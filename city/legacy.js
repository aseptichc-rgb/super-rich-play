// Chapters, prestige as a currency, philanthropy, the foundation and the legacy ending.
import {reputationSummary} from './empire.js';
const money=n=>'₲'+Math.round(n).toLocaleString('ko-KR');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const CHAPTERS=[
 {n:1,name:'자산가',en:'THE HEIR',min:0,unlocks:['호텔 · 임대 빌딩 건설','복리 리스크 사다리','벤처 · 소기업 인수'],symbol:'첫 호텔',hint:'현금흐름을 만들고 라이벌보다 먼저 좋은 땅을 잡으세요.'},
 {n:2,name:'디벨로퍼',en:'THE DEVELOPER',min:10000000,unlocks:['리조트 건설','관광 클러스터 시너지 (호텔·리조트 인접 +8%씩)','명작 경매 상위 작품'],symbol:'리조트 단지',hint:'호텔과 리조트를 붙여 지으면 서로의 매출을 끌어올립니다.'},
 {n:3,name:'타이쿤',en:'THE TYCOON',min:30000000,unlocks:['본사 타워 (관리형 매출 +5%)','기업 · 방송사 인수','라이벌 M&A 제안과 라이벌 건물 인수'],symbol:'본사 타워',hint:'본사를 세우고 라이벌의 건물을 프리미엄에 사들이세요.'},
 {n:4,name:'레거시',en:'THE LEGACY',min:150000000,unlocks:['도시 기념탑 (관리형 매출 +10%)','재단 설립','레거시 엔딩과 회차 시작'],symbol:'도시 기념탑',hint:'무엇을 남길지 정할 시간입니다. 10년째 또는 ₲3억에서 엔딩이 열립니다.'}
];
export const SCENARIOS={
 heir:{name:'상속자',icon:'♛',tagline:'순자산 ₲2,000,000 · 저택·스포츠카·임대 3곳·주식',desc:'기본 시작. 자산은 준비되어 있고, 문제는 무엇을 남기느냐입니다.'},
 selfmade:{name:'자수성가',icon:'⚒',tagline:'현금 ₲500,000 · 자산 없음 · 전문성 85',desc:'맨손에서 시작합니다. 첫 호텔까지가 가장 길고, 그래서 가장 짜릿합니다.'},
 windfall:{name:'벼락부자',icon:'✦',tagline:'현금 ₲3,500,000 · 저택·차·요트 보유 · 생활비 3배',desc:'모든 것을 한 번에 샀습니다. 유지비가 매달 현금을 갉아먹습니다.'}
};
export const PRESTIGE_DECAY=.03;
export function chapterOf(s){const peak=s.mode==='sandbox'?Infinity:(s.highestWealth||0);return CHAPTERS.filter(c=>peak>=c.min).at(-1);}
export function nextChapter(s){return s.mode==='sandbox'?null:CHAPTERS.find(c=>c.min>(s.highestWealth||0))||null;}
export function addPrestige(s,n){s.prestige=Math.max(0,Math.round(((s.prestige||0)+n)*10)/10);return s.prestige;}
// Lifestyle fame fades 3% a month; landmark buildings feed it every month.
export function settlePrestige(s){
 if(s.prestige)s.prestige=Math.max(0,Math.round(s.prestige*(1-PRESTIGE_DECAY)*10)/10);
 const owned=s.tiles.filter(t=>t.owner==='player');
 const gain=(owned.some(t=>t.type==='hq')?10:0)+(owned.some(t=>t.type==='monument')?30:0);
 if(gain)addPrestige(s,gain);
}
export function foundationQuote(s,wealth){return Math.max(5000000,Math.round(wealth*.05));}
export function foundFoundation(s,wealth){
 if(chapterOf(s).n<4)return{ok:false,msg:'레거시 챕터 (최고 순자산 ₲150,000,000)에서 설립할 수 있습니다.'};
 if(s.foundation)return{ok:false,msg:'이미 재단을 설립했습니다.'};
 const amount=foundationQuote(s,wealth);if(s.money<amount)return{ok:false,msg:`출연금 ${money(amount)} 필요`};
 s.money-=amount;s.foundation={month:s.month,endowment:amount};addPrestige(s,100);
 s.log.unshift(`✦ ${s.name} 재단 설립 · 출연금 ${money(amount)} · 명성 +100`);s.log=s.log.slice(0,25);
 return{ok:true,msg:'재단을 설립했습니다. 이름이 도시에 남습니다.'};
}
export function legacyScore(s,a){
 const peak=Math.max(s.highestWealth||0,a.wealth),owned=s.tiles.filter(t=>t.owner==='player'),fame=Math.round(reputationSummary(s).fame);
 const beatRival=!!s.rival&&a.wealth>=s.rival.wealth;
 const parts=[
  {name:'최고 순자산',value:Math.min(3000,Math.round(peak/10000000*100)),note:'₲1,000만당 100점 · 최대 3,000'},
  {name:'명성',value:fame,note:'현재 명성 1점당 1점'},
  {name:'추억',value:(s.lifestyle?.memories||0)*20,note:'경험 1회당 20점'},
  {name:'상징 건물',value:(owned.some(t=>t.type==='hq')?300:0)+(owned.some(t=>t.type==='monument')?800:0),note:'본사 300 · 기념탑 800'},
  {name:'재단',value:s.foundation?400:0,note:'설립 시 400'},
  {name:'라이벌 레이스',value:beatRival?500:0,note:'라이벌보다 앞서면 500'},
  {name:'무결점 경영',value:(s.fireSales||0)?0:200,note:'급매 처분 없이 끝내면 200'}
 ];
 const total=parts.reduce((n,p)=>n+p.value,0),grade=total>=4500?'S':total>=3000?'A':total>=1800?'B':'C';
 return{parts,total,grade,beatRival};
}
export function endingReport(s,a){const score=legacyScore(s,a);return{month:s.month,wealth:Math.round(a.wealth),peak:Math.round(Math.max(s.highestWealth||0,a.wealth)),score:score.total,grade:score.grade,parts:score.parts,beatRival:score.beatRival,shown:false};}
export function validLegacy(s){
 if(s.prestige!==undefined&&!(Number.isFinite(s.prestige)&&s.prestige>=0))return false;
 if(s.lastDonation!==undefined&&!(Number.isInteger(s.lastDonation)&&s.lastDonation>=0&&s.lastDonation<=s.month))return false;
 if(s.donated!==undefined&&!(Number.isFinite(s.donated)&&s.donated>=0))return false;
 if(s.foundation!==undefined&&!(s.foundation&&Number.isInteger(s.foundation.month)&&s.foundation.month>=0&&s.foundation.month<=s.month&&Number.isFinite(s.foundation.endowment)&&s.foundation.endowment>0))return false;
 if(s.ending!==undefined&&!(s.ending&&Number.isInteger(s.ending.month)&&s.ending.month>=0&&s.ending.month<=s.month&&Number.isFinite(s.ending.score)&&['S','A','B','C'].includes(s.ending.grade)&&typeof s.ending.shown==='boolean'&&Array.isArray(s.ending.parts)))return false;
 if(s.scenario!==undefined&&!Object.hasOwn(SCENARIOS,s.scenario))return false;
 return ['crisisMonths','fireSales'].every(k=>s[k]===undefined||(Number.isInteger(s[k])&&s[k]>=0));
}
export function chapterDialog(s,chapter){
 const c=CHAPTERS.find(x=>x.n===chapter)||chapterOf(s),next=CHAPTERS.find(x=>x.n===c.n+1);
 return `<div class="chapter-card"><span class="eyebrow">CHAPTER ${String(c.n).padStart(2,'0')} · ${c.en}</span><h2>${c.name}의 시대가 열렸습니다.</h2><p>${c.hint}</p><ul class="chapter-unlocks">${c.unlocks.map(u=>`<li>✦ ${u}</li>`).join('')}</ul><p class="help">지도의 상징: <b>${c.symbol}</b>${next?` · 다음 챕터 ‘${next.name}’은 최고 순자산 ${money(next.min)}에서 열립니다.`:' · 마지막 챕터입니다. 엔딩은 10년째 또는 ₲300,000,000에서 열립니다.'}</p><button data-action="close" class="primary full">계속하기 →</button></div>`;
}
export function chapterCard(s,a){
 const c=chapterOf(s),next=nextChapter(s),progress=next?Math.min(100,Math.max(0,(a.wealth-c.min)/(next.min-c.min)*100)):100;
 return `<section class="side-section chapter-section"><h3>CHAPTER ${String(c.n).padStart(2,'0')} · ${c.name} <span>✦</span></h3><div class="meter milestone"><i style="width:${progress}%"></i></div><p class="help">${next?`다음 챕터 ‘${next.name}’까지 ${money(Math.max(0,next.min-a.wealth))} · ${next.unlocks[0]} 해금`:'마지막 챕터 · 레거시를 완성하세요'}</p><button class="portfolio-link" data-action="legacy">명성 · 기부 · 레거시 점수 →</button></section>`;
}
export function legacyDialog(s,a){
 const r=reputationSummary(s),score=legacyScore(s,a),c=chapterOf(s),endowment=foundationQuote(s,a.wealth);
 return `<span class="eyebrow">REPUTATION &amp; LEGACY</span><h2>돈은 벌었고, 이름은 남길 차례.</h2><p>라이프 명성은 매달 3%씩 잊히고, 파티·컬렉션·상징 건물이 다시 채웁니다. 기부와 인터뷰로 얻은 명성은 남습니다. 명성은 칭호 혜택에 더해 호텔·리조트·빌딩 매출 프리미엄(최대 +20%)과 경매 참가 자격, 벤처 실패 시 회수를 결정합니다.</p><section class="owner-reputation"><span>나의 명성</span><h3>${Math.round(r.fame).toLocaleString('ko-KR')} · ${r.tier.name}</h3><p>라이프 명성 ${Math.round(s.prestige||0)} · 오너·사회 명성 ${Math.round(r.fame-(s.prestige||0))} · 매출 프리미엄 +${Math.round(r.premium*100-100)}%</p><p>${r.next?`다음 칭호 ‘${r.next.name}’까지 ${Math.ceil(r.next.min-r.fame).toLocaleString('ko-KR')}점`:'최고 칭호 달성'}</p></section><div class="legacy-actions"><section><h3>♡ 기부 · 인터뷰</h3><p>지역사회 기부는 누적 ₲1,000당 명성 1점, 언론 인터뷰는 월 1회 명성 +20.</p><button data-action="reputation">기부 · 인터뷰 · 칭호 보기</button></section><section><h3>✦ ${esc(s.name)} 재단</h3><p>${s.foundation?`설립 ${s.foundation.month}개월 차 · 출연금 ${money(s.foundation.endowment)}`:`순자산의 5% (최소 ₲5,000,000 · 지금 ${money(endowment)}) · 명성 +100 · 레거시 400점`}</p><button data-action="found" ${s.foundation||c.n<4||s.money<endowment?'disabled':''}>${s.foundation?'설립 완료':c.n<4?'레거시 챕터에서 해금':s.money<endowment?'현금 부족':'재단 설립'}</button></section></div><h3>레거시 점수 미리보기 · ${score.total.toLocaleString('ko-KR')}점 · ${score.grade}등급</h3><div class="legacy-score">${score.parts.map(p=>`<div><span>${p.name}</span><b>${p.value.toLocaleString('ko-KR')}</b><small>${p.note}</small></div>`).join('')}</div><p class="help">엔딩은 10년째(120개월) 또는 최고 순자산 ₲300,000,000에서 열리며, 이후에도 계속 플레이할 수 있습니다. 등급: S 4,500 · A 3,000 · B 1,800.</p>`;
}
export function endingDialog(s){
 const e=s.ending;if(!e)return'';
 const scenario=SCENARIOS[s.scenario||'heir'];
 return `<div class="ending-card grade-${e.grade}"><span class="eyebrow">LEGACY · ${scenario.name} 루트 · ${e.month}개월</span><h2>${e.grade}등급 · ${e.score.toLocaleString('ko-KR')}점</h2><p>${e.grade==='S'?'시대를 대표하는 오너. 도시가 당신의 이름을 기억합니다.':e.grade==='A'?'전국적 아이콘. 자산과 명성이 함께 남았습니다.':e.grade==='B'?'성공한 자산가. 다음 회차에서 더 큰 유산을 남겨보세요.':'부자로 살았지만 남긴 것은 적습니다. 다른 길을 시도해 보세요.'}</p><div class="legacy-score">${e.parts.map(p=>`<div><span>${p.name}</span><b>${p.value.toLocaleString('ko-KR')}</b><small>${p.note}</small></div>`).join('')}</div><p class="help">최고 순자산 ${money(e.peak)} · 엔딩 시점 순자산 ${money(e.wealth)}${e.beatRival?' · 라이벌 레이스 승리':' · 라이벌에 뒤처짐'}</p><div class="button-row"><button data-action="close" class="primary">계속 플레이하기</button><button data-action="settings">새 회차 시작 (다른 시작 조건) →</button></div></div>`;
}
