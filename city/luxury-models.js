import {L} from './i18n.js';
import {marketPrice} from './economy.js';
import {awardAssetFame} from './reputation.js';
export const VEHICLES={
 sportscar:[
 {id:'roadster',name:L('Ruby Roadster'),price:80000,image:'car-roadster',color:'#a52d32',length:1,desc:L('Light 2-seat open top · red body')},
 {id:'sunset',name:L('Sunset Sports Coupe'),price:250000,image:'sportscar',color:'#bca780',length:1.15,desc:L('Champagne gold · mid-engine sports coupe')},
 {id:'gt',name:L('Midnight GT'),price:650000,image:'car-gt',color:'#1d3049',length:1.3,desc:L('Long hood and elegant body · navy GT')},
 {id:'super',name:L('Inferno Supercar'),price:1800000,image:'car-super',color:'#df691e',length:1.2,desc:L('Orange wide body · aerodynamic design')},
 {id:'hyper',name:L('Phantom Hypercar'),price:6000000,image:'car-hyper',color:'#b9c0c6',length:1.4,desc:L('Silver and carbon body · large rear wing')}],
 yacht:[
 {id:'small',name:L('Day Cruiser 8'),price:90000,image:'yacht-small',color:'#f4ead8',length:8,desc:L('8m · compact day cruiser · 1 deck')},
 {id:'medium',name:L('Coastal 15'),price:450000,image:'yacht-medium',color:'#d7e9eb',length:15,desc:L('15m · weekend cruising · 2 decks')},
 {id:'riverside',name:L('Riverside 30'),price:1800000,image:'yacht',color:'#fff0d6',length:30,desc:L('30m · private motor yacht · 3 decks')},
 {id:'super',name:L('Ocean Palace 60'),price:12000000,image:'yacht-super',color:'#eef5f4',length:60,desc:L('60m · superyacht · 4 decks · pool')},
 {id:'mega',name:L('Sovereign 100'),price:65000000,image:'yacht-mega',color:'#bac8ce',length:100,desc:L('100m · megayacht · 6 decks · helipad')}]
};
const LEGACY={sportscar:'sunset',yacht:'riverside'};
export const VEHICLE_MAINTENANCE_RATE={sportscar:.005,yacht:.008};
export const vehicleMaintenance=(model,kind)=>Math.round((model?.price||0)*(VEHICLE_MAINTENANCE_RATE[kind]||0));
export function ownedModels(s,kind){return s.flex?.vehicles?.[kind]?.owned??(s.flex?.owned.includes(kind)?[LEGACY[kind]]:[]);}
export function selectedModel(s,kind){if(!Object.hasOwn(VEHICLES,kind))return null;const id=s.flex?.vehicles?.[kind]?.selected??LEGACY[kind];return VEHICLES[kind].find(v=>v.id===id)||VEHICLES[kind][0];}
export function validVehicles(s){const v=s.flex?.vehicles;if(v===undefined)return true;return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.entries(v).every(([kind,c])=>Object.hasOwn(VEHICLES,kind)&&s.flex.owned.includes(kind)&&c&&Array.isArray(c.owned)&&c.owned.length>0&&new Set(c.owned).size===c.owned.length&&c.owned.every(id=>VEHICLES[kind].some(m=>m.id===id))&&c.owned.includes(c.selected));}
export function chooseVehicle(s,kind,id){if(!Object.hasOwn(VEHICLES,kind))return{ok:false,msg:L('Check the collection type.')};const model=VEHICLES[kind].find(v=>v.id===id);if(!model)return{ok:false,msg:L('Check the model.')};const owns=ownedModels(s,kind);if(owns.includes(id)){s.flex.vehicles??={};s.flex.vehicles[kind]={owned:[...owns],selected:id};return{ok:true,msg:model.name+L(' set as showcase model')};}
 if(s.money<marketPrice(s,model.price))return{ok:false,msg:L('Not enough cash to buy.','purchase')};s.flex??={owned:[],lastParty:-1};s.flex.vehicles??={};s.flex.vehicles[kind]={owned:[...owns,id],selected:id};if(!s.flex.owned.includes(kind))s.flex.owned.push(kind);s.money-=marketPrice(s,model.price);s.log.unshift(L`✦ ${model.name} acquired · ₲${marketPrice(s,model.price).toLocaleString('en-US')}`);s.log=s.log.slice(0,25);awardAssetFame(s,`vehicle:${kind}:${id}`,model.price,model.name+L(' acquired'));return{ok:true,msg:model.name+L(' purchased and set as showcase model')};
}
export function vehicleDialog(s,kind){const models=VEHICLES[kind];if(!models)return'';const own=ownedModels(s,kind),selected=selectedModel(s,kind),rate=VEHICLE_MAINTENANCE_RATE[kind]*100;return L`<span class="eyebrow">${kind==='sportscar'?'PRIVATE GARAGE':'PRIVATE MARINA'}</span><h2>${kind==='sportscar'?L('My Sports Car Collection'):L('My Yacht Collection')}</h2><p>Compare 5 models and add them to your collection. Models you already own can be set as the showcase for free.</p><div class="vehicle-grid">${models.map(m=>L`<section class="vehicle-card"><img src="city/assets/luxury/${m.image}.png" alt="${m.name}" loading="lazy" width="1536" height="1024"><div><small>${own.includes(m.id)?selected.id===m.id?L('✦ Showcase model'):L('Owned'):L('New to collection')}</small><h3>${m.name}</h3><p>${m.desc}</p><strong>₲${marketPrice(s,m.price).toLocaleString('en-US')}</strong><small>Monthly upkeep ₲${vehicleMaintenance(m,kind).toLocaleString('en-US')}</small><button data-vehicle-kind="${kind}" data-vehicle-id="${m.id}" ${own.includes(m.id)&&selected.id===m.id||!own.includes(m.id)&&s.money<marketPrice(s,m.price)?'disabled':''}>${own.includes(m.id)?selected.id===m.id?L('Selected'):L('Set as showcase model'):s.money<marketPrice(s,m.price)?L('Not enough cash'):L('Buy · set as showcase')}</button></div></section>`).join('')}</div><p class="help">Purchases come out of cash and net worth. Every model you own is charged ${rate}% of its list price each month in upkeep. There is no resale or trade-in, and older models stay in your collection. Saves from earlier versions keep the Sunset Coupe and the Riverside 30.</p><button data-action="flex" class="full">Back to my collection</button>`;}
