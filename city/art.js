import {L} from './i18n.js';
import {marketPrice} from './economy.js';
import {awardAssetFame} from './reputation.js';
import {reputationSummary} from './empire.js';
// Fictional in-game listings of famous public-domain masterpieces.
// The stylised previews are original CSS artwork, not museum photography.
export const BUYER_PREMIUM=.05;
export const ART_MAINTENANCE_RATE=.0008;

export const ARTWORKS={
 water_lilies:{name:L('Water Lilies'),original:'Nymphéas',artist:L('Claude Monet'),year:'1899–1926',price:12000000,annualRate:.035,rarity:'IMPRESSIONIST ICON',palette:['#547f78','#a9b987','#d3adbd'],description:L('The signature Impressionist series capturing a moment of light and water.')},
 the_kiss:{name:L('The Kiss'),original:'Der Kuss',artist:L('Gustav Klimt'),year:'1907–1908',price:28000000,annualRate:.032,rarity:'GOLDEN PERIOD',palette:['#b7902d','#e2c765','#54452e'],description:L('The Vienna Secession icon fusing gilded ornament with figures.')},
 girl_pearl:{name:L('Girl with a Pearl Earring'),original:'Girl with a Pearl Earring',artist:L('Johannes Vermeer'),year:'c. 1665',price:42000000,annualRate:.03,rarity:'DUTCH MASTER',palette:['#142c39','#d2a33e','#efe1c5'],description:L('A Dutch Golden Age masterpiece remembered for its light and gaze.')},
 starry_night:{name:L('The Starry Night'),original:'The Starry Night',artist:L('Vincent van Gogh'),year:'1889',price:95000000,annualRate:.045,rarity:'POST-IMPRESSIONIST ICON',palette:['#183b62','#e6c64c','#5c87a4'],description:L('The Post-Impressionist icon famous for its swirling night sky.')},
 night_watch:{name:L('The Night Watch'),original:'The Night Watch',artist:L('Rembrandt van Rijn'),year:'1642',price:110000000,annualRate:.028,rarity:'OLD MASTER',palette:['#2c2118','#9b7133','#b33f2f'],description:L('The Baroque masterpiece that reinvented the group portrait with light and motion.')},
 mona_lisa:{name:L('Mona Lisa'),original:'Mona Lisa',artist:L('Leonardo da Vinci'),year:'c. 1503–1519',price:500000000,annualRate:.025,rarity:'ULTIMATE MASTERPIECE',palette:['#403b28','#7b7450','#b4925e'],description:L('The priciest trophy art in the game world. A fictional listing unrelated to the real Louvre collection.')}
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

export function artPortfolio(s){
 const owned=artState(s).owned;
 // item.grown counts curated months (rich life); without the counter, appreciation follows elapsed time. Crash pricing applies on top.
 const value=Math.round(owned.reduce((sum,item)=>{const d=ARTWORKS[item.id],months=item.grown??Math.max(0,s.month-item.boughtMonth);return sum+marketPrice(s,item.price)*Math.pow(1+d.annualRate,months/12);},0));
 return{owned,value,cost:owned.reduce((sum,item)=>sum+(item.paid??item.price),0)};
}

export function artMaintenance(s){return Math.round(artPortfolio(s).value*ART_MAINTENANCE_RATE);}

export function validArt(s){
 const c=s.artCollection;if(c===undefined)return true;
 if(!c||!Array.isArray(c.owned)||c.owned.length>Object.keys(ARTWORKS).length)return false;
 const ids=new Set();
 return c.owned.every(item=>item&&Object.hasOwn(ARTWORKS,item.id)&&!ids.has(item.id)&&ids.add(item.id)&&item.price===ARTWORKS[item.id].price&&(item.paid===undefined||(Number.isFinite(item.paid)&&item.paid>=0&&item.paid<=item.price))&&Number.isInteger(item.boughtMonth)&&item.boughtMonth>=0&&item.boughtMonth<=s.month&&(item.grown===undefined||(Number.isInteger(item.grown)&&item.grown>=0&&item.grown<=s.month)));
}

function preview(id,d){return `<div class="art-frame"><div class="art-canvas art-${id}" style="--art-a:${d.palette[0]};--art-b:${d.palette[1]};--art-c:${d.palette[2]}"><i></i><i></i><i></i></div></div>`;}
export function artDialog(s){const p=artPortfolio(s);return L`<span class="eyebrow">PRIVATE MASTERPIECE SALE · GAME ONLY</span><h2>World Masterpiece Collection</h2><p>Win the great masters' signature works with game funds and complete your private gallery.</p><div class="art-summary"><div><small>COLLECTION</small><b>${p.owned.length} / ${Object.keys(ARTWORKS).length}</b></div><div><small>APPRAISED VALUE</small><b>${money(p.value)}</b></div><div><small>MONTHLY INSURANCE · STORAGE</small><b>${money(artMaintenance(s))}</b></div><div><small>CASH ON HAND</small><b>${money(s.money)}</b></div></div><div class="art-grid">${Object.entries(ARTWORKS).map(([id,d])=>{const owned=p.owned.some(item=>item.id===id),reason=artQuote(s,id);return L`<article class="art-lot ${owned?'owned':''}">${preview(id,d)}<div class="art-copy"><small>${d.rarity} · ${d.year}</small><h3>${d.name}</h3><p>${d.artist}<br><em>${d.original}</em></p><span>${d.description}</span><strong>${money(marketPrice(s,d.price))}</strong><small>Buyer's premium 5% · Total ${money(total(s,d))}${ART_FAME[id]?L` · Reputation ${ART_FAME[id]}+`:''}</small><button data-art-buy="${id}" ${reason?'disabled':''}>${owned?L('✦ Owned'):reason||L('Win at Auction')}</button></div></article>`;}).join('')}</div><p class="help">All artworks and transactions are fictional listings in the game world. The works shown are by masters whose copyright has expired, and the previews are abstract in-game renderings, not reproductions of the originals. Artworks appreciate 2.5–4.5% a year on normal market value, their appraisal shifts with the economic discount rate, and they count toward net worth. In Super Rich Life, appraisals rise only in months where you allocate 8+ hours to collection curation. 0.08% of the current appraisal is charged monthly for insurance, storage and upkeep.</p>`;}
