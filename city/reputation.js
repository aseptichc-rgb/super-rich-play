// Public activities share the existing owner fame balance.
export const DONATION_AMOUNTS=[1000,10000,100000,1000000];
export const INTERVIEW_FAME=20;
export const PROPERTY_PARTIES={golf:{name:'골프장 파티',cost:5000,stress:25,fame:20},resort:{name:'리조트 파티',cost:10000,stress:40,fame:30}};
export const ASSET_FAME=[{cost:100000000,fame:200},{cost:10000000,fame:100},{cost:1000000,fame:50},{cost:100000,fame:20}];
const money=n=>'₲'+n.toLocaleString('ko-KR');
const ensure=s=>s.reputation??={donated:0,lastInterview:-1,assets:{}};
function gainFame(s,gain,label){
 s.empire??={owned:[]};s.empire.earnedFame=(s.empire.earnedFame||0)+gain;
 const msg=`${label} · 명성 +${gain}`;s.log.unshift(msg);s.log=s.log.slice(0,25);return{ok:true,msg};
}
export function assetFame(cost){return ASSET_FAME.find(t=>cost>=t.cost)?.fame||0;}
export function awardAssetFame(s,key,cost,label,minimum=0){
 const points=Math.max(minimum,assetFame(cost)),previous=s.reputation?.assets?.[key]||0;
 if(points<=previous)return 0;
 ensure(s).assets[key]=points;gainFame(s,points-previous,label);return points-previous;
}
export function donate(s,amount){
 if(!Number.isSafeInteger(amount)||amount<1000)return{ok:false,msg:'기부금은 ₲1,000 이상의 정수로 입력하세요.'};
 if(s.money<amount)return{ok:false,msg:'기부할 현금이 부족합니다.'};
 const total=(s.reputation?.donated||0)+amount;
 if(!Number.isSafeInteger(total))return{ok:false,msg:'누적 기부 한도를 초과했습니다.'};
 const r=ensure(s),gain=Math.floor(total/1000)-Math.floor(r.donated/1000);
 s.money-=amount;r.donated=total;return gainFame(s,gain,`지역사회 기부 ${money(amount)}`);
}
export function mediaInterview(s){
 if(s.reputation?.lastInterview===s.month)return{ok:false,msg:'이번 달 인터뷰를 이미 마쳤습니다.'};
 ensure(s).lastInterview=s.month;return gainFame(s,INTERVIEW_FAME,'언론 인터뷰 · 나의 투자와 나눔 이야기');
}
export function hostPropertyParty(s,i){
 const t=Number.isInteger(i)&&s.tiles[i],party=t&&Object.hasOwn(PROPERTY_PARTIES,t.type)&&PROPERTY_PARTIES[t.type];
 if(!party||t.owner!=='player'||t.tenure!=='buy')return{ok:false,msg:'보유한 골프장이나 리조트에서만 파티를 열 수 있습니다.'};
 if(s.reputation?.lastParties?.[t.type]===s.month)return{ok:false,msg:'이번 달에는 이 종류의 시설에서 파티를 이미 열었습니다.'};
 if(s.money<party.cost)return{ok:false,msg:'파티 개최 비용이 부족합니다.'};
 const r=ensure(s);r.lastParties??={};r.lastParties[t.type]=s.month;
 const relief=Math.min(s.stress,party.stress);s.money-=party.cost;s.stress=Math.max(0,s.stress-party.stress);
 return gainFame(s,party.fame,`${party.name} 개최 · ${money(party.cost)} · 스트레스 −${relief}`);
}
export function propertyPartyPanel(s,i){
 const t=s.tiles[i],party=t&&Object.hasOwn(PROPERTY_PARTIES,t.type)&&PROPERTY_PARTIES[t.type];
 if(!party||t.owner!=='player'||t.tenure!=='buy')return '';
 const done=s.reputation?.lastParties?.[t.type]===s.month,poor=s.money<party.cost;
 return `<section class="owner-reputation"><h3>🥂 ${party.name}</h3><p>손님들을 초대해 휴식과 교류를 즐기세요.</p><p>개최 비용 ${money(party.cost)} · 스트레스 최대 −${party.stress} · 명성 +${party.fame}</p><button class="primary full" data-property-party="${i}" ${done||poor?'disabled':''}>${done?'이번 달 파티 완료':poor?'개최 비용 부족':'파티 열기'}</button><p class="help">골프장·리조트 종류별 월 1회. 여러 곳을 소유해도 같은 종류의 개최 횟수를 공유합니다.</p></section>`;
}
export function validReputation(s){
 const r=s.reputation;if(r===undefined)return true;
 if(r?.lastParties!==undefined&&(!r.lastParties||typeof r.lastParties!=='object'||Array.isArray(r.lastParties)||!Object.entries(r.lastParties).every(([key,n])=>['golf','resort'].includes(key)&&Number.isSafeInteger(n)&&n>=0&&n<=s.month)))return false;
 return !!r&&Number.isSafeInteger(r.donated)&&r.donated>=0&&Number.isSafeInteger(r.lastInterview)&&r.lastInterview>=-1&&r.lastInterview<=s.month&&!!r.assets&&typeof r.assets==='object'&&!Array.isArray(r.assets)&&Object.entries(r.assets).every(([key,n])=>/^(parcel:\d+|vehicle:(sportscar|yacht):[a-z]+|art:[a-z_]+|company:[a-z]+|compound:[a-z]+|mansion)$/.test(key)&&[10,20,50,100,200].includes(n));
}
export function publicActivitiesPanel(s){
 const r=s.reputation,done=r?.lastInterview===s.month;
 return `<section class="owner-reputation public-activities"><h3>나눔과 사회 활동</h3><p>누적 기부 <b>${money(r?.donated||0)}</b> · 보유 현금 ${money(Math.round(s.money))}</p><p>기부금은 지역사회 교육·의료 지원에 사용됩니다. 누적 ₲1,000당 명성 1점이 오르며, 기부한 금액만큼 현금과 순자산이 줄어듭니다.</p><div class="button-row">${DONATION_AMOUNTS.map(n=>`<button data-donate="${n}" ${s.money<n?'disabled':''}>${money(n)} 기부 · +${n/1000}점</button>`).join('')}</div><label class="field-label" for="donation-amount">직접 기부할 금액 (₲)<input id="donation-amount" type="number" min="1000" step="1" value="1000"></label><button data-action="donate-custom" class="primary full">입력한 금액 기부하기</button><h3>언론 인터뷰</h3><p>투자와 나눔에 관한 이야기를 전하세요. 비용 없이 월 1회 · 명성 +${INTERVIEW_FAME}</p><button data-action="media-interview" class="full" ${done?'disabled':''}>${done?'이번 달 인터뷰 완료':'언론 인터뷰 참여하기'}</button></section><p class="help">고액 부동산·저택·차량·요트·미술품 취득: ${[...ASSET_FAME].reverse().map(t=>`${money(t.cost)} 이상 +${t.fame}점`).join(' / ')}. 소기업 인수는 최소 +10점입니다. 같은 자산은 최고 기록을 넘은 명성 차이만 반영하며, 주식 거래에는 적용하지 않습니다. 기존 소장품에는 소급 지급하지 않습니다.</p>`;
}
