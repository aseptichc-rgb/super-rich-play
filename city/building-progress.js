import {L} from './i18n.js';
// Old saves have no construction record and remain complete.
export const constructionMonths=t=>t.landmark?60:t.type==='hq'?24:t.type==='monument'?48:t.type==='skyscraper'?Math.min(60,12+Math.ceil((t.level||1)/5)):0;
export const constructionProgress=(s,t)=>t?.construction?Math.max(0,Math.min(1,(s.month-t.construction.start)/t.construction.months)):1;
export const underConstruction=(s,t)=>constructionProgress(s,t)<1;
export function startConstruction(s,t){const months=constructionMonths(t);if(months)t.construction={start:s.month,months};return months;}
export function constructionNotice(months){return months?L`Construction: ${months} game months · Revenue and building benefits begin after completion.`:'';}
export function settleConstruction(s){
 for(let i=0;i<s.tiles.length;i++){
  const t=s.tiles[i];if(!t.construction||underConstruction(s,t))continue;
  if(t.owner==='player'){
   const fame=t.construction.fame||0;
   if(fame){s.empire??={owned:[]};s.empire.landmarkFame??={};s.empire.landmarkFame[i]=(s.empire.landmarkFame[i]||0)+fame;s.empire.earnedFame=(s.empire.earnedFame||0)+fame;}
   s.log.unshift(L`Construction complete · ${t.landmark?.name||L('Building')} · Reputation +${fame}`);
  }
  delete t.construction;
 }
 s.log=s.log.slice(0,25);
}
export function validConstruction(s){return s.tiles.every(t=>t.construction===undefined||!!(t.construction&&Number.isInteger(t.construction.start)&&t.construction.start>=0&&t.construction.start<=s.month&&Number.isInteger(t.construction.months)&&t.construction.months>=1&&t.construction.months<=60&&(t.construction.fame===undefined||Number.isInteger(t.construction.fame)&&t.construction.fame>=0&&t.construction.fame<=1300)&&t.type&&t.type!=='extension'));}
