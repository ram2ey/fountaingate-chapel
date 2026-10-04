import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('account forms have labels, accessible contrast and no mobile overflow',async({page})=>{
 await page.goto('/login');
 for(const mode of ['login','register','recovery','Resend verification']){
  await page.getByRole('button',{name:mode,exact:true}).click();
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 }
});
test('keyboard reaches the form and invalid submission sends no message',async({page})=>{
 await page.goto('/login');
 let submissions=0;page.on('request',request=>{if(request.method()==='POST')submissions++;});
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByLabel('Phone (international format)')).toBeFocused();
 expect(submissions).toBe(0);
 await page.keyboard.press('Tab');await expect(page.getByLabel('Branch ID')).toBeFocused();
});
test('protected pages redirect and protected files deny anonymous requests',async({page,request})=>{
 await page.goto('/operations');await expect(page).toHaveURL(/\/login$/);
 expect((await request.get('/api/documents/00000000-0000-4000-8000-000000000001')).status()).toBe(404);
});
test('native mobile navigation traps focus, closes with Escape and restores focus',async({page,isMobile,context,baseURL})=>{
 test.skip(!process.env.PLAYWRIGHT_NATIVE_FIXTURE||!isMobile,'Requires disposable PostgreSQL CI fixture, never a production account.');
 await context.addCookies([{name:'fgc_session',value:'a'.repeat(43),url:baseURL!}]);
 await page.goto('/operations');
 const opener=page.getByRole('button',{name:'Open navigation',exact:true});
 await opener.click();const dialog=page.getByRole('dialog',{name:'Navigation',exact:true});await expect(dialog).toBeVisible();
 for(let i=0;i<30;i++){await page.keyboard.press('Tab');expect(await dialog.evaluate(element=>element.contains(document.activeElement))).toBe(true);}
 expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(opener).toBeFocused();
 await opener.click();await dialog.getByRole('link',{name:'Operational status',exact:true}).click();await expect(dialog).not.toBeVisible();
});
