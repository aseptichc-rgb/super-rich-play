// Cloud saves keyed by a save code, stored in Supabase. No DOM here: pages pass fetch and storage in, tests pass fakes.
// The code is the only key. The server keeps sha256(code), never the code itself (see supabase/schema.sql).
import {migrateSave,validSave} from './engine.js';
export const CLOUD_KEY='super-rich-cloud-v1';
export const CODE_ALPHABET='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const SYNC_INTERVAL=30000;
export function newCode(random=bytes=>crypto.getRandomValues(bytes)){return Array.from(random(new Uint8Array(16)),n=>CODE_ALPHABET[n&31]).join('');}
export function normalizeCode(input){const c=String(input??'').toUpperCase().replace(/[\s-]/g,'').replace(/O/g,'0').replace(/[IL]/g,'1');return /^[0-9A-HJKMNP-TV-Z]{16}$/.test(c)?c:null;}
export const formatCode=code=>code.match(/.{4}/g).join('-');
export function cloudClient({url='',key='',fetch:fetchImpl=globalThis.fetch?.bind(globalThis),timeout=10000}={}){
 const enabled=!!(url&&key&&fetchImpl);
 // Legacy anon keys are JWTs and also go in Authorization; new sb_publishable_ keys only go in apikey.
 const headers={apikey:key,'Content-Type':'application/json',...(key.startsWith('eyJ')?{Authorization:'Bearer '+key}:{})};
 async function rpc(name,args){
  if(!enabled)return{ok:false,error:'disabled'};
  let response;
  try{response=await fetchImpl(`${url.replace(/\/+$/,'')}/rest/v1/rpc/${name}`,{method:'POST',headers,body:JSON.stringify(args),signal:AbortSignal.timeout(timeout)});}
  catch{return{ok:false,error:'network'};}
  let data=null;
  try{const text=await response.text();data=text?JSON.parse(text):null;}catch{return{ok:false,error:'bad-response',status:response.status};}
  if(!response.ok)return{ok:false,error:data?.code==='23505'?'taken':'http',status:response.status};
  return{ok:true,data};
 }
 const meta=m=>({p_month:m.month,p_wealth:m.wealth,p_version:m.version});
 return{enabled,rpc,
  async create(code,save,m){const r=await rpc('create_cloud_save',{p_code:code,p_data:save,...meta(m)});return r.ok?{ok:true,revision:r.data}:r;},
  async load(code){const r=await rpc('load_cloud_save',{p_code:code});return r.ok?{ok:true,row:Array.isArray(r.data)&&r.data[0]||null}:r;},
  async push(code,save,expected,m){const r=await rpc('push_cloud_save',{p_code:code,p_data:save,p_expected_revision:expected,...meta(m)});if(!r.ok)return r;const row=Array.isArray(r.data)?r.data[0]:null;return row?{ok:true,result:row}:{ok:false,error:'bad-response'};},
  async remove(code){const r=await rpc('delete_cloud_save',{p_code:code});return r.ok?{ok:true,deleted:r.data===true}:r;},
  feedback(body,version,code=null){return rpc('send_feedback',{p_body:String(body).slice(0,8000),p_version:version,p_code:code});}
 };
}
export function decideOnOpen(memo,row){
 if(!row)return'forget';
 if(row.revision===memo.revision)return memo.dirty?'upload':'ok';
 if(row.revision>memo.revision&&!memo.dirty)return'use-remote';
 return'ask';
}
export function readCloud(storage){
 try{
  const v=JSON.parse(storage.get(CLOUD_KEY)),code=normalizeCode(v?.code);
  if(!code||code!==v.code||!Number.isInteger(v.revision)||v.revision<1)return null;
  // account is the Google uid this save code is linked to; manual save codes have none.
  return{code,revision:v.revision,syncedAt:typeof v.syncedAt==='string'?v.syncedAt:null,dirty:v.dirty===true,...(typeof v.account==='string'&&v.account?{account:v.account}:{})};
 }catch{return null;}
}
export function writeCloud(storage,memo){storage.set(CLOUD_KEY,memo?JSON.stringify(memo):null);}
export function remoteSave(data){
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 try{const s=migrateSave(structuredClone(data));return validSave(s)?s:null;}catch{return null;}
}
export function shouldUpload({dirty,busy,paused,monthChanged,lastPush,now}){return !!dirty&&!busy&&!paused&&(!!monthChanged||now-lastPush>=SYNC_INTERVAL);}
