// Shortcut guide: pick the steps for this browser. No DOM here, so tests pass a user agent.
import {L} from './i18n.js';
export const SHORTCUT_HINT_KEY='super-rich-shortcut-hint';
export function shortcutBrowser(ua='',touchPoints=0){
 if(/iPhone|iPad|iPod/.test(ua)||/Macintosh/.test(ua)&&touchPoints>1)return'ios';
 if(/Android/.test(ua))return'android';
 if(/Edg(e|A|iOS)?\//.test(ua))return'edge';
 if(/Firefox\//.test(ua))return'firefox';
 if(/Chrome\/|Chromium\//.test(ua))return'chrome';
 if(/Macintosh/.test(ua)&&/Safari\//.test(ua))return'safari';
 return'other';
}
// Safari and iOS web apps keep their own storage; the others open the same browser profile and save.
export function shortcutGuide(browser,canInstall=false){
 const steps={
  chrome:[L('Click the install icon at the right end of the address bar.'),L('Or open the ⋮ menu → Cast, save and share → Install page as app.')],
  edge:[L('Click the install icon at the right end of the address bar.'),L('Or open the ⋯ menu → Apps → Install this site as an app, then choose Desktop.')],
  firefox:[L('Firefox cannot install web apps. Shrink the window so you can see the desktop.'),L('Drag the lock icon at the left of the address bar onto the desktop.')],
  safari:[L('On macOS Sonoma or later, choose File → Add to Dock in the menu bar.'),L('On older macOS, drag the address onto the desktop.')],
  ios:[L('Open this address in Safari and tap the Share button.'),L('Tap Add to Home Screen, then Add.')],
  android:[L('Open the browser ⋮ menu.'),L('Tap Install app or Add to Home screen.')],
  other:[L('Shrink the window so you can see the desktop.'),L('Drag the icon at the left of the address bar onto the desktop.')]
 }[browser]||[];
 const separate=browser==='ios'||browser==='safari';
 return L`<span class="eyebrow">ONE CLICK TO YOUR EMPIRE</span><h2>Add a Shortcut</h2><p>Open SUPER RICH straight from your desktop or home screen, without looking up the address.</p>${canInstall?L('<button type="button" class="primary full" data-pwa-install>Install SUPER RICH</button><p class="help">A desktop and Start menu shortcut is added right away.</p>'):''}<ol class="shortcut-steps">${steps.map(s=>`<li>${s}</li>`).join('')}</ol><p class="help">${separate?L('An app added from Safari keeps its own save. To continue this game there, export it in Settings and import it in the app.'):L('The shortcut opens this same browser, so your game continues where you left off.')}</p><p class="help">Bookmark instead: press Ctrl+D (⌘+D on Mac).</p>`;
}
