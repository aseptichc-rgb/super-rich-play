import {remoteSave} from './cloud-save.js';

// Firebase ID tokens are checked by Firestore rules; updateTime prevents lost updates.
export function accountSaveClient({projectId,user,legacyClient,fetch:request=globalThis.fetch,timeout=12000}){
 const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/playerSaves/${encodeURIComponent(user.uid)}`;
 async function call(method,suffix='',body){
  try{
   const token=await user.getIdToken();
   const response=await request(url+suffix,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(timeout)});
   const data=await response.json();
   if(!response.ok){
    if(method==='GET'&&response.status===404&&data.error?.message?.startsWith('Document '))return{ok:true,row:null};
    return{ok:false,error:['FAILED_PRECONDITION','ALREADY_EXISTS','ABORTED'].includes(data.error?.status)?'conflict':response.status===403?'setup':'network'};
   }
   const json=data.fields?.save?.stringValue;
   if(typeof json!=='string'||!data.updateTime)return{ok:false,error:'invalid'};
   const save=remoteSave(JSON.parse(json));
   return save?{ok:true,row:{save,revision:data.updateTime}}:{ok:false,error:'invalid'};
  }catch{return{ok:false,error:'network'};}
 }
 const push=(save,revision)=>call('PATCH',revision?`?currentDocument.updateTime=${encodeURIComponent(revision)}`:'?currentDocument.exists=false',{fields:{save:{stringValue:JSON.stringify(save)}}});
 return{push,async load(){
  const current=await call('GET');if(!current.ok||current.row||!legacyClient)return current;
  // Older releases stored a Supabase save code under the Firebase account.
  try{
   const response=await request(url.replace('/playerSaves/','/players/'),{headers:{Authorization:`Bearer ${await user.getIdToken()}`},signal:AbortSignal.timeout(timeout)});
   const data=await response.json();
   if(response.status===404&&data.error?.message?.startsWith('Document '))return current;
   if(!response.ok)return{ok:false,error:response.status===403?'setup':'network'};
   const code=data.fields?.code?.stringValue;if(!/^[0-9A-HJKMNP-TV-Z]{16}$/.test(code||''))return{ok:false,error:'invalid'};
   const old=await legacyClient.load(code);if(!old.ok)return old;
   const save=remoteSave(old.row?.data);if(!save)return{ok:false,error:'invalid'};
   const migrated=await push(save,null);return migrated.error==='conflict'?call('GET'):migrated;
  }catch{return{ok:false,error:'network'};}
 }};
}

export const ACCOUNT_OWNER_KEY='super-rich-account-owner-v1';
export const accountBackupKey=uid=>'super-rich-account-backup-v1:'+(uid||'guest');
const INTERVAL=3000,RETRY=30000;
// Keep account backups separate from the legacy save slot. Never import another account's game.
export function createAccountSave({storage,clientFor,getState,replaceState,newState,hasLocal=false,canSave=()=>true,onChange=()=>{},timers={set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)}}){
 let owner=storage.get(ACCOUNT_OWNER_KEY)||null,user=null,client=null,epoch=0,busy=false,applying=false,ready=false,timer=null,pending=null,status='guest',error='',uncertainJSON=null,revision=null,clean=false,local=hasLocal,initialized=false,lastJSON=JSON.stringify(getState());
 const snapshot=()=>({user,status,error,pending});
 const emit=(next,reason='')=>{status=next;error=reason;onChange(snapshot());};
 function read(uid){try{const r=JSON.parse(storage.get(accountBackupKey(uid)));return r&&remoteSave(r.save)?r:null;}catch{return null;}}
 const initial=read(owner);revision=initial?.revision??null;clean=initial?.clean===true&&JSON.stringify(initial.save)===JSON.stringify(getState());
 function remember(){if(!canSave())return;storage.set(accountBackupKey(owner),JSON.stringify({save:getState(),revision,clean}));storage.set(ACCOUNT_OWNER_KEY,owner);}
 function apply(save){if(JSON.stringify(save)===JSON.stringify(getState()))return;applying=true;try{replaceState(save);}finally{applying=false;lastJSON=JSON.stringify(getState());}}
 function schedule(delay=INTERVAL){timers.clear(timer);timer=timers.set(()=>ready?flush():connect(),delay);}
 function failure(reason){emit(reason==='invalid'?'invalid':reason==='setup'?'setup':'offline',reason);if(reason==='network')schedule(RETRY);}
 async function connect(){
  if(!user||busy||!canSave())return;
  busy=true;const id=epoch;emit('checking');
  const r=await client.load();if(id!==epoch)return;busy=false;
  if(!r.ok){failure(r.error);return;}
  const row=r.row,current=JSON.stringify(getState());
  // A timed-out write may already be committed. Recognize our own exact payload.
  if(row&&uncertainJSON===JSON.stringify(row.save))revision=row.revision;
  uncertainJSON=null;
  if(row&&JSON.stringify(row.save)!==current){
   if(!local||clean){revision=row.revision;clean=true;local=true;apply(row.save);remember();ready=true;emit('saved');return;}
   if(!revision||revision!==row.revision){pending=row;ready=false;emit('conflict');return;}
  }
  revision=row?.revision??null;ready=true;
  if(row&&JSON.stringify(row.save)===current){clean=true;remember();emit('saved');return;}
  clean=false;remember();await flush();
 }
 async function flush(){
  timers.clear(timer);
  if(!user||busy||pending||!canSave())return;
  if(!ready)return connect();
  if(clean){emit('saved');return;}
  const id=epoch,save=structuredClone(getState()),json=JSON.stringify(save);
  busy=true;emit('syncing');
  const r=await client.push(save,revision);if(id!==epoch)return;busy=false;
  if(!r.ok){if(r.error==='conflict'){ready=false;return connect();}if(r.error==='network'){uncertainJSON=JSON.stringify(remoteSave(save));ready=false;}failure(r.error);return;}
  revision=r.row.revision;clean=JSON.stringify(getState())===json;remember();
  emit(clean?'saved':'pending');if(!clean)schedule();
 }
 return{
  snapshot,flush,
  async setUser(next){
   if(initialized&&next?.uid===user?.uid)return;
   initialized=true;
   if(user||local)remember();
   epoch++;timers.clear(timer);busy=false;pending=null;ready=false;uncertainJSON=null;
   const previousOwner=owner;user=next;owner=next?.uid||null;client=next?clientFor(next):null;
   if(!canSave()){emit('invalid');return;}
   const backup=read(owner);
   // A guest game can become an account game, but an account game cannot become another account's game.
   if(next&&previousOwner===null&&local){revision=null;clean=false;}
   else if(backup){local=true;revision=backup.revision;clean=backup.clean===true;apply(remoteSave(backup.save));}
   else if(previousOwner!==owner&&previousOwner!==null){local=false;revision=null;clean=false;apply(newState());}
   else{revision=null;clean=false;}
   storage.set(ACCOUNT_OWNER_KEY,owner);
   if(!next){emit('guest');return;}
   remember();await connect();
  },
  afterSave(){
   if(applying||!canSave())return;
   const json=JSON.stringify(getState());if(json===lastJSON){if(user)onChange(snapshot());return;}lastJSON=json;
   local=true;clean=false;remember();
   if(!user)return;
   if(pending){emit('conflict');return;}
   if(['invalid','setup'].includes(status))return;
   if(!busy){emit('pending');schedule();}
  },
  async choose(which){
   if(!pending||!user)return;
   const row=pending;pending=null;revision=row.revision;ready=true;
   if(which==='remote'){clean=true;local=true;apply(row.save);remember();emit('saved');}
   else{clean=false;remember();await flush();}
  },
  retry(){if(pending){emit('conflict');return;}if(clean)ready=false;return ready?flush():connect();}
 };
}

// Compatibility with older code-based account storage.
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
