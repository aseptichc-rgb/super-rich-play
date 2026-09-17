// A signed-in Google account remembers one cloud save code in Firestore at players/{uid} (see firestore.rules).
// The save itself still syncs through cloud-save.js. No DOM here: pages pass fetch and the ID token, tests pass fakes.
import {normalizeCode} from './cloud-save.js';
export function accountStore({projectId,uid,token,fetch:fetchImpl=globalThis.fetch?.bind(globalThis),timeout=10000}){
 const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/players/${encodeURIComponent(uid)}`;
 async function call(method,body){
  try{
   const response=await fetchImpl(method==='PATCH'?url+'?updateMask.fieldPaths=code':url,{method,headers:{Authorization:'Bearer '+await token(),'Content-Type':'application/json'},body:body&&JSON.stringify(body),signal:AbortSignal.timeout(timeout)});
   return{status:response.status,data:await response.json().catch(()=>null)};
  }catch{return{status:0,data:null};}
 }
 return{uid,
  async get(){const r=await call('GET');if(r.status===404)return{ok:true,code:null};return r.status===200?{ok:true,code:normalizeCode(r.data?.fields?.code?.stringValue)}:{ok:false};},
  async set(code){return{ok:(await call('PATCH',{fields:{code:{stringValue:code}}})).status===200};}
 };
}
