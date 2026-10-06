import {L} from './i18n.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function authError(code){
 if(code==='auth/timeout')return L('Sign-in did not finish. Try again in your usual browser. You can keep playing with this device save.');
 if(code==='auth/popup-blocked')return L('Allow pop-ups for this site, then try signing in again.');
 if(code==='auth/unauthorized-domain')return L('Sign-in is not configured for this website yet.');
 if(['auth/operation-not-allowed','auth/invalid-api-key','auth/configuration-not-found','auth/invalid-oauth-client-id','auth/invalid-credential'].includes(code))return L('This sign-in provider is not configured yet. Please try again later.');
 if(code==='auth/account-exists-with-different-credential')return L('This email already uses another sign-in method. Use your original provider.');
 if(code==='auth/network-request-failed')return L('Could not connect. Check your internet connection and try again.');
 if(['auth/web-storage-unsupported','auth/operation-not-supported-in-this-environment'].includes(code))return L('Open the game in a regular browser and allow site storage to sign in.');
 if(code==='auth/too-many-requests')return L('Too many sign-in attempts. Please try again later.');
 return L('Sign-in is unavailable right now. Keep playing with this device save and try again later.');
}
export function accountHTML({configured,ready,busy,user,error},sync={status:'guest'}){
 const disabled=!ready||busy?'disabled':'';
 return `<h3>${L('Account & Save')}</h3><p class="save-rule"><strong>${L('One Google account · One current game')}</strong></p><p class="help">${L('Use the same Google account on another device to continue this game. Multiple save slots are not supported.')}</p>${user?`<p>${L('Signed in as')} <strong>${esc(user.displayName||user.email||L('Player'))}</strong>${user.email?`<br><span class="help">${esc(user.email)}</span>`:''}</p><p role="status">${saveStatus(sync.status)}</p><div class="button-row"><button data-auth="sync">${['conflict','recovery'].includes(sync.status)?L('Choose Which Save to Keep'):L('Sync Now')}</button><button data-auth="sign-out" ${disabled}>${L('Sign Out')}</button></div>`:`<p role="status">${saveStatus('guest')}</p><button class="primary full" data-auth="google" ${disabled}>${L('Continue with Google')}</button><p class="help">${L('Connect your account to save your progress and continue on another device.')}</p>`}${!configured?`<p class="help">${L('Account sign-in is being set up. Your progress is saved on this device.')}</p>`:busy?`<p role="status">${L('Connecting to your account…')}</p>`:''}${error?`<p role="alert">${authError(error)}</p>${!ready?`<button data-auth="retry" ${busy?'disabled':''}>${L('Retry Sign-In Connection')}</button>`:''}`:''}`;
}

export function saveStatus(status){
 return ({guest:L('Saved on this device · Connect Google for other devices'),checking:L('Checking account save…'),syncing:L('Saving to your account…'),saved:L('Saved to your account'),pending:L('Account save pending…'),offline:L('Offline · Will save when connected'),setup:L('Account storage is unavailable · Retry in Settings'),invalid:L('Could not read the save · Export your game before retrying'),conflict:L('Choose which progress to continue'),recovery:L('Account story available · Restore to continue')})[status]||L('Account save pending…');
}
export function welcomeHTML(auth){
 return `<section class="account-welcome"><span class="eyebrow">SUPER RICH</span><h2>${L('Your wealth. Your story.')}</h2><p>${L('Start with Google to save your story across devices, or try the game first.')}</p>${accountHTML(auth)}<button class="full" data-auth="guest">${L('Try it first')}</button><p class="help">${L('Play first. This browser saves your city; Google connects it across devices.')}</p></section>`;
}
export function accountConflictHTML(local,remote,recovery=false){
 const side=(title,s)=>`<section class="cloud-side"><h3>${title}</h3><p>${esc(s.name)}</p><p>${L`Year ${Math.floor(s.month/12)+1} · Month ${s.month%12+1}`}</p><p>${L('Cash')}: ₲${Math.round(s.money).toLocaleString('en-US')}</p></section>`;
 if(recovery)return `<h2>${L('Restore your account story')}</h2><p>${L('This device\'s save could not be read. Your account story is available. Restoring it keeps a separate copy of the unreadable device save.')}</p>${side(L('Account'),remote)}<button class="primary full" data-auth="use-remote">${L('Continue account story')}</button><button class="full" data-action="export">${L('Export unreadable device save')}</button>`;
 return `<h2>${L('Choose which progress to continue')}</h2><p>${L('There is already a different story on this account. Choose one before automatic saving resumes.')}</p><div class="cloud-compare">${side(L('This Device'),local)}${side(L('Account'),remote)}</div><div class="button-row"><button data-auth="keep-local">${L('Keep This Device\'s Save')}</button><button class="primary" data-auth="use-remote">${L('Continue account story')}</button></div><p class="help">${L('The story you choose will replace the other save. You can export this game first.')}</p><button class="full" data-action="export">${L('Export This Device\'s Save First')}</button>`;
}
