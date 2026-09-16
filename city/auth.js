// Firebase owns credentials and session persistence; game saves stay independent.
export async function loadFirebase(){
 const [app,auth]=await Promise.all([
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js')
 ]);
 return {...app,...auth};
}
export function createAuth({config,language='en',loadSDK=loadFirebase,onChange=()=>{}}){
 const configured=['apiKey','authDomain','projectId','appId'].every(k=>typeof config?.[k]==='string'&&config[k].trim());
 let sdk,auth,starting=null,ready=false,busy=false,user=null,error='';
 const snapshot=()=>({configured,ready,busy,user,error});
 const emit=()=>onChange(snapshot());
 async function start(){
  if(!configured||ready)return;
  if(starting)return starting;
  starting=(async()=>{
   busy=true;error='';emit();
   try{
    sdk=await loadSDK();
    const app=sdk.getApps().find(a=>a.name==='super-rich-auth')||sdk.initializeApp(config,'super-rich-auth');
    auth=sdk.getAuth(app);auth.languageCode=language;
    await sdk.setPersistence(auth,sdk.browserLocalPersistence);
    await auth.authStateReady();
    user=auth.currentUser;ready=true;
    sdk.onAuthStateChanged(auth,next=>{user=next;emit();});
   }catch(e){error=e?.code||'auth/unavailable';}
   finally{busy=false;starting=null;emit();}
  })();
  return starting;
 }
 // Call the popup synchronously from a click after start() finishes, preserving user activation.
 async function signIn(){
  if(!ready||busy)return false;
  busy=true;error='';emit();
  try{
   const p=new sdk.GoogleAuthProvider();
   p.setCustomParameters({prompt:'select_account'});
   const result=await sdk.signInWithPopup(auth,p);user=result.user;return true;
  }catch(e){if(!['auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(e?.code))error=e?.code||'auth/unavailable';return false;}
  finally{busy=false;emit();}
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
