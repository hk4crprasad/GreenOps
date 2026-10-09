'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,Leaf,UsersThree} from '@phosphor-icons/react';
import {api} from '../lib/api';

type DemoAccount={role:string;name:string;description:string;email:string;password?:string};
export default function Login({onLogin}:{onLogin:()=>void}){
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('');
 const[busy,setBusy]=useState(''),[accounts,setAccounts]=useState<DemoAccount[]>([]),[accountError,setAccountError]=useState('');
 useEffect(()=>{let active=true;api<{enabled:boolean;items:DemoAccount[]}>('/auth/demo-accounts?include_credentials=true')
  .then(result=>{if(active&&result.enabled)setAccounts(result.items)})
  .catch((e:unknown)=>{if(active)setAccountError(e instanceof Error?e.message:'Demo accounts could not be loaded')});return()=>{active=false}},[]);
 function fillCredentials(account:DemoAccount){setEmail(account.email);setPassword(account.password||'');setError('');document.getElementById('login-email')?.focus()}
 async function signIn(role?:string){
  if(busy)return;setBusy(role||'manual');setError('');
  try{await api(role?'/auth/demo-login':'/auth/login',{method:'POST',body:JSON.stringify(role?{role}:{email,password})});onLogin()}
  catch(e:unknown){setError(e instanceof Error?e.message:'Sign-in failed')}
  finally{setBusy('')}
 }
 return <div className="login">
  <section className="login-art">
   <div className="brand"><span className="brand-mark"><Leaf size={25}/></span><span>GreenOps<small>HOSPITAL INTELLIGENCE</small></span></div>
   <h1>Better operations.<br/>A lighter footprint.</h1>
   <p>Understand resources. Test resilience. Turn evidence into accountable action.</p>
   <div className="login-bottom">Synthetic demonstration • Aggregate facility operations<br/>No clinical patient workflows</div>
  </section>
  <section className="login-form"><div className="login-workspace">
   <p className="eyebrow">Welcome to GreenOps</p><h2>Sign in to your workspace</h2>
   {accounts.length>0&&<section aria-labelledby="demo-login-title" className="demo-login">
    <div className="demo-login-heading"><UsersThree size={22}/><div><h3 id="demo-login-title">Choose a demo role</h3><p>Sign in directly, or fill the form below. Sign out to switch roles.</p></div><span className="badge">DEMO</span></div>
    <div className="demo-role-list">{accounts.map(account=><article key={account.role} className="demo-role" aria-label={account.name+' demo account'}>
     <div className="demo-role-details"><strong>{account.name}</strong><small>{account.description}</small><div className="demo-credential"><span>Email</span><code className="demo-email">{account.email}</code></div>{account.password&&<div className="demo-credential"><span>Password</span><code className="demo-password">{account.password}</code></div>}</div>
     <div className="demo-role-actions"><button type="button" className="demo-enter primary" aria-label={'Continue as '+account.name} disabled={!!busy} onClick={()=>signIn(account.role)}>{busy===account.role?'Signing in…':<>Sign in <ArrowRight size={16}/></>}</button>{account.password&&<button type="button" className="demo-fill" aria-label={'Fill credentials for '+account.name} disabled={!!busy} onClick={()=>fillCredentials(account)}>Fill credentials</button>}</div>
    </article>)}</div>
   </section>}
   {accountError&&<p className="notice error" role="alert">Demo accounts unavailable: {accountError}. Manual sign-in is available below.</p>}
   {error&&<p className="notice error" role="alert">{error}</p>}
   <form onSubmit={e=>{e.preventDefault();signIn()}}>
    <div className="manual-login-title">{accounts.length?'Or use your credentials':'Enter your credentials'}</div>
    <label>Email<input id="login-email" aria-label="Email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Password<input aria-label="Password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <button className="primary" type="submit" disabled={!!busy}>{busy==='manual'?'Signing in…':'Sign in'}</button>
   </form>
   <p className="tiny muted login-credentials-note">{accounts.length?'Demo access uses real accounts with separate role and zone permissions.':'Use the credentials generated during setup.'}</p>
  </div></section>
 </div>
}
