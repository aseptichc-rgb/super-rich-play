// Deterministic rolls shared by the risk systems. The same save always rolls the same result.
export function hashRoll(seed,sequence,tag=''){
 let x=(Number(seed)||0)^Math.imul((Number(sequence)||0)+1,0x9e3779b1);
 for(const c of String(tag))x=Math.imul(x^c.charCodeAt(0),0x85ebca6b);
 x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;
 return (x>>>0)/4294967296;
}
