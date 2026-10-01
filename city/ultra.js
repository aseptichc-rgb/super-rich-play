import {activeMegaProjects,megaCapacity,lunarPanel,lunarStatus,validLunar,settleLunar} from './lunar.js';
import {healthReason} from './health.js';
import {transaction} from './health.js';
import {L} from './i18n.js';
import {analyze} from './engine.js';
import {lifeEnded} from './longevity.js';
import {ultraCells,ultraPlacementError,clearUltraSite,setUltraSite} from './ultra-placement.js';

export const ULTRA_UNLOCK=1000000000000;
export const ULTRA_ITEMS={
 launch:{name:L('Private Spaceport'),group:'space',icon:'🚀',cost:200000000000,months:6,fame:1000,asset:true,description:L('Build a launch complex and open the route to the Moon. Rockets launch automatically every 6 game months after completion.')},
 moon:{name:L('Lunar Research Base'),group:'space',icon:'🌕',cost:800000000000,months:18,fame:3000,asset:true,requires:'launch',description:L('Build a permanent lunar base after completing your spaceport.')},
 probe:{name:L('Deep Space Expedition'),group:'space',icon:'🛰',cost:300000000000,months:12,fame:2000,requires:'moon',description:L('Send a scientific probe beyond the Moon. Complete a deep-space survey.')},
 disease:{name:L('Disease Eradication Initiative'),group:'foundation',icon:'🧬',cost:150000000000,months:12,fame:2500,description:L('Fund vaccine research and access to treatment. Complete a global health campaign.')},
 climate:{name:L('Global Climate Initiative'),group:'foundation',icon:'🌱',cost:250000000000,months:18,fame:3500,description:L('Fund clean energy and ecosystem restoration. Complete a climate action network.')},
 museum:{name:L('Private World Museum'),group:'collection',icon:'🏛',cost:100000000000,months:6,fame:800,asset:true,description:L('Build your own museum and host private exhibitions.')},
 superyacht:{name:L('Deep-Sea Exploration Submersible'),group:'collection',icon:'🤿',cost:50000000000,months:0,fame:400,asset:true,description:L('Explore the ocean depths in your own scientific submersible.')},
 jet:{name:L('Private Widebody Jet'),group:'collection',icon:'✈',cost:30000000000,months:0,fame:300,asset:true,description:L('Travel the world aboard your own private airliner.')},
 satellite:{name:L('Satellite Network Business'),group:'space',icon:'🛰',cost:1000000000000,months:6,fame:1000,requires:'launch',operation:true,income:50000000000,art:'launch',description:L('Launch a commercial satellite network from your completed spaceport. Earn recurring net profit after deployment.')},
 mars:{name:L('Mars Exploration Project'),group:'space',icon:'🔴',cost:600000000000,months:24,fame:30000,requires:'moon',operation:true,art:'probe',description:L('Use your completed lunar base to launch a Mars expedition and earn world-changing renown.')},
 relic:{name:L('Rare Antiquities Collection'),group:'collection',icon:'🏺',cost:80000000000,months:0,fame:600,asset:true,requires:'museum',description:L('Collect documented antiquities and display them in your completed museum.')}
};
// New contracts use longer schedules; old saves retain their original durations.
export const ULTRA_MONTHS={launch:36,moon:60,probe:48,disease:36,climate:48,museum:24,satellite:36,mars:72};
export const ultraDuration=(id,item)=>item?(item.duration??ULTRA_ITEMS[id].months):(ULTRA_MONTHS[id]??ULTRA_ITEMS[id].months);
const owned=s=>s.ultra?.items||{};
const done=(s,id)=>!!owned(s)[id]?.complete;
const money=n=>'₲'+n.toLocaleString('en-US');
export function ultraIncome(s){return s.concept==='rich-life'?Object.entries(owned(s)).reduce((n,[id,item])=>n+(item.complete?(ULTRA_ITEMS[id]?.income||0):0),0):0;}
export function ultraValue(s){return Object.entries(owned(s)).reduce((n,[id])=>n+(ULTRA_ITEMS[id]?.asset?ULTRA_ITEMS[id].cost:0),0);}
export function ultraSaleValue(id){const d=ULTRA_ITEMS[id];return Object.hasOwn(ULTRA_ITEMS,id)?Math.floor(d.cost/2):0;}
export function ultraUnlocked(s){return (s.highestWealth||0)>=ULTRA_UNLOCK||analyze(s).wealth>=ULTRA_UNLOCK;}
function fame(s,n){s.empire??={owned:[]};s.empire.earnedFame=(s.empire.earnedFame||0)+n;}
export function ultraReason(s,id){
 const d=ULTRA_ITEMS[id];
 if(!Object.hasOwn(ULTRA_ITEMS,id))return L('Choose a project or collection.');
 if(s.concept!=='rich-life')return L('Available only in Super Rich Life.');
 if(lifeEnded(s))return L('Rejuvenate to begin a new project.');
 if(!ultraUnlocked(s))return L('Unlocks at a peak net worth of ₲1,000,000,000,000.');
 if(owned(s)[id])return L('Already commissioned or owned.');
 if(s.ultra?.sold?.includes(id))return L('Already purchased and sold.');
 if(d.requires&&!done(s,d.requires))return L`Complete ${ULTRA_ITEMS[d.requires].name} first.`;
 if(d.months&&activeMegaProjects(s)>=megaCapacity(s))return L('All major project teams are busy.');
 if(s.money<d.cost)return L('Not enough cash.');
 return null;
}
function buyUltraImpl(s,id,position){
 const reason=ultraReason(s,id);if(reason)return{ok:false,msg:reason};
 const siteError=ULTRA_ITEMS[id].operation?null:ultraPlacementError(s,id,position);if(siteError)return{ok:false,msg:siteError};
 const d=ULTRA_ITEMS[id];s.highestWealth=Math.max(s.highestWealth||0,analyze(s).wealth);
 s.money-=d.cost;s.ultra??={items:{}};s.ultra.items[id]={start:s.month,complete:ultraDuration(id)===0,lastActivity:-1,duration:ultraDuration(id)};
 if(!d.operation)setUltraSite(s,id,position);
 if(!d.months)fame(s,d.fame);
 const msg=L`${d.name} · ${money(d.cost)} paid`;s.log.unshift(msg);s.log=s.log.slice(0,25);
 return{ok:true,msg};
}
export function ultraSaleReason(s,id){
 if(!Object.hasOwn(ULTRA_ITEMS,id)||!owned(s)[id])return L('You do not own this collection asset.');
 if(id==='moon'&&s.lunar)return L('The Moon base supports your permanent settlement and cannot be sold.');
 const dependent=Object.entries(ULTRA_ITEMS).find(([key,d])=>d.requires===id&&owned(s)[key]);
 return dependent?L`Sell ${dependent[1].name} first.`:null;
}
function sellUltraImpl(s,id){
 const d=ULTRA_ITEMS[id],reason=ultraSaleReason(s,id);if(reason)return{ok:false,msg:reason};
 const value=ultraSaleValue(id);
 s.money+=value;clearUltraSite(s,id);delete s.ultra.items[id];s.ultra.sold??=[];s.ultra.sold.push(id);
 const msg=L`${d.name} sold · ${money(value)} received`;
 s.log.unshift(msg);s.log=s.log.slice(0,25);
 return{ok:true,msg,value};
}
export function settleUltra(s){
 settleLunar(s);
 for(const [id,item] of Object.entries(owned(s))){const d=ULTRA_ITEMS[id];if(!item.complete&&s.month-item.start>=ultraDuration(id,item)){
  item.complete=true;fame(s,d.fame);s.log.unshift(L`${d.name} completed · Reputation +${d.fame}`);s.log=s.log.slice(0,25);
 }}
}
export function enjoyUltra(s,id){const blocked=healthReason(s);if(blocked)return{ok:false,msg:blocked};
 const d=ULTRA_ITEMS[id],item=owned(s)[id];
 if(!Object.hasOwn(ULTRA_ITEMS,id)||!item?.complete||d.group!=='collection'||lifeEnded(s)||item.lastActivity===s.month)return{ok:false,msg:L('Available once per month for each completed collection.')};
 item.lastActivity=s.month;s.stress=Math.max(0,s.stress-30);s.lifestyle??={spent:0,memories:0,last:{}};s.lifestyle.memories++;fame(s,20);
 return{ok:true,msg:L`${d.name} · Memories +1 · Reputation +20 · Stress −30`};
}
export function validUltra(s){
 if(!validLunar(s))return false;
 if(s.ultra===undefined)return Array.isArray(s.tiles)&&!s.tiles.some(t=>t?.type==='ultra'||t?.ultraId!==undefined);
 const u=s.ultra;if(!u||typeof u!=='object'||Array.isArray(u)||!u.items||typeof u.items!=='object'||Array.isArray(u.items))return false;
 if(u.sold!==undefined&&(!Array.isArray(u.sold)||new Set(u.sold).size!==u.sold.length||!u.sold.every(id=>Object.hasOwn(ULTRA_ITEMS,id)&&!u.items[id])))return false;
 if(!Object.entries(u.items).every(([id,v])=>Object.hasOwn(ULTRA_ITEMS,id)&&v&&Number.isInteger(v.start)&&v.start>=0&&v.start<=s.month&&typeof v.complete==='boolean'&&Number.isInteger(v.lastActivity)&&v.lastActivity>=-1&&v.lastActivity<=s.month&&(v.lastActivity===-1||(v.complete&&ULTRA_ITEMS[id].group==='collection'))&&(v.duration===undefined||v.duration===ultraDuration(id))&&(!v.complete||s.month-v.start>=ultraDuration(id,v))&&(!ULTRA_ITEMS[id].requires||u.items[ULTRA_ITEMS[id].requires]?.complete)))return false;
 if(!Array.isArray(s.tiles))return false;
 const occupied=new Map();
 for(const [id,v]of Object.entries(u.items))if(v.position!==undefined){
  if(ULTRA_ITEMS[id].operation||ultraPlacementError(s,id,v.position))return false;
  if(id!=='moon')for(const i of ultraCells(s,v.position)){if(occupied.has(i)||s.tiles[i].type!=='ultra'||s.tiles[i].ultraId!==id)return false;occupied.set(i,id);}
 }
 return s.tiles.every((t,i)=>t&&(t.type==='ultra'?occupied.has(i)&&occupied.get(i)===t.ultraId&&t.owner===null:t.ultraId===undefined));
}

