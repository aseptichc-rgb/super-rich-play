import {universityRiotProtection} from './university.js';
import {L} from './i18n.js';
import {hashRoll} from './rng.js';
import {delistStock} from './market.js';
import {shortValue} from './broker.js';

export const RIOT_WEALTH=1e12,RIOT_CHANCE=1/(70*12),RIOT_MAX_LOSS=.7;
export const ownsUniversity=s=>s.tiles.some(t=>t.owner==='player'&&t.type==='university');
const riotLossRate=s=>RIOT_MAX_LOSS*(1-universityRiotProtection(s));
const lossPercent=rate=>Number((rate*100).toFixed(1));
const riotSummary=rate=>L`Civil unrest seized ${lossPercent(rate)}% of your assets. The remainder was converted to cash. Property, investments and collections were settled; future investment proceeds ended. Existing debts remain.`;
export function universityRisk(s,wealth){
 const exposed=s.concept==='rich-life'&&wealth>RIOT_WEALTH;
 const months=exposed?(s.universityRisk?.months||0):0;
 const reduction=universityRiotProtection(s);
 return{exposed,months,reduction,chance:exposed?RIOT_CHANCE:0,loss:riotLossRate(s)};
}
export function advanceUniversityRisk(s,wealth){
 const risk=universityRisk(s,wealth);
 if(!risk.exposed){if(s.universityRisk)s.universityRisk.months=0;return null;}
 s.universityRisk={months:Math.min(100,risk.months+1)};
 if(hashRoll(s.seed,s.month,'university-riot')>=risk.chance)return null;
 return{kind:'riot',name:L('Civil unrest'),months:s.universityRisk.months,chance:risk.chance,loss:risk.loss};
}
export function validUniversityRisk(s){const r=s?.universityRisk;return r===undefined||!!r&&Number.isSafeInteger(r.months)&&r.months>=0&&r.months<=Math.min(100,s.month);}

// Seize up to 70% of valued assets; liquidate the remainder into cash and keep debts.
export function nationalizeRiotAssets(s,wealth){
 const loss=riotLossRate(s);
 const liabilities=(s.market.margin||0)+Math.max(0,-shortValue(s));
 const retained=Math.max(0,wealth+s.debt+liabilities)*(1-loss);
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
 delete s.lunar;
 if(s.journey){s.journey.deal=null;s.journey.workroom=null;}
 for(const p of s.projects||[]){p.status='archived';p.sale=0;p.royalty=0;p.monthsLeft=0;}
 s.pending=[];s.effect=null;s.event=null;s.shift=null;s.money=retained;s.universityRisk.months=0;
 const msg=riotSummary(loss);
 s.log.unshift(msg);s.log=s.log.slice(0,25);
}
export function universityRiskPanel(s,wealth){
 const r=universityRisk(s,wealth);if(!r.exposed)return '';
 const risk=L`Monthly riot chance: ${Number((r.chance*100).toFixed(3))}% · Asset loss if it occurs: ${lossPercent(r.loss)}%.`;
 if(ownsUniversity(s))return `<p class="university-risk-status">${risk}</p>`;
 return `<section class="owner-reputation" role="alert"><h3>⚠ ${L('Riot risk')}</h3><p>${risk}</p><p>${L('Above ₲1 trillion, a riot is drawn each month at a fixed chance averaging one occurrence every 70 game years. University research reduces asset loss by 9% per level, up to 90% of the base 70% loss. Only the best owned university applies. Existing debts remain.')}</p><button data-build="university">${L('Build a university')}</button></section>`;
}
export function universityRiotDialog(r){return `<span class="eyebrow">${L('WORLD CRISIS')}</span><h2>${L('Civil unrest')}</h2><p>${riotSummary(r.loss??RIOT_MAX_LOSS)}</p><p>${L`Monthly riot chance: ${Number((r.chance*100).toFixed(3))}%.`}</p><button data-action="close" class="primary full">${L('View My City')}</button>`;}
