import {L} from './i18n.js';

export const START_AGE=30;
export const REJUVENATED_AGE=20;
export const MAX_AGE=100;
export const LONGEVITY_UNLOCK=1000000000000;
export const REJUVENATION_COST=10000000000000;

export function lifeState(s){return s.life??{baseAge:START_AGE,baseMonth:0,rejuvenations:0};}
export function lifeAge(s){const life=lifeState(s);return life.baseAge+Math.floor((s.month-life.baseMonth)/12);}
export function lifeEnded(s){return s.concept==='rich-life'&&lifeAge(s)>=MAX_AGE;}
export function validLongevity(s){
 const life=s.life;if(life===undefined)return true;
 return !!(life&&[START_AGE,REJUVENATED_AGE].includes(life.baseAge)&&Number.isInteger(life.baseMonth)&&life.baseMonth>=0&&life.baseMonth<=s.month&&Number.isInteger(life.rejuvenations)&&life.rejuvenations>=0&&(life.baseAge===START_AGE?life.baseMonth===0&&life.rejuvenations===0:life.rejuvenations>0));
}
export function rejuvenationReason(s){
 if(s.concept!=='rich-life')return L('Available only in Super Rich Life.');
 if((s.highestWealth||0)<LONGEVITY_UNLOCK)return L('Unlocks at a peak net worth of ₲1,000,000,000,000.');
 if(!lifeEnded(s))return L`Available when you reach age ${MAX_AGE}.`;
 if(s.money<REJUVENATION_COST)return L('Needs ₲10,000,000,000,000 cash.');
 return null;
}
export function rejuvenate(s){
 const error=rejuvenationReason(s);if(error)return{ok:false,msg:error};
 const count=lifeState(s).rejuvenations+1;
 s.money-=REJUVENATION_COST;s.life={baseAge:REJUVENATED_AGE,baseMonth:s.month,rejuvenations:count};
 s.log.unshift(L`✦ Rejuvenation complete · Age ${REJUVENATED_AGE} · ₲10,000,000,000,000 paid · Every other asset preserved`);s.log=s.log.slice(0,25);
 return{ok:true,msg:L('Rejuvenation complete. Your life begins again at age 20.')};
}
const money=n=>'₲'+n.toLocaleString('en-US');
export function longevityPanel(s){
 const age=lifeAge(s),reason=rejuvenationReason(s),unlocked=(s.highestWealth||0)>=LONGEVITY_UNLOCK;
 return `<section class="owner-reputation"><span class="eyebrow">${L('LONGEVITY · ULTRA WEALTH')}</span><h3>${L`Age ${age} · Rejuvenation`}</h3><p>${unlocked?L('At age 100, pay ₲10,000,000,000,000 to return to age 20. Property, companies, investments, collections, reputation and every other asset stay exactly as they are.'):L('Reach a peak net worth of ₲1,000,000,000,000 to unlock the longevity program.')}</p><button data-action="rejuvenate" ${reason?'disabled':''}>${reason||L('Pay ₲10,000,000,000,000 · Return to age 20')}</button></section>`;
}
export function lifeEndingDialog(s){
 const reason=rejuvenationReason(s);
 return `<div class="ending-card grade-S"><span class="eyebrow">${L('A LIFE FULLY LIVED')}</span><h2>${L`Age ${lifeAge(s)} · Your lifetime is complete.`}</h2><p>${L('Your city and every asset are preserved. If you can fund the longevity program, you can begin again at age 20 without resetting anything else.')}</p><div class="legacy-score"><div><span>${L('Rejuvenation')}</span><b>${money(REJUVENATION_COST)}</b><small>${L('Age returns to 20')}</small></div><div><span>${L('Assets')}</span><b>${L('100% preserved')}</b><small>${L('Property · companies · investments · collections')}</small></div></div><div class="button-row"><button data-action="rejuvenate" class="primary" ${reason?'disabled':''}>${reason||L('Rejuvenate and continue')}</button><button data-action="settings">${L('Start a new life instead →')}</button></div></div>`;
}
