import {reputationSummary} from './empire.js';
export const VENTURES={
 fusion:{name:'헬리오 퓨전',icon:'☀',sector:'차세대 에너지',chance:.22,multiple:8,story:'소형 핵융합 모듈의 첫 상용 계약에 도전합니다.'},
 bio:{name:'루미나 바이오',icon:'◌',sector:'AI 신약',chance:.30,multiple:6,story:'희귀질환 후보 물질의 임상 데이터 공개를 앞두고 있습니다.'},
 orbit:{name:'오비탈 링크',icon:'◎',sector:'우주 물류',chance:.18,multiple:10,story:'재사용 화물선의 첫 궤도 운송 시험을 준비합니다.'},
 robot:{name:'모션 로보틱스',icon:'⚙',sector:'산업 로봇',chance:.25,multiple:7,story:'자율 작업 로봇의 첫 공장 납품을 준비합니다.'},
 ocean:{name:'블루웨이브',icon:'≈',sector:'해양 기술',chance:.20,multiple:9,story:'해양 정화 설비의 대규모 실증 사업에 도전합니다.'}
};
const COMPANY_NAMES=['노바','아스트라','벨로','네오','에테르','솔라','루멘','테라','펄스','오로라','코스모','루나','알토','프리즘','퀀텀'];
const COMPANY_FIELDS=['에너지','바이오랩','스페이스','로보틱스','오션테크'];
export const MOONSHOT_OUTCOMES=[{multiple:0,chance:.8},{multiple:2,chance:.1},{multiple:5,chance:.05},{multiple:10,chance:.025},{multiple:50,chance:.015},{multiple:100,chance:.008},{multiple:1000,chance:.002}];
const MOONSHOT={name:'인피니티 랩스',icon:'✧',sector:'초고위험 · 문샷',chance:.2,multiple:1000,variable:true,story:'미지의 기술 상용화에 도전합니다. 회수액은 0원부터 투자금의 최대 1,000배까지입니다.'};
// odds < 1 (stress above 65 at signing) shrinks the success window of fixed-multiple ventures.
export const DILIGENCE_HOURS=20;
export const VENTURE_ODDS=[.85,1.15,.9775];
export function ventureMultiple(id,roll,odds=1){const d=ventureCompany(id);if(!d.variable)return roll<Math.min(.95,d.chance*odds)?d.multiple:0;let cumulative=0;for(const outcome of MOONSHOT_OUTCOMES){cumulative+=outcome.chance;if(roll<cumulative)return outcome.multiple;}return 1000;}
export const venturePayout=item=>{const multiple=ventureMultiple(item.ventureId,item.roll,item.odds??1);return multiple>0?item.amount*multiple:item.salvage?Math.round(item.amount*.2):0;};
export function ventureCompany(id){
 if(id==='moonshot')return MOONSHOT;
 if(Object.hasOwn(VENTURES,id))return VENTURES[id];
 const match=/^round-([1-9]\d*)-([0-4])$/.exec(id);if(!match)return null;
 const round=Number(match[1]),slot=Number(match[2]);if(!Number.isSafeInteger(round)||round>Math.floor(Number.MAX_SAFE_INTEGER/3))return null;
 const field=(slot+round)%5,base=slot===4?MOONSHOT:Object.values(VENTURES)[field];
 return{...base,name:`${COMPANY_NAMES[(round*5+slot)%COMPANY_NAMES.length]} ${COMPANY_FIELDS[field]} ${round}`,story:base.story};
}
export function ventureOffering(s){const round=Math.floor(s.month/3);return{round,nextMonth:(round+1)*3,companies:Array.from({length:5},(_,slot)=>{const id=round===0?(slot===4?'moonshot':Object.keys(VENTURES)[slot]):`round-${round}-${slot}`;return{id,...ventureCompany(id)};})};}

const AMOUNTS=[10000,50000,100000];
const hashRoll=(seed,sequence,id)=>{
 let x=(Number(seed)||0)^Math.imul(sequence+1,0x9e3779b1);
 for(const c of id)x=Math.imul(x^c.charCodeAt(0),0x85ebca6b);
 x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;
 return (x>>>0)/4294967296;
};

export function ensureVentures(s){
 if(!s.ventures)s.ventures={active:[],history:[],sequence:0,lastInvestedMonth:-1};
 return s.ventures;
}

