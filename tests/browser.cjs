// Reproducible browser checks for the local fixture; no live Home Assistant needed.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  const page=await browser.newPage({viewport:{width:1300,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(8000);
  await page.goto(`http://127.0.0.1:${server.address().port}/tests/preview.html`);
  const iframe=page.frameLocator('iframe'),card=iframe.locator('essensplaner-card');
  assert.equal(await card.locator('[data-ui-calendar-day]').count(),10);
  assert.equal(await card.getByRole('button',{name:'Nächste Woche',exact:true}).count(),0);
  await card.getByRole('button',{name:'Einstellungen',exact:true}).click();
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  for(const width of [1100,430,390,375]){
   await page.getByLabel('Ansicht').selectOption(String(width));
   const contentFrame=page.frames().find(f=>new URL(f.url()).pathname.endsWith('/tests/frame.html'));
   await contentFrame.waitForFunction(value=>innerWidth===value,width);
   await iframe.getByRole('button',{name:'Layout prüfen',exact:true}).click();
   assert(!((await iframe.locator('#checks').textContent()).includes('FAIL')));
   await contentFrame.waitForFunction(()=>document.querySelector('#style-checks').textContent.startsWith('PASS'));
   assert((await iframe.locator('#style-checks').textContent()).includes('UI Kit 1.6.0'));
   await page.screenshot({path:path.join(root,`test-results/settings-${width}-light.png`)});
  }
  await card.getByRole('button',{name:'Gericht bearbeiten',exact:true}).first().click();
  const modal=card.locator('dialog');assert(await modal.isVisible());
  await modal.getByLabel('Name des Gerichts',{exact:true}).fill('Browser-Test <sicher>');
  await modal.getByRole('button',{name:'Speichern',exact:true}).click();await modal.waitFor({state:'detached'});
  console.log('SAVE DIAGNOSTIC',await card.evaluate(el=>({view:el._view,permissions:el._familyAccess,notice:el._notice,meals:el.getState()?.attributes.meals,call:document.querySelector('#calls').textContent})));
  await card.getByText('Browser-Test <sicher>',{exact:true}).waitFor();
  const months=card.locator('[data-settings^="history-"]');assert.equal(await months.count(),3);
  const latestMonth=months.first().getByRole('button').first();assert.equal(await latestMonth.getAttribute('aria-expanded'),'false');
  await latestMonth.click();assert.equal(await latestMonth.getAttribute('aria-expanded'),'true');
  assert((await months.first().textContent()).includes('Gemüsesuppe von gestern'));
  assert.equal(await months.locator('.calendar-row button').count(),0);assert.equal(await months.locator('.calendar-row[data-control-action]').count(),0);
  assert(await months.first().getByRole('link',{name:'Link öffnen'}).isVisible());
  await page.screenshot({path:path.join(root,'test-results/history-375-light.png')});
  await card.getByRole('button',{name:'Essensplan',exact:true}).click();
  await card.getByRole('button',{name:'Essen einplanen',exact:true}).first().click();
  const search=card.getByRole('combobox',{name:'Gericht auswählen'});await search.fill('Reis');
  assert((await card.locator('.fui-option').count())>6);
  const list=card.locator('.fui-options');assert(await list.evaluate(el=>el.clientHeight<=336&&el.scrollHeight>el.clientHeight));
  await search.press('ArrowDown');await search.press('Enter');
  await card.getByRole('button',{name:'Einplanen',exact:true}).click();await card.locator('dialog').waitFor({state:'detached'});
  await iframe.getByRole('button',{name:'Dunkles Theme',exact:true}).click();
  await iframe.getByRole('button',{name:'Layout prüfen',exact:true}).click();assert(!(await iframe.locator('#checks').textContent()).includes('FAIL'));
  assert.equal(await card.locator('[data-ui-calendar-day]').count(),10);
  await page.screenshot({path:path.join(root,'test-results/ten-days-375-dark.png')});
  await iframe.getByLabel('Testkonto').selectOption('Paul');assert.equal(await card.getByRole('button',{name:'Einstellungen',exact:true}).count(),0);
  await card.getByRole('button',{name:'Essen einplanen',exact:true}).first().click();
  await card.getByRole('button',{name:'Frei eintragen',exact:true}).click();
  await card.getByRole('textbox',{name:'Mahlzeit',exact:true}).fill('Freie Mahlzeit ohne Katalogrecht');
  assert.equal(await card.getByRole('switch',{name:'Auch in Gerichte speichern',exact:true}).count(),0);
  assert.equal(await card.locator('[data-catalog-extra],#new-meal-type').count(),0);
  for(const width of [1100,390])for(const dark of [false,true]){
    await page.getByLabel('Ansicht').selectOption(String(width));
    const contentFrame=page.frames().find(f=>new URL(f.url()).pathname.endsWith('/tests/frame.html'));
    await contentFrame.waitForFunction(value=>innerWidth===value,width);
    await contentFrame.evaluate(dark=>{if((document.documentElement.dataset.dark==='true')!==dark)document.querySelector('#theme').click();},dark);
    assert.equal(await card.locator('dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    await card.locator('dialog').screenshot({path:path.join(root,'test-results/free-without-catalog-'+width+'-'+(dark?'dark':'light')+'.png')});
  }
  await card.getByRole('button',{name:'Einplanen',exact:true}).click();await card.locator('dialog').waitFor({state:'detached'});
  assert.equal(JSON.parse(await iframe.locator('#calls').textContent()).service,'plan_day');
  assert.deepEqual(errors,[]);console.log('PASS ten days, collapsible monthly history, desktop/mobile, themes, dialogs, saved-meal search and settings visibility');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
