import {marketPrice} from './economy.js';
import {awardAssetFame} from './reputation.js';
export const VEHICLES={
 sportscar:[
 {id:'roadster',name:'Ruby Roadster',price:80000,image:'car-roadster',color:'#a52d32',length:1,desc:'Light 2-seat open top · red body'},
 {id:'sunset',name:'Sunset Sports Coupe',price:250000,image:'sportscar',color:'#bca780',length:1.15,desc:'Champagne gold · mid-engine sports coupe'},
 {id:'gt',name:'Midnight GT',price:650000,image:'car-gt',color:'#1d3049',length:1.3,desc:'Long hood and elegant body · navy GT'},
 {id:'super',name:'Inferno Supercar',price:1800000,image:'car-super',color:'#df691e',length:1.2,desc:'Orange wide body · aerodynamic design'},
 {id:'hyper',name:'Phantom Hypercar',price:6000000,image:'car-hyper',color:'#b9c0c6',length:1.4,desc:'Silver and carbon body · large rear wing'}],
 yacht:[
 {id:'small',name:'Day Cruiser 8',price:90000,image:'yacht-small',color:'#f4ead8',length:8,desc:'8m · compact day cruiser · 1 deck'},
 {id:'medium',name:'Coastal 15',price:450000,image:'yacht-medium',color:'#d7e9eb',length:15,desc:'15m · weekend cruising · 2 decks'},
 {id:'riverside',name:'Riverside 30',price:1800000,image:'yacht',color:'#fff0d6',length:30,desc:'30m · private motor yacht · 3 decks'},
 {id:'super',name:'Ocean Palace 60',price:12000000,image:'yacht-super',color:'#eef5f4',length:60,desc:'60m · superyacht · 4 decks · pool'},
 {id:'mega',name:'Sovereign 100',price:65000000,image:'yacht-mega',color:'#bac8ce',length:100,desc:'100m · megayacht · 6 decks · helipad'}]
};
const LEGACY={sportscar:'sunset',yacht:'riverside'};
export const VEHICLE_MAINTENANCE_RATE={sportscar:.005,yacht:.008};
export const vehicleMaintenance=(model,kind)=>Math.round((model?.price||0)*(VEHICLE_MAINTENANCE_RATE[kind]||0));
export function ownedModels(s,kind){return s.flex?.vehicles?.[kind]?.owned??(s.flex?.owned.includes(kind)?[LEGACY[kind]]:[]);}
export function selectedModel(s,kind){if(!Object.hasOwn(VEHICLES,kind))return null;const id=s.flex?.vehicles?.[kind]?.selected??LEGACY[kind];return VEHICLES[kind].find(v=>v.id===id)||VEHICLES[kind][0];}
export function validVehicles(s){const v=s.flex?.vehicles;if(v===undefined)return true;return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.entries(v).every(([kind,c])=>Object.hasOwn(VEHICLES,kind)&&s.flex.owned.includes(kind)&&c&&Array.isArray(c.owned)&&c.owned.length>0&&new Set(c.owned).size===c.owned.length&&c.owned.every(id=>VEHICLES[kind].some(m=>m.id===id))&&c.owned.includes(c.selected));}
export function chooseVehicle(s,kind,id){if(!Object.hasOwn(VEHICLES,kind))return{ok:false,msg:'Check the collection type.'};const model=VEHICLES[kind].find(v=>v.id===id);if(!model)return{ok:false,msg:'Check the model.'};const owns=ownedModels(s,kind);if(owns.includes(id)){s.flex.vehicles??={};s.flex.vehicles[kind]={owned:[...owns],selected:id};return{ok:true,msg:model.name+' set as showcase model'};}
 if(s.money<marketPrice(s,model.price))return{ok:false,msg:'Not enough cash to buy.'};s.flex??={owned:[],lastParty:-1};s.flex.vehicles??={};s.flex.vehicles[kind]={owned:[...owns,id],selected:id};if(!s.flex.owned.includes(kind))s.flex.owned.push(kind);s.money-=marketPrice(s,model.price);s.log.unshift(`✦ ${model.name} acquired · ₲${marketPrice(s,model.price).toLocaleString('en-US')}`);s.log=s.log.slice(0,25);awardAssetFame(s,`vehicle:${kind}:${id}`,model.price,model.name+' acquired');return{ok:true,msg:model.name+' purchased and set as showcase model'};
}
export function vehicleDialog(s,kind){const models=VEHICLES[kind];if(!models)return'';const own=ownedModels(s,kind),selected=selectedModel(s,kind),rate=VEHICLE_MAINTENANCE_RATE[kind]*100;return `<span class="eyebrow">${kind==='sportscar'?'PRIVATE GARAGE':'PRIVATE MARINA'}</span><h2>${kind==='sportscar'?'My Sports Car Collection':'My Yacht Collection'}</h2><p>Compare 5 models and add them to your collection. Models you already own can be set as the showcase for free.</p><div class="vehicle-grid">${models.map(m=>`<section class="vehicle-card"><img src="city/assets/luxury/${m.image}.png" alt="${m.name}" loading="lazy" width="1536" height="1024"><div><small>${own.includes(m.id)?selected.id===m.id?'✦ Showcase model':'Owned':'New to collection'}</small><h3>${m.name}</h3><p>${m.desc}</p><strong>₲${marketPrice(s,m.price).toLocaleString('en-US')}</strong><small>Monthly upkeep ₲${vehicleMaintenance(m,kind).toLocaleString('en-US')}</small><button data-vehicle-kind="${kind}" data-vehicle-id="${m.id}" ${own.includes(m.id)&&selected.id===m.id||!own.includes(m.id)&&s.money<marketPrice(s,m.price)?'disabled':''}>${own.includes(m.id)?selected.id===m.id?'Selected':'Set as showcase model':s.money<marketPrice(s,m.price)?'Not enough cash':'Buy · set as showcase'}</button></div></section>`).join('')}</div><p class="help">Purchases come out of cash and net worth. Every model you own is charged ${rate}% of its list price each month in upkeep. There is no resale or trade-in, and older models stay in your collection. Saves from earlier versions keep the Sunset Coupe and the Riverside 30.</p><button data-action="flex" class="full">Back to my collection</button>`;}
