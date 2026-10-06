import {createAnalytics} from './analytics.js';
import {FIREBASE_CONFIG} from './firebase-config.js';
import {L} from './i18n.js';
const address=new URL(window.location.href);
let storage=null;try{storage=window.localStorage;}catch{}
export const analytics=createAnalytics({storage,projectId:FIREBASE_CONFIG.projectId,enabled:address.searchParams.get('dev')!=='1'&&address.searchParams.get('trial')!=='12'&&!/^(localhost|127\.0\.0\.1)$/.test(address.hostname),source:address.searchParams.get('utm_source')||'',device:innerWidth<720?'mobile':'desktop',browser:/FBAN|FBAV|Instagram|KAKAOTALK|Line\//i.test(navigator.userAgent)?'in-app':'regular'});
// Record a visit before loading the game graph; a failed boot never records "ready".
void import('./app.js').catch(()=>{
 const root=document.querySelector('#app');
 root.innerHTML='<section class="mission-option"><h2>'+L('The city could not open yet')+'</h2><p>'+L('Check your connection and reopen the game. Your saved city stays on this device.')+'</p><button>'+L('Retry')+'</button></section>';
 root.querySelector('button').addEventListener('click',()=>window.location.reload());
});
