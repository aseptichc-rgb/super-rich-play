import {analyze} from './engine.js';
import {RICH_SAVE_KEY} from './rich-life.js';

export const DEV_SAVE_KEY='super-rich-lifestyle-dev-v1';
export function developerSession(hostname,search,cloud=false){
 const enabled=['localhost','127.0.0.1','::1','[::1]'].includes(hostname)&&new URLSearchParams(search).get('dev')==='1';
 return{enabled,saveKey:enabled?DEV_SAVE_KEY:RICH_SAVE_KEY,cloudSave:!enabled&&cloud};
}
// Only the first test session copies the normal save. Invalid saves still go through app.js validation.
export function sessionSave(storage,session){
 return storage.getItem(session.saveKey)??(session.enabled?storage.getItem(RICH_SAVE_KEY):null);
}
export function setTestMoney(state,input,enabled){
 if(!enabled||!/^\d+$/.test(String(input)))return false;
 const amount=Number(input);
 if(!Number.isSafeInteger(amount)||amount>1000000000000)return false;
 state.money=amount;
 state.highestWealth=Math.max(state.highestWealth,analyze(state).wealth);
 return true;
}
