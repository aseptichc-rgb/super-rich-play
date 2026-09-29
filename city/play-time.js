// Time in the visible game, independent of simulation speed. Old saves stay unmeasured.
export function validPlayTime(s){
 const p=s?.playTime;
 return p===undefined||!!(p&&Number.isFinite(p.seconds)&&p.seconds>=0&&Number.isFinite(p.startedAt)&&p.startedAt>0);
}
export function createPlayTimer(){
 let previous=null,story=null,wasActive=false,pending=0,startedAt=0;
 const tick=(state,now,active,wallTime=Date.now())=>{
  const delta=previous===null?0:(now-previous)/1000;
  if(story!==state){pending=0;startedAt=0;wasActive=false;story=state;}
  previous=now;
  if(active&&wasActive&&delta>0&&delta<=5){
   startedAt||=wallTime;pending+=delta;
  }
  wasActive=active;
  if(pending>=30){tick.flush(state);return true;}
  return false;
 };
 // Keep saves stable between writes so a completed account upload becomes clean.
 tick.flush=state=>{
  if(state!==story||pending<=0)return;
  state.playTime??={seconds:0,startedAt};state.playTime.seconds+=pending;pending=0;
 };
 return tick;
}
