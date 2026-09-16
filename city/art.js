import {L} from './i18n.js';
import {marketPrice} from './economy.js';
import {awardAssetFame} from './reputation.js';
import {reputationSummary} from './empire.js';
import {mansionDesign,MANSION_STYLES} from './mansion.js';
// Fictional in-game listings of famous public-domain masterpieces.
// Public-domain image sources and reuse notes: assets/art/SOURCES.md.
export const BUYER_PREMIUM=.05;
export const ART_MAINTENANCE_RATE=.0008;

export const ARTWORKS={
 water_lilies:{name:L('Water Lilies'),original:'Nymphéas',artist:L('Claude Monet'),year:'1899–1926',price:12000000,annualRate:.035,rarity:'IMPRESSIONIST ICON',description:L('The signature Impressionist series capturing a moment of light and water.')},
 the_kiss:{name:L('The Kiss'),original:'Der Kuss',artist:L('Gustav Klimt'),year:'1907–1908',price:28000000,annualRate:.032,rarity:'GOLDEN PERIOD',description:L('The Vienna Secession icon fusing gilded ornament with figures.')},
 girl_pearl:{name:L('Girl with a Pearl Earring'),original:'Girl with a Pearl Earring',artist:L('Johannes Vermeer'),year:'c. 1665',price:42000000,annualRate:.03,rarity:'DUTCH MASTER',description:L('A Dutch Golden Age masterpiece remembered for its light and gaze.')},
 starry_night:{name:L('The Starry Night'),original:'The Starry Night',artist:L('Vincent van Gogh'),year:'1889',price:95000000,annualRate:.045,rarity:'POST-IMPRESSIONIST ICON',description:L('The Post-Impressionist icon famous for its swirling night sky.')},
 night_watch:{name:L('The Night Watch'),original:'The Night Watch',artist:L('Rembrandt van Rijn'),year:'1642',price:110000000,annualRate:.028,rarity:'OLD MASTER',description:L('The Baroque masterpiece that reinvented the group portrait with light and motion.')},
 mona_lisa:{name:L('Mona Lisa'),original:'Mona Lisa',artist:L('Leonardo da Vinci'),year:'c. 1503–1519',price:500000000,annualRate:.025,rarity:'ULTIMATE MASTERPIECE',description:L('The priciest trophy art in the game world. A fictional listing unrelated to the real Louvre collection.')}
};

export const artState=s=>s.artCollection??{owned:[]};
const total=(s,d)=>Math.round(marketPrice(s,d.price)*(1+BUYER_PREMIUM));
const money=n=>'₲'+Math.round(n).toLocaleString('en-US');

// Auction houses only invite collectors with a reputation; each lot has a fame threshold.
export const ART_FAME={water_lilies:0,the_kiss:40,girl_pearl:80,starry_night:150,night_watch:200,mona_lisa:300};
export const artFame=s=>reputationSummary(s).fame;
export function artQuote(s,id){
 const d=ARTWORKS[id],owned=artState(s).owned;
 if(!d)return L('No artwork selected.');
 if(owned.some(item=>item.id===id))return L('Already in your collection.');
 if(s.mode!=='sandbox'&&artFame(s)<(ART_FAME[id]||0))return L`Reputation ${ART_FAME[id]} required (currently ${Math.round(artFame(s))})`;
 if(s.money<total(s,d))return L`Cash ${money(total(s,d))} required`;
 return null;
}

export function buyArtwork(s,id){
 const error=artQuote(s,id);if(error)return{ok:false,msg:error};
 const d=ARTWORKS[id],paid=total(s,d);
 s.artCollection??={owned:[]};s.money-=paid;
 s.artCollection.owned.push({id,price:d.price,paid:marketPrice(s,d.price),boughtMonth:s.month});
 s.log.unshift(L`🖼 ${d.artist} 〈${d.name}〉 won at auction · ${money(paid)} (fees included)`);s.log=s.log.slice(0,25);
 awardAssetFame(s,`art:${id}`,d.price,d.name+L(' won at auction'));
 return{ok:true,msg:L`${d.artist} 〈${d.name}〉 · now on display in your private gallery!`,paid};
}

// item.grown counts curated months (rich life); without the counter, appreciation follows elapsed time. Crash pricing applies on top.
function itemValue(s,item){const months=item.grown??Math.max(0,s.month-item.boughtMonth);return marketPrice(s,item.price)*Math.pow(1+ARTWORKS[item.id].annualRate,months/12);}
export function artPortfolio(s){
 const owned=artState(s).owned;
 const value=Math.round(owned.reduce((sum,item)=>sum+itemValue(s,item),0));
 return{owned,value,cost:owned.reduce((sum,item)=>sum+(item.paid??item.price),0)};
}

export function artMaintenance(s){return Math.round(artPortfolio(s).value*ART_MAINTENANCE_RATE);}

export function validArt(s){
 const c=s.artCollection;if(c===undefined)return true;
 if(!c||!Array.isArray(c.owned)||c.owned.length>Object.keys(ARTWORKS).length)return false;
 const ids=new Set();
 return c.owned.every(item=>item&&Object.hasOwn(ARTWORKS,item.id)&&!ids.has(item.id)&&ids.add(item.id)&&item.price===ARTWORKS[item.id].price&&(item.paid===undefined||(Number.isFinite(item.paid)&&item.paid>=0&&item.paid<=item.price))&&Number.isInteger(item.boughtMonth)&&item.boughtMonth>=0&&item.boughtMonth<=s.month&&(item.grown===undefined||(Number.isInteger(item.grown)&&item.grown>=0&&item.grown<=s.month)));
}

