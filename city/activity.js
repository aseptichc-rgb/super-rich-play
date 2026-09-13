// Optional, bounded monthly activity: choose a profitable mix under two resource limits.
// Stored separately from ordinary wages and shop settlement; never paid twice.
export const ORDERS = [
 {name:'Neighborhood regular',icon:'☕',stock:1,energy:1,pay:55,text:'A small order to start light with.'},
 {name:'Office group order',icon:'▦',stock:3,energy:1,pay:145,text:'Heavy on materials, but quick to deliver.'},
 {name:'Picky first customer',icon:'✧',stock:1,energy:3,pay:170,text:'Takes time to finish, but the pay is high.'},
 {name:'Booked customer',icon:'◷',stock:2,energy:1,pay:100,text:'Prepare the set order quickly.'},
 {name:'Premium commission',icon:'♛',stock:2,energy:2,pay:150,text:'An order that needs both materials and focus.'},
 {name:'A small favor for a neighbor',icon:'♡',stock:1,energy:1,pay:70,text:'A good way to finish if you have resources left.'},
];
export function ordersFor(s){const offset=(s.seed+s.month)%ORDERS.length;return Array.from({length:5},(_,i)=>ORDERS[(offset+i)%ORDERS.length]);}
export function startShift(s){
 if(s.shift)return {ok:true,msg:'Back to the job already in progress.'};
 const extra=s.shiftMonth===s.month;
 if(extra&&!(s.rewards?.tickets>0))return {ok:false,msg:'This month job is finished. New commissions arrive next month.'};
 const bonus=s.rewards?.materials||0;
 if(extra)s.rewards.tickets--;
 if(bonus)s.rewards.materials=0;
 s.shift={round:0,stock:6+bonus,stockLimit:6+bonus,extra,energy:5,earned:0,served:0,results:[]};return {ok:true,msg:`Handle five commissions with ${6+bonus} materials and 5 focus.`};
}
export function resolveOrder(s,choice){
 const run=s.shift;if(!run||!['serve','craft','skip'].includes(choice))return {ok:false,msg:'No commission in progress.'};
 const order=ordersFor(s)[run.round];if(!order)return {ok:false,msg:'All commissions are finished.'};
 const craft=choice==='craft',stock=order.stock-(craft?1:0),energy=order.energy+(craft?1:0);
 if(choice!=='skip'){
  if(craft&&s.skill<15)return {ok:false,msg:'Custom crafting needs expertise 15.'};
  if(run.stock<stock||run.energy<energy)return {ok:false,msg:'Not enough resources. Pick the next commission.'};
  const pay=order.pay+(craft?25:0);run.stock-=stock;run.energy-=energy;run.earned+=pay;run.served++;run.results.push({name:order.name,pay});
 }else run.results.push({name:order.name,pay:0});
 run.round++;
 if(run.round<5)return {ok:true,msg:choice==='skip'?'You saved resources for the next chance.':`Delivered! Payout +₲${run.results.at(-1).pay}`,complete:false};
 const reward=run.earned,served=run.served;s.money+=reward;s.stress=Math.min(100,s.stress+served);s.shiftMonth=s.month;s.shift=null;
 s.log.unshift(`Job rush complete · ${served}/5 delivered · +${reward}G (net of materials)`);s.log=s.log.slice(0,25);
 return {ok:true,msg:`${served} delivered! +₲${reward}`,complete:true,reward,served};
}
export function validShift(s){
 if(s.shiftMonth!==undefined&&(!Number.isInteger(s.shiftMonth)||s.shiftMonth<0||s.shiftMonth>s.month))return false;
 if(!s.shift)return true;
 const r=s.shift;if(r.stockLimit!==undefined&&![6,8].includes(r.stockLimit))return false;if(r.extra!==undefined&&typeof r.extra!=='boolean')return false;if((s.shiftMonth===s.month&&!r.extra)||!Number.isInteger(r.round)||r.round<0||r.round>=5||!Number.isInteger(r.stock)||r.stock<0||r.stock>(r.stockLimit||6)||!Number.isInteger(r.energy)||r.energy<0||r.energy>5||!Number.isInteger(r.earned)||r.earned<0||r.earned>1000||!Number.isInteger(r.served)||r.served<0||r.served>r.round||!Array.isArray(r.results)||r.results.length!==r.round)return false;
 if(!r.results.every(x=>x&&typeof x.name==='string'&&Number.isInteger(x.pay)&&x.pay>=0&&x.pay<=200))return false;
 return r.results.reduce((n,x)=>n+x.pay,0)===r.earned;
}
