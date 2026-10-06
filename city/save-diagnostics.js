import {migrateSave,validSave} from './engine.js';
import {validPlayTime} from './play-time.js';
import {validHealth} from './health.js';
import {validMissions} from './missions.js';
import {validMarket} from './market.js';
import {validLandmarks} from './landmarks.js';
import {validConstruction} from './building-progress.js';
// Diagnose a copy. Never relax save validation or write a repaired server save automatically.
export function inspectSave(json){
 let raw;try{raw=JSON.parse(json);}catch{return{save:null,reason:'invalid-json'};}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return{save:null,reason:'invalid-shape'};
 if(raw.version!==2)return{save:null,reason:'unsupported-version'};
 let save;try{save=migrateSave(structuredClone(raw));}catch{return{save:null,reason:'migration'};}
 const checks=[['play-time',validPlayTime],['health',validHealth],['missions',validMissions],['market',validMarket],['landmarks',validLandmarks],['construction',validConstruction]];
 try{for(const [reason,check] of checks)if(!check(save))return{save:null,reason};if(!validSave(save))return{save:null,reason:'game-rules'};}catch{return{save:null,reason:'game-rules'};}
 return{save,reason:null};
}
