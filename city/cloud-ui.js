// Cloud save screens and upload timing. The protocol and the decisions live in cloud-save.js.
import {L,lang} from './i18n.js';
import {analyze} from './engine.js';
import {newCode,normalizeCode,formatCode,decideOnOpen,readCloud,writeCloud,remoteSave,shouldUpload,SYNC_INTERVAL} from './cloud-save.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₲'+Math.round(n).toLocaleString('en-US');
const when=s=>L`Year ${Math.floor(s.month/12)+1} · Month ${s.month%12+1}`;
const UNAVAILABLE=L('Your Google account save is unavailable right now. Your game is still saved on this device.');
const SYNCED=L('✓ Saved · Cloud synced'),PENDING=L('✓ Saved · Cloud sync pending'),FAILED=L('Saved locally · Cloud sync failed'),CHOOSE=L('Saved locally · Choose a save to keep'),LOCAL=L('✓ Saved');
// Nothing is uploaded while the page closes: a closing page never reads the reply, so this device would fall behind
// the cloud's revision and ask about a conflict on the next visit. Unsynced changes go up the next time the game opens.
export function createCloudUI({client,storage,version,getState,replaceState,openDialog,closeDialog,toast,setStatus,showSettings,scenarioName,timers={set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)}}){
 let memo=readCloud(storage),busy=false,again=false,paused=false,applying=false,lastPush=0,lastMonth=getState().month,timer=0,pending=null,opened=null;
 // The signed-in Google account: {uid, store from account-save.js, code it points at}. Null when signed out.
 let account=null;
 // open() decides with what was remembered at load; saves made while the page starts must not change that answer.
 const loadedDirty=!!memo?.dirty;
 // JSON of the save known to match the cloud. A save with the same JSON is not a change.
 let synced=memo&&!memo.dirty?JSON.stringify(getState()):null;
 // No uploads until open() has compared this device with the cloud.
 let ready=!memo;
 const remember=v=>{memo=v;writeCloud(storage,v);};
 const meta=s=>({month:s.month,wealth:analyze(s).wealth,version});
 // Points the signed-in account at the code this device now syncs, so other devices continue the same save.
 async function linkCode(){
  if(!account||!memo)return;
  const a=account,code=memo.code;
  if(memo.account!==a.uid)remember({...memo,account:a.uid});
  if(a.code===code)return;
  const r=await a.store.set(code);
  if(account!==a)return;
  if(r.ok){a.code=code;toast(L('Your game is now saved to your Google account.'));}else toast(UNAVAILABLE);
 }
 function schedule(){timers.clear(timer);timer=timers.set(()=>push(),Math.max(1000,SYNC_INTERVAL-(Date.now()-lastPush)));}
 function stop(message){remember(null);paused=false;pending=null;synced=null;ready=true;timers.clear(timer);setStatus(LOCAL);if(message)toast(message);}
 async function push(){
  if(!memo||paused||!ready)return;
  if(busy){again=true;return;}
  const s=getState(),json=JSON.stringify(s);
  busy=true;again=false;timers.clear(timer);setStatus(L('Syncing…'));
  const code=memo.code,r=await client.push(code,s,memo.revision,meta(s));
  busy=false;lastPush=Date.now();
  if(memo?.code!==code)return;
  if(!r.ok){setStatus(FAILED);schedule();return;}
  const res=r.result;
  if(res.ok){synced=json;remember({...memo,revision:res.revision,syncedAt:res.updated_at,dirty:again});setStatus(again?PENDING:SYNCED);if(again)schedule();return;}
  if(res.revision==null){stop(L('This cloud save was deleted on another device, so syncing stopped. Your game is still saved here.'));return;}
  ask();
 }
 function ask(row){paused=true;timers.clear(timer);setStatus(CHOOSE);compare(row);}
 async function compare(row){
  if(!memo)return;
  const code=memo.code;
  if(!row){const r=await client.load(code);if(memo?.code!==code)return;if(!r.ok){setStatus(FAILED);toast(L('Could not reach the cloud. Try again in a moment.'));return;}if(!r.row){stop(L('This cloud save no longer exists, so syncing stopped. Your game is still saved here.'));return;}row=r.row;}
  pending={row,save:remoteSave(row.data),code};showCompare();
 }
 const side=(title,s,extra='')=>`<section class="cloud-side"><h3>${title}</h3>${s?L`<p><b>${when(s)}</b></p><p>Net worth ${money(analyze(s).wealth)}</p><p>${esc(scenarioName(s))}</p>`:L('<p role="alert">This save could not be read.</p>')}${extra}</section>`;
 function showCompare(){
  const {row,save}=pending,updated=row.updated_at?new Date(row.updated_at).toLocaleString(lang==='ko'?'ko-KR':'en-US'):'';
  openDialog('cloud-compare',L`<span class="eyebrow">CLOUD SAVE</span><h2>Which save do you want to keep?</h2><p>This device and your cloud save have both moved on. The one you don't pick is replaced.</p><div class="cloud-compare">${side(L('This Device'),getState())}${side(L('Cloud Save'),save,updated?L`<p class="help">Saved ${esc(updated)}</p>`:'')}</div><div class="button-row"><button class="primary" data-cloud="keep-local">Keep This Device's Save</button><button data-cloud="use-remote" ${save?'':'disabled'}>Load Cloud Save</button></div><button class="full" data-action="export">Export This Device's Save First</button>`);
 }
 function useRemote(){
  if(!pending?.save)return;
  const {row,save,code}=pending;pending=null;
  applying=true;try{replaceState(save);}finally{applying=false;}
  synced=JSON.stringify(getState());ready=true;lastMonth=save.month;paused=false;
  remember({code,revision:row.revision,syncedAt:row.updated_at,dirty:false});linkCode();
  setStatus(SYNCED);toast(L('Continued from your cloud save.'));
 }
 async function keepLocal(){
  if(!pending)return;
  const {row,code}=pending;pending=null;closeDialog();
  synced=null;ready=true;paused=false;
  remember({code,revision:row.revision,syncedAt:row.updated_at,dirty:true});linkCode();
  await push();
 }
 async function create(show=true){
  if(busy)return;
  busy=true;const s=getState();let r;
  for(let tries=0;tries<3;tries++){
   const code=newCode();r=await client.create(code,s,meta(s));
   if(r.ok){busy=false;lastPush=Date.now();paused=false;ready=true;synced=JSON.stringify(s);remember({code,revision:r.revision,syncedAt:new Date().toISOString(),dirty:false});setStatus(SYNCED);if(show)showCode(code);linkCode();return;}
   if(r.error!=='taken')break;
  }
  busy=false;toast(L('Could not reach the cloud. Your game is still saved on this device.'));
 }
 function showCode(code){openDialog('cloud-code',L`<span class="eyebrow">CLOUD SAVE</span><h2>Your save code</h2><p class="cloud-code">${formatCode(code)}</p><p>On another device, open Settings → Cloud Save and enter this code to continue there.</p><p role="alert">Copy it or write it down now. A lost code can't be recovered, and anyone who has it can open, overwrite or delete this save.</p><button class="primary full" data-cloud="copy">Copy Code</button>`);}
 async function loadCode(){
  const code=normalizeCode(document.querySelector('#cloud-code-input')?.value);
  if(!code){toast(L('Enter the 16-character save code, like K7QM-3XRA-94TD-PW2E.'));return;}
  if(busy)return;
  busy=true;const r=await client.load(code);busy=false;
  if(!r.ok){toast(L('Could not reach the cloud. Try again in a moment.'));return;}
  if(!r.row){toast(L('No cloud save matches that code.'));return;}
  const save=remoteSave(r.row.data);
  if(!save){toast(L('That cloud save could not be read. Your game here is unchanged.'));return;}
  pending={row:r.row,save,code};
  if(getState().month===0){useRemote();return;}
  showCompare();
 }
 function copy(){
  if(!memo)return;
  const text=formatCode(memo.code),fail=()=>toast(L`Copy failed. Write the code down: ${text}`);
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>toast(L('Save code copied.')),fail);else fail();
 }
 async function remove(){
  if(!memo||busy)return;
  busy=true;const r=await client.remove(memo.code);busy=false;
  if(!r.ok){toast(L('Could not reach the cloud. Nothing was deleted.'));return;}
  stop(L('Cloud save deleted. Your game is still saved on this device.'));closeDialog();showSettings();
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-cloud]');if(!b)return;e.preventDefault();
  const a=b.dataset.cloud;
  if(a==='create')create();
  else if(a==='load-code')loadCode();
  else if(a==='copy')copy();
  else if(a==='sync')push();
  else if(a==='compare')compare();
  else if(a==='keep-local')keepLocal();
  else if(a==='use-remote')useRemote();
  else if(a==='stop'){stop(L('Syncing stopped on this device. Your cloud save is kept.'));showSettings();}
  else if(a==='delete')openDialog('cloud-delete',L('<h2>Delete this cloud save?</h2><p>The save code stops working on every device. The game saved on this device stays.</p><div class="button-row"><button class="primary" data-cloud="delete-confirm">Delete Cloud Save</button><button data-action="close">Cancel</button></div>'));
  else if(a==='delete-confirm')remove();
 });
 return{
  settingsHTML(){
   if(!memo)return L`<h3>Cloud Save</h3><p class="help">Continue this game on another device with a save code. No sign-up needed. Anyone with the code can open, overwrite or delete the save, and a lost code can't be recovered.</p><button data-cloud="create" class="full">Save to Cloud</button><label class="field-label">Already have a code?<input id="cloud-code-input" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX"></label><button data-cloud="load-code">Continue With a Save Code</button>`;
   return L`<h3>Cloud Save</h3><p class="help">This game syncs to the cloud. Enter the code on another device to continue there. Keep it private: anyone with it can open, overwrite or delete this save.</p><p class="cloud-code">${formatCode(memo.code)}</p><div class="button-row"><button data-cloud="copy">Copy Code</button>${paused?L('<button class="primary" data-cloud="compare">Choose Which Save to Keep</button>'):L('<button data-cloud="sync">Sync Now</button>')}</div><div class="button-row"><button data-cloud="stop">Stop Syncing on This Device</button><button data-cloud="delete">Delete Cloud Save</button></div>`+(memo.account?L('<p class="help">Linked to your Google account. Sign in with the same account on another device to continue.</p>'):'');
  },
  // app.js passes the JSON it just wrote to localStorage.
  afterSave(json=JSON.stringify(getState())){
   if(!memo||applying)return;
   const s=getState(),monthChanged=s.month!==lastMonth;lastMonth=s.month;
   if(json===synced&&!memo.dirty)return;
   if(!memo.dirty)remember({...memo,dirty:true});
   if(!ready)return;
   if(busy){again=true;return;}
   if(paused){setStatus(CHOOSE);return;}
   if(shouldUpload({dirty:true,busy,paused,monthChanged,lastPush,now:Date.now()}))push();else{setStatus(PENDING);schedule();}
  },
  // signIn() waits for this first comparison with the cloud.
  open(){return opened??=(async()=>{
   if(!memo){ready=true;return;}
   setStatus(L('Checking cloud save…'));
   const code=memo.code,r=await client.load(code);
   ready=true;
   if(memo?.code!==code)return;
   if(!r.ok){setStatus(FAILED);if(memo.dirty)schedule();return;}
   const decision=decideOnOpen({...memo,dirty:loadedDirty},r.row);
   if(decision==='forget'){stop(L('Your cloud save no longer exists, so syncing stopped. Your game is still saved here.'));return;}
   if(decision==='ok'){if(memo.dirty){setStatus(PENDING);schedule();}else setStatus(SYNCED);return;}
   if(decision==='upload'){push();return;}
   if(decision==='use-remote'){pending={row:r.row,save:remoteSave(r.row.data),code};if(pending.save){useRemote();return;}}
   ask(r.row);
  })();},
  // A new device (month 0) continues the account's save; progress on both sides asks which one to keep.
  async signIn(store){
   if(account?.uid===store.uid)return;
   const a=account={uid:store.uid,store,code:null};
   await opened;
   const got=await store.get();
   if(account!==a)return;
   if(!got.ok){account=null;toast(UNAVAILABLE);return;}
   a.code=got.code;
   if(got.code&&got.code===memo?.code){linkCode();return;}
   if(got.code){
    const r=await client.load(got.code);
    if(account!==a)return;
    if(!r.ok){account=null;toast(L('Could not reach the cloud. Try again in a moment.'));return;}
    if(r.row){pending={row:r.row,save:remoteSave(r.row.data),code:got.code};if(pending.save&&getState().month===0)useRemote();else showCompare();return;}
   }
   // No save on the account yet, or it was deleted: this device's game becomes the account's save.
   if(!memo||memo.account&&memo.account!==a.uid)await create(false);else linkCode();
  },
  // Signing out keeps this device's game but stops syncing it to that account.
  signOut(){account=null;if(memo?.account)stop(L('Signed out. Your game stays on this device but no longer syncs to your Google account.'));},
  linked:()=>!!memo,
  // A brand-new game leaves the cloud save as it is; this device just stops syncing to it.
  stopSync(message){if(memo)stop(message);},
  async sendFeedback(text){return(await client.feedback(text,version,memo?.code??null)).ok;}
 };
}
