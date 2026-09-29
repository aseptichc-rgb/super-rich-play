import {ULTRA_ITEMS} from './ultra.js';

const IDS=Object.keys(ULTRA_ITEMS);
export const ultraHitId=i=>IDS[-100-i]??null;
// A dedicated extension cannot overwrite player parcels and needs no new save fields.
export function ultraSites(s){
 if(s.concept!=='rich-life')return [];
 const size=Math.sqrt(s.tiles.length);
 return IDS.flatMap((id,n)=>{const item=s.ultra?.items?.[id];if(!item)return [];
  return [{id,hit:-100-n,x:size+3+(n%3)*6,y:size-17+Math.floor(n/3)*6,
   complete:item.complete,remaining:Math.max(0,ULTRA_ITEMS[id].months-(s.month-item.start)),
   image:`city/assets/ultra/${id}.webp`}];
 }).sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x);
}
