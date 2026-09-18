import {L,localized} from './i18n.js';
import {createRichGame} from './rich-life.js';
// Starting over from scratch: a new random map, the heir's starting assets and nothing from the old save.
// Language, sound and motion choices live outside the save, so they carry over.
const money=n=>'₲'+Math.round(n).toLocaleString('en-US'),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const NAME_LIMIT=24;
export function freshGame(name='',seed=Math.floor(Math.random()*1000)){
 const s=createRichGame('standard',seed,'heir'),n=String(name).trim().slice(0,NAME_LIMIT);
 if(n)s.name=n;
 return s;
}
// The confirm button stays disabled until the player ticks the box, so one stray tap never erases a save.
export function newGameDialog(s,wealth,{cloudLinked=false}={}){
 const year=Math.floor(s.month/12)+1,month=s.month%12+1;
 return L`<span class="eyebrow">START FROM SCRATCH</span><h2>Start a Completely New Game</h2><p>A new map, fresh starting assets and month one. Everything in your current game is erased.</p><div class="new-game-current"><b>${esc(localized(s.name))}</b><span>Year ${year}, month ${month} · Net worth ${money(wealth)}</span></div>${cloudLinked?L('<p class="help">Your cloud save is kept. This device stops syncing to it, so you can still load the old game there with its code.</p>'):''}<p class="help">Exported save files and the Classic game save are kept. Export first if you want to come back to this game.</p><label class="field-label">New neighborhood name<input id="new-game-name" maxlength="${NAME_LIMIT}" placeholder="${esc(L('Riverview Estate'))}"></label><label class="new-game-confirm"><input type="checkbox" id="new-game-confirm"> I understand my current game will be erased.</label><div class="button-row"><button data-action="export">Export Current Game</button><button data-action="new-game-start" class="primary" id="new-game-start" disabled>Start New Game</button></div>`;
}
