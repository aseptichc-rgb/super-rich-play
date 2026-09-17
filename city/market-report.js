import {stockProfile} from './market.js';
import {investmentReport} from './investment.js';
import {ensureBroker,marginEquity,shortLossRatio,MARGIN_CALL} from './broker.js';
// A read-only review of the stock portfolio: mix by character, beta, crash exposure and leverage.
export const CRASH_TEST=.3;
export function portfolioReview(s){
 const m=ensureBroker(s),basis=investmentReport(s).basis;
 const rows=m.listed.map(id=>{const p=stockProfile(s,id),qty=s.holdings[id]||0;return{id,name:p.name,type:p.type,beta:p.beta,yield:p.yield,qty,value:qty*s.prices[id],basis:basis[id]||0};}).filter(r=>r.qty>0);
 const value=rows.reduce((n,r)=>n+r.value,0),types={};
 for(const r of rows)types[r.type]=(types[r.type]||0)+r.value;
 const byType=Object.entries(types).map(([type,v])=>({type,value:v,weight:v/value})).sort((a,b)=>b.value-a.value);
 const beta=value?rows.reduce((n,r)=>n+r.value*r.beta,0)/value:0;
 const crashLoss=rows.reduce((n,r)=>n+r.value*(1-Math.pow(1-CRASH_TEST,r.beta)),0);
 const annualDividend=rows.reduce((n,r)=>n+r.value*r.yield,0);
 const ranking=rows.filter(r=>r.basis>0).map(r=>({id:r.id,name:r.name,return:r.value/r.basis-1})).sort((a,b)=>b.return-a.return);
 const eq=marginEquity(s),margin={debt:eq.debt,equityRatio:eq.ratio,callAt:eq.debt>0&&eq.value>0?Math.max(0,(1-eq.debt/((1-MARGIN_CALL)*eq.value))*100):null};
 const shorts=Object.entries(m.shorts).map(([id,p])=>({id,name:stockProfile(s,id).name,qty:p.qty,pnl:(p.entry-s.prices[id])*p.qty,lossRatio:shortLossRatio(s,id)}));
 const worstShort=shorts.reduce((n,x)=>Math.max(n,x.lossRatio),0);
 const risk=(eq.debt>0&&eq.ratio<.4)||worstShort>.5?'critical':beta>=1.3||eq.debt>0||shorts.length?'high':beta>=1?'moderate':'safe';
 return{value,byType,beta,crashLoss,annualDividend,ranking,margin,shorts,risk};
}
