import {analyze} from './engine.js';
import {reputationSummary,tallestSkyscraperFloors,setWorldSkyscraperFloors,WORLD_SKYSCRAPER_FAME,TOP_SKYSCRAPER_FAME} from './empire.js';
import {chapterOf} from './legacy.js';
import {developerAccount} from './developer.js';
import {L} from './i18n.js';

// Stable pseudorandom identity across devices, languages and new games; no email/name input.
export async function playerNickname(uid){
 const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('super-rich-nickname-v1:'+uid)));
 const first=['Golden','Silver','Lucky','Bright','Royal','Sunny','Bold','Noble','Cosmic','Velvet','Swift','Emerald','Amber','Crystal','Grand','Lunar'];
 const last=['Fox','Falcon','Otter','Tiger','Owl','Panda','Lynx','Orca','Wolf','Raven','Phoenix','Lion','Swan','Dolphin','Eagle','Jaguar'];
 return first[hash[0]%16]+last[hash[1]%16]+'-'+Array.from(hash.slice(2,8),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
}
export const ACHIEVEMENTS={
 developer:L('Developer'),tycoon:L('Tycoon'),legacy:L('Legacy'),foundation:L('Foundation'),
 ending:L('Legacy ending'),trillion:L('Trillion Club'),moon:L('Lunar Research Base'),mars:L('Mars Exploration Project'),rejuvenation:L('Rejuvenation')
};
export function rankingSummary(save,worldFloors,topFiveFloors){
 if(save.concept!=='rich-life'||save.mode==='sandbox')return null;
 const s=structuredClone(save);
 if(worldFloors!==undefined)setWorldSkyscraperFloors(s,worldFloors,topFiveFloors);
 const a=analyze(s),chapter=chapterOf(s).n;
 const badges=[chapter>=2&&'developer',chapter>=3&&'tycoon',chapter>=4&&'legacy',s.foundation&&'foundation',s.ending&&'ending',Math.max(s.highestWealth||0,a.wealth)>=1e12&&'trillion',s.ultra?.items?.moon?.complete&&'moon',s.ultra?.items?.mars?.complete&&'mars',s.life?.rejuvenations>0&&'rejuvenation'].filter(Boolean);
 return{wealth:Math.round(a.wealth),fame:Math.round(reputationSummary(s).fame),achievements:badges.length,badges:badges.join(','),skyscraperFloors:tallestSkyscraperFloors(s),month:s.month};
}
const metrics=['wealth','fame','achievements','skyscraperFloors'];
function fields(row){return Object.fromEntries(Object.entries(row).map(([k,v])=>[k,typeof v==='number'?{doubleValue:v}:{stringValue:v}]));}
function decode(doc){
 if(!doc?.fields)return null;
 const r=Object.fromEntries(Object.entries(doc.fields).map(([k,v])=>[k,v.stringValue??v.timestampValue??Number(v.doubleValue??v.integerValue)]));
 if(!/^[A-Za-z]+-[0-9A-F]{12}$/.test(r.nickname||'')||!['wealth','fame','achievements'].every(k=>Number.isFinite(r[k]))||!Number.isSafeInteger(r.month)||!Number.isSafeInteger(r.sourceUpdatedAt)||typeof r.badges!=='string'||(r.skyscraperFloors!==undefined&&(!Number.isSafeInteger(r.skyscraperFloors)||r.skyscraperFloors<0)))return null;
 return{...r,skyscraperFloors:r.skyscraperFloors??0,id:doc.name.split('/').at(-1)};
}
export function rankingsClient({projectId,user,fetch:request=globalThis.fetch,onWorldRecord=()=>{}}){
 const root=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`,path=root+'/rankings/'+encodeURIComponent(user.uid);
 let queue=Promise.resolve(),lastRevision='',error='';
 async function call(url,method='GET',body){
  try{
   const response=await request(url,{method,headers:{Authorization:`Bearer ${await user.getIdToken()}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});
   if(method==='GET'&&response.status===404)return null;
   if(!response.ok)throw Error(response.status===403?'setup':'network');
   return response.status===204?null:await response.json();
  }catch(e){throw Error(e.message==='setup'?'setup':'network');}
 }
 async function skyscraperLeaders(limit=6){
  const data=await call(root+':runQuery','POST',{structuredQuery:{from:[{collectionId:'rankings'}],orderBy:[{field:{fieldPath:'skyscraperFloors'},direction:'DESCENDING'}],limit}});
  if(!Array.isArray(data))throw Error('network');
  return data.map(r=>decode(r.document)).filter(Boolean);
 }
 // Five strictly taller opponents put the player outside the shared top five.
 const topFiveThreshold=leaders=>leaders.filter(r=>r.id!==user.uid&&r.skyscraperFloors>0)[4]?.skyscraperFloors||0;
 async function publish(row){
  if(!row||row.revision===lastRevision)return;
  // Firestore revisions have microsecond precision; preserve it for cross-device ordering.
  const sourceUpdatedAt=Date.parse(row.revision)*1000+Number((row.revision.split('.')[1]||'').replace('Z','').padEnd(6,'0').slice(3,6));
  const eligible=!developerAccount(user,{user})&&row.save.concept==='rich-life'&&row.save.mode!=='sandbox';
  const leaders=eligible?await skyscraperLeaders():[];
  const otherFloors=leaders.find(r=>r.id!==user.uid)?.skyscraperFloors||0;
  const summary=eligible?rankingSummary(row.save,otherFloors,topFiveThreshold(leaders)):null;
  if(!summary){
   const current=await call(path);
   if(current?.updateTime&&Number(current.fields?.sourceUpdatedAt?.integerValue)<=sourceUpdatedAt)await call(path+'?currentDocument.updateTime='+encodeURIComponent(current.updateTime),'DELETE');
   onWorldRecord(0,undefined);lastRevision=row.revision;return;
  }
  const nickname=await playerNickname(user.uid);
  await call(path,'PATCH',{fields:{...fields({...summary,nickname}),sourceUpdatedAt:{integerValue:String(sourceUpdatedAt)}}});
  onWorldRecord(Math.max(summary.skyscraperFloors,otherFloors),topFiveThreshold(leaders));
  lastRevision=row.revision;
 }
 return{
  // Only confirmed account saves enter the board. Ranking outages never block saving.
  wrap(client){return Object.fromEntries(['load','push'].map(key=>[key,async(...args)=>{
   const result=await client[key](...args);
   if(result.ok&&result.row&&!(key==='load'&&args[0]?.readOnly)){const row=structuredClone(result.row);queue=queue.then(()=>publish(row)).then(()=>{error='';},e=>{error=e.message;});}
   return result;
  }]));},
  async list(metric='wealth'){
   if(!metrics.includes(metric))metric='wealth';
   await queue;
   const [data,own,leaders]=await Promise.all([
    call(root+':runQuery','POST',{structuredQuery:{from:[{collectionId:'rankings'}],orderBy:[{field:{fieldPath:metric},direction:'DESCENDING'}],limit:50}}),
    call(path),skyscraperLeaders()
   ]);
   if(!Array.isArray(data))throw Error('network');
   onWorldRecord(leaders[0]?.skyscraperFloors||0,developerAccount(user,{user})?undefined:topFiveThreshold(leaders));
   return{rows:data.map(r=>decode(r.document)).filter(r=>r&&(metric!=='skyscraperFloors'||r.skyscraperFloors>0)),own:decode(own),worldRecord:leaders[0]||null,nickname:await playerNickname(user.uid),excluded:developerAccount(user,{user}),error};
  }
 };
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₲'+Math.round(n).toLocaleString('en-US');
export function rankingsHTML({metric='wealth',rows=[],own=null,worldRecord=null,userId='',nickname='',excluded=false,status='',error='' }={}){
 const labels={wealth:L('Net worth'),fame:L('Reputation'),achievements:L('Major achievements'),skyscraperFloors:L('Tallest skyscraper')};
 const entry=(r,rank)=>`<article class="ranking-row ${r.id===userId?'ranking-self':''}"><div class="ranking-name"><strong>${rank?rank+'. ':''}${esc(r.nickname)}</strong>${r.id===userId?`<span>${L('You')}</span>`:''}</div><div class="ranking-values"><span>${labels.wealth}<b>${money(r.wealth)}</b></span><span>${labels.fame}<b>${r.fame.toLocaleString('en-US')}</b></span><span>${labels.achievements}<b>${r.achievements} / ${Object.keys(ACHIEVEMENTS).length}</b></span><span>${labels.skyscraperFloors}<b>${r.skyscraperFloors||0} ${L('floors')}</b></span></div><p>${r.badges.split(',').filter(k=>Object.hasOwn(ACHIEVEMENTS,k)).map(k=>esc(ACHIEVEMENTS[k])).join(' · ')||L('No major achievements yet.')}</p><small>${L('Months played')}: ${r.month} · ${L('Updated')}: ${esc(new Date(r.sourceUpdatedAt/1000).toLocaleString())}</small></article>`;
 const identity=nickname||own?.nickname||rows.find(r=>r.id===userId)?.nickname;
 const published=own||rows.find(r=>r.id===userId);
 let rank=0;
 return `<h2>🏆 ${L('Player Rankings')}</h2>${identity?`<section class="ranking-identity"><span>${L('My nickname')}</span><strong>${esc(identity)}</strong>${excluded?`<p>${L('Your developer account is excluded from rankings.')}</p>`:!published?`<p>${L('You have no published record. Sign in and sync a normal game to appear in rankings.')}</p>`:''}</section>`:''}<p>${L('Compare the latest account saves by nickname. Top 50 per category; equal scores share a rank.')}</p><p class="help">${L('Net worth includes all assets minus debt. Nicknames stay the same across devices and new games. Email and save files are private.')}</p><p class="help">${L('Only synced ranking records are shown, not the total number of users.')}</p>${worldRecord?.skyscraperFloors?`<p class="ranking-world-record">🏙 ${L('World tallest skyscraper')}: <b>${esc(worldRecord.nickname)}</b> · ${worldRecord.skyscraperFloors} ${L('floors')}</p>`:''}<div class="button-row">${metrics.map(k=>`<button data-ranking="${k}" aria-pressed="${metric===k}">${labels[k]}</button>`).join('')}<button data-ranking="${metric}">${L('Refresh rankings')}</button></div><p class="help">${L`A completed skyscraper tied for the world record grants +${WORLD_SKYSCRAPER_FAME} reputation while you own it. Ties share the bonus.`}</p><p class="help">${L`A completed skyscraper in the global top five by floor count grants an additional +${TOP_SKYSCRAPER_FAME} reputation while you own it. Ties share the bonus; it stacks with the world record bonus. Rankings refresh on account sync or ranking refresh.`}</p><p class="help">${L('Major achievements: chapters, foundation, legacy ending, Trillion Club, Moon, Mars and rejuvenation. Client-reported records; sandbox and developer accounts are excluded.')}</p>${status?`<p role="status">${esc(status)}</p>`:''}${error?`<p role="alert">${L('Your ranking update failed. Your account save is safe. Refresh to retry.')}</p>`:''}${own?`<h3>${L('My published record')}</h3>${entry(own,null)}`:''}${rows.length?`<h3>${labels[metric]} · ${L('Top 50')}</h3>${rows.map((r,i)=>{if(!i||r[metric]!==rows[i-1][metric])rank=i+1;return entry(r,rank);}).join('')}`:!status?`<p>${L('No rankings yet. Records appear after players sign in and sync their game.')}</p>`:''}`;
}
