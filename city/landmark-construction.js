import {build,canBuild,developmentQuote,footprintCells} from './engine.js';
import {validLandmark} from './landmarks.js';
export function landmarkQuote(s,i,type,footprint){
 const q=developmentQuote(s,i,type,1,footprint),construction=q.construction*100,revenue=q.revenue*10;
 const fame=Math.max(0,500+(q.cells.length-1)*100-(s.empire?.landmarkFame?.[i]||0));
 return {...q,fame,baseConstruction:q.construction,construction,total:construction+q.land,revenue,profit:revenue-q.cost};
}
export function landmarkBuildError(s,i,design,footprint){
 if(!validLandmark(design))return 'Select a valid design.';
 const cells=footprintCells(i,footprint);
 if(!cells.length)return 'Select a lot inside the map, 1–3 tiles wide and tall.';
 if(cells.some(j=>s.tiles[j].terrain!=='land'||s.tiles[j].type||s.tiles[j].owner))return 'The entire footprint of the selected size must be empty.';
 const error=canBuild(s,i,design.type,'buy',footprint);if(error)return error;
 if(s.mode!=='sandbox'&&s.money<landmarkQuote(s,i,design.type,footprint).total)return 'Not enough cash to build the landmark.';
 return null;
}
export function buildLandmark(s,i,design,footprint){
 const error=landmarkBuildError(s,i,design,footprint);if(error)return {ok:false,msg:error};
 const previousLog=[...s.log],q=landmarkQuote(s,i,design.type,footprint),result=build(s,i,design.type,'buy',footprint);if(!result.ok)return result;
 const t=s.tiles[i],extra=q.construction-q.baseConstruction;
 if(s.mode!=='sandbox')s.money-=extra;
 t.constructionCost=q.construction;t.assetLedger.initial+=extra;t.assetLedger.buildingValue*=100;t.landmark={...design};
 s.empire??={owned:[]};s.empire.landmarkFame??={};
 s.empire.landmarkFame[i]=(s.empire.landmarkFame[i]||0)+q.fame;s.empire.earnedFame=(s.empire.earnedFame||0)+q.fame;
 s.log=[`${design.name} landmark built on ${footprint.width}×${footprint.height} tiles · ₲${q.total.toLocaleString()} invested · Completion reputation +${q.fame}`,...previousLog].slice(0,25);
 return {ok:true,fame:q.fame,msg:`Landmark complete! Reputation +${q.fame.toLocaleString('en-US')}`};
}
