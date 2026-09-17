// Reduced-motion handling. The game follows the system preference unless the player turns animation on in Game Settings.
export const MOTION_KEY='super-rich-motion';
// query, storage and root may be values or functions returning them, so the defaults resolve lazily against the live window.
export function createMotion({query={matches:false},storage=null,root=null}={}){
 const get=v=>typeof v==='function'?v():v;
 let forced=null;
 const isForced=()=>{if(forced===null){try{forced=get(storage)?.getItem(MOTION_KEY)==='on';}catch{forced=false;}}return forced;};
 const apply=()=>{get(root)?.toggleAttribute?.('data-motion',isForced());};
 return{
  systemReduced:()=>!!get(query)?.matches,
  reduced:()=>!!get(query)?.matches&&!isForced(),
  forced:isForced,
  force(on){forced=!!on;try{const s=get(storage);if(forced)s?.setItem(MOTION_KEY,'on');else s?.removeItem(MOTION_KEY);}catch{}apply();},
  apply
 };
}
let systemQuery=null;
export const motion=createMotion({
 query:()=>{if(!systemQuery&&globalThis.window?.matchMedia)systemQuery=globalThis.window.matchMedia('(prefers-reduced-motion: reduce)');return systemQuery||{matches:false};},
 storage:()=>{try{return globalThis.window?.localStorage??null;}catch{return null;}},
 root:()=>globalThis.document?.documentElement??null
});
export const reducedMotion=()=>motion.reduced();