// Owned works hang in the player's mansion, dressed in its architectural style; without a mansion they sit in a viewing room.
function hall(s){if(!s.flex?.owned?.includes('penthouse'))return{theme:'vault',name:L('Private Viewing Room')};const style=mansionDesign(s).style;return{theme:style,name:MANSION_STYLES[style]};}
const image=(id,d,cls='')=>`<img class="${cls}" src="./city/assets/art/${id}.jpg" alt="${d.artist} — ${d.name}" decoding="async">`;
// Only won works can be viewed up close; unwon lots stay behind frosted glass.
function preview(id,d,owned){return owned?`<button class="art-frame art-view-link" data-art-view="${id}">${image(id,d,'art-canvas')}<span class="art-view-hint">${L('View in my mansion')}</span></button>`:`<div class="art-frame locked">${image(id,d,'art-canvas')}<span class="art-lock">${L('🔒 Win it to view up close')}</span></div>`;}
function gallery(s){
 const owned=artState(s).owned,h=hall(s);
 if(!owned.length)return L`<section class="mansion-gallery theme-${h.theme} empty"><header><small>MY MANSION GALLERY · ${h.name}</small></header><div class="gallery-wall"><p>The walls are still bare. Works you win are hung here, and only they can be viewed up close.</p></div></section>`;
 const hung=owned.map(({id})=>{const d=ARTWORKS[id];return `<button class="hung-art" data-art-view="${id}"><span class="gilt">${image(id,d)}</span><i class="plaque">${d.name}</i></button>`;}).join('');
 return L`<section class="mansion-gallery theme-${h.theme}"><header><small>MY MANSION GALLERY · ${h.name}</small><span>Tap a painting to view it up close</span></header><div class="gallery-wall">${hung}</div></section>`;
}
export function artViewDialog(s,id){
 const owned=artState(s).owned,i=owned.findIndex(item=>item.id===id);
 if(i<0)return null;
 const item=owned[i],d=ARTWORKS[id],h=hall(s),value=itemValue(s,item),paid=item.paid??item.price,change=paid?(value/paid-1)*100:0;
 const row=(label,amount,cls='')=>`<div><small>${label}</small><b class="${cls}">${amount}</b></div>`;
 const nav=owned.length>1?`<button data-art-view="${owned[(i-1+owned.length)%owned.length].id}">${L('← Previous work')}</button><button data-art-view="${owned[(i+1)%owned.length].id}">${L('Next work →')}</button>`:'';
 return L`<div class="art-room theme-${h.theme}"><div class="room-wall"><span class="room-light"></span><button class="room-painting" data-art-zoom aria-pressed="false" title="Zoom to full size"><span class="gilt">${image(id,d)}</span><span class="plaque"><b>${d.name}</b>${d.artist} · ${d.year}</span></button></div><div class="room-floor"></div></div><div class="art-view-body"><div class="art-view-copy"><span class="eyebrow">${h.name} · MY COLLECTION · ${i+1} / ${owned.length}</span><h2>${d.name}</h2><p class="art-view-artist">${d.artist} · <em>${d.original}</em> · ${d.year}</p><p>${d.description}</p><p class="help">Tap the painting to zoom to full size and scroll across the brushwork.</p></div><div class="art-view-stats">${row(L('Won'),L`Year ${Math.floor(item.boughtMonth/12)+1} · Month ${item.boughtMonth%12+1}`)}${row(L('Hammer price'),money(paid))}${row(L('Current appraisal'),money(value))}${row(L('Change'),`${change>=0?'+':''}${change.toFixed(1)}%`,change>=0?'positive':'negative')}</div></div><div class="art-view-nav">${nav}<button data-action="art" class="primary">Back to Collection</button></div>`;
}
export function artDialog(s){const p=artPortfolio(s);return L`<span class="eyebrow">PRIVATE MASTERPIECE SALE · GAME ONLY</span><h2>World Masterpiece Collection</h2><p>Win the great masters' signature works with game funds and complete your private gallery.</p>${gallery(s)}<div class="art-summary"><div><small>COLLECTION</small><b>${p.owned.length} / ${Object.keys(ARTWORKS).length}</b></div><div><small>APPRAISED VALUE</small><b>${money(p.value)}</b></div><div><small>MONTHLY INSURANCE · STORAGE</small><b>${money(artMaintenance(s))}</b></div><div><small>CASH ON HAND</small><b>${money(s.money)}</b></div></div><div class="art-grid">${Object.entries(ARTWORKS).map(([id,d])=>{const owned=p.owned.some(item=>item.id===id),reason=artQuote(s,id);return L`<article class="art-lot ${owned?'owned':''}">${preview(id,d,owned)}<div class="art-copy"><small>${d.rarity} · ${d.year}</small><h3>${d.name}</h3><p>${d.artist}<br><em>${d.original}</em></p><span>${d.description}</span><strong>${money(marketPrice(s,d.price))}</strong><small>Buyer's premium 5% · Total ${money(total(s,d))}${ART_FAME[id]?L` · Reputation ${ART_FAME[id]}+`:''}</small><button data-art-buy="${id}" ${reason?'disabled':''}>${owned?L('✦ Owned'):reason||L('Win at Auction')}</button></div></article>`;}).join('')}</div><p class="help">All artworks and transactions are fictional listings in the game world. The previews use public-domain reproductions of the original paintings. Artworks appreciate 2.5–4.5% a year on normal market value, their appraisal shifts with the economic discount rate, and they count toward net worth. In Super Rich Life, appraisals rise only in months where you allocate 8+ hours to collection curation. 0.08% of the current appraisal is charged monthly for insurance, storage and upkeep.</p>`;}
