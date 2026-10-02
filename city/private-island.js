import {transaction} from './health.js';
import {L} from './i18n.js';
import {lifeEnded} from './longevity.js';

export const ISLAND_COST=500000000000;
export const VILLA_COST=1000000000;
const money=n=>'₲'+n.toLocaleString('en-US');

export function islandValue(s){return s.privateIsland?.owned?ISLAND_COST+(s.privateIsland.villa?VILLA_COST:0):0;}

export function islandReason(s,part){
 if(s.concept!=='rich-life')return L('Available only in Super Rich Life.');
 if(lifeEnded(s))return L('Rejuvenate to begin a new project.');
 if(part==='island'){
  if(s.privateIsland?.owned)return L('Island already owned.');
  if(s.money<ISLAND_COST)return L('Not enough cash.');
  return null;
 }
 if(part==='villa'){
  if(!s.privateIsland?.owned)return L('Buy the island first.');
  if(s.privateIsland.villa)return L('Villa already built.');
  if(s.money<VILLA_COST)return L('Not enough cash.');
  return null;
 }
 return L('Choose the island or villa.');
}

export function buyIsland(s,part){return transaction(s,()=>{
 const reason=islandReason(s,part);if(reason)return{ok:false,msg:reason};
 const cost=part==='island'?ISLAND_COST:VILLA_COST;
 s.money-=cost;
 if(part==='island')s.privateIsland={owned:true,villa:false};else s.privateIsland.villa=true;
 const msg=part==='island'?L`Private island purchased · ${money(cost)} paid`:L`Island villa built · ${money(cost)} paid`;
 s.log.unshift(msg);s.log=s.log.slice(0,25);
 return{ok:true,msg};
});}

export function validIsland(s){const i=s.privateIsland;return i===undefined||!!(i&&typeof i==='object'&&!Array.isArray(i)&&i.owned===true&&typeof i.villa==='boolean');}

export function islandScene(s){
 const owned=!!s.privateIsland?.owned,villa=!!s.privateIsland?.villa;
 const part=owned?'villa':'island',cost=owned?VILLA_COST:ISLAND_COST,reason=villa?null:islandReason(s,part);
 return `<div class="island-header"><div><span class="eyebrow">${L('PRIVATE ISLAND')}</span><h2>${L('My island, my villa')}</h2><p>${owned?L('A private island away from the city.'):L('A private island is waiting beyond the city.')}</p></div><button data-action="island-back">${L('← City map')}</button></div><div class="island-map"><img class="island-land" src="./city/assets/island/private-island.png" alt="${L('Private island surrounded by turquoise water')}" draggable="false">${villa?`<img class="island-villa" src="./city/assets/island/island-villa.png" alt="${L('My island villa')}" draggable="false">`:''}${!villa?`<button class="island-site" data-island-buy="${part}" ${reason?'disabled':''}>${owned?L('Build here'):L('Buy this island')}</button>`:''}</div><div class="island-actions"><div><b>${villa?L('Your private retreat is complete'):owned?L('The island is yours'):L('Private island')}</b><span>${villa?L('Island and villa are included in net worth.'):owned?L('The villa construction cost is separate from the island price.'):L('Purchase the island, then build your villa on its central site.')}</span></div><strong>${villa?money(ISLAND_COST+VILLA_COST):money(cost)}</strong>${villa?'':`<button class="primary" data-island-buy="${part}" ${reason?'disabled':''}>${owned?L('Build island villa'):L('Buy private island')}</button>`}${reason?`<small>${reason}</small>`:''}</div>`;
}