export function placeUltra(s,id,position){return transaction(s,()=>{
 if(!Object.hasOwn(ULTRA_ITEMS,id)||!Object.hasOwn(owned(s),id))return{ok:false,msg:L('You do not own this collection asset.')};
 if(ULTRA_ITEMS[id].operation)return{ok:false,msg:L('This activity uses its existing facility.')};
 if(owned(s)[id].position)return{ok:false,msg:L('This facility is already placed.')};
 if(id==='moon'&&!done(s,'launch'))return{ok:false,msg:L`Complete ${ULTRA_ITEMS.launch.name} first.`};
 const reason=ultraPlacementError(s,id,position);if(reason)return{ok:false,msg:reason};
 setUltraSite(s,id,position);return{ok:true,msg:L('3×3 site confirmed.')};
});}
export function ultraEntry(s){return `<section class="owner-reputation"><h3>${L('Trillion Club')}</h3><p>${L('Space exploration · Global foundation · Exceptional collections')}</p>${ultraOwnedGallery(s)}${s.ultra?.items?.moon?.complete?`<p>${lunarStatus(s)}</p>`:''}<button data-action="ultra">${ultraUnlocked(s)?L('Enter the Trillion Club'):L('Preview · Unlocks at ₲1 trillion')}</button></section>`;}
const ultraArt=id=>`./city/assets/ultra/${ULTRA_ITEMS[id].art||id}.webp`;
export function ultraOwnedGallery(s){
 const assets=Object.entries(ULTRA_ITEMS).filter(([id,d])=>d.asset&&owned(s)[id]);
 if(!assets.length)return '';
 return `<div class="ultra-owned-gallery"><h4>${L('My Trillion Club assets')}</h4><div class="ultra-owned-list">${assets.map(([id,d])=>`<div class="ultra-owned-card"><img src="${ultraArt(id)}" alt="${d.name}" loading="lazy"><span><b>${d.name}</b><small>${owned(s)[id].complete?L('Completed'):L('In progress')}</small></span></div>`).join('')}</div></div>`;
}
export function ultraDialog(s){
 const groups={space:L('Private Space Development'),foundation:L('Global Foundation'),collection:L('Exceptional Collections')};
 const activities={museum:L('Host a private exhibition'),superyacht:L('Dive on a deep-sea expedition'),jet:L('Take a world tour'),relic:L('View the antiquities')};
 return `<span class="eyebrow">TRILLION CLUB</span><h2>${L('Beyond a trillion')}</h2><p>${L('Unlock permanently after reaching ₲1 trillion net worth. Pay each price once in cash. Projects advance with game months.')}</p><div class="flex-summary"><b>${L`Collection and infrastructure value: ${money(ultraValue(s))}`}</b><span>${L('Infrastructure and collections count toward net worth · Check each asset for sale restrictions')}</span></div>${ultraOwnedGallery(s)}${lunarPanel(s)}<p class="help">${L('Infrastructure and collections retain their purchase value, including construction in progress. Research, foundation and satellite funding are expenses. Eligible holdings and project rights can be sold for half their price. A Moon base supporting lunar development cannot be sold. Sell dependent activities first. Sold items cannot be repurchased; future income and progress stop, while earned reputation remains.')}</p>${Object.entries(groups).map(([group,title])=>`<h3>${title}</h3><div class="flex-grid">${Object.entries(ULTRA_ITEMS).filter(([,d])=>d.group===group).map(([id,d])=>{
 const item=owned(s)[id],reason=ultraReason(s,id),remaining=item?Math.max(0,ultraDuration(id,item)-(s.month-item.start)):ultraDuration(id);
 return `<section class="flex-item"><img class="ultra-art" src="${ultraArt(id)}" alt="${d.name}" loading="lazy"><h3>${d.name}</h3><p>${d.description}</p><p>${d.operation?L('Uses the completed facility · No additional land required'):id==='moon'?L('Moon only · Requires a completed spaceport · 3×3 tiles'):L('Choose 9 empty city tiles · Fixed 3×3 footprint')}</p><strong>${money(d.cost)}</strong><p>${d.asset?L('Retained asset value'):L('One-time project expense')} · ${L`Reputation +${d.fame} on completion`}</p><p>${d.income?L`Monthly net profit after deployment · ${money(d.income)}`:''}</p><p>${item?.complete?(d.income?L('Operating'):L('Completed')):d.months?L`${remaining} game months to complete`:L('Available immediately')}</p><button data-ultra-buy="${id}" ${reason?'disabled':''}>${reason||(d.operation?L('Review and start'):L('Choose 3×3 build site'))}</button>${item&&!d.operation?`${item.position?`<button data-ultra-map="${id}">${L('View on map')}</button>`:`<button data-ultra-place="${id}">${L('Place on map · 3×3')}</button>`}`:''}${item?.complete&&group==='collection'?`<p>${L('Free monthly experience · Memories +1 · Reputation +20 · Stress −30')}</p><button data-ultra-enjoy="${id}" ${item.lastActivity===s.month||lifeEnded(s)?'disabled':''}>${activities[id]}</button>`:''}${item?`<button data-ultra-sell="${id}" ${ultraSaleReason(s,id)?'disabled':''}>${ultraSaleReason(s,id)||L`Sell · ${money(ultraSaleValue(id))}`}</button>`:''}</section>`;
 }).join('')}</div>`).join('')}<button data-action="lifestyle" class="full">${L('Back to lifestyle')}</button>`;
}

export function buyUltra(s,...args){return transaction(s,()=>buyUltraImpl(s,...args));}
export function sellUltra(s,...args){return transaction(s,()=>sellUltraImpl(s,...args));}
