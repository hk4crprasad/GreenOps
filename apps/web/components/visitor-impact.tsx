'use client';
import {useEffect,useState} from 'react';
import {api,scoped,World,Row,number,time} from '../lib/api';

export default function VisitorImpact({world,refresh}:{world:World;refresh:number}){
 const [people,setPeople]=useState(1000),[water,setWater]=useState(2.5),[energy,setEnergy]=useState(.15),[waste,setWaste]=useState(.025);
 const [stay,setStay]=useState(2),[arrivals,setArrivals]=useState(10),[air,setAir]=useState(30),[waterLoss,setWaterLoss]=useState(''),[energyLoss,setEnergyLoss]=useState('');
 const [baseline,setBaseline]=useState<any>(null),[factor,setFactor]=useState<Row|null>(null),[error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();setBaseline(null);setFactor(null);setError('');
  Promise.all([api(scoped('/metrics/summary',world.id),{signal:controller.signal}),api(scoped('/emission-factors',world.id,{limit:100}),{signal:controller.signal})]).then(([summary,factors])=>{
   if(controller.signal.aborted)return;
   setBaseline(summary);setFactor(factors.items.find((r:Row)=>r.unit==='kgCO2e/kWh'&&r.value!==null&&r.event_at<=summary.end&&(!r.data.effective_from||r.data.effective_from<=summary.end))||null);
  }).catch(e=>{if(!controller.signal.aborted)setError(e.message)});
  return ()=>controller.abort();
 },[world.id,world.version,world.as_of,refresh]);
 const valid=[people,water,energy,waste,stay,arrivals,air].every(Number.isFinite)&&Number.isInteger(people)&&people>=0&&people<=100000&&water>=0&&energy>=0&&waste>=0&&air>=0&&stay>0&&stay<=24&&arrivals>0&&arrivals<=24&&[waterLoss,energyLoss].every(v=>v===''||(Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=100));
 const extra={water:people*water,energy:people*energy,waste:people*waste,air:people*stay*air};
 const concurrent=people*Math.min(1,stay/arrivals);
 const carbon=factor&&factor.value!==null?extra.energy*factor.value:null;
 const tomorrow=new Date(world.as_of);tomorrow.setDate(tomorrow.getDate()+1);
 const rows=[
  {label:'Water consumption',unit:'L',metric:'water.interval_l',extra:extra.water},
  {label:'Electricity consumption',unit:'kWh',metric:'energy.interval_kwh',extra:extra.energy},
  {label:'Waste generated',unit:'kg',metric:'waste.generated_kg',extra:extra.waste},
  {label:'Fresh-air planning allowance',unit:'m³',metric:null,extra:extra.air},
  {label:'Electricity emissions',unit:'kg CO₂e',metric:null,extra:carbon},
 ];
 function current(row:typeof rows[number]):number|null{
  if(!baseline)return null;
  if(row.label==='Electricity emissions')return factor&&baseline.metrics['energy.interval_kwh']?.value!=null?baseline.metrics['energy.interval_kwh'].value*factor.value!:null;
  return row.metric?baseline.metrics[row.metric]?.value??null:null;
 }
 function exportEstimate(){
  const data={name:`Tomorrow: ${people} extra visitors`,source_type:'illustrative_planning_estimate',world_id:world.id,world_version:world.version,scenario_date:tomorrow.toISOString(),baseline,emission_factor:factor,
   assumptions:{extra_visitors:people,water_l_per_visitor:water,energy_kwh_per_visitor:energy,waste_kg_per_visitor:waste,average_stay_hours:stay,arrival_window_hours:arrivals,fresh_air_m3_per_person_hour:air,water_loss_pct:waterLoss===''?null:Number(waterLoss),avoidable_energy_pct:energyLoss===''?null:Number(energyLoss)},
   additional:{...extra,carbon_kgco2e:carbon,average_extra_concurrent_people:concurrent,water_loss_l:waterLoss===''?null:extra.water*Number(waterLoss)/100,avoidable_energy_kwh:energyLoss===''?null:extra.energy*Number(energyLoss)/100},
   limitations:['Synthetic data; editable per-visitor allowances, not a trained forecast.','Tomorrow repeats the last 24-hour baseline; no weather, capacity or schedule adjustment.','Water/energy losses are user assumptions; indoor CO2 and PM2.5 are not predicted.']};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='greenops-extra-visitors.json';link.click();URL.revokeObjectURL(url);
 }
 return <section className="panel visitor-impact" aria-labelledby="visitor-impact-title">
  <div className="panel-head"><div><p className="eyebrow">Quick what-if • tomorrow</p><h2 id="visitor-impact-title">What if 1,000 more people arrive?</h2></div><span className="badge">Instant planning estimate</span></div>
  <p className="muted">Adjust the extra visitors to see additional demand and tomorrow’s estimated totals. Results update immediately.</p>
  <div className="visitor-controls"><label>Extra visitors tomorrow<input type="number" min={0} max={100000} step={100} value={people} onChange={e=>setPeople(Number(e.target.value))}/></label><label>Average stay (hours)<input type="number" min={.25} max={24} step={.25} value={stay} onChange={e=>setStay(Number(e.target.value))}/></label><label>Arrivals spread over (hours)<input type="number" min={1} max={24} value={arrivals} onChange={e=>setArrivals(Number(e.target.value))}/></label></div>
  {!valid&&<p className="notice error" role="alert">Enter 0–100,000 whole visitors, a stay and arrival window above 0 and at most 24 hours, nonnegative allowances, and loss percentages from 0 to 100.</p>}
  {error?<p className="notice error" role="alert">Baseline could not load: {error}</p>:!baseline?<p className="muted" role="status">Loading the selected hospital’s last 24 hours…</p>:<p className="tiny muted">Scenario day: {new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeZone:'Asia/Kolkata'}).format(tomorrow)} • Baseline: {time(baseline.start)} to {time(baseline.end)}. Tomorrow repeats this baseline plus the extra visitors.</p>}
  <div className="table-wrap"><table><thead><tr><th>Resource</th><th>Last 24 hours</th><th>Additional demand</th><th>Tomorrow estimate</th></tr></thead><tbody>{rows.map(row=>{
   const base=current(row),added=valid?row.extra:null,coverage=row.metric?baseline?.metrics[row.metric]?.coverage_pct:null;
   return <tr key={row.label}><td className="record-title">{row.label}<small className="muted visitor-unit">{row.unit}</small></td><td>{base===null?'Unavailable':number(base)}{coverage!=null&&<small className="muted visitor-unit">{number(coverage)}% coverage</small>}</td><td className="visitor-addition">{added===null?'Unavailable':`+${number(added,2)}`}</td><td>{base===null||added===null?'Unavailable':number(base+added,2)}{coverage!=null&&coverage<100&&<small className="visitor-unit">Partial baseline</small>}</td></tr>
  })}</tbody></table></div>
  <div className="visitor-losses"><div><span className="tiny muted">Estimated extra water wasted</span><strong>{valid&&waterLoss!==''?`${number(extra.water*Number(waterLoss)/100,2)} L`:'Set a loss % below'}</strong></div><div><span className="tiny muted">Estimated avoidable energy</span><strong>{valid&&energyLoss!==''?`${number(extra.energy*Number(energyLoss)/100,2)} kWh`:'Set a loss % below'}</strong></div><div><span className="tiny muted">Average extra people on site</span><strong>{valid?number(concurrent):'Unavailable'}</strong></div></div>
  <details><summary className="details-link">Adjust allowances and wastage assumptions</summary><p className="tiny muted">Water, electricity and waste defaults match the per-OPD-visit coefficients in our synthetic demo generator (2.5 L, 0.15 kWh, 0.025 kg). Applying them to visitors is an illustrative assumption. The fresh-air allowance is editable and has not been validated for this hospital.</p><div className="form-grid">
   <label>Water (L per visitor)<input type="number" min={0} step={.5} value={water} onChange={e=>setWater(Number(e.target.value))}/></label>
   <label>Electricity (kWh per visitor)<input type="number" min={0} step={.01} value={energy} onChange={e=>setEnergy(Number(e.target.value))}/></label>
   <label>Waste (kg per visitor)<input type="number" min={0} step={.005} value={waste} onChange={e=>setWaste(Number(e.target.value))}/></label>
   <label>Fresh air (m³ per person per hour)<input type="number" min={0} step={1} value={air} onChange={e=>setAir(Number(e.target.value))}/></label>
   <label>Extra water assumed wasted (%)<input type="number" min={0} max={100} placeholder="Unspecified" value={waterLoss} onChange={e=>setWaterLoss(e.target.value)}/></label>
   <label>Extra energy assumed avoidable (%)<input type="number" min={0} max={100} placeholder="Unspecified" value={energyLoss} onChange={e=>setEnergyLoss(e.target.value)}/></label>
  </div><p className="tiny muted">Loss estimates are portions of additional consumption, not extra quantities to add again. {factor?`Electricity emissions use the selected world's recorded factor: ${number(factor.value,3)} ${factor.unit}.`:'No applicable emission factor is recorded; carbon estimates are unavailable.'}</p></details>
  <p className="notice">Planning estimate using synthetic observations and editable allowances. Extra demand is not automatically wastage. Indoor CO₂, PM2.5 and temperature require ventilation, room volume and weather inputs and are not predicted here.</p>
  <button disabled={!valid||!baseline} onClick={exportEstimate}>Export visitor estimate</button>
 </section>
}
