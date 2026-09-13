import {reputationSummary} from './empire.js';
export const VENTURES={
 fusion:{name:'Helio Fusion',icon:'☀',sector:'Next-gen Energy',chance:.22,multiple:8,story:'Chasing the first commercial contract for compact fusion modules.'},
 bio:{name:'Lumina Bio',icon:'◌',sector:'AI Drug Discovery',chance:.30,multiple:6,story:'About to unveil clinical data for a rare-disease drug candidate.'},
 orbit:{name:'Orbital Link',icon:'◎',sector:'Space Logistics',chance:.18,multiple:10,story:'Preparing the first orbital delivery test of a reusable cargo ship.'},
 robot:{name:'Motion Robotics',icon:'⚙',sector:'Industrial Robots',chance:.25,multiple:7,story:'Preparing the first factory delivery of autonomous work robots.'},
 ocean:{name:'BlueWave',icon:'≈',sector:'Ocean Tech',chance:.20,multiple:9,story:'Taking on a large-scale pilot of ocean clean-up systems.'}
};
const COMPANY_NAMES=['Nova','Astra','Velo','Neo','Aether','Solar','Lumen','Terra','Pulse','Aurora','Cosmo','Luna','Alto','Prism','Quantum'];
const COMPANY_FIELDS=['Energy','Biolabs','Space','Robotics','Oceantech'];
export const MOONSHOT_OUTCOMES=[{multiple:0,chance:.8},{multiple:2,chance:.1},{multiple:5,chance:.05},{multiple:10,chance:.025},{multiple:50,chance:.015},{multiple:100,chance:.008},{multiple:1000,chance:.002}];
const MOONSHOT={name:'Infinity Labs',icon:'✧',sector:'Ultra High Risk · Moonshot',chance:.2,multiple:1000,variable:true,story:'Attempting to commercialize an unknown technology. Returns range from ₲0 up to 1,000× your investment.'};
// odds < 1 (stress above 65 at signing) shrinks the success window of fixed-multiple ventures.
export const DILIGENCE_HOURS=20;
export const VENTURE_ODDS=[.85,1.15,.9775];
export function ventureMultiple(id,roll,odds=1){const d=ventureCompany(id);if(!d.variable)return roll<Math.min(.95,d.chance*odds)?d.multiple:0;let cumulative=0;for(const outcome of MOONSHOT_OUTCOMES){cumulative+=outcome.chance;if(roll<cumulative)return outcome.multiple;}return 1000;}
export const venturePayout=item=>{const multiple=ventureMultiple(item.ventureId,item.roll,item.odds??1);return multiple>0?item.amount*multiple:item.salvage?Math.round(item.amount*.2):0;};
export function ventureCompany(id){
 if(id==='moonshot')return MOONSHOT;
 if(Object.hasOwn(VENTURES,id))return VENTURES[id];
 const match=/^round-([1-9]\d*)-([0-4])$/.exec(id);if(!match)return null;
 const round=Number(match[1]),slot=Number(match[2]);if(!Number.isSafeInteger(round)||round>Math.floor(Number.MAX_SAFE_INTEGER/3))return null;
 const field=(slot+round)%5,base=slot===4?MOONSHOT:Object.values(VENTURES)[field];
 return{...base,name:`${COMPANY_NAMES[(round*5+slot)%COMPANY_NAMES.length]} ${COMPANY_FIELDS[field]} ${round}`,story:base.story};
}
export function ventureOffering(s){const round=Math.floor(s.month/3);return{round,nextMonth:(round+1)*3,companies:Array.from({length:5},(_,slot)=>{const id=round===0?(slot===4?'moonshot':Object.keys(VENTURES)[slot]):`round-${round}-${slot}`;return{id,...ventureCompany(id)};})};}

const AMOUNTS=[10000,50000,100000];
const hashRoll=(seed,sequence,id)=>{
 let x=(Number(seed)||0)^Math.imul(sequence+1,0x9e3779b1);
 for(const c of id)x=Math.imul(x^c.charCodeAt(0),0x85ebca6b);
 x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;
 return (x>>>0)/4294967296;
};

export function ensureVentures(s){
 if(!s.ventures)s.ventures={active:[],history:[],sequence:0,lastInvestedMonth:-1};
 return s.ventures;
}

// Saves written before the interface moved to English hold the old localized company names,
// which validItem compares against the table. Rebuild only those names from the stored id so
// the name check still guards saves written since.
const LOCALIZED_NAME=/[\uAC00-\uD7A3]/;
export function repairVentureNames(s){
 for(const list of [s?.ventures?.active,s?.ventures?.history]){
  if(!Array.isArray(list))continue;
  for(const item of list){
   if(!item||typeof item.name!=='string'||!LOCALIZED_NAME.test(item.name))continue;
   const d=ventureCompany(item.ventureId);if(d)item.name=d.name;
  }
 }
 return s;
}

