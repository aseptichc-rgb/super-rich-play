import {L} from './i18n.js';
import {hashRoll} from './rng.js';
import {delistStock} from './market.js';
import {shortValue} from './broker.js';

export const RIOT_WEALTH=1e12,RIOT_STEP=.01;
export const ownsUniversity=s=>s.tiles.some(t=>t.owner==='player'&&t.type==='university');
export function universityRisk(s,wealth){
 const exposed=s.concept==='rich-life'&&wealth>RIOT_WEALTH&&!ownsUniversity(s);
 const months=exposed?(s.universityRisk?.months||0):0;
 return{exposed,months,chance:exposed?Math.min(1,(months+1)*RIOT_STEP):0};
}
export function advanceUniversityRisk(s,wealth){
 const risk=universityRisk(s,wealth);
 if(!risk.exposed){if(s.universityRisk)s.universityRisk.months=0;return null;}
 s.universityRisk={months:Math.min(100,risk.months+1)};
 if(hashRoll(s.seed,s.month,'university-riot')>=risk.chance)return null;
 return{kind:'riot',name:L('University neglect riot'),months:s.universityRisk.months,chance:risk.chance};
}
export function validUniversityRisk(s){const r=s?.universityRisk;return r===undefined||!!r&&Number.isSafeInteger(r.months)&&r.months>=0&&r.months<=Math.min(100,s.month);}

// Nationalize 98% of valued assets; liquidate the remaining 2% into cash and keep debts.
export function nationalizeRiotAssets(s,wealth){
 const liabilities=(s.market.margin||0)+Math.max(0,-shortValue(s));
 const retained=Math.max(0,wealth+s.debt+liabilities)*.02;
 s.debt+=liabilities;
 s.market.margin=0;s.market.shorts={};s.market.plans=[];s.market.reinvest=false;
 for(const p of s.startups?.active||[]){if(p.listed)delistStock(s,p.listed);p.cash=0;p.business=0;p.status='failed';}
 s.realizedGains=(s.realizedGains||0)-Object.values(s.costBasis||{}).reduce((a,b)=>a+b,0);
 for(const id of Object.keys(s.holdings)){s.holdings[id]=0;s.costBasis[id]=0;}
 s.tiles=s.tiles.map(t=>t.type==='ultra'?{terrain:t.terrain,type:null,owner:null,level:1,tree:false}:t.owner==='player'?{...t,owner:'npc',tenure:'buy',deposit:0,assetLedger:undefined}:t);
 if(s.compound){for(const id of Object.keys(s.compound.balances))s.compound.balances[id]=0;s.compound.last=0;s.compound.principal=0;}
 if(s.acquisitions)s.acquisitions.active=[];
 if(s.ventures){s.ventures.active=[];s.ventures.latest=[];}
 if(s.artCollection)s.artCollection.owned=[];
 if(s.empire)s.empire={owned:[],earnedFame:s.empire.earnedFame||0};
 if(s.flex)s.flex={owned:[],lastParty:s.flex.lastParty};
 if(s.ultra)s.ultra.items={};
 if(s.journey){s.journey.deal=null;s.journey.workroom=null;}
 for(const p of s.projects||[]){p.status='archived';p.sale=0;p.royalty=0;p.monthsLeft=0;}
 s.pending=[];s.effect=null;s.event=null;s.shift=null;s.money=retained;s.universityRisk.months=0;
 const msg=L('A riot over university neglect nationalized 98% of your assets. The remaining 2% was converted to cash. Property, investments and collections were settled; future investment proceeds ended. Existing debts remain.');
 s.log.unshift(msg);s.log=s.log.slice(0,25);
}
export function universityRiskPanel(s,wealth){
 const r=universityRisk(s,wealth);if(!r.exposed)return '';
 return `<section class="owner-reputation" role="alert"><h3>⚠ ${L('University neglect risk')}</h3><p>${L`Next monthly riot chance: ${Math.round(r.chance*100)}% · ${r.months} months without a university.`}</p><p>${L('Above ₲1 trillion without an owned university, riot chance starts at 1% and rises by 1 percentage point each month, up to 100%. A riot nationalizes 98% of assets; the remaining 2% is converted to cash. Own a university, even at research level 0, or fall to ₲1 trillion or less to reset the risk.')}</p><button data-build="university">${L('Build a university')}</button></section>`;
}
export function universityRiotDialog(r){return `<span class="eyebrow">${L('WORLD CRISIS')}</span><h2>${L('University neglect riot')}</h2><p>${L('A riot over university neglect nationalized 98% of your assets. The remaining 2% was converted to cash. Property, investments and collections were settled; future investment proceeds ended. Existing debts remain.')}</p><p>${L`Riot occurred after ${r.months} months at a ${Math.round(r.chance*100)}% monthly chance.`}</p><button data-action="close" class="primary full">${L('View My City')}</button>`;}
