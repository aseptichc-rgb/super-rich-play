import {underConstruction} from './building-progress.js';
import {VEHICLES,ownedModels} from './luxury-models.js';
import {CAR_DESIGNS,YACHT_DESIGNS} from './map-vehicles.js';

// Display positions are derived from ownership and terrain, never written to saves.
export function mapCollection(s){
 const size=Math.sqrt(s.tiles.length),cars=[],yachts=[];
 const site=type=>s.tiles.findIndex(t=>t.type===type&&t.owner==='player'&&!underConstruction(s,t));
 const garage=site('garage'),marina=site('marina');
 if(garage>=0){
  const x=garage%size,y=Math.floor(garage/size);
  VEHICLES.sportscar.filter(m=>ownedModels(s,'sportscar').includes(m.id)).forEach((model,n)=>{
   cars.push({model,x:x+.27+(n%2)*.46,y:y+.24+Math.floor(n/2)*.27,scale:16/CAR_DESIGNS[model.id].length,site:garage});
  });
 }
 if(marina>=0){
  const x=marina%size+.5,y=Math.floor(marina/size)+.5;
  const water=(a,b)=>a>=0&&b>=0&&a<size&&b<size&&s.tiles[b*size+a].terrain==='water'&&!s.tiles[b*size+a].type;
  const candidates=[];
  for(let b=0;b<size;b++)for(let a=0;a<size;a++)if(water(a,b))candidates.push({x:a+.5,y:b+.5});
  candidates.sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||a.y-b.y||a.x-b.x);
  // The hull's isometric waterline, including clearance, must fit entirely on empty water.
  const models=VEHICLES.yacht.filter(m=>ownedModels(s,'yacht').includes(m.id)).toReversed();
  for(const model of models){
   const d=YACHT_DESIGNS[model.id];let berth=null;
   for(const scale of [.85,.7,.55,.4]){
    const rx=(d.length*.52*.00375+d.beam*.6*.0261)*scale+.1,ry=(d.length*.52*.0295+d.beam*.6*.0083)*scale+.1;
    berth=candidates.find(p=>{
     if(yachts.some(q=>Math.abs(q.x-p.x)<q.rx+rx+.2&&Math.abs(q.y-p.y)<q.ry+ry+.2))return false;
     for(let b=Math.floor(p.y-ry);b<=Math.floor(p.y+ry);b++)for(let a=Math.floor(p.x-rx);a<=Math.floor(p.x+rx);a++)if(!water(a,b))return false;
     return true;
    });
    if(berth){yachts.push({...berth,model,scale,rx,ry,site:marina});break;}
   }
  }
 }
 return{cars,yachts,garage,marina};
}