export function investVenture(s,id,amount){
 const d=ventureOffering(s).companies.find(c=>c.id===id),v=ensureVentures(s);
 if(!d)return{ok:false,msg:'Choose a company to invest in.'};
 if(!AMOUNTS.includes(amount))return{ok:false,msg:'Check the investment amount.'};
 if(v.active.length>=3)return{ok:false,msg:'You can have at most 3 active venture investments.'};
 if(s.money<amount)return{ok:false,msg:'Not enough cash to invest.'};
 const stressed=s.stress>65,diligent=s.concept==='rich-life'&&(s.plan.inspect||0)>=DILIGENCE_HOURS,salvage=s.concept==='rich-life'&&reputationSummary(s).salvage;
 const odds=Math.round((stressed?.85:1)*(diligent?1.15:1)*10000)/10000;
 const investment={id:`venture-${v.sequence+1}`,ventureId:id,name:d.name,amount,startedMonth:s.month,dueMonth:s.month+3,roll:hashRoll(s.seed,v.sequence,id),...(odds!==1?{odds}:{}),...(salvage?{salvage:true}:{})};
 v.sequence++;v.lastInvestedMonth=s.month;v.active.push(investment);s.money-=amount;
 s.log.unshift(`${d.icon} ${d.name} venture investment · ₲${amount.toLocaleString('en-US')} · results in month ${investment.dueMonth}${stressed?' · Overworked, judgment impaired (success rate −15%)':''}${diligent?' · Due diligence boosts success rate +15%':''}${salvage?' · Reputation recovers 20% on failure':''}`);s.log=s.log.slice(0,25);
 return{ok:true,msg:`${d.name} investment placed · Fate decided in 3 months.${stressed?' High stress cuts the success rate by 15%.':''}${diligent?' Due diligence hours raise the success rate by 15%.':''}`};
}

export function advanceVentures(s){
 const v=ensureVentures(s),resolved=[];
 v.active=v.active.filter(item=>{
  if(item.dueMonth>s.month)return true;
  const d=ventureCompany(item.ventureId),multiple=ventureMultiple(item.ventureId,item.roll,item.odds??1),success=multiple>0,payout=venturePayout(item);
  const result={...item,resolvedMonth:s.month,success,payout,multiple};
  if(payout)s.money+=payout;
  v.history.unshift(result);resolved.push(result);
  s.log.unshift(success?`✦ Venture jackpot! ${d.name} ${multiple}× exit · +₲${payout.toLocaleString('en-US')}`:`× Venture failed · ${d.name} stake ₲${item.amount.toLocaleString('en-US')} ${payout?`· ₲${payout.toLocaleString('en-US')} recovered`:'lost entirely'}`);
  return false;
 });
 v.history=v.history.slice(0,12);s.log=s.log.slice(0,25);v.latest=resolved;
 return resolved;
}

const validItem=(item,settled=false)=>item&&typeof item.id==='string'&&!!ventureCompany(item.ventureId)&&item.name===ventureCompany(item.ventureId).name&&AMOUNTS.includes(item.amount)&&Number.isInteger(item.startedMonth)&&item.startedMonth>=0&&Number.isInteger(item.dueMonth)&&item.dueMonth===item.startedMonth+3&&Number.isFinite(item.roll)&&item.roll>=0&&item.roll<1&&(item.odds===undefined||VENTURE_ODDS.includes(item.odds))&&(item.salvage===undefined||item.salvage===true)&&(!settled||(Number.isInteger(item.resolvedMonth)&&item.resolvedMonth>=item.dueMonth&&typeof item.success==='boolean'&&item.success===(ventureMultiple(item.ventureId,item.roll,item.odds??1)>0)&&item.payout===venturePayout(item)));
export function validVentures(s){
 const v=s.ventures;if(v===undefined)return true;
 return !!(v&&Array.isArray(v.active)&&v.active.length<=3&&v.active.every(i=>validItem(i))&&Array.isArray(v.history)&&v.history.length<=12&&v.history.every(i=>validItem(i,true))&&Number.isInteger(v.sequence)&&v.sequence>=v.active.length+v.history.length&&Number.isInteger(v.lastInvestedMonth)&&v.lastInvestedMonth>=-1&&v.lastInvestedMonth<=s.month&&(!v.latest||Array.isArray(v.latest)&&v.latest.every(i=>validItem(i,true))));
}

export function ventureSummary(s){const v=ensureVentures(s);return{active:v.active,history:v.history,committed:v.active.reduce((n,i)=>n+i.amount,0),wins:v.history.filter(i=>i.success).length,losses:v.history.filter(i=>!i.success).length};}
