import {L} from './i18n.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function authError(code){
 if(code==='auth/popup-blocked')return L('Allow pop-ups for this site, then try signing in again.');
 if(code==='auth/unauthorized-domain')return L('Sign-in is not configured for this website yet.');
 if(['auth/operation-not-allowed','auth/invalid-api-key','auth/configuration-not-found','auth/invalid-oauth-client-id','auth/invalid-credential'].includes(code))return L('This sign-in provider is not configured yet. Please try again later.');
 if(code==='auth/account-exists-with-different-credential')return L('This email already uses another sign-in method. Use your original provider.');
 if(code==='auth/network-request-failed')return L('Could not connect. Check your internet connection and try again.');
 if(['auth/web-storage-unsupported','auth/operation-not-supported-in-this-environment'].includes(code))return L('Open the game in a regular browser and allow site storage to sign in.');
 if(code==='auth/too-many-requests')return L('Too many sign-in attempts. Please try again later.');
 return L('Sign-in is unavailable right now. You can keep playing and try again later.');
}
export function accountHTML({configured,ready,busy,user,error}){
 const disabled=!ready||busy?'disabled':'';
 return `<h3>${L('Account')}</h3>${user?`<p>${L('Signed in as')} <strong>${esc(user.displayName||user.email||L('Player'))}</strong></p><button class="full" data-auth="sign-out" ${disabled}>${L('Sign Out')}</button>`:`<div class="button-row"><button data-auth="google" ${disabled}>${L('Sign in with Google')}</button></div>`}<p class="help">${L('Sign-in identifies your account. Game progress stays in this browser; use Cloud Save or export to move it between devices.')}</p>${!configured?`<p class="help">${L('Account sign-in is being set up. You can keep playing without signing in.')}</p>`:busy?`<p role="status">${L('Connecting to your account…')}</p>`:''}${error?`<p role="alert">${authError(error)}</p>${!ready?`<button data-auth="retry" ${busy?'disabled':''}>${L('Retry Sign-In Connection')}</button>`:''}`:''}`;
}
