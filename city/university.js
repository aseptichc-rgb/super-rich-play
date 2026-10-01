import {L} from './i18n.js';
import {transaction} from './health.js';

export const UNIVERSITY={maxLevel:10,step:.05,riotStep:.09,investment:1000000,monthlyResearch:5000};
export const researchLevel=t=>Math.max(0,Math.min(UNIVERSITY.maxLevel,Math.floor(t?.researchLevel||0)));
export const universityProtection=s=>Math.max(0,...s.tiles.filter(t=>t.type==='university'&&t.owner==='player').map(t=>researchLevel(t)*UNIVERSITY.step));
export const universityRiotProtection=s=>universityProtection(s)/UNIVERSITY.step*UNIVERSITY.riotStep;
export const researchCost=t=>UNIVERSITY.investment*(researchLevel(t)+1);
export function investUniversity(s,i){return transaction(s,()=>{
 const selected=s.tiles[i],t=selected?.type==='extension'?s.tiles[selected.buildingAnchor]:selected;
 if(t?.type!=='university'||t.owner!=='player')return{ok:false,msg:L('Select a university you own.')};
 if(researchLevel(t)>=UNIVERSITY.maxLevel)return{ok:false,msg:L('Research is complete.')};
 if(t.lastResearchMonth===s.month)return{ok:false,msg:L('Research can advance once per month per university.')};
 const cost=researchCost(t);
 if(s.mode!=='sandbox'&&s.money<cost)return{ok:false,msg:L('Not enough cash.')};
 if(s.mode!=='sandbox')s.money-=cost;
 t.researchLevel=researchLevel(t)+1;t.lastResearchMonth=s.month;
 if(t.assetLedger)t.assetLedger.operating-=cost;
 return{ok:true,msg:L('University research advanced.')};
});}
export function universityPanel(s,t){
 if(t.type!=='university')return '';
 const level=researchLevel(t),disabled=level>=UNIVERSITY.maxLevel||t.lastResearchMonth===s.month||s.mode!=='sandbox'&&s.money<researchCost(t);
 return `<section class="amenity-bonus"><h3>${L('University research')}</h3><p>${L('Research level')} ${level}/10 · ${L('Riot asset loss reduction')} ${Math.round(universityRiotProtection(s)*100)}% · ${L('City damage reduction')} ${Math.round(universityProtection(s)*100)}%</p><p>${L('Invest once per month to reduce riot asset loss by 9% per level, up to 90% of the base 70% loss, and major crisis damage by 5% per level, up to 50%. Riot chance stays fixed. Only the best owned university applies. Selling or losing it ends its protection. Monthly upkeep includes ongoing research costs.')}</p><button data-action="university-research" ${disabled?'disabled':''}>${level>=10?L('Research is complete.'):L('Fund research')+' · ₲'+researchCost(t).toLocaleString('en-US')}</button></section>`;
}
export function validUniversity(s){return s.tiles.every(t=>t.type!=='university'||t.footprint?.width===3&&t.footprint?.height===3&&t.level===1&&(t.researchLevel===undefined||Number.isInteger(t.researchLevel)&&t.researchLevel>=0&&t.researchLevel<=10)&&(t.lastResearchMonth===undefined||Number.isSafeInteger(t.lastResearchMonth)&&t.lastResearchMonth>=0&&t.lastResearchMonth<=s.month));}
