// Decision events for the rich life. Stakes scale with net worth; some choices pay off months later.
import {L} from './i18n.js';
import {hashRoll} from './rng.js';
import {shockPrices} from './market.js';
const money=n=>'₲'+Math.round(n).toLocaleString('en-US');
const pct=(wealth,p,min=0)=>Math.max(min,Math.round(wealth*p));
// Spending stops growing at the Tycoon chapter's ₲30M; investments keep scaling because they return the stake.
const spend=(wealth,p)=>pct(Math.min(wealth,30000000),p);
export const EVENT_INTERVAL=4;
export const RICH_EVENTS=[
 {id:'tax_audit',title:L('Tax audit notice'),text:L('Your growing wealth triggered a full tax audit. How do you respond?'),build:(s,c)=>[
  {label:L('Pay in full'),cost:spend(c.wealth,.03),fame:10,desc:L`Pay ${money(spend(c.wealth,.03))} · Reputation +10`},
  {label:L('Hire a tax consultant'),cost:spend(c.wealth,.01),stress:8,later:{months:4,amount:-spend(c.wealth,.06),chance:.35,label:L('Back taxes')},desc:L`${money(spend(c.wealth,.01))} now · 35% chance of a ${money(spend(c.wealth,.06))} back-tax bill in 4 months · Stress +8`},
  ...(c.fame>=150?[{label:L('Bring in the law firm'),cost:spend(c.wealth,.005),fame:-15,desc:L`${money(spend(c.wealth,.005))} spent · Reputation −15 · An option only fame unlocks`}]:[])]},
 {id:'rate_hike',title:L('Rate hike'),text:L('The central bank raised rates. Loans get harder and the rental market cools.'),build:(s,c)=>[
  {label:L('Buy high-yield bonds'),cost:pct(c.wealth,.05),later:{months:6,amount:pct(c.wealth,.05)+pct(c.wealth,.004)*6,chance:1,label:L('Bond matured')},desc:L`5% (${money(pct(c.wealth,.05))}) invested · Principal + 2.4% interest guaranteed back in 6 months`},
  {label:L('Wait and see'),multiplier:.9,months:3,desc:L('Rental & hotel revenue −10% for 3 months')}]},
 {id:'tourist_boom',title:L('Global event · Tourist surge'),text:L('The city landed a major international event. Lodging demand is about to explode.'),build:(s,c)=>[
  {label:L('Invest in promotion'),cost:spend(c.wealth,.02),multiplier:1.3,months:3,desc:L`${money(spend(c.wealth,.02))} spent · Rental & hotel revenue +30% for 3 months`},
  {label:L('Welcome them as is'),multiplier:1.1,months:1,desc:L('Revenue +10% for 1 month · No cost')}]},
 {id:'scandal',title:L('Tabloid scandal'),text:L('A party photo landed in the gossip pages. Public opinion is stirring.'),build:(s,c)=>[
  {label:L('Apologize and donate'),cost:spend(c.wealth,.02),fame:-10,desc:L`${money(spend(c.wealth,.02))} donated · Limits the hit to Reputation −10`},
  {label:L('Ignore it'),fame:-40,stress:15,desc:L('No cost · Reputation −40 · Stress +15')}]},
 // A gala is a night out, not an investment: costs scale early, then stop at party-sized prices.
 {id:'charity_gala',title:L('Charity gala invitation'),text:L('The biggest charity gala in the city needs a headline sponsor. High society is watching you.'),build:(s,c)=>{const sponsor=Math.min(pct(c.wealth,.015),100000),table=Math.min(pct(c.wealth,.002),10000);return[
  {label:L('Become headline sponsor'),cost:sponsor,fame:40,memories:1,stress:-10,desc:L`${money(sponsor)} sponsored · Reputation +40 · Memories +1`},
  {label:L('Just attend'),cost:table,fame:10,desc:L`${money(table)} for a table · Reputation +10`},
  {label:L('Skip it'),fame:-5,stress:-5,desc:L('Reputation −5 · Stress −5')}];}},
 {id:'insider_tip',title:L('Insider tip'),text:L('An old friend leaks pre-IPO info. They swear it\'s a sure thing, but getting caught would ruin your name.'),build:(s,c)=>[
  {label:L('Politely decline'),fame:5,desc:L('Reputation +5 · Nothing to lose')},
  {label:L('Bet quietly'),cost:pct(c.wealth,.03),stress:12,later:{months:2,amount:pct(c.wealth,.09),chance:.5,label:L('Insider bet'),penalty:{fame:-60}},desc:L`3% (${money(pct(c.wealth,.03))}) bet · In 2 months, 50%: +9% return / 50%: total loss and Reputation −60`}]},
 {id:'family_request',title:L('Family asks for startup money'),text:L('Your younger sibling asks for startup funding. The plan looks solid, but there are no guarantees.'),build:(s,c)=>[
  {label:L('Fund them gladly'),cost:spend(c.wealth,.02),stress:-10,fame:5,later:{months:9,amount:spend(c.wealth,.03),chance:.4,label:L('Sibling\'s first dividend')},desc:L`${money(spend(c.wealth,.02))} funded · Stress −10 · 40% chance of ${money(spend(c.wealth,.03))} back in 9 months`},
  {label:L('Decline'),stress:15,desc:L('No cost · Stress +15')}]},
 {id:'travel_slump',title:L('Tourism slump · Flights suspended'),text:L('Major air routes are cut and the hotel trade has frozen. Your staff are looking to you.'),build:(s,c)=>[
  {label:L('Keep every employee'),cost:spend(c.wealth,.01),fame:15,multiplier:.8,months:3,desc:L`${money(spend(c.wealth,.01))} spent · Reputation +15 · Revenue −20% for 3 months`},
  {label:L('Cut staff'),fame:-15,multiplier:.65,months:2,desc:L('No cost · Reputation −15 · Revenue −35% for 2 months')}]},
 {id:'museum_loan',title:L('Museum loan request'),text:L('The national museum asks to borrow your collection for a special exhibition.'),when:(s)=>(s.artCollection?.owned.length||0)>0,build:()=>[
  {label:L('Lend it'),fame:25,memories:1,desc:L('Reputation +25 · Memories +1 · The works return in 3 months')},
  {label:L('Decline'),desc:L('No change')}]},
 {id:'zoning',title:L('Riverfront redevelopment announced'),text:L('The city has hinted at riverfront redevelopment. A pre-announcement buying consortium invites you in.'),build:(s,c)=>[
  {label:L('Join the consortium'),cost:pct(c.wealth,.04),later:{months:6,amount:pct(c.wealth,.09),chance:.6,label:L('Redevelopment consortium payout'),fallback:pct(c.wealth,.02)},desc:L`4% (${money(pct(c.wealth,.04))}) invested · In 6 months, 60%: 9% return / 40%: only 2% back`},
  {label:L('Wait and see'),desc:L('No change')}]},
 {id:'burnout',title:L('Health checkup warning'),text:L('Your doctor warns you\'re overworked. Rest now, or you\'ll be forced to rest much longer later.'),when:s=>s.stress>=45,build:(s,c)=>[
  {label:L('Take a month off to recover'),cost:spend(c.wealth,.01),stress:-40,multiplier:.9,months:1,desc:L`${money(spend(c.wealth,.01))} · Stress −40 · Revenue −10% for 1 month`},
  {label:L('Ignore it and keep working'),stress:20,later:{months:3,amount:-spend(c.wealth,.02),chance:.6,label:L('Hospital bill')},desc:L`Stress +20 · 60% chance of a ${money(spend(c.wealth,.02))} hospital bill in 3 months`}]},
 {id:'market_crash',title:L('Stock market plunge'),text:L('Bad news from abroad crashed the market in a day. Sell in panic, or buy the dip?'),build:(s,c)=>[
  {label:L('Buy the dip'),cost:pct(c.wealth,.03),prices:.9,later:{months:3,amount:pct(c.wealth,.03)+pct(c.wealth,.02),chance:.75,label:L('Dip-buy rebound')},desc:L`Stock prices −10% · 3% (${money(pct(c.wealth,.03))}) extra buying · 75% chance of a 5% return in 3 months`},
  {label:L('Hold'),prices:.9,desc:L('Stock prices −10% · No extra spending')}]},
 {id:'rival_offer',title:L('Rival\'s buyout offer'),text:L('Your rival offers to buy your building above market price. Take the cash, or keep your pride?'),hidden:true,build:(s,c)=>[
  {label:L('Sell at a premium'),money:c.offer,action:'sell-to-rival',tile:c.tile,desc:L`${c.tileName} sold · 130% of market (${money(c.offer)}) in cash`},
  {label:L('Decline'),fame:10,desc:L('Reputation +10 · Rival\'s next offer comes in a year')}]}
];
const eventById=id=>RICH_EVENTS.find(e=>e.id===id);
export function buildRichEvent(s,id,ctx){
 const e=eventById(id);if(!e)return null;
 const options=e.build(s,ctx).map(o=>({...o,cost:o.cost||0}));
 return{id:e.id,title:e.title,text:e.text,options};
}
// Every EVENT_INTERVAL months, pick a non-repeating eligible event deterministically.
export function scheduleRichEvent(s,ctx){
 if(s.event||s.month===0||s.month%EVENT_INTERVAL!==0)return null;
 const recent=(s.eventLog||[]).slice(0,3);
 const pool=RICH_EVENTS.filter(e=>!e.hidden&&!recent.includes(e.id)&&(!e.when||e.when(s,ctx)));
 const pick=pool[Math.floor(hashRoll(s.seed,s.month,'event')*pool.length)];
 if(!pick)return null;
 s.event=buildRichEvent(s,pick.id,ctx);s.eventLog=[pick.id,...(s.eventLog||[])].slice(0,6);
 return s.event;
}
export function applyRichChoice(s,o){
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 if(s.mode!=='sandbox')s.money-=o.cost||0;
 if(o.money)s.money+=o.money;
 s.stress=clamp(s.stress+(o.stress||0),0,100);s.skill=clamp(s.skill+(o.skill||0),0,100);
 if(o.fame)s.prestige=Math.max(0,(s.prestige||0)+o.fame);
 if(o.memories){s.lifestyle??={spent:0,memories:0,last:{}};s.lifestyle.memories+=o.memories;}
 if(o.prices)shockPrices(s,o.prices);
 if(o.multiplier)s.effect={bonus:0,remaining:o.months||1,multiplier:o.multiplier};else if(o.bonus)s.effect={bonus:o.bonus,remaining:2};
 if(o.later){s.pending??=[];const seq=(s.pendingSerial=(s.pendingSerial||0)+1);s.pending.push({id:seq,label:o.later.label,month:s.month+o.later.months,amount:o.later.amount,chance:o.later.chance,fallback:o.later.fallback||0,penalty:o.later.penalty||null,roll:hashRoll(s.seed,seq,'pending')});}
 if(o.action==='sell-to-rival'&&Number.isInteger(o.tile)){const t=s.tiles[o.tile];if(t?.owner==='player'){t.owner='rival';t.tree=false;delete t.assetLedger;if(s.rival){s.rival.tiles.push(o.tile);s.rival.acquired=(s.rival.acquired||0)+1;}}}
}
// Delayed payoffs resolve at month end using the roll fixed when the decision was made.
export function resolvePending(s){
 if(!s.pending?.length)return[];
 const due=s.pending.filter(p=>p.month<=s.month),resolved=[];
 for(const p of due){
  const win=p.roll<p.chance,amount=win?p.amount:p.fallback||0;
  s.money+=amount;if(!win&&p.penalty?.fame)s.prestige=Math.max(0,(s.prestige||0)+p.penalty.fame);
  s.log.unshift(`${amount>=0?'✦':'⚠'} ${p.label} · ${win?L('Success'):L('Fell through')} · ${amount>=0?'+':'−'}${money(Math.abs(amount))}${!win&&p.penalty?.fame?L(' · Reputation ')+p.penalty.fame:''}`);
  resolved.push({...p,win,amount});
 }
 s.pending=s.pending.filter(p=>p.month>s.month);s.log=s.log.slice(0,25);
 return resolved;
}
export function validRichEvent(s){
 const e=s.event;if(!e)return true;
 if(!eventById(e.id)||typeof e.title!=='string'||typeof e.text!=='string'||!Array.isArray(e.options)||e.options.length<1||e.options.length>3)return false;
 return e.options.every(o=>o&&typeof o.label==='string'&&typeof o.desc==='string'&&Number.isFinite(o.cost)&&o.cost>=0&&['money','stress','skill','fame','memories','multiplier','months','prices','bonus'].every(k=>o[k]===undefined||Number.isFinite(o[k]))&&(o.later===undefined||(o.later&&Number.isInteger(o.later.months)&&o.later.months>0&&Number.isFinite(o.later.amount)&&Number.isFinite(o.later.chance)))&&(o.tile===undefined||Number.isInteger(o.tile)));
}
export function validPending(s){
 if(s.pending===undefined)return true;
 if(!Array.isArray(s.pending)||s.pending.length>12)return false;
 return s.pending.every(p=>p&&Number.isInteger(p.id)&&typeof p.label==='string'&&Number.isInteger(p.month)&&p.month>s.month-1&&Number.isFinite(p.amount)&&Number.isFinite(p.chance)&&Number.isFinite(p.roll)&&p.roll>=0&&p.roll<1)&&(s.pendingSerial===undefined||Number.isInteger(s.pendingSerial))&&(s.eventLog===undefined||(Array.isArray(s.eventLog)&&s.eventLog.length<=6&&s.eventLog.every(id=>!!eventById(id))));
}
