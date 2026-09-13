// No third-party advertisements are loaded. Demo is explicitly limited to local
// development. A public build stays unavailable until a real provider is added.
export function rewardProviderMode(hostname){return ['localhost','127.0.0.1','::1','[::1]'].includes(hostname)?'local-demo':'unavailable';}
export function createDemoSession({id,kind,day}){
 let elapsed=0,cancelled=false,delivered=false;
 return{
  advance(ms,visible=true){if(!cancelled&&!delivered&&visible&&Number.isFinite(ms))elapsed+=Math.max(0,Math.min(ms,1000));},
  get remaining(){return Math.max(0,5000-elapsed);},
  cancel(){cancelled=true;},
  complete(){if(cancelled||delivered||elapsed<5000)return null;delivered=true;return{id,kind,day,completed:true,source:'local-demo'};}
 };
}
