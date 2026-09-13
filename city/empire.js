import {marketPrice,incomeFactor} from './economy.js';
import {publicActivitiesPanel} from './reputation.js';
export const EMPIRE_ASSETS={
 company:{name:'한빛 글로벌',role:'주요 기업 회장',icon:'▦',sector:'산업 · 테크 그룹',unlock:20000000,cost:12000000,income:120000,description:'도시의 제조·기술 계열사를 이끄는 대기업 지배 지분입니다.'},
 broadcaster:{name:'프라임 방송 네트워크',role:'방송사 오너',icon:'▣',sector:'뉴스 · 엔터테인먼트',unlock:60000000,cost:35000000,income:300000,description:'전국 채널과 제작 스튜디오를 보유한 미디어 그룹입니다.'},
 club:{name:'리버사이드 유나이티드',role:'스포츠 구단주',icon:'◆',sector:'프로 스포츠 구단',unlock:150000000,cost:90000000,income:700000,description:'경기장과 유소년 아카데미를 함께 운영하는 명문 구단입니다.'}
};

const money=n=>'₲'+Math.round(n).toLocaleString('ko-KR');
export const OWNER_PERKS={company:{fame:50,monthly:3,label:'회장 네트워킹',gain:20,skill:3,stress:0,benefit:'회장 네트워킹으로 전문성 +3'},broadcaster:{fame:150,monthly:5,label:'프리미어 개최',gain:30,skill:2,stress:0,benefit:'보유 중 창작 진행 속도 +25%'},club:{fame:250,monthly:8,label:'구단주석에서 경기 관람',gain:40,skill:0,stress:20,benefit:'보유 중 매월 스트레스 −5'}};
export const REPUTATION_TIERS=[
 {min:0,name:'프라이빗 오너',field:'경제',relief:0,creative:1,ownerIncome:1,benefit:'기본 명성 칭호'},
 {min:100,name:'지역사회 후원자',field:'사회',relief:1,creative:1,ownerIncome:1,benefit:'매월 스트레스 −1'},
 {min:200,name:'도시의 유명 인사',field:'사회',relief:2,creative:1,ownerIncome:1,benefit:'매월 스트레스 −2'},
 {min:500,name:'문화예술 후원가',field:'문화',relief:4,creative:1.05,ownerIncome:1,benefit:'창작 속도 +5% · 스트레스 −4'},
 {min:1000,name:'경제계 거물',field:'경제',relief:6,creative:1.05,ownerIncome:1.05,benefit:'오너 배당 +5% · 스트레스 −6'},
 {min:1500,name:'시의원',field:'정치',relief:7,creative:1.05,ownerIncome:1.05,benefit:'매월 스트레스 −7'},
 {min:2000,name:'자선재단 이사장',field:'사회',relief:7,creative:1.05,ownerIncome:1.08,benefit:'오너 배당 +8% · 스트레스 −7'},
 {min:2500,name:'국회의원',field:'정치',relief:8,creative:1.05,ownerIncome:1.08,benefit:'매월 스트레스 −8'},
 {min:3200,name:'글로벌 비즈니스 리더',field:'경제',relief:8,creative:1.1,ownerIncome:1.1,benefit:'창작 +10% · 오너 배당 +10%'},
 {min:4000,name:'장관',field:'정치',relief:9,creative:1.1,ownerIncome:1.1,benefit:'매월 스트레스 −9'},
 {min:5500,name:'세계적 명사',field:'문화',relief:9,creative:1.15,ownerIncome:1.15,benefit:'창작 +15% · 오너 배당 +15%'},
 {min:7000,name:'대통령',field:'정치',relief:10,creative:1.2,ownerIncome:1.2,benefit:'창작 +20% · 배당 +20% · 스트레스 −10'}
];
// Fame = owner base + owner activities + public giving + lifestyle prestige (s.prestige: parties, collections, landmarks; fades 3% a month).
export function reputationSummary(s){const owned=s.empire?.owned||[],fame=owned.reduce((n,id)=>n+(OWNER_PERKS[id]?.fame||0),0)+(s.empire?.earnedFame||0)+(s.prestige||0),tier=REPUTATION_TIERS.filter(t=>fame>=t.min).at(-1);return{fame,tier,next:REPUTATION_TIERS.find(t=>t.min>fame),earned:REPUTATION_TIERS.filter(t=>fame>=t.min),monthly:owned.reduce((n,id)=>n+(OWNER_PERKS[id]?.monthly||0),0),creativeMultiplier:(owned.includes('broadcaster')?1.25:1)*tier.creative,ownerIncomeMultiplier:tier.ownerIncome,stressRelief:(owned.includes('club')?5:0)+tier.relief,premium:1+Math.min(300,Math.max(0,fame-acquisitionFame(s)))/1500,salvage:fame>=100};}
// Fame earned merely by buying assets or completing landmarks does not raise operating revenue; activity, giving and lifestyle fame do.
function acquisitionFame(s){return Object.values(s.reputation?.assets||{}).reduce((n,v)=>n+v,0)+Object.values(s.empire?.landmarkFame||{}).reduce((n,v)=>n+v,0);}
export function settleOwnerBenefits(s){const r=reputationSummary(s);if(!r.monthly&&!r.stressRelief)return;const e=ensureEmpire(s);e.earnedFame=(e.earnedFame||0)+r.monthly;s.stress=Math.max(0,s.stress-r.stressRelief);}
export function ownerActivity(s,id){if(!Object.hasOwn(OWNER_PERKS,id)||!s.empire?.owned.includes(id))return{ok:false,msg:'이 자산을 먼저 인수하세요.'};const e=s.empire,d=OWNER_PERKS[id];if(e.lastActivities?.[id]===s.month)return{ok:false,msg:'이번 달에 이미 참여했습니다.'};e.lastActivities??={};e.lastActivities[id]=s.month;e.earnedFame=(e.earnedFame||0)+d.gain;s.skill=Math.min(100,s.skill+d.skill);s.stress=Math.max(0,s.stress-d.stress);const msg=`${d.label} · 명성 +${d.gain}${d.skill?' · 전문성 +'+d.skill:''}${d.stress?' · 스트레스 −'+d.stress:''}`;s.log.unshift(msg);s.log=s.log.slice(0,25);return{ok:true,msg};}

