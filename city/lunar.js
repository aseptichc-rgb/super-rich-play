import {L} from './i18n.js';
import {transaction,healthReason} from './health.js';
import {lifeEnded} from './longevity.js';

export const LUNAR_MODULES={
 power:{name:L('Lunar power grid'),cost:80000000000,months:12},
 supply:{name:L('Closed-loop life support'),cost:100000000000,months:18},
 research:{name:L('Lunar science campus'),cost:120000000000,months:24}
};
export const LUNAR_STAGES=[
 {name:L('Lunar outpost'),cost:200000000000,months:18,population:24,needs:{power:1,supply:1,research:1}},
 {name:L('Permanent settlement'),cost:500000000000,months:36,population:120,needs:{power:2,supply:2,research:2}},
 {name:L('Independent lunar city'),cost:1000000000000,months:60,population:600,needs:{power:3,supply:3,research:3}}
];
const money=n=>'₲'+n.toLocaleString('en-US');
const initial=(month=0)=>({lastMonth:month,stage:0,route:null,levels:{power:0,supply:0,research:0},jobs:[],project:null});
export const lunarState=s=>s.lunar||initial(s.month);
export const activeMegaProjects=s=>Object.values(s.ultra?.items||{}).filter(v=>!v.complete).length+(s.lunar?.jobs.length||0)+(s.lunar?.project?1:0);
export const megaCapacity=s=>s.lunar?.stage>=2?3:2;
export function lunarNeeds(stage,route){const needs={...LUNAR_STAGES[stage].needs};if(stage===2)needs[route==='research'?'supply':'power']=2;return needs;}
export function lunarStatus(s){const l=lunarState(s),p=l.project;if(l.stage===3)return lunarTitle(s);if(p&&!p.decision&&p.elapsed>=LUNAR_STAGES[l.stage].months/2)return L('Engineering review · Your decision is required');if(p?.elapsed===p?.total&&p)return L('Commission this milestone');return L('Lunar development · Choose your next milestone');}
export function lunarTitle(s){const l=lunarState(s);return l.stage===3?(l.route==='research'?L('Lunar science capital'):L('Lunar garden city')):l.stage?LUNAR_STAGES[l.stage-1].name:L('Lunar development');}
function available(s){return healthReason(s)||(s.concept!=='rich-life'?L('Available only in Super Rich Life.'):lifeEnded(s)?L('Rejuvenate to begin a new project.'):!s.ultra?.items?.moon?.complete?L('Complete the lunar research base first.'):null);}
export function lunarModuleQuote(s,id){const d=LUNAR_MODULES[id];if(!Object.hasOwn(LUNAR_MODULES,id))return null;const level=lunarState(s).levels[id]+1;return{level,cost:d.cost*level,months:d.months*level};}
export function lunarModuleReason(s,id){
 const blocked=available(s);if(blocked)return blocked;
 const q=lunarModuleQuote(s,id),l=lunarState(s);if(!q)return L('Choose lunar infrastructure.');
 if(q.level>3)return L('Fully expanded');
 if(l.jobs.some(j=>j.id===id))return L('Already under construction.');
 if(activeMegaProjects(s)>=megaCapacity(s))return L('All major project teams are busy.');
 if(s.money<q.cost)return L('Not enough cash.');return null;
}
export function lunarStageReason(s,route){
 const blocked=available(s);if(blocked)return blocked;
 const l=lunarState(s);if(l.stage===3)return L('Lunar city completed.');
 if(l.project)return L('Finish and commission the current stage first.');
 if(!['research','garden'].includes(route)||l.route&&l.route!==route)return L('Choose a development direction.');
 const needs=lunarNeeds(l.stage,route);
 if(Object.keys(needs).some(id=>l.levels[id]<needs[id]))return L('Complete the required infrastructure first.');
 if(activeMegaProjects(s)>=megaCapacity(s))return L('All major project teams are busy.');
 if(s.money<LUNAR_STAGES[l.stage].cost)return L('Not enough cash.');return null;
}
export function lunarAction(s,action,id){return transaction(s,()=>{
 let reason=available(s);if(reason)return{ok:false,msg:reason};
 const before=lunarState(s);
 if(action==='module'){
  reason=lunarModuleReason(s,id);if(reason)return{ok:false,msg:reason};
  const q=lunarModuleQuote(s,id);s.lunar??=initial(s.month);s.money-=q.cost;s.lunar.jobs.push({id,level:q.level,total:q.months,remaining:q.months});
 }else if(action==='start'){
  reason=lunarStageReason(s,id);if(reason)return{ok:false,msg:reason};
  s.lunar??=initial(s.month);s.lunar.route=id;const d=LUNAR_STAGES[s.lunar.stage];s.money-=d.cost;
  s.lunar.project={elapsed:0,total:d.months,decision:null};
 }else if(action==='review'){
  const p=before.project,d=LUNAR_STAGES[before.stage];
  if(!p||p.decision||p.elapsed<d.months/2||!['test','expedite'].includes(id))return{ok:false,msg:L('The engineering review is not ready.')};
  const cost=id==='expedite'?d.cost*.2:0;if(s.money<cost)return{ok:false,msg:L('Not enough cash.')};
  s.money-=cost;p.decision=id;if(id==='test')p.total+=6;
 }else if(action==='commission'){
  const p=before.project;if(!p||!p.decision||p.elapsed<p.total)return{ok:false,msg:L('Complete construction and the engineering review first.')};
  before.stage++;before.project=null;
  const msg=L`Milestone achieved · ${lunarTitle(s)}`;s.log.unshift(msg);s.log=s.log.slice(0,25);return{ok:true,msg};
 }else return{ok:false,msg:L('Choose a lunar project action.')};
 return{ok:true,msg:L('Lunar development plan updated.')};
});}
// Only infrastructure advances automatically. A city stage stops at its review, then awaits commissioning.
export function settleLunar(s){
 const l=s.lunar;if(!l||!s.ultra?.items?.moon?.complete||l.lastMonth>=s.month)return;
 const elapsed=s.month-l.lastMonth;l.lastMonth=s.month;
 l.jobs=l.jobs.filter(j=>{j.remaining=Math.max(0,j.remaining-elapsed);if(j.remaining>0)return true;l.levels[j.id]=j.level;s.log.unshift(L`Lunar infrastructure complete · ${LUNAR_MODULES[j.id].name} Lv.${j.level}`);return false;});
 const p=l.project;if(p){const d=LUNAR_STAGES[l.stage];if(p.decision||p.elapsed<d.months/2)p.elapsed=Math.min(p.decision?p.total:d.months/2,p.elapsed+elapsed);}
 s.log=s.log.slice(0,25);
}
export function validLunar(s){
 const l=s.lunar;if(l===undefined)return true;
 if(!l||!Number.isInteger(l.lastMonth)||l.lastMonth<0||l.lastMonth>s.month||s.concept!=='rich-life'||!s.ultra?.items?.moon?.complete||!Number.isInteger(l.stage)||l.stage<0||l.stage>3||![null,'research','garden'].includes(l.route)||l.stage>0&&!l.route)return false;
 if(!l.levels||Object.keys(l.levels).length!==3||!Object.keys(LUNAR_MODULES).every(id=>Number.isInteger(l.levels[id])&&l.levels[id]>=0&&l.levels[id]<=3))return false;
 if(!Array.isArray(l.jobs)||l.jobs.length>3||new Set(l.jobs.map(j=>j?.id)).size!==l.jobs.length||!l.jobs.every(j=>j&&Object.hasOwn(LUNAR_MODULES,j.id)&&j.level===l.levels[j.id]+1&&j.level<=3&&j.total===LUNAR_MODULES[j.id].months*j.level&&Number.isInteger(j.remaining)&&j.remaining>0&&j.remaining<=j.total))return false;
 if(l.stage>0){const needs=lunarNeeds(l.stage-1,l.route);if(Object.keys(needs).some(id=>l.levels[id]<needs[id]))return false;}
 if(l.project!==null){const p=l.project,d=LUNAR_STAGES[l.stage];if(!p||!d||!l.route||![null,'test','expedite'].includes(p.decision)||p.total!==d.months+(p.decision==='test'?6:0)||!Number.isInteger(p.elapsed)||p.elapsed<0||p.elapsed>p.total||!p.decision&&p.elapsed>d.months/2||p.decision&&p.elapsed<d.months/2)return false;const needs=lunarNeeds(l.stage,l.route);if(Object.keys(needs).some(id=>l.levels[id]<needs[id]))return false;}
 return true;
}
export function lunarPanel(s){
 const l=lunarState(s),d=LUNAR_STAGES[l.stage];
 const button=(action,id,label,reason)=>`<button data-lunar="${action}" data-lunar-id="${id}" ${reason?'disabled':''}>${reason||label}</button>`;
 let html=`<section class="lunar-panel"><span class="eyebrow">${L('BEYOND THE MOON BASE')}</span><h2>${lunarTitle(s)}</h2><p>${L('Build infrastructure, choose a direction, resolve engineering reviews and commission each stage. Advancing months alone never completes a settlement.')}</p><p>${L`Major project teams · ${activeMegaProjects(s)} / ${megaCapacity(s)}`} · ${L`Residents · ${l.stage?LUNAR_STAGES[l.stage-1].population:0}`}</p>`;
 if(!s.ultra?.items?.moon?.complete)return html+`<p>${L('Complete the lunar research base first.')}</p></section>`;
 html+=`<p class="help">${L('Lunar funding is a permanent expense. Starting infrastructure reserves your Moon base; it cannot be sold afterward.')}</p><ol class="lunar-stages">${LUNAR_STAGES.map((stage,n)=>`<li class="${l.stage>n?'reached':''}">${stage.name} · ${stage.months} ${L('months')}${l.stage>n?' ✓':''}</li>`).join('')}</ol>`;
 if(l.stage===3)html+=`<p class="lunar-achievement">✦ ${lunarTitle(s)} · ${L('Permanent achievement. Your city remains on the Moon.')}</p>`;
 html+=`<div class="lunar-grid">${Object.entries(LUNAR_MODULES).map(([id,m])=>{const q=lunarModuleQuote(s,id),job=l.jobs.find(j=>j.id===id);return`<section><h3>${m.name} · Lv.${l.levels[id]}</h3><p>${job?L`Under construction · ${job.remaining} / ${job.total} months remaining`:l.levels[id]<3?L`Next level · ${money(q.cost)} · ${q.months} months`:L('Fully expanded')}</p>${button('module',id,L('Build next level'),lunarModuleReason(s,id))}</section>`;}).join('')}</div>`;
 if(d&&!l.project){html+=`<h3>${L('Next settlement milestone')} · ${d.name}</h3><p>${L`Stage budget · ${money(d.cost)} · ${d.months} months`}</p>`;
 for(const choice of l.route?[l.route]:['research','garden']){const needs=lunarNeeds(l.stage,choice);html+=`<section class="asset-profit"><h3>${choice==='research'?L('Science capital route'):L('Garden city route')}</h3><p>${choice==='research'?L('Final city needs power 3, life support 2 and research 3.'):L('Final city needs power 2, life support 3 and research 3.')}</p><p>${Object.entries(needs).map(([id,n])=>`${LUNAR_MODULES[id].name} ${l.levels[id]}/${n}`).join(' · ')}</p>${button('start',choice,L('Commit to this development plan'),lunarStageReason(s,choice))}</section>`;}
 html+=`<p class="help">${L('Your direction is fixed when the first stage starts. The second milestone unlocks a third project team. Achievements do not multiply income.')}</p>`;}
 if(l.project){const p=l.project;html+=`<h3>${d.name}</h3><p>${L`Construction progress · ${p.elapsed} / ${p.total} months`}</p><div class="meter"><i style="width:${100*p.elapsed/p.total}%"></i></div>`;
 if(!p.decision&&p.elapsed>=d.months/2)html+=`<h3>${L('Engineering review · Your decision is required')}</h3><p>${L('Construction pauses here while other assets continue operating. Fund specialist teams to keep the schedule, or spend six additional months on testing.')}</p><div class="button-row">${button('review','test',L('Extended testing · +6 months'),null)}${button('review','expedite',L`Specialist teams · ${money(d.cost*.2)}`,s.money<d.cost*.2?L('Not enough cash.'):null)}</div>`;
 else if(p.decision&&p.elapsed===p.total)html+=button('commission','',L('Commission this milestone'),null);
 else html+=`<p>${p.decision?L('Engineering review approved.'):L('An engineering review will pause construction halfway.')}</p>`;
 }
 return html+'</section>';
}
