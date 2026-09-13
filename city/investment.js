// Virtual investment accounting: price gains remain unrealized until sale.
export const DIVIDENDS={local:.08,tech:0,estate:.25};
export function investmentReport(s){const basis=s.costBasis||Object.fromEntries(Object.keys(DIVIDENDS).map(k=>[k,s.holdings[k]*s.prices[k]]));const market=Object.keys(DIVIDENDS).reduce((n,k)=>n+s.holdings[k]*s.prices[k],0);return{basis,unrealized:market-Object.values(basis).reduce((a,b)=>a+b,0),realized:s.realizedGains||0,dividends:Object.keys(DIVIDENDS).reduce((n,k)=>n+s.holdings[k]*DIVIDENDS[k],0)};}
export function ensureBasis(s){if(!s.costBasis)s.costBasis={...investmentReport(s).basis};s.realizedGains||=0;}
export function recordTrade(s,id,qty,value,fee){ensureBasis(s);if(qty>0)s.costBasis[id]+=value+fee;else{const removed=s.costBasis[id]*(-qty/s.holdings[id]);s.costBasis[id]-=removed;s.realizedGains+=-value-fee-removed;}}
export function validInvestment(s){if(s.realizedGains!==undefined&&!Number.isFinite(s.realizedGains))return false;if(s.costBasis&&(!Object.keys(DIVIDENDS).every(k=>Number.isFinite(s.costBasis[k])&&s.costBasis[k]>=-0.001)||Object.keys(s.costBasis).length!==3))return false;return true;}
