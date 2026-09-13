// Fictional, non-transferable rewards only. This local ledger is not a production
// ad-verification boundary; production must award from a verified server receipt.
export const REWARDS={
 capital:{name:'게임 자본',icon:'◈',label:'₲200',description:'게임 안에서 창업·제작·투자에 쓰는 자본 200G',amount:200},
 materials:{name:'현장 재료',icon:'▦',label:'재료 +2',description:'다음 현장 러시를 재료 8개로 시작하는 꾸러미',amount:2},
 ticket:{name:'추가 도전권',icon:'⚡',label:'도전 +1회',description:'이번 달 기본 현장을 마친 뒤 한 번 더 도전',amount:1},
};
export function rewardDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function rewardStatus(s,kind,day=rewardDay()){
 if(!Object.hasOwn(REWARDS,kind))return {ok:false,msg:'보상을 선택하세요.'};
 const wallet=s.rewards,claims=wallet?.day===day?wallet.claims:[];
 if(claims.some(c=>c.kind===kind))return {ok:false,msg:'오늘 이 보상을 받았습니다. 내일 다시 이용할 수 있습니다.'};
 if(kind==='materials'&&(wallet?.materials||0)>=2)return {ok:false,msg:'보관 중인 재료 꾸러미를 먼저 사용하세요.'};
 if(kind==='ticket'&&(wallet?.tickets||0)>=1)return {ok:false,msg:'보관 중인 도전권을 먼저 사용하세요.'};
 return {ok:true,msg:'선택 가능'};
}
export function grantReward(s,receipt,day=rewardDay()){
 if(!receipt||receipt.completed!==true||receipt.source!=='local-demo'||receipt.day!==day||typeof receipt.id!=='string'||receipt.id.length<1||receipt.id.length>100)return {ok:false,msg:'완료된 보상 체험을 확인하지 못했습니다.'};
 const status=rewardStatus(s,receipt.kind,day);if(!status.ok)return status;
 if(s.rewards?.claims.some(c=>c.id===receipt.id))return {ok:false,msg:'이미 지급한 보상입니다.'};
 const previous=s.rewards;s.rewards={day,claims:previous?.day===day?[...previous.claims]:[],materials:previous?.materials||0,tickets:previous?.tickets||0};
 s.rewards.claims.push({id:receipt.id,kind:receipt.kind});
 if(receipt.kind==='capital')s.money+=200;
 if(receipt.kind==='materials')s.rewards.materials+=2;
 if(receipt.kind==='ticket')s.rewards.tickets+=1;
 s.log.unshift(`테스트 보상 · ${REWARDS[receipt.kind].name} ${REWARDS[receipt.kind].label} 지급 (게임 전용)`);s.log=s.log.slice(0,25);
 return {ok:true,msg:REWARDS[receipt.kind].name+' '+REWARDS[receipt.kind].label+' 지급 완료'};
}
export function validRewards(s){
 if(s.rewards===undefined)return true;const r=s.rewards;
 if(!r||typeof r.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.day)||!Array.isArray(r.claims)||r.claims.length>3||![0,2].includes(r.materials)||![0,1].includes(r.tickets))return false;
 const ids=new Set(),kinds=new Set();return r.claims.every(c=>{if(!c||typeof c.id!=='string'||!c.id.length||c.id.length>100||!Object.hasOwn(REWARDS,c.kind)||ids.has(c.id)||kinds.has(c.kind))return false;ids.add(c.id);kinds.add(c.kind);return true;});
}