export function investVenture(s,id,amount){
 const d=ventureOffering(s).companies.find(c=>c.id===id),v=ensureVentures(s);
 if(!d)return{ok:false,msg:'투자할 회사를 선택하세요.'};
 if(!AMOUNTS.includes(amount))return{ok:false,msg:'투자 금액을 확인하세요.'};
 if(v.active.length>=3)return{ok:false,msg:'진행 중인 벤처 투자는 최대 3건입니다.'};
 if(s.money<amount)return{ok:false,msg:'투자에 필요한 현금이 부족합니다.'};
 const stressed=s.stress>65,diligent=s.concept==='rich-life'&&(s.plan.inspect||0)>=DILIGENCE_HOURS,salvage=s.concept==='rich-life'&&reputationSummary(s).salvage;
 const odds=Math.round((stressed?.85:1)*(diligent?1.15:1)*10000)/10000;
 const investment={id:`venture-${v.sequence+1}`,ventureId:id,name:d.name,amount,startedMonth:s.month,dueMonth:s.month+3,roll:hashRoll(s.seed,v.sequence,id),...(odds!==1?{odds}:{}),...(salvage?{salvage:true}:{})};
 v.sequence++;v.lastInvestedMonth=s.month;v.active.push(investment);s.money-=amount;
 s.log.unshift(`${d.icon} ${d.name} 벤처 투자 · ₲${amount.toLocaleString('ko-KR')} · ${investment.dueMonth}개월 차 결과 공개${stressed?' · 과로로 판단력 저하 (성공률 −15%)':''}${diligent?' · 실사 덕분에 성공률 +15%':''}${salvage?' · 명성 덕분에 실패 시 20% 회수':''}`);s.log=s.log.slice(0,25);
 return{ok:true,msg:`${d.name} 투자 완료 · 3개월 뒤 운명이 결정됩니다.${stressed?' 스트레스가 높아 성공률이 15% 낮습니다.':''}${diligent?' 실사 시간 덕분에 성공률이 15% 높습니다.':''}`};
}

export function advanceVentures(s){
 const v=ensureVentures(s),resolved=[];
 v.active=v.active.filter(item=>{
  if(item.dueMonth>s.month)return true;
  const d=ventureCompany(item.ventureId),multiple=ventureMultiple(item.ventureId,item.roll,item.odds??1),success=multiple>0,payout=venturePayout(item);
  const result={...item,resolvedMonth:s.month,success,payout,multiple};
  if(payout)s.money+=payout;
  v.history.unshift(result);resolved.push(result);
  s.log.unshift(success?`✦ 벤처 대박! ${d.name} ${multiple}배 엑싯 · +₲${payout.toLocaleString('ko-KR')}`:`× 벤처 실패 · ${d.name} 투자금 ₲${item.amount.toLocaleString('ko-KR')} ${payout?`중 ₲${payout.toLocaleString('ko-KR')} 회수`:'전액 손실'}`);
  return false;
 });
 v.history=v.history.slice(0,12);s.log=s.log.slice(0,25);v.latest=resolved;
 return resolved;
}

const validItem=(item,settled=false)=>item&&typeof item.id==='string'&&!!ventureCompany(item.ventureId)&&item.name===ventureCompany(item.ventureId).name&&AMOUNTS.includes(item.amount)&&Number.isInteger(item.startedMonth)&&item.startedMonth>=0&&Number.isInteger(item.dueMonth)&&item.dueMonth===item.startedMonth+3&&Number.isFinite(item.roll)&&item.roll>=0&&item.roll<1&&(item.odds===undefined||VENTURE_ODDS.includes(item.odds))&&(item.salvage===undefined||item.salvage===true)&&(!settled||(Number.isInteger(item.resolvedMonth)&&item.resolvedMonth>=item.dueMonth&&typeof item.success==='boolean'&&item.success===(ventureMultiple(item.ventureId,item.roll,item.odds??1)>0)&&item.payout===venturePayout(item)));
export function validVentures(s){
 const v=s.ventures;if(v===undefined)return true;
 return !!(v&&Array.isArray(v.active)&&v.active.length<=3&&v.active.every(i=>validItem(i))&&Array.isArray(v.history)&&v.history.length<=12&&v.history.every(i=>validItem(i,true))&&Number.isInteger(v.sequence)&&v.sequence>=v.active.length+v.history.length&&Number.isInteger(v.lastInvestedMonth)&&v.lastInvestedMonth>=-1&&v.lastInvestedMonth<=s.month&&(!v.latest||Array.isArray(v.latest)&&v.latest.every(i=>validItem(i,true))));
}

export function ventureSummary(s){const v=ensureVentures(s);return{active:v.active,history:v.history,committed:v.active.reduce((n,i)=>n+i.amount,0),wins:v.history.filter(i=>i.success).length,losses:v.history.filter(i=>!i.success).length};}
