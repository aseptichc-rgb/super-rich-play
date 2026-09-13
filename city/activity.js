// Optional, bounded monthly activity: choose a profitable mix under two resource limits.
// Stored separately from ordinary wages and shop settlement; never paid twice.
export const ORDERS = [
 {name:'동네 단골',icon:'☕',stock:1,energy:1,pay:55,text:'가볍게 시작할 수 있는 작은 주문입니다.'},
 {name:'사무실 단체 주문',icon:'▦',stock:3,energy:1,pay:145,text:'재료는 많이 들지만 빠르게 납품할 수 있습니다.'},
 {name:'까다로운 첫 고객',icon:'✧',stock:1,energy:3,pay:170,text:'시간을 들여 완성하면 보수가 높습니다.'},
 {name:'예약 고객',icon:'◷',stock:2,energy:1,pay:100,text:'정해진 구성을 빠르게 준비해 주세요.'},
 {name:'프리미엄 의뢰',icon:'♛',stock:2,energy:2,pay:150,text:'재료와 집중력이 모두 필요한 주문입니다.'},
 {name:'이웃의 작은 부탁',icon:'♡',stock:1,energy:1,pay:70,text:'자원이 조금 남았다면 좋은 마무리가 됩니다.'},
];
export function ordersFor(s){const offset=(s.seed+s.month)%ORDERS.length;return Array.from({length:5},(_,i)=>ORDERS[(offset+i)%ORDERS.length]);}
export function startShift(s){
 if(s.shift)return {ok:true,msg:'진행 중인 현장으로 돌아갑니다.'};
 const extra=s.shiftMonth===s.month;
 if(extra&&!(s.rewards?.tickets>0))return {ok:false,msg:'이번 달 현장을 마쳤습니다. 다음 달 새로운 의뢰가 도착합니다.'};
 const bonus=s.rewards?.materials||0;
 if(extra)s.rewards.tickets--;
 if(bonus)s.rewards.materials=0;
 s.shift={round:0,stock:6+bonus,stockLimit:6+bonus,extra,energy:5,earned:0,served:0,results:[]};return {ok:true,msg:`재료 ${6+bonus}개와 집중력 5칸으로 다섯 의뢰를 골라 처리하세요.`};
}
export function resolveOrder(s,choice){
 const run=s.shift;if(!run||!['serve','craft','skip'].includes(choice))return {ok:false,msg:'진행 중인 의뢰가 없습니다.'};
 const order=ordersFor(s)[run.round];if(!order)return {ok:false,msg:'모든 의뢰를 마쳤습니다.'};
 const craft=choice==='craft',stock=order.stock-(craft?1:0),energy=order.energy+(craft?1:0);
 if(choice!=='skip'){
  if(craft&&s.skill<15)return {ok:false,msg:'맞춤 제작은 전문성 15부터 가능합니다.'};
  if(run.stock<stock||run.energy<energy)return {ok:false,msg:'자원이 부족합니다. 다음 의뢰를 선택하세요.'};
  const pay=order.pay+(craft?25:0);run.stock-=stock;run.energy-=energy;run.earned+=pay;run.served++;run.results.push({name:order.name,pay});
 }else run.results.push({name:order.name,pay:0});
 run.round++;
 if(run.round<5)return {ok:true,msg:choice==='skip'?'다음 기회를 위해 자원을 남겼습니다.':`납품 완료! 정산 예정 +₲${run.results.at(-1).pay}`,complete:false};
 const reward=run.earned,served=run.served;s.money+=reward;s.stress=Math.min(100,s.stress+served);s.shiftMonth=s.month;s.shift=null;
 s.log.unshift(`현장 러시 완료 · ${served}/5건 납품 · +${reward}G (재료비 제외 순보수)`);s.log=s.log.slice(0,25);
 return {ok:true,msg:`${served}건 납품 완료! +₲${reward}`,complete:true,reward,served};
}
export function validShift(s){
 if(s.shiftMonth!==undefined&&(!Number.isInteger(s.shiftMonth)||s.shiftMonth<0||s.shiftMonth>s.month))return false;
 if(!s.shift)return true;
 const r=s.shift;if(r.stockLimit!==undefined&&![6,8].includes(r.stockLimit))return false;if(r.extra!==undefined&&typeof r.extra!=='boolean')return false;if((s.shiftMonth===s.month&&!r.extra)||!Number.isInteger(r.round)||r.round<0||r.round>=5||!Number.isInteger(r.stock)||r.stock<0||r.stock>(r.stockLimit||6)||!Number.isInteger(r.energy)||r.energy<0||r.energy>5||!Number.isInteger(r.earned)||r.earned<0||r.earned>1000||!Number.isInteger(r.served)||r.served<0||r.served>r.round||!Array.isArray(r.results)||r.results.length!==r.round)return false;
 if(!r.results.every(x=>x&&typeof x.name==='string'&&Number.isInteger(x.pay)&&x.pay>=0&&x.pay<=200))return false;
 return r.results.reduce((n,x)=>n+x.pay,0)===r.earned;
}
