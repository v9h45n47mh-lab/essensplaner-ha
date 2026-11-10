import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../custom_components/essensplaner/www/',import.meta.url);
const read=(base,file)=>readFile(new URL(file,base),'utf8');
const lock=JSON.parse(await read(root,'family-ui.lock.json'));
const release=new URL(`family-ui/${lock.version}/`,root);
const manifest=JSON.parse(await read(release,'manifest.json'));
const hash=text=>createHash('sha256').update(text).digest('hex');
for(const [file,expected] of Object.entries(lock.files)){
 if(manifest.files[file]!==expected || hash(await read(release,file))!==expected)throw new Error(`UI checksum mismatch: ${file}`);
}
if(hash(await read(release,'LICENSE'))!==lock.licenseSha256)throw new Error('UI license checksum mismatch');
const card=await read(root,'essensplaner-card.js');
if(!card.includes(`from '${lock.module}'`))throw new Error('Card does not import the pinned module');
if(card.includes('<svg')||card.includes('icon(name)'))throw new Error('Card has local copies of shared icons');
for(const helper of ['combobox','dateNavigation','weekCalendar','confirmDialog','downloadJSON','bindGestures']){
 if(!card.includes(helper+'('))throw new Error(`Shared component not adopted: ${helper}`);
}
if(card.includes('.calendar-row{')||card.includes('.meal-option{')||card.includes('updateMealOptions()'))throw new Error('Card duplicates shared calendar or selection implementation');
const version=JSON.parse(await read(new URL('../',root),'manifest.json')).version;
if(!card.includes(`ESSENSPLANER_VERSION = '${version}'`))throw new Error('Frontend/backend versions differ');
console.log(`Verified HA UI Kit ${lock.version}, checksums, license, local import and Essensplaner ${version}`);
