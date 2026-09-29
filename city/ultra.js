import {healthReason} from './health.js';
import {transaction} from './health.js';
import {L} from './i18n.js';
import {analyze} from './engine.js';
import {lifeEnded} from './longevity.js';

export const ULTRA_UNLOCK=1000000000000;
export const ULTRA_ITEMS={
 launch:{name:L('Private Spaceport'),group:'space',icon:'🚀',cost:200000000000,months:6,fame:1000,asset:true,description:L('Build a launch complex and open the route to the Moon.')},
 moon:{name:L('Lunar Research Base'),group:'space',icon:'🌕',cost:800000000000,months:18,fame:3000,asset:true,requires:'launch',description:L('Build a permanent lunar base after completing your spaceport.')},
 probe:{name:L('Deep Space Expedition'),group:'space',icon:'🛰',cost:300000000000,months:12,fame:2000,requires:'moon',description:L('Send a scientific probe beyond the Moon. Complete a deep-space survey.')},
 disease:{name:L('Disease Eradication Initiative'),group:'foundation',icon:'🧬',cost:150000000000,months:12,fame:2500,description:L('Fund vaccine research and access to treatment. Complete a global health campaign.')},
 climate:{name:L('Global Climate Initiative'),group:'foundation',icon:'🌱',cost:250000000000,months:18,fame:3500,description:L('Fund clean energy and ecosystem restoration. Complete a climate action network.')},
 museum:{name:L('Private World Museum'),group:'collection',icon:'🏛',cost:100000000000,months:6,fame:800,asset:true,description:L('Build your own museum and host private exhibitions.')},
 superyacht:{name:L('Expedition Superyacht'),group:'collection',icon:'🛥',cost:50000000000,months:0,fame:400,asset:true,description:L('Own a superyacht for private ocean expeditions.')},
 jet:{name:L('Private Widebody Jet'),group:'collection',icon:'✈',cost:30000000000,months:0,fame:300,asset:true,description:L('Travel the world aboard your own private airliner.')},
 relic:{name:L('Rare Antiquities Collection'),group:'collection',icon:'🏺',cost:80000000000,months:0,fame:600,asset:true,requires:'museum',description:L('Collect documented antiquities and display them in your completed museum.')}
};
const owned=s=>s.ultra?.items||{};
const done=(s,id)=>!!owned(s)[id]?.complete;
const money=n=>'₲'+n.toLocaleString('en-US');
export function ultraValue(s){return Object.entries(owned(s)).reduce((n,[id])=>n+(ULTRA_ITEMS[id]?.asset?ULTRA_ITEMS[id].cost:0),0);}
export function ultraSaleValue(id){const d=ULTRA_ITEMS[id];return d?.group==='collection'?Math.floor(d.cost/2):0;}
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
 if(s.money<d.cost)return L('Not enough cash.');
 return null;
}
function buyUltraImpl(s,id){
 const reason=ultraReason(s,id);if(reason)return{ok:false,msg:reason};
 const d=ULTRA_ITEMS[id];s.highestWealth=Math.max(s.highestWealth||0,analyze(s).wealth);
 s.money-=d.cost;s.ultra??={items:{}};s.ultra.items[id]={start:s.month,complete:d.months===0,lastActivity:-1};
 if(!d.months)fame(s,d.fame);
 const msg=L`${d.name} · ${money(d.cost)} paid`;s.log.unshift(msg);s.log=s.log.slice(0,25);
 return{ok:true,msg};
}
function sellUltraImpl(s,id){
 const d=ULTRA_ITEMS[id],item=owned(s)[id];
 if(!d||d.group!=='collection'||!item)return{ok:false,msg:L('You do not own this collection asset.')};
 if(id==='museum'&&owned(s).relic)return{ok:false,msg:L('Sell the antiquities before selling the museum.')};
 const value=ultraSaleValue(id);
 s.money+=value;delete s.ultra.items[id];s.ultra.sold??=[];s.ultra.sold.push(id);
 const msg=L`${d.name} sold · ${money(value)} received`;
 s.log.unshift(msg);s.log=s.log.slice(0,25);
 return{ok:true,msg,value};
}
export function settleUltra(s){
 for(const [id,item] of Object.entries(owned(s))){const d=ULTRA_ITEMS[id];if(!item.complete&&s.month-item.start>=d.months){
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
 if(s.ultra===undefined)return true;
 const u=s.ultra;if(!u||typeof u!=='object'||Array.isArray(u)||!u.items||typeof u.items!=='object'||Array.isArray(u.items))return false;
 if(u.sold!==undefined&&(!Array.isArray(u.sold)||new Set(u.sold).size!==u.sold.length||!u.sold.every(id=>Object.hasOwn(ULTRA_ITEMS,id)&&ULTRA_ITEMS[id].group==='collection'&&!u.items[id])))return false;
 return Object.entries(u.items).every(([id,v])=>Object.hasOwn(ULTRA_ITEMS,id)&&v&&Number.isInteger(v.start)&&v.start>=0&&v.start<=s.month&&typeof v.complete==='boolean'&&Number.isInteger(v.lastActivity)&&v.lastActivity>=-1&&v.lastActivity<=s.month&&(v.lastActivity===-1||(v.complete&&ULTRA_ITEMS[id].group==='collection'))&&(!v.complete||s.month-v.start>=ULTRA_ITEMS[id].months)&&(!ULTRA_ITEMS[id].requires||u.items[ULTRA_ITEMS[id].requires]?.complete));
}
export function ultraEntry(s){return `<section class="owner-reputation"><h3>${L('Trillion Club')}</h3><p>${L('Space exploration · Global foundation · Exceptional collections')}</p>${ultraOwnedGallery(s)}<button data-action="ultra">${ultraUnlocked(s)?L('Enter the Trillion Club'):L('Preview · Unlocks at ₲1 trillion')}</button></section>`;}
const ULTRA_ART={superyacht:'./city/assets/vehicles/yacht-mega.webp'};
export function ultraOwnedGallery(s){
 const assets=Object.entries(ULTRA_ITEMS).filter(([id,d])=>d.asset&&owned(s)[id]);
 if(!assets.length)return '';
 return `<div class="ultra-owned-gallery"><h4>${L('My Trillion Club assets')}</h4><div class="ultra-owned-list">${assets.map(([id,d])=>`<div class="ultra-owned-card">${ULTRA_ART[id]?`<img src="${ULTRA_ART[id]}" alt="${d.name}" loading="lazy">`:`<span class="ultra-owned-icon" aria-hidden="true">${d.icon}</span>`}<span><b>${d.name}</b><small>${owned(s)[id].complete?L('Completed'):L('In progress')}</small></span></div>`).join('')}</div></div>`;
}
export function ultraDialog(s){
 const groups={space:L('Private Space Development'),foundation:L('Global Foundation'),collection:L('Exceptional Collections')};
 const activities={museum:L('Host a private exhibition'),superyacht:L('Sail on an ocean expedition'),jet:L('Take a world tour'),relic:L('View the antiquities')};
 return `<span class="eyebrow">TRILLION CLUB</span><h2>${L('Beyond a trillion')}</h2><p>${L('Unlock permanently after reaching ₲1 trillion net worth. Pay each price once in cash. Projects advance with game months.')}</p><div class="flex-summary"><b>${L`Collection and infrastructure value: ${money(ultraValue(s))}`}</b><span>${L('Included in net worth · Collections can be sold for half their purchase price')}</span></div>${ultraOwnedGallery(s)}<p class="help">${L('Infrastructure and collections retain their purchase value, including construction in progress. Research and foundation funding are expenses. Collections can be sold for half their purchase price; projects cannot be sold. No additional monthly fees.')}</p>${Object.entries(groups).map(([group,title])=>`<h3>${title}</h3><div class="flex-grid">${Object.entries(ULTRA_ITEMS).filter(([,d])=>d.group===group).map(([id,d])=>{
 const item=owned(s)[id],reason=ultraReason(s,id),remaining=item?Math.max(0,d.months-(s.month-item.start)):d.months;
 return `<section class="flex-item"><span class="flex-icon">${d.icon}</span><h3>${d.name}</h3><p>${d.description}</p><strong>${money(d.cost)}</strong><p>${d.asset?L('Retained asset value'):L('One-time project expense')} · ${L`Reputation +${d.fame} on completion`}</p><p>${item?.complete?L('Completed'):d.months?L`${remaining} game months to complete`:L('Available immediately')}</p><button data-ultra-buy="${id}" ${reason?'disabled':''}>${reason||L('Commission / Purchase')}</button>${item?`<button data-ultra-map="${id}">${L('View on map')}</button>`:''}${item?.complete&&group==='collection'?`<p>${L('Free monthly experience · Memories +1 · Reputation +20 · Stress −30')}</p><button data-ultra-enjoy="${id}" ${item.lastActivity===s.month||lifeEnded(s)?'disabled':''}>${activities[id]}</button>`:''}${item&&group==='collection'?`<button data-ultra-sell="${id}" ${id==='museum'&&owned(s).relic?'disabled':''}>${L`Sell · ${money(ultraSaleValue(id))}`}</button>`:''}</section>`;
 }).join('')}</div>`).join('')}<button data-action="lifestyle" class="full">${L('Back to lifestyle')}</button>`;
}

export function buyUltra(s,...args){return transaction(s,()=>buyUltraImpl(s,...args));}
export function sellUltra(s,...args){return transaction(s,()=>sellUltraImpl(s,...args));}
