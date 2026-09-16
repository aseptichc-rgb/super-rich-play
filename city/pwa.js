import {L} from './i18n.js';

let installPrompt=null,offlineReady=false,registration=null,failed=false;
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function status(){
 if(failed)return L('Offline setup could not finish. Reopen the game online to retry.');
 if(registration?.waiting)return L('An update is ready. Close all game windows and reopen to apply it.');
 return offlineReady?L('Ready for offline play. Live prices, cloud saves and new online images need a connection.'):L('Preparing offline play. Keep this window open until it is ready.');
}
function refresh(){
 document.querySelectorAll('[data-pwa-status]').forEach(el=>el.textContent=status());
 document.querySelectorAll('[data-pwa-install]').forEach(el=>el.hidden=!installPrompt||standalone());
}
export function pwaSettings(){
 return `<section class="pwa-settings"><h3>${L('Play from your home screen')}</h3><p>${standalone()?L('You are playing in the installed app.'):L('Install SUPER RICH to open it directly from your home screen.')}</p><button type="button" class="primary full" data-pwa-install ${!installPrompt||standalone()?'hidden':''}>${L('Install SUPER RICH')}</button><p data-pwa-status role="status">${status()}</p><details><summary>${L('Installation and saved games')}</summary><p>${L('iPhone / iPad: open this address in Safari, tap Share, then Add to Home Screen. Android / PC: use Install SUPER RICH above, or the browser menu to install or add to your home screen.')}</p><p>${L('Saves stay in this browser or installed app. Before switching devices or installing, export your save in Settings and import it if needed. Installation alone does not sync saves.')}</p></details></section>`;
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;refresh();});
window.addEventListener('appinstalled',()=>{installPrompt=null;refresh();});
document.addEventListener('click',async event=>{
 if(!event.target.closest('[data-pwa-install]')||!installPrompt)return;
 const prompt=installPrompt;installPrompt=null;refresh();
 try{await prompt.prompt();await prompt.userChoice;}catch{/* Browser installation remains available from its menu. */}
});
if('serviceWorker' in navigator&&window.isSecureContext){
 (async()=>{
  try{
   registration=await navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{updateViaCache:'none'});
   const watch=()=>{
    const worker=registration.installing;
    worker?.addEventListener('statechange',()=>{
     if(worker.state==='redundant'&&!registration.active)failed=true;
     refresh();
    });
   };
   watch();registration.addEventListener('updatefound',watch);
   const ready=await navigator.serviceWorker.ready;
   offlineReady=!!ready.active;refresh();
  }catch{failed=true;refresh();}
 })();
}else{failed=true;}
