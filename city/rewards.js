// Fictional, non-transferable rewards only. This local ledger is not a production
// ad-verification boundary; production must award from a verified server receipt.
export const REWARDS={
 capital:{name:'Game Capital',icon:'◈',label:'₲200',description:'200G of in-game capital for founding, crafting and investing',amount:200},
 materials:{name:'Job Materials',icon:'▦',label:'Materials +2',description:'A pack that starts your next job rush with 8 materials',amount:2},
 ticket:{name:'Extra Run Pass',icon:'⚡',label:'Run +1',description:'One more run after you finish this month base job',amount:1},
};
export function rewardDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function rewardStatus(s,kind,day=rewardDay()){
 if(!Object.hasOwn(REWARDS,kind))return {ok:false,msg:'Choose a reward.'};
 const wallet=s.rewards,claims=wallet?.day===day?wallet.claims:[];
 if(claims.some(c=>c.kind===kind))return {ok:false,msg:'You already claimed this reward today. It is available again tomorrow.'};
 if(kind==='materials'&&(wallet?.materials||0)>=2)return {ok:false,msg:'Use the material pack you are already holding first.'};
 if(kind==='ticket'&&(wallet?.tickets||0)>=1)return {ok:false,msg:'Use the run pass you are already holding first.'};
 return {ok:true,msg:'Available'};
}
export function grantReward(s,receipt,day=rewardDay()){
 if(!receipt||receipt.completed!==true||receipt.source!=='local-demo'||receipt.day!==day||typeof receipt.id!=='string'||receipt.id.length<1||receipt.id.length>100)return {ok:false,msg:'Could not verify a completed reward session.'};
 const status=rewardStatus(s,receipt.kind,day);if(!status.ok)return status;
 if(s.rewards?.claims.some(c=>c.id===receipt.id))return {ok:false,msg:'This reward was already granted.'};
 const previous=s.rewards;s.rewards={day,claims:previous?.day===day?[...previous.claims]:[],materials:previous?.materials||0,tickets:previous?.tickets||0};
 s.rewards.claims.push({id:receipt.id,kind:receipt.kind});
 if(receipt.kind==='capital')s.money+=200;
 if(receipt.kind==='materials')s.rewards.materials+=2;
 if(receipt.kind==='ticket')s.rewards.tickets+=1;
 s.log.unshift(`Test reward · ${REWARDS[receipt.kind].name} ${REWARDS[receipt.kind].label} granted (in-game only)`);s.log=s.log.slice(0,25);
 return {ok:true,msg:REWARDS[receipt.kind].name+' '+REWARDS[receipt.kind].label+' granted'};
}
export function validRewards(s){
 if(s.rewards===undefined)return true;const r=s.rewards;
 if(!r||typeof r.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.day)||!Array.isArray(r.claims)||r.claims.length>3||![0,2].includes(r.materials)||![0,1].includes(r.tickets))return false;
 const ids=new Set(),kinds=new Set();return r.claims.every(c=>{if(!c||typeof c.id!=='string'||!c.id.length||c.id.length>100||!Object.hasOwn(REWARDS,c.kind)||ids.has(c.id)||kinds.has(c.kind))return false;ids.add(c.id);kinds.add(c.kind);return true;});
}