export function ensureEmpire(s){if(!s.empire)s.empire={owned:[]};return s.empire;}

export function empireSummary(s){
 const owned=(s.empire?.owned||[]).filter(id=>Object.hasOwn(EMPIRE_ASSETS,id)),titleBenefit=reputationSummary(s).ownerIncomeMultiplier;
 return{owned,assets:Math.round(owned.reduce((sum,id)=>sum+marketPrice(s,EMPIRE_ASSETS[id].cost)*Math.pow(1.002,Math.max(0,s.month-(s.empire?.acquiredMonths?.[id]??s.month))),0)),income:owned.reduce((sum,id)=>sum+EMPIRE_ASSETS[id].income*incomeFactor(s)*titleBenefit,0)};
}

export function acquisitionReason(s,id,wealth){
 const d=EMPIRE_ASSETS[id];if(!d)return'인수 대상을 확인하세요.';
 if((s.empire?.owned||[]).includes(id))return'이미 소유하고 있습니다.';
 if(s.mode!=='sandbox'&&(s.highestWealth||wealth)<d.unlock)return`최고 순자산 ${money(d.unlock)} 달성 시 해금`;
 if(s.mode!=='sandbox'&&wealth<marketPrice(s,d.unlock))return`현재 순자산 ${money(marketPrice(s,d.unlock))} 필요`;
 if(s.mode!=='sandbox'&&s.money<marketPrice(s,d.cost))return`인수 현금 ${money(marketPrice(s,d.cost))} 필요`;
 return null;
}

export function acquireEmpireAsset(s,id,wealth){
 const error=acquisitionReason(s,id,wealth);if(error)return{ok:false,msg:error};
 const d=EMPIRE_ASSETS[id];if(s.mode!=='sandbox')s.money-=marketPrice(s,d.cost);const e=ensureEmpire(s);e.acquiredMonths??={};e.acquiredMonths[id]=s.month;
 ensureEmpire(s).owned.push(id);s.log.unshift(`${d.icon} ${d.name} 인수 · ${d.role} 취임 · ${money(marketPrice(s,d.cost))}`);s.log=s.log.slice(0,25);
 return{ok:true,msg:`${d.name} 인수 완료 · ${d.role}가 되었습니다!`};
}

export function validEmpire(s){
 const e=s.empire;if(e===undefined)return true;
 if(e?.acquiredMonths!==undefined&&(!e.acquiredMonths||typeof e.acquiredMonths!=='object'||Array.isArray(e.acquiredMonths)||!Object.entries(e.acquiredMonths).every(([id,m])=>e.owned?.includes(id)&&Number.isInteger(m)&&m>=0&&m<=s.month)))return false;
 if(e?.earnedFame!==undefined&&(!Number.isSafeInteger(e.earnedFame)||e.earnedFame<0))return false;
 if(e?.lastActivities!==undefined&&(!e.lastActivities||typeof e.lastActivities!=='object'||Array.isArray(e.lastActivities)||!Object.entries(e.lastActivities).every(([id,month])=>Object.hasOwn(OWNER_PERKS,id)&&e.owned?.includes(id)&&Number.isInteger(month)&&month>=0&&month<=s.month)))return false;
 return!!(e&&Array.isArray(e.owned)&&e.owned.length<=Object.keys(EMPIRE_ASSETS).length&&new Set(e.owned).size===e.owned.length&&e.owned.every(id=>Object.hasOwn(EMPIRE_ASSETS,id)));
}

