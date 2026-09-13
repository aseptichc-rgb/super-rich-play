import {mansionDesign,mansionMaintenance} from './mansion.js';
import {VEHICLES,ownedModels,vehicleMaintenance} from './luxury-models.js';
import {artMaintenance} from './art.js';

export const BASE_LIVING_COST=1100;

function vehicleCost(s,kind){
 const ids=ownedModels(s,kind);
 return ids.reduce((sum,id)=>sum+vehicleMaintenance(VEHICLES[kind].find(model=>model.id===id),kind),0);
}

export function lifestyleCostReport(s){
 const mansion=s.flex?.owned.includes('penthouse')?mansionMaintenance(mansionDesign(s)):0;
 const sportscar=vehicleCost(s,'sportscar');
 const yacht=vehicleCost(s,'yacht');
 const art=artMaintenance(s);
 const maintenance=mansion+sportscar+yacht+art,base=BASE_LIVING_COST*(s.scenario==='windfall'?3:1);
 return{base,mansion,sportscar,yacht,art,maintenance,total:base+maintenance};
}
