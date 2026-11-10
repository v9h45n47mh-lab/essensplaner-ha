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
  await card.getByRole('button',{name:'Einstellungen',exact:true}).click();
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  for(const width of [1100,430,390,375]){
   await page.getByLabel('Ansicht').selectOption(String(width));
   const contentFrame=page.frames().find(f=>f.url().endsWith('/tests/frame.html'));
   await contentFrame.waitForFunction(value=>innerWidth===value,width);
   await iframe.getByRole('button',{name:'Layout prüfen',exact:true}).click();
   assert(!((await iframe.locator('#checks').textContent()).includes('FAIL')));
   await contentFrame.waitForFunction(()=>document.querySelector('#style-checks').textContent.startsWith('PASS'));
   assert((await iframe.locator('#style-checks').textContent()).includes('UI Kit 1.2.1'));
   await page.screenshot({path:path.join(root,`test-results/settings-${width}-light.png`)});
  }
  await card.getByRole('button',{name:'Gericht bearbeiten',exact:true}).first().click();
  const modal=card.locator('dialog');assert(await modal.isVisible());
  await modal.getByLabel('Name des Gerichts',{exact:true}).fill('Browser-Test <sicher>');
  await modal.getByRole('button',{name:'Speichern',exact:true}).click();await modal.waitFor({state:'detached'});
  assert((await card.textContent()).includes('Browser-Test <sicher>'));
  await card.getByRole('button',{name:'Essensplan',exact:true}).click();
  await card.getByRole('button',{name:'Essen einplanen',exact:true}).first().click();
  const search=card.getByRole('combobox',{name:'Gericht auswählen'});await search.fill('Reis');
  assert((await card.locator('.fui-option').count())>6);
  const list=card.locator('.fui-options');assert(await list.evaluate(el=>el.clientHeight<=336&&el.scrollHeight>el.clientHeight));
  await search.press('ArrowDown');await search.press('Enter');
  await card.getByRole('button',{name:'Einplanen',exact:true}).click();await card.locator('dialog').waitFor({state:'detached'});
  await iframe.getByRole('button',{name:'Dunkles Theme',exact:true}).click();
  await iframe.getByRole('button',{name:'Layout prüfen',exact:true}).click();assert(!(await iframe.locator('#checks').textContent()).includes('FAIL'));
  await page.screenshot({path:path.join(root,'test-results/week-375-dark.png')});
  await iframe.getByLabel('Testkonto').selectOption('Paul');assert.equal(await card.getByRole('button',{name:'Einstellungen',exact:true}).count(),0);
  assert.deepEqual(errors,[]);console.log('PASS desktop/mobile, themes, dialogs, saved-meal search and settings visibility');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
