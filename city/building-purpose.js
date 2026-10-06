import {L} from './i18n.js';
export const PURPOSES=['steady','growth','culture'];
export const purposeEligible=t=>!!t&&(['skyscraper','hq','monument'].includes(t.type)||!!t.landmark);
export function purposeReport(t,revenue,cost,cycle=1){
 if(!purposeEligible(t)||!PURPOSES.includes(t.purpose))return{revenue,cost};
 if(t.purpose==='steady')return{revenue:Math.round(revenue/Math.max(.5,cycle)*.92),cost:Math.round(cost*.9)};
 if(t.purpose==='growth')return{revenue:Math.round(revenue*1.15),cost:Math.round(cost*1.4)};
 return{revenue:Math.round(revenue*.85),cost};
}
export function setBuildingPurpose(s,i,purpose){const t=s.tiles[i];if(t?.owner!=='player'||!purposeEligible(t)||!PURPOSES.includes(purpose))return false;t.purpose=purpose;return true;}
export function purposePanel(t){if(!purposeEligible(t))return'';return `<section class="mission-option"><h3>${L('Give this building a purpose')}</h3><p>${L('Standard operation stays available. Stable leasing smooths the regular economy cycle at 92% revenue and 90% upkeep; growth earns 115% revenue with 140% upkeep; culture earns 85% revenue and adds three reputation each settled month. Major shocks still apply.')}</p><div class="button-row">${[['steady',L('Stable leasing')],['growth',L('Tourism and growth')],['culture',L('Culture and exhibitions')]].map(([id,label])=>`<button data-purpose="${id}" aria-pressed="${t.purpose===id}">${label}</button>`).join('')}<button data-purpose="standard" aria-pressed="${!t.purpose}">${L('Standard operation')}</button></div></section>`;}
export function validPurposes(s){return !Array.isArray(s?.tiles)||s.tiles.every(t=>t.purpose===undefined||purposeEligible(t)&&PURPOSES.includes(t.purpose));}
