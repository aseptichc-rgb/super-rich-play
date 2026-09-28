import {L} from './i18n.js';
// Automatic settlements do not sign new personal contracts.
export const settling=new WeakSet();
const transactions=new WeakSet();
export function hospitalized(s){return s.concept==='rich-life'&&(s.health?.remaining||0)>0&&!s.health?.dead;}
export function checkHealth(s){
 if(s.concept!=='rich-life')return;
 if(s.health?.dead)return;
 if(s.stress>=100){s.health={remaining:0,dead:true};s.log.unshift(L('Stress reached 100. You have died.'));}
 else if(s.stress>80&&!hospitalized(s)){s.health={remaining:3,dead:false};s.log.unshift(L('Health deteriorated. Hospitalized for 3 months.'));}
}
export function healthReason(s){
 if(s.concept!=='rich-life'||settling.has(s))return null;
 if(s.health?.dead||s.stress>=100)return L('Your life has ended. Start a new life to continue.');
 if(hospitalized(s)||s.stress>80)return L('Hospitalized: new contracts and activities are unavailable.');
 return null;
}
export function transaction(s,action,amount){
 if(s.concept!=='rich-life'||settling.has(s)||transactions.has(s))return action();
 const reason=healthReason(s);if(reason)return{ok:false,msg:reason};
 const cash=s.money,basis=Math.max(100000,s.highestWealth||0,cash);let result;
 transactions.add(s);try{result=action();}finally{transactions.delete(s);}
 if(result?.ok){const gain=60*(amount===undefined?Math.abs(s.money-cash):Math.abs(amount))/basis;s.stress=Math.min(100,s.stress+gain);checkHealth(s);if(s.health?.dead||hospitalized(s))result.msg+=' · '+healthStatus(s);}
 return result;
}
export function validHealth(s){const h=s?.health;return h===undefined||!!(h&&typeof h.dead==='boolean'&&Number.isInteger(h.remaining)&&h.remaining>=0&&h.remaining<=3&&(!h.dead||h.remaining===0));}
export function healthStatus(s){return s.health?.dead?L('Deceased'):hospitalized(s)?L`Hospitalized · ${s.health.remaining} months remaining`:L('Healthy');}
