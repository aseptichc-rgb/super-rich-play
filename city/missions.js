// Optional save fields. Missions use the normal city; they never reset assets or grant cash.
export const MISSION_IDS=['first-build','first-settlement','first-profit','district','reserve','wealth','landmark','tourism','cashflow','redevelopment','skyline'];
export const CONTRACT_IDS=['tourism','cashflow','redevelopment','skyline'];
export function missionStats(s,a){
 const owned=s.tiles.filter(t=>t.owner==='player'&&t.type!=='plot'),ready=owned.filter(t=>!t.construction);
 const reports=a.owned.filter(({t})=>t.type!=='plot').map(({i})=>({t:s.tiles[i],r:a.reports[i]}));
 const tourism=reports.filter(({t})=>['hotel','resort','golf','themepark','observatory','cablecar'].includes(t.type)||t.purpose==='growth').reduce((n,{r})=>n+Math.max(0,r?.revenue||0),0);
 const traffic=reports.length?reports.reduce((n,{r})=>n+(r?.loc?.footfall||0),0)/reports.length:0;
 const reserve=Math.max(10000,Math.ceil((Math.max(0,a.expense)+Math.max(0,a.living)+Math.max(0,a.interest)+Math.max(0,a.tuition))*3));
 return{owned:owned.length,parks:ready.filter(t=>t.type==='citypark').length,landmarks:ready.filter(t=>t.landmark||['hq','monument'].includes(t.type)).length,floors:Math.max(0,...ready.filter(t=>t.type==='skyscraper').map(t=>t.level)),tourism,traffic,reserve,net:a.net,wealth:a.wealth};
}
export function ensureMissions(s,a){
 if(s.concept!=='rich-life')return null;
 if(!s.missions){const baseline=missionStats(s,a),existing=s.month>0||baseline.owned>3;s.missions={version:1,started:s.month,baseline,built:existing?Math.max(0,baseline.owned-3):0,firstBuildMonth:existing?s.month:null,settlements:0,positiveMonths:0,completed:[],active:null,history:[]};}
 return s.missions;
}
export function recordMissionInvestment(s,amount,built=false){
 const m=s.missions;if(!m)return;
 if(built){m.built++;m.firstBuildMonth??=s.month;}
 if(m.active)m.active.spent+=Math.max(0,amount);
}
export function missionProgress(s,a){
 const m=ensureMissions(s,a);if(!m)return[];const x=missionStats(s,a);
 return[
  {id:'first-build',value:m.built,target:1},
  {id:'first-settlement',value:m.firstBuildMonth!==null&&s.month>m.firstBuildMonth?1:0,target:1},
  {id:'first-profit',value:m.positiveMonths,target:1},
  {id:'district',value:Math.min(3,Math.max(0,x.owned-m.baseline.owned-Math.max(0,x.parks-m.baseline.parks)))+(x.parks>m.baseline.parks?1:0),target:4},
  {id:'reserve',value:s.money,target:x.reserve},
  {id:'wealth',value:x.wealth,target:3000000},
  {id:'landmark',value:x.landmarks,target:1}
 ].map(p=>({...p,complete:m.completed.some(c=>c.id===p.id)}));
}
export function updateMissions(s,a,{settlement=false}={}){
 const m=ensureMissions(s,a);if(!m)return[];const earned=[];
 if(settlement){m.settlements++;if(s.lastReport?.net>0)m.positiveMonths++;}
 for(const p of missionProgress(s,a))if(!p.complete&&p.value>=p.target){m.completed.push({id:p.id,month:s.month});earned.push(p.id);}
 const c=m.active;if(!c)return earned;
 if(settlement&&s.month>c.lastMonth){c.lastMonth=s.month;if(s.lastReport?.net>=0)c.goodMonths++;}
 const value=contractProgress(s,a).value;
 const budgetOK=c.spent<=c.budget,clean=(s.fireSales||0)===c.fireSales,finished=s.month>=c.deadline;
 // Operational goals must be sustained until the deadline, rather than claimed mid-month.
 if(finished||!budgetOK||!clean){
  const win=finished&&budgetOK&&clean&&value>=c.target;
  const score=win?Math.max(1,Math.round(1000*(c.budget?Math.max(0,1-c.spent/c.budget):1))):0;
  m.history.push({id:c.id,month:s.month,won:win,score,reason:!budgetOK?'budget':!clean?'fire-sale':win?'complete':'target'});m.history=m.history.slice(-30);m.active=null;
  if(win&&!m.completed.some(p=>p.id===c.id)){m.completed.push({id:c.id,month:s.month});earned.push(c.id);}
 }
 return earned;
}
export function contractProgress(s,a){const c=s.missions?.active;if(!c)return null;const x=missionStats(s,a);return{value:c.id==='tourism'?x.tourism:c.id==='redevelopment'?x.traffic:c.id==='skyline'?x.floors:c.goodMonths,target:c.target};}
export function contractQuote(s,a,id){
 if(!CONTRACT_IDS.includes(id))return null;const x=missionStats(s,a);
 const target=id==='tourism'?x.tourism+Math.max(5000,x.tourism*.2):id==='redevelopment'?Math.min(100,x.traffic+8):id==='skyline'?x.floors+Math.max(5,Math.ceil(x.floors*.1)):12;
 return{id,start:s.month,deadline:s.month+12,lastMonth:s.month,baseline:id==='tourism'?x.tourism:id==='redevelopment'?x.traffic:id==='skyline'?x.floors:0,target,budget:Math.max(500000,Math.round(Math.max(0,a.revenue)*12)),spent:0,goodMonths:0,fireSales:s.fireSales||0};
}
export function startContract(s,a,id){const m=ensureMissions(s,a),q=contractQuote(s,a,id);if(!m||!q||m.active||id==='redevelopment'&&q.baseline>=100||id==='skyline'&&q.baseline===0)return false;m.active=q;return true;}
export function cancelContract(s){const m=s.missions;if(!m?.active)return false;m.history.push({id:m.active.id,month:s.month,won:false,score:0,reason:'cancelled'});m.history=m.history.slice(-30);m.active=null;return true;}
export function validMissions(s){
 const m=s?.missions;if(m===undefined)return true;
 const number=n=>Number.isFinite(n)&&n>=0,integer=n=>Number.isInteger(n)&&n>=0;
 if(!m||m.version!==1||!integer(m.started)||m.started>s.month||!m.baseline||!Object.values(m.baseline).every(Number.isFinite)||!integer(m.built)||!(m.firstBuildMonth===null||integer(m.firstBuildMonth)&&m.firstBuildMonth<=s.month)||!integer(m.settlements)||!integer(m.positiveMonths)||!Array.isArray(m.completed)||m.completed.length>MISSION_IDS.length||new Set(m.completed.map(p=>p.id)).size!==m.completed.length||!m.completed.every(p=>MISSION_IDS.includes(p.id)&&integer(p.month)&&p.month<=s.month)||!Array.isArray(m.history)||m.history.length>30||!m.history.every(p=>CONTRACT_IDS.includes(p.id)&&integer(p.month)&&p.month<=s.month&&typeof p.won==='boolean'&&number(p.score)&&['budget','fire-sale','complete','target','cancelled'].includes(p.reason)))return false;
 const c=m.active;return c===null||!!(c&&CONTRACT_IDS.includes(c.id)&&['start','deadline','lastMonth','goodMonths','fireSales'].every(k=>integer(c[k]))&&c.start<=s.month&&c.lastMonth>=c.start&&c.lastMonth<=s.month&&c.deadline===c.start+12&&['baseline','target','budget','spent'].every(k=>number(c[k]))&&c.target>c.baseline&&c.goodMonths<=s.month-c.start);
}
