import '../custom_components/essensplaner/www/essensplaner-card.js';
import {compareKitStyles} from './style-reference.js';
const people=['Vera','Manuel','Maximilian','Paul'];
const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const monday=new Date();monday.setHours(12,0,0,0);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
const date=n=>{const d=new Date(monday);d.setDate(d.getDate()+n);return key(d)};
let meals=Array.from({length:10},(_,i)=>({id:'rice-'+i,name:['Gemüsereis mit knackigem Gemüse','Reispfanne mit Feta','Curry mit Reis','Reisauflauf mit Tomaten','Gebratener Reis','Reis mit Pilzen','Reissalat mit Kräutern','Bunter Reis mit einem besonders langen Gerichtsnamen für die mobile Darstellung','Reis mit Bohnen','Risotto aus Reis'][i],meat:false,eaters:[...people]}));
meals.push({id:'meat',name:'Hähnchen mit Kartoffeln',meat:true,eaters:people.filter(p=>p!=='Maximilian')});
let entries={
 [date(4)]:{title:'Kartoffelauflauf mit Gemüse',planned_by:'Paul',planned_by_user_id:'Paul',planned_at:new Date().toISOString(),link:'https://example.org/auflauf'},
 [date(0)]:{title:'Gemüsereis mit knackigem Gemüse',meal_id:'rice-0',planned_by:'Manuel',planned_by_user_id:'Manuel',planned_at:new Date().toISOString(),link:'https://example.org/rezept'},
 [date(2)]:{title:'Reispfanne mit Feta und einem besonders langen Namen zum Umbruch auf dem Handy',meal_id:'rice-1',planned_by:'Paul',planned_by_user_id:'Paul',planned_at:new Date().toISOString()}
};
let card, failNext=false,styleObserver,styleFrame;
function scheduleStyleCheck(){cancelAnimationFrame(styleFrame);styleFrame=requestAnimationFrame(()=>{if(card?.isConnected)document.querySelector('#style-checks').textContent=compareKitStyles(card);});}
window.addEventListener('resize',scheduleStyleCheck);
new MutationObserver(scheduleStyleCheck).observe(document.documentElement,{attributes:true});
function publish(){
 const actor=document.querySelector('#actor').value;
 const state={entity_id:'sensor.essensplaner_wochenplan',attributes:{integration_version:'1.4.2',week_start:date(0),week_end:date(6),days:Array.from({length:7},(_,i)=>({date:date(i),entry:entries[date(i)]||null})),entries:structuredClone(entries),meals:structuredClone(meals)}};
 card.hass={user:{id:actor,name:actor,is_admin:false},states:{[state.entity_id]:state},callService:async(domain,service,data)=>{
  await new Promise(resolve=>setTimeout(resolve,120));
  if(failNext){failNext=false;throw new Error('Test: Speichern abgelehnt');}
  if(data.entity_id!==state.entity_id)throw new Error('Falsches Sensor-Ziel');
  const manager=['Manuel','Vera'].includes(actor);
  if(service==='plan_day'){
   const old=entries[data.date];
   if(data.clear){if(old&&!manager&&old.planned_by_user_id!==actor)throw new Error('Fremder Eintrag');delete entries[data.date];}
   else{if(old&&!manager)throw new Error('Bestehender Eintrag');const meal=meals.find(m=>m.id===data.meal_id);entries[data.date]={title:meal?.name||data.text,meal_id:data.meal_id||null,link:data.link||'',planned_by:actor,planned_by_user_id:actor,planned_at:new Date().toISOString()};}
  }
  if(service==='save_meal'){if(!manager)throw new Error('Keine Gerichteverwaltung');const meal={id:data.id||crypto.randomUUID(),name:data.name,meat:data.meat,eaters:data.eaters};const index=meals.findIndex(m=>m.id===meal.id);if(index<0)meals.push(meal);else meals[index]=meal;}
  if(service==='delete_meal'){if(!manager)throw new Error('Keine Gerichteverwaltung');meals=meals.filter(m=>m.id!==data.id);}
  document.querySelector('#calls').textContent=JSON.stringify({domain,service,data},null,2);publish();
 }};
}
function mount(){styleObserver?.disconnect();card?.remove();card=document.createElement('essensplaner-card');card.setConfig({});document.querySelector('#mount').append(card);publish();styleObserver=new MutationObserver(scheduleStyleCheck);styleObserver.observe(card.shadowRoot,{childList:true,subtree:true,attributes:true});scheduleStyleCheck();}
document.querySelector('#actor').onchange=mount;
document.querySelector('#deny').onclick=()=>{failNext=true;};
document.querySelector('#theme').onclick=()=>{
 const dark=document.documentElement.dataset.dark!=='true';document.documentElement.dataset.dark=String(dark);
 const vars=dark?{'primary-text-color':'#eeeeee','secondary-text-color':'#b0b0b0','ha-card-background':'#1c1c1c','card-background-color':'#1c1c1c','secondary-background-color':'#111111','divider-color':'#444444','input-fill-color':'#303030','primary-color':'#03a9f4'}:{};
 document.documentElement.removeAttribute('style');for(const [name,value]of Object.entries(vars))document.documentElement.style.setProperty('--'+name,value);
 document.querySelector('#theme').textContent=dark?'Helles Theme':'Dunkles Theme';
};
document.querySelector('#check').onclick=()=>{
 const root=card.shadowRoot,results=[];
 const test=(label,ok)=>results.push(`${ok?'PASS':'FAIL'} ${label}`);
 test(`Kein horizontaler Überlauf bei ${innerWidth} px`,document.documentElement.scrollWidth<=innerWidth);
 test('Zeilen passen in die Karte',[...root.querySelectorAll('.setting-row')].every(el=>el.scrollWidth<=el.clientWidth+1));
 test('Symbole haben mindestens 40 × 40 px Bedienfläche',[...root.querySelectorAll('.edit-button')].filter(el=>el.getClientRects().length).every(el=>el.getBoundingClientRect().width>=40&&el.getBoundingClientRect().height>=40));
 const gear=root.querySelector('[data-icon="settings"]');if(gear){const st=getComputedStyle(gear);test('Zahnrad aus UI Kit mit 24 px',st.width==='24px');}
 const main=root.querySelector('main');if(main)test('Inhaltsabstand aus UI Kit',getComputedStyle(main).paddingLeft===(innerWidth<=600?'12px':'16px'));
 const modal=root.querySelector('dialog[open]');if(modal){test('Dialog passt ins Fenster',modal.getBoundingClientRect().width<=innerWidth);test('Dialoginhalt ohne horizontalen Überlauf',modal.querySelector('.modal-body').scrollWidth<=modal.querySelector('.modal-body').clientWidth+1);}
 const list=root.querySelector('.fui-options:not([hidden])');if(list){test('Höchstens sechs Treffer sichtbar',list.clientHeight<=336);results.push(`Treffer: ${list.children.length}; Höhe ${list.clientHeight}px; Scrollhöhe ${list.scrollHeight}px`);}
 results.push('Theme: '+(document.documentElement.dataset.dark==='true'?'dunkel':'hell'));
 document.querySelector('#checks').textContent=results.join('\n');scheduleStyleCheck();
};
mount();
