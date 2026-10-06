import {validEvent,EVENT_NAMES} from '../city/analytics.js';
export const OPERATOR_EMAIL='kjykjj04@gmail.com';
export const reasonLabels={'invalid-json':'JSON 파싱 실패','invalid-shape':'저장 기본 구조 불일치','unsupported-version':'지원하지 않는 저장 버전',migration:'기존 저장 변환 실패','play-time':'플레이 시간 필드 불일치',health:'건강 상태 불일치',missions:'미션 진행 필드 불일치',market:'시장·주식 필드 불일치',landmarks:'랜드마크 필드 불일치',construction:'건설 진행 필드 불일치','game-rules':'게임 저장 규칙 불일치',evaluation:'자산 평가 실패'};
const median=values=>{if(!values.length)return null;const a=[...values].sort((x,y)=>x-y),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;};
export function eventInsights(documents,now=Date.now(),includeExcluded=false){
 const events=documents.map(d=>{const f=Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,v.stringValue??Number(v.integerValue)]));return{...f,time:Date.parse(d.createTime)};}).filter(e=>validEvent(e)&&Number.isFinite(e.time)&&e.time<=now&&e.time>=now-14*86400000);
 const excluded=new Set(events.filter(e=>e.name==='excluded').map(e=>e.visitor));
 const usable=events.filter(e=>includeExcluded||!excluded.has(e.visitor));
 const visits=usable.filter(e=>e.name==='visit'),sessions=new Map();
 for(const e of visits)if(!sessions.has(e.session))sessions.set(e.session,{...e,events:new Map()});
 for(const e of usable){const s=sessions.get(e.session);if(s&&!s.events.has(e.name))s.events.set(e.name,e);}
 const counts=Object.fromEntries(EVENT_NAMES.filter(n=>n!=='excluded').map(n=>[n,[...sessions.values()].filter(s=>s.events.has(n)).length]));
 const times=[...sessions.values()].map(s=>s.events.get('first_settlement')?.elapsed).filter(Number.isFinite);
 const visitors=new Set(visits.map(e=>e.visitor));
 const latestEligible=new Map();for(const s of sessions.values())if(s.time<=now-2*86400000)latestEligible.set(s.visitor,Math.min(latestEligible.get(s.visitor)||s.time,s.time));
 let returned=0;for(const [visitor,first] of latestEligible)if(visits.some(e=>e.visitor===visitor&&e.time>=first+86400000&&e.time<first+2*86400000))returned++;
 const group=key=>[...new Set(visits.map(e=>e[key]))].map(value=>{const a=[...sessions.values()].filter(e=>e[key]===value);return{value,visits:a.length,actions:a.filter(e=>e.events.has('first_action')).length,settlements:a.filter(e=>e.events.has('first_settlement')).length};});
 return{sessions:sessions.size,visitors:visitors.size,counts,medianSettlementMs:median(times),d1Eligible:latestEligible.size,d1Returned:returned,groups:{source:group('source'),device:group('device'),browser:group('browser')},excludedVisitors:excluded.size};
}
export function dashboardView(data,{includeExcluded=false,excludedUids=new Set()}={}){
 const rows=data.rows.filter(r=>includeExcluded||!r.excluded&&!excludedUids.has(r.uid)),valid=rows.filter(r=>r.game),measured=valid.filter(r=>r.game.seconds!==null);
 const now=Date.parse(data.updatedAt),within=v=>v!==null&&v<=now&&v>=now-7*86400000;
 const summary={...data.summary,registered:rows.length,new7:rows.filter(r=>within(r.createdAt)).length,login7:rows.filter(r=>within(r.lastLoginAt)).length,saved:valid.length,invalid:rows.filter(r=>r.status==='invalid').length,measured:measured.length,seconds:measured.reduce((n,r)=>n+r.game.seconds,0)};
 for(const k of ['wealth','cash','property','stocks','compound','debt','other'])summary[k]=valid.reduce((n,r)=>n+r.game[k],0);
 summary.averageWealth=valid.length?summary.wealth/valid.length:null;summary.averageSeconds=measured.length?summary.seconds/measured.length:null;
 summary.medianWealth=median(valid.map(r=>r.game.wealth));summary.medianSeconds=median(measured.map(r=>r.game.seconds));
 summary.month0=valid.filter(r=>r.game.month===0).length;summary.month1=valid.filter(r=>r.game.month>=1).length;summary.initial=valid.filter(r=>r.game.month===0&&r.game.properties===3).length;summary.under120=measured.filter(r=>r.game.seconds<120).length;summary.missionPlayers=valid.filter(r=>r.game.missions>0).length;
 const signups=data.signups.map(d=>({...d,count:rows.filter(r=>r.createdAt&&new Date(r.createdAt).toISOString().slice(0,10)===d.date).length}));
 const feedback=data.feedback.filter(f=>includeExcluded||!f.test);
 return{...data,rows,summary,signups,feedback,excludedAccounts:data.rows.length-rows.length,events:eventInsights(data.eventDocuments||[],now,includeExcluded)};
}
