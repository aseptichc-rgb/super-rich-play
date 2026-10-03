import {L} from './i18n.js';

// Mobile panels are view state only; keep saved games and desktop preferences intact.
export function setupMobileUI(){
 const game=document.querySelector('.game');
 const media=window.matchMedia('(max-width:900px), (max-width:1100px) and (max-height:500px)');
 const styles=document.createElement('link');styles.rel='stylesheet';styles.href='./city/mobile.css';document.head.append(styles);
 const nav=document.createElement('nav');nav.className='mobile-nav';nav.setAttribute('aria-label',L('Mobile navigation'));
 const entries=[['map','⌖',L('Map','mobile'),'world'],['build','▥',L('Build','mobile'),'build-dock'],['office','✦',L('Office','mobile'),'live-card'],['assets','◧',L('Assets','mobile'),'game-sidebar'],['layers','▱',L('Layers','mobile'),'map-layers']];
 nav.innerHTML=entries.map(([id,icon,label,controls])=>`<button data-mobile-panel="${id}" aria-controls="${controls}" aria-pressed="false"><span aria-hidden="true">${icon}</span>${label}</button>`).join('');
 const close=document.createElement('button');close.className='mobile-panel-close';close.textContent='× '+L('Back to map');
 game.append(close,nav);
 function show(panel='map',focus=false){
  game.dataset.mobilePanel=panel;
  for(const button of nav.querySelectorAll('button')){
   const active=button.dataset.mobilePanel===panel;
   button.setAttribute('aria-pressed',String(active));
   if(button.dataset.mobilePanel!=='map')button.setAttribute('aria-expanded',String(active));
   if(focus&&active)button.focus({preventScroll:true});
  }
 }
 nav.addEventListener('click',e=>{const b=e.target.closest('button');if(b)show(game.dataset.mobilePanel===b.dataset.mobilePanel?'map':b.dataset.mobilePanel);});
 close.addEventListener('click',()=>show('map',true));
 game.addEventListener('keydown',e=>{if(media.matches&&e.key==='Escape'&&!document.querySelector('dialog[open]')){show('map',true);e.stopPropagation();}});
 // The desktop sidebar's close control also returns to the map on a phone.
 game.addEventListener('click',e=>{if(media.matches&&e.target.closest('[data-action="toggle-sidebar"]')){e.stopPropagation();show('map',true);}},true);
 media.addEventListener('change',()=>show(document.querySelector('#tutorial-card')?'assets':'map'));
 show();
 return {get active(){return media.matches;},show(panel){if(media.matches)show(panel);},close(){if(media.matches)show();}};
}
