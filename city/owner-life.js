import {L} from './i18n.js';
import {healthReason} from './health.js';
import {ARTWORKS} from './art.js';
import {mansionDesign,mansionArt} from './mansion.js';
import {mansionArtId} from './mansion-art.js';
import {buildingArtURL} from './building-art.js';
import {underConstruction} from './building-progress.js';
import {experienceReason,enjoyExperience} from './rich-life.js';
import {PROPERTY_PARTIES,hostPropertyParty} from './reputation.js';
import {enjoyUltra} from './ultra.js';

export const OWNER_SCENES={
 estate:{icon:'🏛',name:L('My Private Estate'),intro:L('The rooms and view you designed are yours to enjoy.'),choices:[
  {id:'morning',name:L('Summer · pool view'),caption:L('The house is quiet. Summer light crosses the rooms you designed, and the pool is yours for the day.')},
  {id:'garden',name:L('Spring · garden view'),caption:L('Spring has reached your garden. Take the long way through it; there is nowhere else you need to be.')},
  {id:'evening',name:L('Winter · city lights'),caption:L('The lights come on across your estate. Beyond the windows, the winter city sparkles.')}]},
 art:{icon:'🖼',name:L('My Private Gallery'),intro:L('Choose a masterpiece, then decide how to enjoy it.'),choices:[
  {id:'salon',name:L('Invite guests to a private viewing'),caption:L('Your guests gather around the painting. The room goes quiet before the conversation begins.')},
  {id:'quiet',name:L('Spend a quiet hour with the work'),caption:L('No crowd, no auction. Just you and the painting you chose to bring home.')}]},
 yacht:{icon:'🛥',name:L('My Yacht Voyage'),intro:L('Choose a route and time for your next voyage.'),choices:[
  {id:'coast-dawn',name:L('Coast · sunrise'),caption:L('Your yacht leaves the harbor as the first light reaches the water.')},
  {id:'island-sunset',name:L('Island · sunset'),caption:L('The island slips behind you while the deck catches the last gold of the day.')},
  {id:'harbor-night',name:L('Harbor · night'),caption:L('City lights shimmer across the water. The harbor is yours for the evening.')}]},
 resort:{icon:'🏝',name:L('My Resort'),intro:L('The owner has a place here, beyond the guest rooms.'),choices:[
  {id:'suite',name:L('Stay in the owner suite'),caption:L('The best room is waiting for you. The pool and gardens are just outside your door.')},
  {id:'gala',name:L('Host an opening gala'),caption:L('The guestbook reads: “A night we will remember.” Your resort has its own story now.')},
  {id:'pool',name:L('A private day by the pool'),caption:L('The loungers are ready and the water is still. You built this escape.')}]},
 jet:{icon:'✈',name:L('My Private Jet'),intro:L('Pick a destination. Your aircraft is waiting.'),choices:[
  {id:'paris',name:L('Paris'),caption:L('The city lights appear below as your private aircraft descends toward Paris.')},
  {id:'santorini',name:L('Santorini'),caption:L('Blue water and white cliffs fill the window. Your weekend begins when you land.')},
  {id:'tokyo',name:L('Tokyo'),caption:L('The skyline comes into view. Another corner of the world is within reach.')}]},
 golf:{icon:'⛳',name:L('My Golf Club'),intro:L('Choose who joins you on your own course.'),choices:[
  {id:'rival',name:L('Invite the rival to a round'),caption:L('The rival arrives at your clubhouse. For one afternoon, the contest is on your fairways.')},
  {id:'friends',name:L('Play with friends'),caption:L('Your friends gather at the first tee. The clubhouse photo will remember this round.')},
  {id:'solo',name:L('Walk the course alone'),caption:L('A quiet round on a course that carries your name. Even the final green feels personal.')}]}
};

const kinds=Object.keys(OWNER_SCENES);
const choiceFor=(kind,choice)=>OWNER_SCENES[kind]?.choices.find(c=>c.id===choice);
const date=month=>L`Year ${Math.floor(month/12)+1} · Month ${month%12+1}`;
const venueFor=(s,kind,venue)=>Number.isInteger(venue)?(s.tiles[venue]?.type===kind&&s.tiles[venue].owner==='player'&&s.tiles[venue].tenure==='buy'&&!underConstruction(s,s.tiles[venue])?venue:-1):s.tiles.findIndex(t=>t.type===kind&&t.owner==='player'&&t.tenure==='buy'&&!underConstruction(s,t));

