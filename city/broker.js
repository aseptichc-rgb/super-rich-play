import {L} from './i18n.js';
import {ensureMarket,trade,investIndex,FEE} from './market.js';
import {stockInfo,dividendPerShare} from './stocks.js';
import {ensureBasis} from './investment.js';
// Broker services on top of the market: margin loans, short positions, monthly savings plans and
// dividend reinvestment, with one settlement pass a month. Prices themselves live in market.js.
export const MARGIN_RATE=.015,MARGIN_LIMIT=.5,MARGIN_CALL=.3,MARGIN_TARGET=.5;
export const SHORT_FEE=.005,SHORT_FEE_RISKY=.01,SHORT_COLLATERAL=2,SHORT_STOP=.7;
export const PLAN_MIN=1000;
export function ensureBroker(s){const m=ensureMarket(s);if(!m)return null;m.margin??=0;m.shorts??={};m.plans??=[];m.reinvest??=false;return m;}
export const longValue=s=>ensureBroker(s).listed.reduce((n,id)=>n+(s.holdings[id]||0)*s.prices[id],0);
// What every short position would hand back if covered now: collateral minus the cost to buy back.
export const shortValue=s=>Object.entries(ensureBroker(s).shorts).reduce((n,[id,p])=>n+p.collateral-s.prices[id]*p.qty,0);
export function marginEquity(s){const m=ensureBroker(s),value=longValue(s),debt=m.margin,equity=value-debt;return{value,debt,equity,ratio:value>0?equity/value:debt>0?0:1};}
export function buyOnMargin(s,id,qty){
 const m=ensureBroker(s);if(!m.listed.includes(id)||!Number.isInteger(qty)||qty<1)return{ok:false,msg:L('Check the quantity.')};
 if(m.shorts[id])return{ok:false,msg:L('Cover the short position first.')};
 const cost=s.prices[id]*qty*(1+FEE),cash=Math.max(0,Math.min(s.money,cost)),borrow=Math.ceil((cost-cash)*100)/100;
 if(borrow<=0)return trade(s,id,qty);
 if(m.margin+borrow>(longValue(s)+s.prices[id]*qty)*MARGIN_LIMIT)return{ok:false,msg:L`Margin limit · Loans can cover at most ${Math.round(MARGIN_LIMIT*100)}% of your stock value.`};
 s.money+=borrow;m.margin+=borrow;const r=trade(s,id,qty);
 if(!r.ok){s.money-=borrow;m.margin-=borrow;return r;}
 return{ok:true,msg:L`Bought on margin · ₲${Math.round(borrow).toLocaleString('en-US')} borrowed at ${(MARGIN_RATE*100).toFixed(1)}%/mo`,borrowed:borrow};
}
export function repayMargin(s,amount){
 const m=ensureBroker(s),pay=Math.min(amount,m.margin,s.money);
 if(!Number.isFinite(amount)||!(pay>0))return{ok:false,msg:L('Nothing to repay, or not enough cash.')};
 s.money-=pay;m.margin=m.margin-pay<.005?0:m.margin-pay;return{ok:true,msg:L`Margin repaid · ₲${Math.round(pay).toLocaleString('en-US')}`};
}
export function openShort(s,id,qty){
 const m=ensureBroker(s);if(!m.listed.includes(id)||!Number.isInteger(qty)||qty<1)return{ok:false,msg:L('Check the quantity.')};
 if(s.holdings[id]>0)return{ok:false,msg:L('Sell your shares before shorting this stock.')};
 const price=s.prices[id],proceeds=price*qty,extra=proceeds*(SHORT_COLLATERAL-1),fee=proceeds*FEE;
 if(s.money<extra+fee)return{ok:false,msg:L`Not enough cash · Shorting needs ₲${Math.round(extra+fee).toLocaleString('en-US')} as collateral and fee.`};
 ensureBasis(s);s.money-=extra+fee;s.realizedGains-=fee;
 const p=m.shorts[id];
 if(p){p.entry=(p.entry*p.qty+price*qty)/(p.qty+qty);p.qty+=qty;p.collateral+=proceeds+extra;}
 else m.shorts[id]={qty,entry:price,collateral:proceeds+extra};
 return{ok:true,msg:L`Short sold ${qty} sh · Borrow fee ${(SHORT_FEE*100).toFixed(1)}%/mo · Dividends are owed while short`};
}
export function closeShort(s,id,qty){
 const m=ensureBroker(s),p=m.shorts[id];if(!p)return{ok:false,msg:L('No short position.')};
 qty??=p.qty;if(!Number.isInteger(qty)||qty<1||qty>p.qty)return{ok:false,msg:L('Check the quantity.')};
 const price=s.prices[id]||0,cover=price*qty,fee=cover*FEE,share=qty/p.qty,collateral=p.collateral*share,pnl=(p.entry-price)*qty-fee;
 ensureBasis(s);s.money+=collateral-cover-fee;s.realizedGains+=pnl;
 if(qty===p.qty)delete m.shorts[id];else{p.qty-=qty;p.collateral-=collateral;}
 return{ok:true,msg:L`Short covered · ${pnl>=0?'+':'−'}₲${Math.round(Math.abs(pnl)).toLocaleString('en-US')}`,pnl};
}
// Loss on a short as a share of the extra cash the player posted (half the collateral).
export function shortLossRatio(s,id){const p=ensureBroker(s).shorts[id];if(!p)return 0;return Math.max(0,(s.prices[id]-p.entry)*p.qty)/(p.collateral/SHORT_COLLATERAL);}
export function addPlan(s,target,amount){
 const m=ensureBroker(s);if(target!=='index'&&!m.listed.includes(target))return{ok:false,msg:L('Pick a listed company or the index.')};
 if(!Number.isInteger(amount)||amount<PLAN_MIN)return{ok:false,msg:L`Enter at least ₲${PLAN_MIN.toLocaleString('en-US')} a month.`};
 const p=m.plans.find(p=>p.target===target);if(p)p.amount=amount;else m.plans.push({target,amount});
 return{ok:true,msg:L`Savings plan set · ₲${amount.toLocaleString('en-US')} every month`};
}
export function removePlan(s,target){const m=ensureBroker(s),n=m.plans.length;m.plans=m.plans.filter(p=>p.target!==target);return n===m.plans.length?{ok:false,msg:L('No such plan.')}:{ok:true,msg:L('Savings plan stopped')};}
const fmt=n=>Math.round(n).toLocaleString('en-US');
// One settlement a month, after prices move and before the distress check: plans, reinvestment,
// margin calls and short fees. Never throws; broken positions are dropped.
export function settleBroker(s,dividends=0){
 const m=ensureBroker(s),r={invested:0,skipped:[],reinvested:0,marginCall:null,shortCost:0,squeezes:[]};
 m.plans=m.plans.filter(p=>p.target==='index'||m.listed.includes(p.target));
 for(const p of m.plans){
  const name=p.target==='index'?L('Index fund'):stockInfo(p.target).name;
  if(p.target==='index'){const before=s.money;if(investIndex(s,p.amount).ok)r.invested+=before-s.money;else r.skipped.push(name);continue;}
  const price=s.prices[p.target],qty=Math.floor(p.amount/(price*(1+FEE)));
  if(qty<1||s.money<price*qty*(1+FEE)){r.skipped.push(name);continue;}
  const before=s.money;if(trade(s,p.target,qty).ok)r.invested+=before-s.money;else r.skipped.push(name);
 }
 if(r.invested>0||r.skipped.length)s.log.unshift(L`↻ Savings plan · ₲${fmt(r.invested)} invested${r.skipped.length?L` · skipped (cash short): ${r.skipped.join(', ')}`:''}`);
 if(m.reinvest&&dividends>=PLAN_MIN){const before=s.money;if(investIndex(s,Math.floor(dividends)).ok)r.reinvested=before-s.money;}
 const eq=marginEquity(s);
 if(eq.debt>0&&eq.value>0&&eq.ratio<MARGIN_CALL){
  const sold=[];let repaid=0;
  for(const id of [...m.listed].sort((a,b)=>(s.holdings[b]||0)*s.prices[b]-(s.holdings[a]||0)*s.prices[a])){
   if(marginEquity(s).ratio>=MARGIN_TARGET||m.margin<=0)break;
   const qty=s.holdings[id]||0;if(!qty)continue;
   const before=s.money;if(!trade(s,id,-qty).ok)continue;const got=s.money-before,pay=Math.min(got,m.margin);
   s.money-=pay;m.margin-=pay;repaid+=pay;sold.push({name:stockInfo(id).name,qty,value:got});
  }
  if(m.margin<.005)m.margin=0;
  if(sold.length){r.marginCall={sold,repaid};s.log.unshift(L`⚠ Margin call · ${sold.map(x=>x.name).join(', ')} sold · ₲${fmt(repaid)} repaid`);}
 }
 for(const [id,p] of Object.entries(m.shorts)){
  if(!m.listed.includes(id)||!(p.qty>=1)||!(p.collateral>0)){delete m.shorts[id];continue;}
  const price=s.prices[id],risky=m.distress[id]!==undefined||!!stockInfo(id).ipo,fee=price*p.qty*(risky?SHORT_FEE_RISKY:SHORT_FEE),owed=dividendPerShare(s,id)*p.qty;
  s.money-=fee+owed;r.shortCost+=fee+owed;
  if(shortLossRatio(s,id)>SHORT_STOP){const loss=(price-p.entry)*p.qty,name=stockInfo(id).name;closeShort(s,id);r.squeezes.push({name,loss});s.log.unshift(L`⚠ Short squeeze · ${name} covered · −₲${fmt(loss)}`);}
 }
 if(r.shortCost>0)s.log.unshift(L`Short positions · ₲${fmt(r.shortCost)} borrow fees and dividends paid`);
 s.log=s.log.slice(0,25);return r;
}
export function validBroker(s){
 const m=s?.market;if(!m)return false;
 if(m.margin!==undefined&&!(Number.isFinite(m.margin)&&m.margin>=0))return false;
 if(m.reinvest!==undefined&&typeof m.reinvest!=='boolean')return false;
 if(m.shorts!==undefined&&!(m.shorts&&typeof m.shorts==='object'&&!Array.isArray(m.shorts)&&Object.entries(m.shorts).every(([id,p])=>m.listed.includes(id)&&Number.isInteger(p.qty)&&p.qty>=1&&Number.isFinite(p.entry)&&p.entry>0&&Number.isFinite(p.collateral)&&p.collateral>0)))return false;
 if(m.plans!==undefined&&!(Array.isArray(m.plans)&&m.plans.every(p=>p&&(p.target==='index'||m.listed.includes(p.target))&&Number.isInteger(p.amount)&&p.amount>=PLAN_MIN)&&new Set(m.plans.map(p=>p.target)).size===m.plans.length))return false;
 return true;
}
