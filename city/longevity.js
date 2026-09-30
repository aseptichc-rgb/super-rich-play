import {L} from './i18n.js';

export const START_AGE=30;
export const REJUVENATED_AGE=20;
export const MAX_AGE=100;
export const LONGEVITY_UNLOCK=1000000000000;
export const REJUVENATION_COST=100000000000000;

export function lifeState(s){return s.life??{baseAge:START_AGE,baseMonth:0,rejuvenations:0};}
export function lifeAge(s){const life=lifeState(s);return life.baseAge+Math.floor((s.month-life.baseMonth)/12);}
export function lifeEnded(s){return s.concept==='rich-life'&&(s.health?.dead||s.stress>=100||lifeAge(s)>=MAX_AGE);}
export function validLongevity(s){
 const life=s.life;if(life===undefined)return true;
 return !!(life&&[START_AGE,REJUVENATED_AGE].includes(life.baseAge)&&Number.isInteger(life.baseMonth)&&life.baseMonth>=0&&life.baseMonth<=s.month&&Number.isInteger(life.rejuvenations)&&life.rejuvenations>=0&&(life.baseAge===START_AGE?life.baseMonth===0&&life.rejuvenations===0:life.rejuvenations>0));
}
export function rejuvenationReason(s){
 if(s.health?.dead||s.stress>=100)return L('Death from stress cannot be reversed by rejuvenation.');
 if(s.concept!=='rich-life')return L('Available only in Super Rich Life.');
 if((s.highestWealth||0)<LONGEVITY_UNLOCK)return L('Unlocks at a peak net worth of ₲1,000,000,000,000.');
 if(!lifeEnded(s))return L`Available when you reach age ${MAX_AGE}.`;
 if(s.money<REJUVENATION_COST)return L('Needs ₲100,000,000,000,000 cash.');
 return null;
}
export function rejuvenate(s){
 const error=rejuvenationReason(s);if(error)return{ok:false,msg:error};
 const count=lifeState(s).rejuvenations+1;
 s.money-=REJUVENATION_COST;s.life={baseAge:REJUVENATED_AGE,baseMonth:s.month,rejuvenations:count};
 s.log.unshift(L`✦ Rejuvenation complete · Age ${REJUVENATED_AGE} · ₲100,000,000,000,000 paid · Every other asset preserved`);s.log=s.log.slice(0,25);
 return{ok:true,msg:L('Rejuvenation complete. Your life begins again at age 20.')};
}
const money=n=>'₲'+n.toLocaleString('en-US');
export function rejuvenationPlan(s){
 const life=lifeState(s),months=Math.max(0,(MAX_AGE-life.baseAge)*12-(s.month-life.baseMonth)),cash=Math.max(0,s.money),shortfall=Math.max(0,REJUVENATION_COST-cash);
 return {months,cash,shortfall,monthly:months?Math.ceil(shortfall/months):0,progress:Math.min(100,cash/REJUVENATION_COST*100)};
}
export function rejuvenationPreparation(s){
 if(s.concept!=='rich-life')return '';
 const p=rejuvenationPlan(s);
 return `<section class="side-section"><h3>${L('Prepare for Rejuvenation')}</h3><p>${L`At age ${MAX_AGE}, pay ${money(REJUVENATION_COST)} in cash to return to age ${REJUVENATED_AGE}.`}</p><div class="meter milestone"><i style="width:${p.progress}%"></i></div><p>${L`Cash on hand ${money(Math.floor(p.cash))} · Still needed ${money(Math.ceil(p.shortfall))}`}</p>${(s.highestWealth||0)<LONGEVITY_UNLOCK?`<p>${L('Reach a peak net worth of ₲1,000,000,000,000 to unlock the longevity program.')}</p>`:''}</section>`;
}
export function longevityPanel(s){
 const age=lifeAge(s),reason=rejuvenationReason(s),unlocked=(s.highestWealth||0)>=LONGEVITY_UNLOCK;
 return `<section class="owner-reputation"><span class="eyebrow">${L('LONGEVITY · ULTRA WEALTH')}</span><h3>${L`Age ${age} · Rejuvenation`}</h3><p>${unlocked?L('At age 100, pay ₲100,000,000,000,000 in cash to return to age 20. Other assets stay.'):L('Reach a peak net worth of ₲1,000,000,000,000 to unlock the longevity program.')}</p><button data-action="rejuvenate" ${reason?'disabled':''}>${reason||L('Pay ₲100,000,000,000,000 · Return to age 20')}</button></section>`;
}
export function lifeEndingDialog(s){
 if(s.health?.dead||s.stress>=100)return `<div class="ending-card"><h2>${L('Death from extreme stress')}</h2><p>${L('Stress reached 100. This life is over. You can start a new life in Settings.')}</p><button data-action="settings">${L('Start a new life instead →')}</button></div>`;

 const reason=rejuvenationReason(s);
 return `<div class="ending-card grade-S"><span class="eyebrow">${L('A LIFE FULLY LIVED')}</span><h2>${L`Age ${lifeAge(s)} · Your lifetime is complete.`}</h2><p>${L('Your city and every asset are preserved. If you can fund the longevity program, you can begin again at age 20 without resetting anything else.')}</p><div class="legacy-score"><div><span>${L('Rejuvenation')}</span><b>${money(REJUVENATION_COST)}</b><small>${L('Age returns to 20')}</small></div><div><span>${L('Assets')}</span><b>${L('100% preserved')}</b><small>${L('Property · companies · investments · collections')}</small></div></div><div class="button-row"><button data-action="rejuvenate" class="primary" ${reason?'disabled':''}>${reason||L('Rejuvenate and continue')}</button><button data-action="settings">${L('Start a new life instead →')}</button></div></div>`;
}
