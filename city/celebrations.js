import {L} from './i18n.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scenes={
 hq:{src:'celebrations/hq.png',alt:()=>L('Ribbon cutting at your new headquarters')},
 landmark:{src:'celebrations/landmark.png',alt:()=>L('Fireworks at a landmark opening ceremony')},
 achievement:{src:'celebrations/achievement.png',alt:()=>L('A reception celebrating your latest achievement')},
 ...Object.fromEntries(['classic','modern','resort'].map(style=>['mansion-'+style,{src:'luxury/mansion-'+style+'.png',alt:()=>L('Your completed private residence')}]))
};
export function celebrationImage(kind='achievement'){
 const scene=scenes[Object.hasOwn(scenes,kind)?kind:'achievement'];
 return `<figure class="celebration-image"><img src="./city/assets/${scene.src}" alt="${esc(scene.alt())}" width="1536" height="1024"><figcaption>${L('A moment to celebrate')}</figcaption></figure>`;
}
export function celebrationDialog(kind,title,message,details=''){
 return `<section class="celebration-result"><span class="eyebrow">${L('A NEW CHAPTER IN YOUR STORY')}</span><h2>${esc(title)}</h2>${celebrationImage(kind)}<p class="celebration-message" role="status">${esc(message)}</p>${details}<button data-action="close" class="primary full">${L('Continue')}</button></section>`;
}
