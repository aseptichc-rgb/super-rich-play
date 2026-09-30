import {universityProtection} from './university.js';
import {L} from './i18n.js';
import {shockPrices,delistStock} from './market.js';
import {stockInfo} from './stocks.js';

const roll=(seed,n)=>{let x=(seed^Math.imul(n,0x9e3779b1)^0xa511e9b3)>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return((x^(x>>>16))>>>0)/4294967296;};
const interval=(s,kind,count)=>12*(kind==='depression'?30:50)+Math.floor(roll(s.seed,count*7+(kind==='depression'?1:2))*(12*(kind==='depression'?20:20)+1));
export function ensureLongShocks(s){return s.longShocks??={depressions:0,disasters:0,nextDepression:s.month+interval(s,'depression',0),nextDisaster:s.month+interval(s,'disaster',0),activeUntil:0};}
export function validLongShocks(s){const q=s?.longShocks;if(q===undefined)return true;return !!(q&&['depressions','disasters','nextDepression','nextDisaster','activeUntil'].every(k=>Number.isSafeInteger(q[k])&&q[k]>=0)&&q.nextDepression<=s.month+600&&q.nextDisaster<=s.month+840&&q.activeUntil<=s.month+36);}

// The damage is stored on existing holdings. New investments are not charged for an old disaster.
export function advanceLongShocks(s,destroyBuildings){
 const q=ensureLongShocks(s),depression=s.month>=q.nextDepression,disaster=s.month>=q.nextDisaster;
 if(!depression&&!disaster)return null;
 const kind=depression?'depression':['earthquake','meteor','war','alien'][Math.floor(roll(s.seed,q.disasters*7+3)*4)];
 if(depression){q.depressions++;q.nextDepression=s.month+interval(s,'depression',q.depressions);}
 if(disaster){if(depression)q.nextDisaster=s.month+1;else{q.disasters++;q.nextDisaster=s.month+interval(s,'disaster',q.disasters);}}
 const protection=universityProtection(s),mitigate=factor=>1-(1-factor)*(1-protection);
 const severity=.85+roll(s.seed,s.month+83)*.3;
 const stockFactor=mitigate(Math.max(.2,(kind==='depression'?.35:kind==='war'||kind==='alien'?.38:kind==='meteor'?.45:.7)*severity));
 const propertyFactor=mitigate(Math.max(.2,(kind==='earthquake'?.35:kind==='meteor'?.45:kind==='depression'?.5:.7)*severity));
 const companyFactor=mitigate(Math.max(.2,(kind==='depression'?.35:kind==='war'||kind==='alien'?.4:kind==='meteor'?.5:.7)*severity));
 const otherFactor=mitigate(Math.max(.2,(kind==='depression'?.5:kind==='meteor'?.5:.7)*severity));
 const listed=[...s.market.listed].sort((a,b)=>(stockInfo(b,s)?.beta||0)-(stockInfo(a,s)?.beta||0));
 shockPrices(s,stockFactor,1);
 const delisted=(depression||kind==='war'||kind==='meteor'||kind==='alien'?listed.slice(0,Math.min(2,listed.length-1)-Math.floor(Math.min(2,listed.length-1)*protection)):[]).map(id=>{const name=stockInfo(id,s).name;delistStock(s,id);return name;});
 const destroyed=depression?0:destroyBuildings(s,protection);
 for(const t of s.tiles)if(t.owner==='player')t.shockFactor=(t.shockFactor??1)*propertyFactor;
 if(s.compound)for(const id of Object.keys(s.compound.balances))s.compound.balances[id]*=otherFactor;
 for(const p of s.acquisitions?.active||[])p.lossFactor=(p.lossFactor??1)*companyFactor;
 for(const p of s.startups?.active||[])if(p.status!=='failed'){
  p.cash=Math.round(p.cash*companyFactor);p.business=Math.round(p.business*companyFactor);p.crisisUntil=s.month+18;
  if(p.cash===0&&p.business===0){if(p.listed)delistStock(s,p.listed);else p.status='failed';}
 }
 for(const item of s.artCollection?.owned||[])item.lossFactor=(item.lossFactor??1)*otherFactor;
 if(s.empire?.owned.length){s.empire.losses??={};for(const id of s.empire.owned)s.empire.losses[id]=(s.empire.losses[id]??1)*companyFactor;}
 q.activeUntil=s.month+36;
 const name={depression:L('Great Depression'),earthquake:L('Earthquake'),meteor:L('Meteor strike'),war:L('War'),alien:L('Alien invasion')}[kind];
 s.log.unshift(L`⚠ ${name} · ${destroyed} city buildings destroyed; ${delisted.length} stocks delisted. Existing assets and founded companies suffered lasting damage.`);
 s.log=s.log.slice(0,25);
 return{kind,name,protection,destroyed,delisted,stockLoss:Math.round((1-stockFactor)*100),propertyLoss:Math.round((1-propertyFactor)*100),companyLoss:Math.round((1-companyFactor)*100)};
}
