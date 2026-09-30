// Firebase owns credentials and session persistence; account-save.js synchronizes game progress.
export async function loadFirebase(){
 const [app,auth]=await Promise.all([
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js')
 ]);
 return {...app,...auth};
}
export function createAuth({config,language='en',loadSDK=loadFirebase,onChange=()=>{},timers={set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)}}){
 const configured=['apiKey','authDomain','projectId','appId'].every(k=>typeof config?.[k]==='string'&&config[k].trim());
 let sdk,auth,starting=null,ready=false,busy=false,user=null,error='';
 const snapshot=()=>({configured,ready,busy,user,error});
 const emit=()=>onChange(snapshot());
 async function start(){
  if(!configured||ready)return;
  if(starting)return starting;
  starting=(async()=>{
   busy=true;error='';emit();
   let timer;
   try{
    // Bound initialization too: SDK loading and persisted-session recovery can stall.
    // Only the winning attempt may publish state or subscribe to account changes.
    const initialized=await Promise.race([(async()=>{
     const loaded=await loadSDK();
     const app=loaded.getApps().find(a=>a.name==='super-rich-auth')||loaded.initializeApp(config,'super-rich-auth');
     const session=loaded.getAuth(app);session.languageCode=language;
     await loaded.setPersistence(session,loaded.browserLocalPersistence);
     await session.authStateReady();
     return{sdk:loaded,auth:session};
    })(),new Promise((_,reject)=>{timer=timers.set(()=>reject({code:'auth/timeout'}),30000);})]);
    sdk=initialized.sdk;auth=initialized.auth;
    user=auth.currentUser;ready=true;
    sdk.onAuthStateChanged(auth,next=>{user=next;emit();});
   }catch(e){error=e?.code||'auth/unavailable';}
   finally{timers.clear(timer);busy=false;starting=null;emit();}
  })();
  return starting;
 }
 // Call the popup synchronously from a click after start() finishes, preserving user activation.
 async function signIn(){
  if(!ready||busy)return false;
  busy=true;error='';emit();
  let timer;
  try{
   const p=new sdk.GoogleAuthProvider();
   p.setCustomParameters({prompt:'select_account'});
   const result=await Promise.race([sdk.signInWithPopup(auth,p),new Promise((_,reject)=>{timer=timers.set(()=>reject({code:'auth/timeout'}),30000);})]);user=result.user;return true;
  }catch(e){if(!['auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(e?.code))error=e?.code||'auth/unavailable';return false;}
  finally{timers.clear(timer);busy=false;emit();}
 }
 async function signOut(){
  if(!ready||busy)return false;
  busy=true;error='';emit();
  try{await sdk.signOut(auth);user=null;return true;}
  catch(e){error=e?.code||'auth/unavailable';return false;}
  finally{busy=false;emit();}
 }
 return{start,signIn,signOut,snapshot};
}
