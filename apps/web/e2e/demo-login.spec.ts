import {test,expect} from '@playwright/test';
const roles=['Hospital admin','Organization admin','Operations supervisor','Maintenance technician','Waste officer','Sustainability officer','Auditor'];
test('jury can enter every real demo role and sign out to switch',async({page})=>{
 test.setTimeout(180000);
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Choose a demo role'})).toBeVisible();
 await expect(page.locator('.demo-role')).toHaveCount(7);
 await expect(page.locator('.demo-password')).toHaveCount(7);
 // These screenshots are public documentation; redact the demo passwords.
 await page.screenshot({path:(process.env.E2E_SCREENSHOT_DIR||'../../docs/screenshots')+'/demo-login.png',fullPage:true,mask:[page.locator('.demo-password')]});
 for(const role of roles){
  const overview=page.waitForResponse(r=>r.url().includes('/api/v1/overview?')&&r.status()===200);
  await page.getByRole('button',{name:'Continue as '+role,exact:true}).click();
  await overview;
  await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
  const me=await (await page.request.get('/api/v1/me')).json();
  expect(me.role).toBe(role.toLowerCase().replaceAll(' ','_'));
  if(role==='Maintenance technician')expect(me.grants.map((g:any)=>g.zone_code)).toEqual(['WARD_A']);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Choose a demo role'})).toBeVisible();
 }
});
test('demo credentials fill the manual form and authenticate a real account',async({page})=>{
 await page.goto('/');
 const card=page.getByRole('article',{name:'Auditor demo account',exact:true});
 await expect(card).toBeVisible();
 const email=await card.locator('.demo-email').innerText();
 const password=await card.locator('.demo-password').innerText();
 await page.getByRole('button',{name:'Fill credentials for Auditor',exact:true}).click();
 expect(await page.getByLabel('Email',{exact:true}).inputValue()===email).toBe(true);
 expect(await page.getByLabel('Password',{exact:true}).inputValue()===password).toBe(true);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
 const me=await (await page.request.get('/api/v1/me')).json();
 expect(me.role).toBe('auditor');
});
test('demo picker fits mobile without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.locator('.demo-role')).toHaveCount(7);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Continue as Auditor',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
});