export function ownerReason(s,kind,choice,venue){
 if(s.concept!=='rich-life'||!Object.hasOwn(OWNER_SCENES,kind))return L('Available in Super Rich Life only.');
 if((kind==='estate'&&!s.flex?.owned?.includes('penthouse'))||(kind==='yacht'&&!s.flex?.owned?.includes('yacht'))||(kind==='art'&&!s.artCollection?.owned?.length)||(kind==='jet'&&!s.ultra?.items?.jet?.complete)||(['resort','golf'].includes(kind)&&venueFor(s,kind,venue)<0))return L('Own this asset to unlock its private experience.');
 if(choice&&!choiceFor(kind,choice))return L('Choose an experience.');
 if(!choice)return null;
 const blocked=healthReason(s);if(blocked)return blocked;
 if(s.lifestyle?.lastOwner?.[kind]===s.month)return L('Already enjoyed this owner experience this month.');
 if(kind==='yacht')return experienceReason(s,'cruise');
 if(kind==='jet'&&s.ultra.items.jet.lastActivity===s.month)return L('Already flown this month.');
 if(kind==='resort'&&choice==='gala'&&s.reputation?.lastParties?.resort===s.month)return L('A resort party was already held this month.');
 if(kind==='resort'&&choice==='gala'&&s.money<PROPERTY_PARTIES.resort.cost)return L('Not enough cash to host the gala.');
 return null;
}

function picture(s,kind,entry){
 if(kind==='estate')return `./city/assets/mansion/${entry?.visual||mansionArtId(mansionDesign(s))}.webp`;
 if(kind==='art')return `./city/assets/art/${entry?.subject||s.artCollection?.owned?.[0]?.id||'water_lilies'}.jpg`;
 if(kind==='yacht')return './city/assets/experiences/private-yacht-cruise.webp';
 if(kind==='resort'||kind==='golf')return './'+buildingArtURL(kind,entry?.tier||1);
 return './city/assets/experiences/world-tour.webp';
}

export function enjoyOwnerScene(s,kind,choice,{subject,venue}={}){
 const reason=ownerReason(s,kind,choice,venue);if(reason)return{ok:false,msg:reason};
 if(kind==='art'&&!s.artCollection.owned.some(item=>item.id===subject))return{ok:false,msg:L('Choose a masterpiece you own.')};
 const site=['resort','golf'].includes(kind)?venueFor(s,kind,venue):-1;
 if(kind==='yacht'){const r=enjoyExperience(s,'cruise');if(!r.ok)return r;}
 else if(kind==='jet'){const r=enjoyUltra(s,'jet');if(!r.ok)return r;}
 else if(kind==='resort'&&choice==='gala'){const r=hostPropertyParty(s,site);if(!r.ok)return r;s.lifestyle??={spent:0,memories:0,last:{}};s.lifestyle.memories++;}
 else {s.lifestyle??={spent:0,memories:0,last:{}};s.lifestyle.memories++;s.stress=Math.max(0,s.stress-10);}
 const l=s.lifestyle;l.lastOwner??={};l.lastOwner[kind]=s.month;l.journal??=[];
 const entry={kind,choice,month:s.month};
 if(kind==='art')entry.subject=subject;
 if(kind==='estate')entry.visual=mansionArtId(mansionDesign(s));
 if(site>=0)entry.tier=Math.max(1,Math.min(3,s.tiles[site].level||1));
 l.journal.push(entry);
 s.log.unshift(L`✦ ${OWNER_SCENES[kind].name} · A new page in My Life Album`);s.log=s.log.slice(0,25);
 return{ok:true,msg:L('A new memory was added to My Life Album.'),entry};
}

