import {L} from './i18n.js';
import {ULTRA_ITEMS,ultraReason,buyUltra,placeUltra} from './ultra.js';
import {ultraPlacementError} from './ultra-placement.js';
import {moonHitPosition} from './ultra-map.js';

export function createUltraUI({getState,renderer,preparePlacement,openDialog,closeDialog,changed,toast}){
 let pending=null;
 function cancel(){pending=null;renderer.setUltraPlacement(null);}
 function begin(id){
  const s=getState();if(!Object.hasOwn(ULTRA_ITEMS,id))return;
  const existing=!!s.ultra?.items?.[id],reason=existing?null:ultraReason(s,id);if(reason)return toast(reason);
  if(ULTRA_ITEMS[id].operation){
   if(existing)return;
   cancel();pending={id,existing:false};const d=ULTRA_ITEMS[id];
   openDialog('ultra-contract',`<h2>${d.name}</h2><p>${d.description}</p><p>${L('Uses the completed facility · No additional land required')}</p><strong>${L`Total price · ₲${d.cost.toLocaleString('en-US')}`}</strong><p>${L`${d.months} game months to complete`}</p><p>${d.income?L`Monthly net profit after deployment · ₲${d.income.toLocaleString('en-US')}`:L`Reputation +${d.fame} on completion`}</p><div class="button-row"><button class="primary" data-ultra-confirm>${L('Confirm and start')}</button><button data-ultra-cancel>${L('Cancel')}</button></div>`);return;
  }
  closeDialog();preparePlacement();pending={id,existing};renderer.setUltraPlacement(id);
  if(id==='moon')renderer.focusMoon();else if(s.ultra?.items?.[id]?.position)renderer.focusUltra(id);else renderer.home();
  toast(id==='moon'?L('Choose a 3×3 site on the Moon.'):L('Choose 9 empty city tiles. Press Esc to cancel.'));
 }
 function pick(i){
  if(!pending||ULTRA_ITEMS[pending.id].operation)return false;
  const s=getState(),size=Math.sqrt(s.tiles.length),p=pending.id==='moon'?moonHitPosition(i):i>=0?{x:i%size,y:Math.floor(i/size)}:null;
  const reason=ultraPlacementError(s,pending.id,p);if(reason){toast(reason);return true;}
  pending.position=p;const d=ULTRA_ITEMS[pending.id];
  openDialog('ultra-contract',`<h2>${d.name}</h2><img class="ultra-contract-art" src="./city/assets/ultra/${pending.id}.webp" alt="${d.name}"><h3>${L('Confirm this 3×3 site?')}</h3><p>${pending.id==='moon'?L('Moon'):L('City')} · ${p.x+1}, ${p.y+1} → ${p.x+3}, ${p.y+3}</p><p>${pending.existing?L('Relocation is free. Construction progress is preserved.'):L`Total price · ₲${d.cost.toLocaleString('en-US')}`}</p><div class="button-row"><button class="primary" data-ultra-confirm>${pending.existing?L('Confirm location'):L('Confirm purchase and build')}</button><button data-ultra-cancel>${L('Cancel')}</button></div>`);
  return true;
 }
 function confirm(){
  if(!pending||!pending.position&&!ULTRA_ITEMS[pending.id].operation)return;
  const {id,position,existing}=pending,s=getState(),result=existing?placeUltra(s,id,position):buyUltra(s,id,position);
  if(!result.ok){toast(result.msg);return;}
  cancel();changed();closeDialog();renderer.focusUltra(ULTRA_ITEMS[id].operation?ULTRA_ITEMS[id].requires:id);toast(result.msg);
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pending){cancel();closeDialog();}});
 return{begin,pick,confirm,cancel};
}
