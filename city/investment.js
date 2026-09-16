// Virtual investment accounting: price gains remain unrealized until sale. Dividends are a yield on the
// current price, so a dividend stock keeps paying more as it appreciates.
import {dividendPerShare} from './stocks.js';
export function investmentReport(s){const ids=Object.keys(s.holdings),basis=s.costBasis||Object.fromEntries(ids.map(k=>[k,s.holdings[k]*s.prices[k]]));const market=ids.reduce((n,k)=>n+s.holdings[k]*s.prices[k],0);return{basis,market,unrealized:market-Object.values(basis).reduce((a,b)=>a+b,0),realized:s.realizedGains||0,dividends:ids.reduce((n,k)=>n+s.holdings[k]*dividendPerShare(s,k),0)};}
export function ensureBasis(s){if(!s.costBasis)s.costBasis={...investmentReport(s).basis};for(const k of Object.keys(s.holdings))s.costBasis[k]??=0;s.realizedGains||=0;}
export function recordTrade(s,id,qty,value,fee){ensureBasis(s);if(qty>0)s.costBasis[id]+=value+fee;else{const removed=s.costBasis[id]*(-qty/s.holdings[id]);s.costBasis[id]-=removed;s.realizedGains+=-value-fee-removed;}}
export function validInvestment(s){if(s.realizedGains!==undefined&&!Number.isFinite(s.realizedGains))return false;if(s.costBasis&&(!s.holdings||!Object.keys(s.holdings).every(k=>Number.isFinite(s.costBasis[k])&&s.costBasis[k]>=-0.001)))return false;return true;}
