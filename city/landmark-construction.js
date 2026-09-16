import {L} from './i18n.js';
import {build,canBuild,developmentQuote,footprintCells,coords,SIZE} from './engine.js';
import {validLandmark} from './landmarks.js';
export function landmarkQuote(s,i,type,footprint){
 const q=developmentQuote(s,i,type,1,footprint),construction=q.construction*100,revenue=q.revenue*10;
 const fame=Math.max(0,500+(q.cells.length-1)*100-(s.empire?.landmarkFame?.[i]||0));
 return {...q,fame,baseConstruction:q.construction,construction,total:construction+q.land+q.demolition,revenue,profit:revenue-q.cost};
}
export function landmarkBuildError(s,i,design,footprint){
 if(!validLandmark(design))return L('Select a valid design.');
 const cells=footprintCells(i,footprint);
 if(!cells.length)return L('Select a lot inside the map, 1–3 tiles wide and tall.');
 if(cells.some(j=>s.tiles[j].terrain!=='land'||((s.tiles[j].type||s.tiles[j].owner)&&!(s.tiles[j].type==='plot'&&s.tiles[j].owner==='player'&&s.tiles[j].tenure==='buy'))))return L('The entire footprint must be empty land or your own empty lots.');
 const error=canBuild(s,i,design.type,'buy',footprint);if(error)return error;
 if(s.mode!=='sandbox'&&s.money<landmarkQuote(s,i,design.type,footprint).total)return L('Not enough cash to build the landmark.');
 return null;
}
// A lot grows right and down from its anchor. When the clicked tile can't be the anchor, slide the lot so the
// tile still sits inside it; the first buildable anchor wins. Returns null when no placement contains the tile.
export function landmarkAnchor(s,i,design,footprint){
 const {x,y}=coords(i),{width=1,height=1}=footprint||{};
 for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++){
  if(x-dx<0||y-dy<0)continue;
  const a=(y-dy)*SIZE+x-dx;if(!landmarkBuildError(s,a,design,footprint))return a;
 }
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
 s.log=[L`${design.name} landmark built on ${footprint.width}×${footprint.height} tiles · ₲${q.total.toLocaleString()} invested · Completion reputation +${q.fame}`,...previousLog].slice(0,25);
 return {ok:true,fame:q.fame,msg:L`Landmark complete! Reputation +${q.fame.toLocaleString('en-US')}`};
}
