import {build,canBuild,developmentQuote,footprintCells} from './engine.js';
import {validLandmark} from './landmarks.js';
export function landmarkQuote(s,i,type,footprint){
 const q=developmentQuote(s,i,type,1,footprint),construction=q.construction*100,revenue=q.revenue*10;
 const fame=Math.max(0,500+(q.cells.length-1)*100-(s.empire?.landmarkFame?.[i]||0));
 return {...q,fame,baseConstruction:q.construction,construction,total:construction+q.land,revenue,profit:revenue-q.cost};
}
export function landmarkBuildError(s,i,design,footprint){
 if(!validLandmark(design))return '유효한 설계를 선택하세요.';
 const cells=footprintCells(i,footprint);
 if(!cells.length)return '가로·세로 1~3칸의 지도 안쪽 부지를 선택하세요.';
 if(cells.some(j=>s.tiles[j].terrain!=='land'||s.tiles[j].type||s.tiles[j].owner))return '선택한 크기의 전체 부지가 비어 있어야 합니다.';
 const error=canBuild(s,i,design.type,'buy',footprint);if(error)return error;
 if(s.mode!=='sandbox'&&s.money<landmarkQuote(s,i,design.type,footprint).total)return '랜드마크 건설 자금이 부족합니다.';
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
 s.log=[`${design.name} 랜드마크 ${footprint.width}×${footprint.height}칸 건설 · ₲${q.total.toLocaleString()} 투자 · 완공 명성 +${q.fame}`,...previousLog].slice(0,25);
 return {ok:true,fame:q.fame,msg:`랜드마크 완공! 명성 +${q.fame.toLocaleString('ko-KR')}`};
}
