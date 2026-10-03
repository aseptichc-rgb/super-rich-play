export const BUILDING_VARIANTS=5;

// Stable per building: the chosen design survives saves, map growth and expansion.
export function buildingVariant(seed,index,month,type){
 let hash=(seed|0)^Math.imul(index+1,73856093)^Math.imul(month+1,19349663);
 for(const char of type)hash=Math.imul(hash^char.charCodeAt(0),16777619);
 hash=Math.imul(hash^(hash>>>16),0x7feb352d);
 return((hash^(hash>>>15))>>>0)%BUILDING_VARIANTS+1;
}
