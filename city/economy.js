import {L} from './i18n.js';
// One economy, two rhythms. A seeded crash every 5–10 years reprices assets 20–50% down (cash and debt are
// not repriced), while a monthly business cycle (±14%) and decision shocks move every rent, hotel and compound income.
const roll=(seed,n)=>{let x=(seed^Math.imul(n,0x9e3779b1)^0x3c6ef372)>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return((x^(x>>>16))>>>0)/4294967296;};
export function ensureEconomy(s){return s.economy??={next:s.month+60+Math.floor(roll(s.seed,0)*61),count:0,start:0,duration:0,drop:0};}
// Crash price factor (1 = normal). Applied to asset prices and valuations.
export function marketFactor(s){const e=s.economy;if(!e?.drop)return 1;const age=s.month-e.start;if(age<0)return 1;return 1-e.drop*Math.max(0,Math.min(1,(e.duration+12-age)/12));}
export const marketPrice=(s,price)=>Math.round(price*marketFactor(s));
export const incomeFactor=s=>marketFactor(s)<1?.7:1;
export function advanceEconomy(s){const e=ensureEconomy(s);if(s.month<e.next)return false;e.count++;e.start=s.month;e.duration=12+Math.floor(roll(s.seed,e.count*3)*13);e.drop=(20+Math.floor(roll(s.seed,e.count*3+1)*31))/100;e.next=s.month+60+Math.floor(roll(s.seed,e.count*3+2)*61);s.log.unshift(L`Market crash · Asset prices down ${Math.round(e.drop*100)}%. A chance to buy the dip with cash.`);return true;}
export function validEconomy(s){const e=s?.economy;if(e===undefined)return true;return !!(e&&Number.isFinite(e.drop)&&['next','count','start','duration'].every(k=>Number.isSafeInteger(e[k])&&e[k]>=0)&&e.next>s.month&&e.next<=s.month+120&&e.start<=s.month&&(e.count===0?e.drop===0&&e.duration===0:e.drop>=.2&&e.drop<=.5&&e.duration>=12&&e.duration<=24&&e.next-e.start>=60&&e.next-e.start<=120));}
// Monthly business cycle. Multiplied by any temporary shock from a decision (s.effect.multiplier).
export const CYCLE_AMPLITUDE=.14;
export function economyCycle(s,month=s.month){return 1+Math.sin(month*.45+s.seed*.1)*CYCLE_AMPLITUDE;}
export function cycleFactor(s,month=s.month){return economyCycle(s,month)*(s.effect?.multiplier??1);}
export function economyReport(s){
 const cycle=economyCycle(s),next=economyCycle(s,s.month+1),factor=cycleFactor(s),market=marketFactor(s);
 const phase=market<1?'bust':cycle>=1.06?'boom':cycle<=.94?'bust':'steady';
 const label=market<1?L('Market crash'):{boom:L('Boom'),bust:L('Bust'),steady:L('Steady')}[phase],trend=next>cycle+.005?L('Rising'):next<cycle-.005?L('Falling'):L('Peak');
 const shock=s.effect?.multiplier&&s.effect.multiplier!==1?{multiplier:s.effect.multiplier,remaining:s.effect.remaining}:null;
 return{cycle,factor,market,phase,label,trend,shock,percent:Math.round((factor*incomeFactor(s)-1)*100)};
}
export function economyBanner(s){const f=marketFactor(s),r=economyReport(s);return `<section class="side-section" role="status"><h3>${f<1?'📉 '+(s.month-s.economy.start<s.economy.duration?L('Market crash · Buy-the-dip window'):L('Recovery underway'))+L(' · Prices −')+Math.round((1-f)*100)+'%':L`Economy: ${r.label} · Income ${r.percent>0?'+':''}${r.percent}%`}</h3><p class="help">${f<1?L('Stocks, property, companies, artwork and compound assets can be bought with cash at reduced prices. Business, rental and owner income drops 30%.'):L`A monthly business cycle swings rental, hotel and compound income by ±14% (${r.trend}). Every 5–10 years a market crash knocks asset prices down 20–50%.`}</p></section>`;}
