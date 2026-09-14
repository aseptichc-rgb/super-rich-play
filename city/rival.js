// A rival tycoon competes for the same land, grows with rubber-band pacing and makes buyout offers.
import {L,localized} from './i18n.js';
import {TYPES,coords,neighbors,developmentQuote,assetValue} from './engine.js';
import {buildRichEvent} from './events.js';
const NAMES=[L('Kangho Baek'),L('Jian Seo'),L('Doyun Han'),L('Yunseo Choi'),L('Taeo Kang')];
const money=n=>'₲'+Math.round(n).toLocaleString('en-US');
export function ensureRival(s){
 if(s.concept!=='rich-life')return null;
 return s.rival??={name:NAMES[Math.abs(s.seed||0)%NAMES.length],wealth:Math.round((s.startingWealth||2000000)*.9),tiles:[],nextBuy:6,target:-1,acquired:0,preempted:0,offerMonth:-1};
}
export function rivalTier(r){return r.wealth<8000000?'office':r.wealth<30000000?'hotel':'resort';}
export function rivalCandidates(s){
 const type=rivalTier(s.rival);
 return s.tiles.map((t,i)=>i).filter(i=>{const t=s.tiles[i];return t.terrain==='land'&&!t.type&&!t.owner&&neighbors(i).some(n=>s.tiles[n].type==='road');}).sort((a,b)=>developmentQuote(s,b,type).score-developmentQuote(s,a,type).score);
}
// Runs after the month counter advanced. Returns what happened so the UI can react.
export function advanceRival(s,playerWealth){
 const r=ensureRival(s);if(!r)return[];
 const ratio=playerWealth/Math.max(1,r.wealth),adjust=Math.max(-.008,Math.min(.03,(ratio-1)*.04));
 r.wealth=Math.round(r.wealth*(1+.015+adjust));
 const events=[];
 if(s.month===r.nextBuy-1&&r.target<0){
  const c=rivalCandidates(s)[0];
  if(c!==undefined){r.target=c;const{x,y}=coords(c);s.log.unshift(L`⚑ Rival ${r.name} · eyeing a ${TYPES[rivalTier(r)].name} lot at Street ${x+1}, Lot ${y+1}. Buying next month`);events.push({kind:'target',tile:c});}
 }else if(s.month>=r.nextBuy){
  const i=r.target,t=s.tiles[i];
  if(i>=0&&t&&t.terrain==='land'&&!t.type&&!t.owner){const type=rivalTier(r),{x,y}=coords(i);Object.assign(t,{type,owner:'rival',level:1,tree:false,constructionCost:developmentQuote(s,i,type).construction});r.tiles.push(i);r.acquired++;s.log.unshift(L`⚑ Rival ${r.name} · broke ground on a ${TYPES[type].name} at Street ${x+1}, Lot ${y+1}`);events.push({kind:'bought',tile:i});}
  else if(i>=0){r.preempted++;s.prestige=Math.max(0,(s.prestige||0)+5);s.log.unshift(L('✦ You secured the lot before the rival · Reputation +5'));events.push({kind:'preempted',tile:i});}
  r.target=-1;r.nextBuy=s.month+(s.month>=36?4:5);
 }
 if(s.month%12===0){const i=r.tiles.find(i=>s.tiles[i]?.owner==='rival'&&s.tiles[i].level<3);if(i!==undefined)s.tiles[i].level++;}
 r.tiles=r.tiles.filter(i=>s.tiles[i]?.owner==='rival');
 s.log=s.log.slice(0,25);
 return events;
}
// From the tycoon chapter, the rival offers 130% of value for the player's best building once a year.
export function rivalOffer(s,wealth){
 const r=s.rival;if(!r||s.event||s.month<36||s.month%4!==2||(s.highestWealth||0)<30000000||s.month-r.offerMonth<12)return null;
 const targets=s.tiles.map((t,i)=>i).filter(i=>s.tiles[i].owner==='player'&&TYPES[s.tiles[i].type]?.managed).sort((a,b)=>assetValue(s,b)-assetValue(s,a));
 if(!targets.length)return null;
 const tile=targets[0],offer=Math.round(assetValue(s,tile)*1.3);
 s.event=buildRichEvent(s,'rival_offer',{wealth,offer,tile,tileName:TYPES[s.tiles[tile].type].name});r.offerMonth=s.month;
 return s.event;
}
export function rivalSummary(s,wealth){
 const r=s.rival;if(!r)return null;
 const share=wealth/Math.max(1,wealth+r.wealth);
 return{name:localized(r.name),wealth:r.wealth,ahead:wealth>=r.wealth,gap:wealth-r.wealth,share,buildings:r.tiles.length,target:r.target,nextBuy:r.nextBuy,acquired:r.acquired,preempted:r.preempted,label:wealth>=r.wealth*1.5?L('Commanding lead'):wealth>=r.wealth?L('Narrow lead'):wealth*1.5>=r.wealth?L('Chasing'):L('Far behind')};
}
export function validRival(s){
 const r=s.rival;if(r===undefined)return true;
 return !!(r&&typeof r.name==='string'&&r.name.length<=20&&Number.isFinite(r.wealth)&&r.wealth>=0&&Array.isArray(r.tiles)&&r.tiles.every(i=>Number.isInteger(i)&&s.tiles?.[i]?.owner==='rival')&&Number.isInteger(r.nextBuy)&&Number.isInteger(r.target)&&r.target>=-1&&r.target<(s.tiles?.length||0)&&['acquired','preempted'].every(k=>Number.isInteger(r[k])&&r[k]>=0)&&Number.isInteger(r.offerMonth)&&r.offerMonth>=-1&&r.offerMonth<=s.month);
}
export function rivalCard(s,wealth){
 const v=rivalSummary(s,wealth);if(!v)return'';
 return L`<section class="side-section rival-race"><h3>Tycoon Race <span>⚑</span></h3><div class="race-bar" role="img" aria-label="Me ${money(wealth)} vs ${v.name} ${money(v.wealth)}"><i style="width:${Math.round(v.share*100)}%"></i></div><div class="race-names"><span>Me <b>${money(wealth)}</b></span><span>${v.name} <b>${money(v.wealth)}</b></span></div><p class="help">${v.label} · Rival buildings: ${v.buildings}${v.target>=0?L` · Eyeing <b>Street ${coords(v.target).x+1}, Lot ${coords(v.target).y+1}</b>`:L` · Next purchase in ${Math.max(0,v.nextBuy-s.month)} months`}</p>${v.target>=0?L`<button class="portfolio-link" data-rival-target="${v.target}">View Targeted Lot →</button>`:''}</section>`;
}
