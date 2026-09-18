import {L} from './i18n.js';
import {marketFactor,economyCycle} from './economy.js';
import {STOCKS,ADDED_STOCKS,IPO_POOL,stockInfo} from './stocks.js';
import {ensureBasis,recordTrade} from './investment.js';
import {validBroker,settleBroker} from './broker.js';
// The stock market: ten companies and an office REIT at the start, one IPO a year, distress and delisting when a
// price collapses, and a market-cap-weighted index that can be bought as one basket.
const roll=(seed,n)=>{let x=(seed^Math.imul(n,0x9e3779b1)^0x5bd1e995)>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return((x^(x>>>16))>>>0)/4294967296;};
export const FEE=.005,DISTRESS_MONTHS=3,DRAWDOWN=.3,RECOVERY=.4;
export function createMarket(month=0){return{listed:STOCKS.map(k=>k.id),nextIpo:month+12,ipos:0,listedAt:{},peak:Object.fromEntries(STOCKS.map(k=>[k.id,k.base])),distress:{},delisted:[],index:1000,indexHistory:[],added:ADDED_STOCKS.map(k=>k.id)};}
// Older saves know only the first three companies; the other seven list at their base price.
// Stocks added after launch list once, so a later delisting is never undone.
export function ensureMarket(s){
 if(!s.holdings||!s.prices)return null;
 s.market??=createMarket(s.month);
 for(const k of STOCKS){s.holdings[k.id]??=0;s.prices[k.id]??=k.base;if(s.costBasis)s.costBasis[k.id]??=0;}
 const m=s.market;m.added??=[];
 for(const k of ADDED_STOCKS)if(!m.added.includes(k.id)){if(!m.listed.includes(k.id))m.listed.push(k.id);m.added.push(k.id);}
 for(const id of m.listed)m.peak[id]??=s.prices[id];
 return s.market;
}
export const listedStocks=s=>ensureMarket(s).listed.map(stockInfo);
// A new listing's fate is hidden but fixed by the seed: half boom, half bust, 12–36 months after listing.
export function ipoFate(s,id){const k=stockInfo(id),at=s.market?.listedAt?.[id];if(!k?.ipo||at===undefined)return null;return{boom:roll(s.seed,k.key*11+3)<.5,at:at+12+Math.floor(roll(s.seed,k.key*11+4)*25),multiple:2+Math.round(roll(s.seed,k.key*11+5)*20)/10};}
// How a stock trades this month: listings drift toward their fate, then a jackpot turns into a growth stock.
export function stockProfile(s,id){
 const k=stockInfo(id),f=ipoFate(s,id);
 if(!f)return k;
 if(f.boom&&s.month>f.at)return{...k,type:'growth',annualRate:.19,risk:.12,beta:1.4};
 return{...k,annualRate:f.boom?.5:s.month>=f.at?-.6:-.3};
}
export function trade(s,id,qty){if(!ensureMarket(s)?.listed.includes(id)||!Number.isInteger(qty)||!qty)return{ok:false,msg:L('Check the quantity.')};if(qty>0&&s.market.shorts?.[id])return{ok:false,msg:L('Cover the short position first.')};const value=s.prices[id]*qty,fee=Math.abs(value)*FEE;if(qty>0&&s.money<value+fee)return{ok:false,msg:L('Not enough cash to buy.')};if(s.holdings[id]+qty<0)return{ok:false,msg:L('Not enough shares.')};recordTrade(s,id,qty,value,fee);s.money-=value+fee;s.holdings[id]+=qty;return{ok:true,msg:L`${qty>0?L('Buy','stock'):L('Sell')} complete · 0.5% fee`};}
export const marketCap=(s,id)=>s.prices[id]*stockInfo(id).shares;
export function indexWeights(s){const m=ensureMarket(s),total=m.listed.reduce((n,id)=>n+marketCap(s,id),0);return m.listed.map(id=>({id,cap:marketCap(s,id),weight:marketCap(s,id)/total})).sort((a,b)=>b.cap-a.cap);}
export function indexOrder(s,amount){const orders=indexWeights(s).filter(w=>!s.market.shorts?.[w.id]).map(w=>({id:w.id,qty:Math.floor(amount*w.weight/(1+FEE)/s.prices[w.id])})).filter(o=>o.qty>0);return{orders,cost:orders.reduce((n,o)=>n+s.prices[o.id]*o.qty*(1+FEE),0)};}
// Index fund: one order spread across every listed company in proportion to market cap.
export function investIndex(s,amount){
 if(!Number.isFinite(amount)||amount<1000)return{ok:false,msg:L('Enter at least ₲1,000 for the index basket.')};
 const {orders,cost}=indexOrder(s,amount);
 if(!orders.length)return{ok:false,msg:L('The amount is too small to buy even one weighted share.')};
 if(s.money<cost)return{ok:false,msg:L('Not enough cash for the index basket.')};
 for(const o of orders)trade(s,o.id,o.qty);
 s.log.unshift(L`↗ Index basket · ${orders.length} companies by market cap · ₲${Math.round(cost).toLocaleString('en-US')} (fees included)`);s.log=s.log.slice(0,25);
 return{ok:true,msg:L`Index basket bought · ${orders.length} companies weighted by market cap`,orders,cost};
}
// A decision event's one-day plunge cuts every price at once. The index moves with its basket, and the latest
// chart point shows the new level instead of waiting for month end.
export function shockPrices(s,factor){
 const m=ensureMarket(s),cap=()=>m.listed.reduce((n,id)=>n+marketCap(s,id),0),before=cap();
 for(const k of Object.keys(s.prices))s.prices[k]=Math.max(5,Math.round(s.prices[k]*factor*100)/100);
 m.index=Math.round(m.index*cap()/before*100)/100;if(m.indexHistory.length)m.indexHistory[m.indexHistory.length-1]=m.index;
}
function delist(s,id){
 const m=s.market,k=stockInfo(id),qty=s.holdings[id];ensureBasis(s);const lost=s.costBasis[id]||0;s.realizedGains-=lost;
 const short=m.shorts?.[id];
 if(short){s.money+=short.collateral;s.realizedGains+=short.entry*short.qty;delete m.shorts[id];s.log.unshift(L`✔ ${k.name} delisted while short · ₲${Math.round(short.entry*short.qty).toLocaleString('en-US')} profit`);}
 if(m.plans)m.plans=m.plans.filter(p=>p.target!==id);
 m.listed=m.listed.filter(x=>x!==id);delete s.holdings[id];delete s.prices[id];delete s.costBasis[id];delete m.peak[id];delete m.distress[id];delete m.listedAt[id];
 m.delisted.push({id,name:k.name,month:s.month,shares:qty,lost:Math.round(lost)});m.delisted=m.delisted.slice(-12);
 s.log.unshift(qty?L`✖ ${k.name} delisted · ${qty.toLocaleString('en-US')} shares written off (₲${Math.round(lost).toLocaleString('en-US')} lost)`:L`✖ ${k.name} delisted`);
}
// One month of prices: drift by character, a seasonal swing, seeded noise, the business cycle for
// cyclicals and the crash scaled by beta. Then fates, distress checks, the index and the yearly IPO.
export function advanceStocks(s,crashed,previousMarket,dividends=0){
 const m=ensureMarket(s),before=Object.fromEntries(m.listed.map(id=>[id,s.prices[id]]));
 for(const id of m.listed){
  const p=stockProfile(s,id),phase=s.seed+p.base,cycle=x=>Math.sin(x*Math.PI/6+phase);
  let factor=Math.pow(1+p.annualRate,1/12)*Math.exp(p.risk*(cycle(s.month)-cycle(s.month-1)))*Math.exp(p.risk*.8*(roll(s.seed,s.month*64+p.key)*2-1));
  if(p.type==='cyclical')factor*=Math.pow(economyCycle(s)/economyCycle(s,s.month-1),1.5);
  if(p.type==='reit')factor*=economyCycle(s)/economyCycle(s,s.month-1);
  const crash=Math.pow(marketFactor(s)/previousMarket,p.beta);
  s.prices[id]=Math.max(1,Math.round(s.prices[id]*(crashed?1:factor)*crash*100)/100);
 }
 if(crashed){const worst=[...m.listed].sort((a,b)=>s.prices[a]/before[a]-s.prices[b]/before[b])[0];s.log.unshift(L`📉 Stocks plunge · ${stockInfo(worst).name} −${Math.round((1-s.prices[worst]/before[worst])*100)}% · defensive and dividend names hold up better`);}
 for(const id of [...m.listed]){
  const f=ipoFate(s,id),k=stockInfo(id);
  if(f&&s.month===f.at){
   if(f.boom){s.prices[id]=Math.round(s.prices[id]*f.multiple*100)/100;s.log.unshift(L`🚀 ${k.name} breakthrough · Share price ×${f.multiple} · Now trades as a growth stock`);}
   else{s.prices[id]=Math.max(1,Math.round(s.prices[id]*.35*100)/100);s.log.unshift(L`💥 ${k.name} accounting scandal · Share price −65%`);}
  }
 }
 const broker=settleBroker(s,dividends);
 const capNow=m.listed.reduce((n,id)=>n+marketCap(s,id),0),capBefore=m.listed.reduce((n,id)=>n+before[id]*stockInfo(id).shares,0);
 m.index=Math.round(m.index*capNow/capBefore*100)/100;m.indexHistory.push(m.index);m.indexHistory=m.indexHistory.slice(-36);
 for(const id of [...m.listed]){
  const price=s.prices[id],peak=m.peak[id]=Math.max(m.peak[id]||price,price),k=stockInfo(id);
  if(m.distress[id]!==undefined){
   if(price>=peak*RECOVERY){delete m.distress[id];s.log.unshift(L`${k.name} leaves administration · Price recovered`);}
   else if(--m.distress[id]<=0)delist(s,id);
  }else if(price<peak*DRAWDOWN){m.distress[id]=DISTRESS_MONTHS;s.log.unshift(L`⚠ ${k.name} under administration · Delisted in ${DISTRESS_MONTHS} months unless the price climbs back above ₲${(peak*RECOVERY).toFixed(2)}`);}
 }
 if(m.nextIpo!==null&&s.month>=m.nextIpo){
  const k=IPO_POOL[m.ipos];
  if(k){m.listed.push(k.id);s.prices[k.id]=k.base;s.holdings[k.id]=0;ensureBasis(s);s.costBasis[k.id]=0;m.listedAt[k.id]=s.month;m.peak[k.id]=k.base;m.ipos++;s.log.unshift(L`✦ IPO · ${k.name} (${k.sector}) lists at ₲${k.base} · Jackpot or delisting within a few years`);}
  m.nextIpo=m.ipos<IPO_POOL.length?s.month+12:null;
 }
 s.log=s.log.slice(0,25);return broker;
}
export function validMarket(s){
 const m=s?.market;if(!m||!s.holdings||!s.prices)return false;
 if(!Array.isArray(m.listed)||!m.listed.every(id=>stockInfo(id)&&Number.isInteger(s.holdings[id])&&s.holdings[id]>=0&&Number.isFinite(s.prices[id])&&s.prices[id]>0)||new Set(m.listed).size!==m.listed.length)return false;
 if(!(m.nextIpo===null||(Number.isInteger(m.nextIpo)&&m.nextIpo>=0))||!Number.isInteger(m.ipos)||m.ipos<0||m.ipos>IPO_POOL.length)return false;
 if(!['listedAt','peak','distress'].every(k=>m[k]&&typeof m[k]==='object'&&!Array.isArray(m[k]))||!Object.entries(m.listedAt).every(([id,v])=>m.listed.includes(id)&&stockInfo(id)?.ipo&&Number.isInteger(v)&&v>=0&&v<=s.month))return false;
 if(!Object.entries(m.peak).every(([id,v])=>m.listed.includes(id)&&Number.isFinite(v)&&v>0)||!Object.entries(m.distress).every(([id,v])=>m.listed.includes(id)&&Number.isInteger(v)&&v>=1&&v<=DISTRESS_MONTHS))return false;
 if(!Array.isArray(m.delisted)||m.delisted.length>12||!m.delisted.every(d=>stockInfo(d.id)&&!m.listed.includes(d.id)&&typeof d.name==='string'&&Number.isInteger(d.month)&&d.month>=0&&Number.isInteger(d.shares)&&d.shares>=0&&Number.isFinite(d.lost)))return false;
 if(!Number.isFinite(m.index)||m.index<=0||!Array.isArray(m.indexHistory)||m.indexHistory.length>36||!m.indexHistory.every(v=>Number.isFinite(v)&&v>0))return false;
 if(m.added!==undefined&&!(Array.isArray(m.added)&&new Set(m.added).size===m.added.length&&m.added.every(id=>ADDED_STOCKS.some(k=>k.id===id))))return false;
 if(!validBroker(s))return false;
 return true;
}
