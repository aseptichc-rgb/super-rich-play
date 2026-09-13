// Decision events for the rich life. Stakes scale with net worth; some choices pay off months later.
import {hashRoll} from './rng.js';
const money=n=>'₲'+Math.round(n).toLocaleString('ko-KR');
const pct=(wealth,p,min=0)=>Math.max(min,Math.round(wealth*p));
export const EVENT_INTERVAL=4;
export const RICH_EVENTS=[
 {id:'tax_audit',title:'국세청 세무조사 통지',text:'자산 규모가 커지자 정밀 세무조사가 시작됐습니다. 어떻게 대응할까요?',build:(s,c)=>[
  {label:'성실하게 납부한다',cost:pct(c.wealth,.03),fame:10,desc:`순자산 3% (${money(pct(c.wealth,.03))}) 납부 · 명성 +10`},
  {label:'절세 컨설팅을 받는다',cost:pct(c.wealth,.01),stress:8,later:{months:4,amount:-pct(c.wealth,.06),chance:.35,label:'추징 과세'},desc:`지금 1% (${money(pct(c.wealth,.01))}) · 4개월 뒤 35% 확률로 6% 추징 · 스트레스 +8`},
  ...(c.fame>=150?[{label:'로펌을 동원한다',cost:pct(c.wealth,.005),fame:-15,desc:`0.5% (${money(pct(c.wealth,.005))}) 지출 · 명성 −15 · 유명세가 가져온 선택지`}]:[])]},
 {id:'rate_hike',title:'기준금리 인상',text:'중앙은행이 금리를 올렸습니다. 대출 문턱이 높아지고 임대 시장이 식습니다.',build:(s,c)=>[
  {label:'고금리 채권을 산다',cost:pct(c.wealth,.05),later:{months:6,amount:pct(c.wealth,.05)+pct(c.wealth,.004)*6,chance:1,label:'채권 만기 상환'},desc:`5% (${money(pct(c.wealth,.05))}) 투자 · 6개월 뒤 원금 + 이자 2.4% 확정 회수`},
  {label:'관망한다',multiplier:.9,months:3,desc:'3개월 동안 임대·숙박 매출 −10%'}]},
 {id:'tourist_boom',title:'국제 행사 유치 · 관광객 급증',text:'도시가 대형 국제 행사를 유치했습니다. 숙박 수요가 폭발할 예정입니다.',build:(s,c)=>[
  {label:'프로모션에 투자한다',cost:pct(c.wealth,.02),multiplier:1.3,months:3,desc:`2% (${money(pct(c.wealth,.02))}) 지출 · 3개월 동안 임대·숙박 매출 +30%`},
  {label:'있는 그대로 맞이한다',multiplier:1.1,months:1,desc:'1개월 동안 매출 +10% · 비용 없음'}]},
 {id:'scandal',title:'타블로이드 스캔들',text:'파티에서 찍힌 사진이 가십지에 실렸습니다. 여론이 술렁입니다.',build:(s,c)=>[
  {label:'공식 사과와 기부로 수습한다',cost:pct(c.wealth,.02),fame:-10,desc:`2% (${money(pct(c.wealth,.02))}) 기부 · 명성 −10에서 방어`},
  {label:'무대응한다',fame:-40,stress:15,desc:'비용 없음 · 명성 −40 · 스트레스 +15'}]},
 {id:'charity_gala',title:'자선 갈라 초청장',text:'도시 최대 자선 갈라의 메인 후원자 자리가 비었습니다. 사교계가 당신을 보고 있습니다.',build:(s,c)=>[
  {label:'메인 후원자가 된다',cost:pct(c.wealth,.015),fame:40,memories:1,stress:-10,desc:`1.5% (${money(pct(c.wealth,.015))}) 후원 · 명성 +40 · 추억 +1`},
  {label:'참석만 한다',cost:pct(c.wealth,.002),fame:10,desc:`0.2% (${money(pct(c.wealth,.002))}) 테이블 · 명성 +10`},
  {label:'불참한다',fame:-5,stress:-5,desc:'명성 −5 · 스트레스 −5'}]},
 {id:'insider_tip',title:'은밀한 내부자 정보',text:'오랜 지인이 상장 전 정보를 흘립니다. 확실하다고 하지만, 적발되면 명예가 무너집니다.',build:(s,c)=>[
  {label:'정중히 거절한다',fame:5,desc:'명성 +5 · 잃을 것이 없습니다'},
  {label:'조용히 베팅한다',cost:pct(c.wealth,.03),stress:12,later:{months:2,amount:pct(c.wealth,.09),chance:.5,label:'비공개 정보 베팅',penalty:{fame:-60}},desc:`3% (${money(pct(c.wealth,.03))}) 베팅 · 2개월 뒤 50%: +9% 회수 / 50%: 전액 손실과 명성 −60`}]},
 {id:'family_request',title:'가족의 사업 자금 요청',text:'동생이 창업 자금을 부탁합니다. 계획서는 그럴듯하지만 보장은 없습니다.',build:(s,c)=>[
  {label:'흔쾌히 지원한다',cost:pct(c.wealth,.02),stress:-10,fame:5,later:{months:9,amount:pct(c.wealth,.03),chance:.4,label:'동생의 첫 배당'},desc:`2% (${money(pct(c.wealth,.02))}) 지원 · 스트레스 −10 · 9개월 뒤 40% 확률로 3% 회수`},
  {label:'거절한다',stress:15,desc:'비용 없음 · 스트레스 +15'}]},
 {id:'travel_slump',title:'관광객 급감 · 항공 노선 중단',text:'주요 항공 노선이 끊기며 숙박업이 얼어붙었습니다. 직원들의 눈이 당신을 향합니다.',build:(s,c)=>[
  {label:'직원을 모두 지킨다',cost:pct(c.wealth,.01),fame:15,multiplier:.8,months:3,desc:`1% (${money(pct(c.wealth,.01))}) 지출 · 명성 +15 · 3개월 매출 −20%`},
  {label:'인력을 감축한다',fame:-15,multiplier:.65,months:2,desc:'비용 없음 · 명성 −15 · 2개월 매출 −35%'}]},
 {id:'museum_loan',title:'미술관의 대여 요청',text:'국립미술관이 당신의 소장품을 특별전에 대여해 달라고 요청합니다.',when:(s)=>(s.artCollection?.owned.length||0)>0,build:()=>[
  {label:'대여한다',fame:25,memories:1,desc:'명성 +25 · 추억 +1 · 작품은 3개월 뒤 돌아옵니다'},
  {label:'거절한다',desc:'변화 없음'}]},
 {id:'zoning',title:'강변 재개발 계획 발표',text:'시가 강변 재개발을 예고했습니다. 발표 전 선매입 컨소시엄이 당신을 초대합니다.',build:(s,c)=>[
  {label:'컨소시엄에 참여한다',cost:pct(c.wealth,.04),later:{months:6,amount:pct(c.wealth,.09),chance:.6,label:'재개발 컨소시엄 정산',fallback:pct(c.wealth,.02)},desc:`4% (${money(pct(c.wealth,.04))}) 투자 · 6개월 뒤 60%: 9% 회수 / 40%: 2%만 회수`},
  {label:'관망한다',desc:'변화 없음'}]},
 {id:'burnout',title:'건강 검진 경고',text:'주치의가 과로를 경고합니다. 지금 쉬지 않으면 더 크게 쉬게 될 겁니다.',when:s=>s.stress>=45,build:(s,c)=>[
  {label:'한 달 요양을 떠난다',cost:pct(c.wealth,.01),stress:-40,multiplier:.9,months:1,desc:`1% (${money(pct(c.wealth,.01))}) · 스트레스 −40 · 1개월 매출 −10%`},
  {label:'무시하고 일한다',stress:20,later:{months:3,amount:-pct(c.wealth,.02),chance:.6,label:'입원 치료비'},desc:'스트레스 +20 · 3개월 뒤 60% 확률로 2% 치료비'}]},
 {id:'market_crash',title:'증시 급락',text:'해외발 악재로 증시가 하루 만에 무너졌습니다. 공포에 팔 것인가, 담을 것인가.',build:(s,c)=>[
  {label:'저가에 담는다',cost:pct(c.wealth,.03),prices:.9,later:{months:3,amount:pct(c.wealth,.03)+pct(c.wealth,.02),chance:.75,label:'저가 매수 반등'},desc:`주가 −10% · 3% (${money(pct(c.wealth,.03))}) 추가 매수 · 3개월 뒤 75% 확률로 5% 회수`},
  {label:'지켜본다',prices:.9,desc:'주가 −10% · 추가 지출 없음'}]},
 {id:'networking',title:'업계 네트워킹 초대',text:'새 고객과 파트너를 만날 기회입니다. 생활의 여유와 성장 중 무엇에 투자할까요?',build:(s,c)=>[
  {label:'참가하고 배운다',cost:pct(c.wealth,.002),skill:4,fame:8,stress:4,desc:`0.2% (${money(pct(c.wealth,.002))}) 지출 · 전문성 +4 · 명성 +8 · 스트레스 +4`},
  {label:'충분히 쉬어간다',stress:-12,desc:'비용 없음 · 스트레스 −12'}]},
 {id:'rival_offer',title:'라이벌의 인수 제안',text:'라이벌이 당신의 건물을 시세보다 비싸게 사겠다고 제안합니다. 현금을 챙길까요, 자존심을 지킬까요?',hidden:true,build:(s,c)=>[
  {label:'프리미엄에 매각한다',money:c.offer,action:'sell-to-rival',tile:c.tile,desc:`${c.tileName} 매각 · 시세의 130% (${money(c.offer)}) 현금 회수`},
  {label:'거절한다',fame:10,desc:'명성 +10 · 라이벌의 다음 제안은 1년 뒤'}]}
];
const eventById=id=>RICH_EVENTS.find(e=>e.id===id);
export function buildRichEvent(s,id,ctx){
 const e=eventById(id);if(!e)return null;
 const options=e.build(s,ctx).map(o=>({...o,cost:o.cost||0}));
 return{id:e.id,title:e.title,text:e.text,options};
}
// Every EVENT_INTERVAL months, pick a non-repeating eligible event deterministically.
export function scheduleRichEvent(s,ctx){
 if(s.event||s.month===0||s.month%EVENT_INTERVAL!==0)return null;
 const recent=(s.eventLog||[]).slice(0,3);
 const pool=RICH_EVENTS.filter(e=>!e.hidden&&!recent.includes(e.id)&&(!e.when||e.when(s,ctx)));
 const pick=pool[Math.floor(hashRoll(s.seed,s.month,'event')*pool.length)];
 if(!pick)return null;
 s.event=buildRichEvent(s,pick.id,ctx);s.eventLog=[pick.id,...(s.eventLog||[])].slice(0,6);
 return s.event;
}
export function applyRichChoice(s,o){
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 if(s.mode!=='sandbox')s.money-=o.cost||0;
 if(o.money)s.money+=o.money;
 s.stress=clamp(s.stress+(o.stress||0),0,100);s.skill=clamp(s.skill+(o.skill||0),0,100);
 if(o.fame)s.prestige=Math.max(0,(s.prestige||0)+o.fame);
 if(o.memories){s.lifestyle??={spent:0,memories:0,last:{}};s.lifestyle.memories+=o.memories;}
 if(o.prices)for(const k of Object.keys(s.prices))s.prices[k]=Math.max(5,Math.round(s.prices[k]*o.prices*100)/100);
 if(o.multiplier)s.effect={bonus:0,remaining:o.months||1,multiplier:o.multiplier};else if(o.bonus)s.effect={bonus:o.bonus,remaining:2};
 if(o.later){s.pending??=[];const seq=(s.pendingSerial=(s.pendingSerial||0)+1);s.pending.push({id:seq,label:o.later.label,month:s.month+o.later.months,amount:o.later.amount,chance:o.later.chance,fallback:o.later.fallback||0,penalty:o.later.penalty||null,roll:hashRoll(s.seed,seq,'pending')});}
 if(o.action==='sell-to-rival'&&Number.isInteger(o.tile)){const t=s.tiles[o.tile];if(t?.owner==='player'){const keep={type:t.type,level:t.level,constructionCost:t.constructionCost};for(const k of Object.keys(t))if(!['terrain','tree'].includes(k))delete t[k];Object.assign(t,keep,{owner:'rival',tree:false});if(s.rival){s.rival.tiles.push(o.tile);s.rival.acquired=(s.rival.acquired||0)+1;}}}
}
// Delayed payoffs resolve at month end using the roll fixed when the decision was made.
export function resolvePending(s){
 if(!s.pending?.length)return[];
 const due=s.pending.filter(p=>p.month<=s.month),resolved=[];
 for(const p of due){
  const win=p.roll<p.chance,amount=win?p.amount:p.fallback||0;
  s.money+=amount;if(!win&&p.penalty?.fame)s.prestige=Math.max(0,(s.prestige||0)+p.penalty.fame);
  s.log.unshift(`${amount>=0?'✦':'⚠'} ${p.label} · ${win?'성공':'무산'} · ${amount>=0?'+':'−'}${money(Math.abs(amount))}${!win&&p.penalty?.fame?' · 명성 '+p.penalty.fame:''}`);
  resolved.push({...p,win,amount});
 }
 s.pending=s.pending.filter(p=>p.month>s.month);s.log=s.log.slice(0,25);
 return resolved;
}
export function validRichEvent(s){
 const e=s.event;if(!e)return true;
 if(!eventById(e.id)||typeof e.title!=='string'||typeof e.text!=='string'||!Array.isArray(e.options)||e.options.length<1||e.options.length>3)return false;
 return e.options.every(o=>o&&typeof o.label==='string'&&typeof o.desc==='string'&&Number.isFinite(o.cost)&&o.cost>=0&&['money','stress','skill','fame','memories','multiplier','months','prices','bonus'].every(k=>o[k]===undefined||Number.isFinite(o[k]))&&(o.later===undefined||(o.later&&Number.isInteger(o.later.months)&&o.later.months>0&&Number.isFinite(o.later.amount)&&Number.isFinite(o.later.chance)))&&(o.tile===undefined||Number.isInteger(o.tile)));
}
export function validPending(s){
 if(s.pending===undefined)return true;
 if(!Array.isArray(s.pending)||s.pending.length>12)return false;
 return s.pending.every(p=>p&&Number.isInteger(p.id)&&typeof p.label==='string'&&Number.isInteger(p.month)&&p.month>s.month-1&&Number.isFinite(p.amount)&&Number.isFinite(p.chance)&&Number.isFinite(p.roll)&&p.roll>=0&&p.roll<1)&&(s.pendingSerial===undefined||Number.isInteger(s.pendingSerial))&&(s.eventLog===undefined||(Array.isArray(s.eventLog)&&s.eventLog.length<=6&&s.eventLog.every(id=>!!eventById(id))));
}