export function empireDialog(s,wealth){
 const summary=empireSummary(s);
 return`<span class="eyebrow">OWNER'S CLUB · ENDGAME</span><h2>투자를 넘어, 세상을 움직이는 오너로.</h2><p>처음부터 살 수 없는 최상위 자산입니다. 최고 순자산을 먼저 달성하고, 인수 대금을 현금으로 준비해야 합니다.</p><div class="empire-summary"><span>현재 최고 순자산 <b>${money(s.highestWealth||wealth)}</b></span><span>오너 자산 <b>${money(summary.assets)}</b></span><span>월 오너 배당 <b>+${money(summary.income)}</b></span></div>${reputationPanel(s)}<button data-action="reputation" class="full">기부 · 언론 인터뷰로 명성 쌓기 →</button><div class="empire-grid">${Object.entries(EMPIRE_ASSETS).map(([id,d])=>{const reason=acquisitionReason(s,id,wealth),owned=summary.owned.includes(id),progress=Math.min(100,(s.highestWealth||wealth)/d.unlock*100);return`<section class="empire-card ${owned?'owned':''}"><div class="empire-head"><span>${d.icon}</span><div><small>${d.sector}</small><h3>${d.name}</h3></div></div><b class="empire-role">${owned?'✓ '+d.role:d.role}</b><p>${d.description}</p><div class="owner-perks"><b>명성 +${OWNER_PERKS[id].fame} · 매월 +${OWNER_PERKS[id].monthly}</b><p>${OWNER_PERKS[id].benefit}</p><p>월 1회 ${OWNER_PERKS[id].label}: 명성 +${OWNER_PERKS[id].gain}${OWNER_PERKS[id].skill?` · 전문성 +${OWNER_PERKS[id].skill}`:""}${OWNER_PERKS[id].stress?` · 스트레스 −${OWNER_PERKS[id].stress}`:""}</p>${owned?`<button data-owner-activity="${id}" ${s.empire.lastActivities?.[id]===s.month?'disabled':''}>${s.empire.lastActivities?.[id]===s.month?'이번 달 참여 완료':OWNER_PERKS[id].label}</button>`:""}</div><div class="empire-numbers"><span>해금 조건 <b>${money(d.unlock)}</b></span><span>인수 대금 <b>${money(marketPrice(s,d.cost))}</b></span><span>월 배당 <b>+${money(d.income*incomeFactor(s))}</b></span></div><div class="meter"><i style="width:${progress}%"></i></div><button data-empire-acquire="${id}" ${reason?'disabled':''}>${owned?'인수 완료':reason||'지배 지분 인수하기'}</button></section>`;}).join('')}</div><p class="help">인수 대금은 현금에서 빠지고 동일한 가치의 오너 자산이 순자산에 편입됩니다. 인수한 자산의 배당은 매월 자동 정산됩니다. 오너 자산 평가액은 보유 월마다 0.2%씩 복리 상승하며, 상승분은 매각 전까지 현금이 아닌 순자산에 반영됩니다. 이전 저장의 소유 자산은 다음 월 정산부터 상승을 기록합니다.</p>`;
}
export function reputationPanel(s){const r=reputationSummary(s),progress=r.next?Math.max(0,Math.min(100,(r.fame-r.tier.min)/(r.next.min-r.tier.min)*100)):100;return`<section class="owner-reputation"><span>나의 명성 · 상한 없음</span><h3>${r.fame.toLocaleString('ko-KR')} · ${r.tier.name}</h3><p>현재 혜택 · ${r.tier.benefit}</p><p>매월 명성 +${r.monthly}${r.next?` · 다음 칭호 ‘${r.next.name}’까지 ${(r.next.min-r.fame).toLocaleString('ko-KR')}점`:' · 최고 칭호 달성 후에도 명성은 계속 쌓입니다'}</p><div class="reputation-progress" aria-label="다음 칭호 진행도"><i style="width:${progress}%"></i></div><div class="reputation-tiers">${REPUTATION_TIERS.map(t=>`<span class="${r.fame>=t.min?'earned':''}${t===r.tier?' current':''}"><b>${r.fame>=t.min?'✓':'○'} ${t.name}</b><small>${t.min.toLocaleString('ko-KR')}점 · ${t.field}</small><em>${t.benefit}</em></span>`).join('')}</div><small>사회·문화·경제·정치 칭호를 차례로 획득합니다. 혜택은 현재 칭호 기준으로 적용되며, 방송사·구단 보유 혜택과 함께 받을 수 있습니다.</small></section>`;}

export function reputationDialog(s){return `<span class="eyebrow">REPUTATION & GIVING</span><h2>나의 명성과 나눔</h2>${reputationPanel(s)}${publicActivitiesPanel(s)}`;}