export function ownerLifeDialog(s,kind,venue){
 if(!kind)return `<span class="eyebrow">${L('THE LIFE YOU OWN')}</span><h2>${L('My Private Life')}</h2><p>${L('Visit the places and collections that belong to you. Every choice becomes a page in your album.')}</p><div class="owner-life-grid">${kinds.map(id=>{const d=OWNER_SCENES[id],locked=ownerReason(s,id);return `<section class="owner-life-card"><span>${d.icon}</span><h3>${d.name}</h3><p>${d.intro}</p><button data-owner-open="${id}" ${locked?'disabled':''}>${locked||L('Enter my private world →')}</button></section>`;}).join('')}</div><button data-action="owner-album" class="primary full">${L`My Life Album · ${s.lifestyle?.journal?.length||0} pages`}</button><button data-action="lifestyle" class="full">${L('Back to experiences')}</button>`;
 const d=OWNER_SCENES[kind],locked=ownerReason(s,kind,null,venue);if(!d||locked)return ownerLifeDialog(s);
 const site=['resort','golf'].includes(kind)?venueFor(s,kind,venue):-1;
 const firstArt=s.artCollection?.owned?.[0]?.id;
 const artPicker=kind==='art'?`<label class="owner-art-pick">${L('Masterpiece on display')}<select id="owner-art">${s.artCollection.owned.map(item=>`<option value="${item.id}">${ARTWORKS[item.id].name}</option>`).join('')}</select></label>`:'';
 const hero=kind==='estate'?mansionArt(mansionDesign(s)):`<img src="${picture(s,kind,kind==='art'?{subject:firstArt}:site>=0?{tier:s.tiles[site].level}:null)}" alt="${d.name}" loading="lazy">`;
 const options=d.choices.map(c=>{const reason=ownerReason(s,kind,c.id,site);return `<button data-owner-choice="${c.id}" data-owner-kind="${kind}" ${site>=0?`data-owner-venue="${site}"`:''} ${reason?'disabled':''}><b>${c.name}</b><small>${reason||c.caption}</small></button>`;}).join('');
 return `<span class="eyebrow">${L('OWNER ACCESS')}</span><h2>${d.icon} ${d.name}</h2><p>${d.intro}</p><div class="owner-life-hero">${hero}</div>${artPicker}${kind==='jet'?`<div class="owner-flight-map" role="img" aria-label="${L('World destinations: Paris, Santorini, Tokyo')}"><span>✈ ${L('My route map')}</span><i>● ${L('Paris')}</i><i>● ${L('Santorini')}</i><i>● ${L('Tokyo')}</i></div>`:''}<div class="owner-life-options">${options}</div><button data-action="owner-album" class="full">${L('Open My Life Album')}</button><button data-action="owner-life" class="full">${L('All my private places')}</button>`;
}

export function ownerMemoryDialog(s,entry){
 const d=OWNER_SCENES[entry.kind],c=choiceFor(entry.kind,entry.choice);if(!d||!c)return ownerAlbumDialog(s);
 const subject=entry.kind==='art'?ARTWORKS[entry.subject]?.name:null;
 return `<span class="eyebrow">${L('MY LIFE ALBUM')} · ${date(entry.month)}</span><h2>${d.icon} ${c.name}</h2>${entry.kind==='jet'?`<div class="owner-departure"><img src="./city/assets/ultra/jet.webp" alt=""><span>${L('Private runway · your aircraft is ready')}</span></div>`:''}<figure class="owner-memory-photo"><img src="${picture(s,entry.kind,entry)}" alt="${subject||d.name}" loading="lazy"><figcaption>${c.caption}</figcaption></figure>${subject?`<p>${L('On display')}: <b>${subject}</b></p>`:''}${entry.kind==='art'&&entry.choice==='salon'?`<blockquote>${L('A guest whispers: “I could stand here for hours.”')}</blockquote>`:''}${entry.kind==='resort'&&entry.choice==='gala'?`<blockquote>${L('Guestbook · “A night we will remember.”')}</blockquote>`:''}${entry.kind==='jet'?`<div class="owner-stamp">✈ ${L`Destination stamp · ${c.name}`}</div>`:''}<p class="help">${L('This memory stays in your album even if you sell the asset.')}</p><button data-action="owner-album" class="primary full">${L('Back to My Life Album')}</button>`;
}

export function ownerAlbumDialog(s){const journal=s.lifestyle?.journal||[];return `<span class="eyebrow">${L('MY LIFE ALBUM')}</span><h2>${L('The life I chose')}</h2><p>${L('Every page records the place, the choice and the game month. Sold assets leave their memories here.')}</p>${journal.length?`<div class="owner-album-grid">${[...journal].reverse().map((entry,index)=>{const d=OWNER_SCENES[entry.kind],c=choiceFor(entry.kind,entry.choice);return `<button data-owner-memory="${journal.length-1-index}" class="owner-album-card"><img src="${picture(s,entry.kind,entry)}" alt="" loading="lazy"><small>${date(entry.month)} · ${d.name}</small><b>${c.name}</b></button>`;}).join('')}</div>`:`<p class="help">${L('Your first private experience will appear here.')}</p>`}<button data-action="owner-life" class="primary full">${L('Visit my private places')}</button>`;}
