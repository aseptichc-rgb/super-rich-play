import {L} from './i18n.js';
import {TYPES,assetValue} from './engine.js';
import {assetSummary} from './construction.js';
import {underConstruction} from './building-progress.js';
import {VEHICLES,ownedModels} from './luxury-models.js';
import {vehicleArtURL} from './vehicle-art.js';

export function displayBuildingDialog(s,i,report){
 const t=s.tiles[i],kind=t.type==='marina'?'yacht':'sportscar',models=VEHICLES[kind].filter(model=>ownedModels(s,kind).includes(model.id));
 const gallery=underConstruction(s,t)?`<p>${L('Your collection will be displayed when construction is complete.')}</p>`:models.length?`<div class="vehicle-grid">${models.map(model=>`<section class="vehicle-card"><img src="${vehicleArtURL(kind,model.id)}" alt="${model.name}" loading="lazy" width="1536" height="1024"><div><small>${L('✦ My collection')}</small><h3>${model.name}</h3><p>${model.desc}</p></div></section>`).join('')}</div>`:`<p>${L('No vehicles in this collection yet.')}</p>`;
 return `<span class="eyebrow">${L('MY COLLECTION')}</span><h2>${TYPES[t.type].icon} ${TYPES[t.type].name}</h2><p>${t.type==='marina'?L('All my yachts beside the river.'):L('All my cars on display.')}</p>${gallery}${assetSummary(s,i,report)}<div class="button-row"><button data-action="${kind==='yacht'?'yachts':'cars'}">${kind==='yacht'?L('Explore yachts'):L('Explore cars')}</button><button data-action="sell">${L('Sell Building')} · ₲${Math.round(assetValue(s,i)).toLocaleString('en-US')}</button></div>`;
}
