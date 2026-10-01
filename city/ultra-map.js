import {ULTRA_ITEMS,ultraDuration} from './ultra.js';
import {moonOrigin,MOON_SIZE} from './ultra-placement.js';

const IDS=Object.keys(ULTRA_ITEMS);
export const ultraHitId=i=>IDS[-100-i]??null;
export const moonHit=(x,y)=>-1000-y*MOON_SIZE-x;
export const moonHitPosition=i=>Number.isInteger(i)&&i<=-1000&&i>-1000-MOON_SIZE*MOON_SIZE?{x:(-1000-i)%MOON_SIZE,y:Math.floor((-1000-i)/MOON_SIZE)}:null;
// Saves without a position remain owned and can be placed by the player for free.
export function ultraSites(s){
 if(s.concept!=='rich-life')return [];
 return IDS.flatMap((id,n)=>{const item=s.ultra?.items?.[id];if(!item?.position)return [];
  const offset=id==='moon'?moonOrigin(s):{x:0,y:0};
  return [{id,hit:-100-n,x:item.position.x+offset.x,y:item.position.y+offset.y,width:3,height:3,
   complete:item.complete,total:ultraDuration(id,item),remaining:Math.max(0,ultraDuration(id,item)-(s.month-item.start)),
   image:`city/assets/ultra/${id}.webp`}];
 }).sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x);
}
