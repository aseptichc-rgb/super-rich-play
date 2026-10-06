// Anonymous, write-only first-occurrence events. No names, email, UID, URLs or save payloads.
export const ANALYTICS_VERSION='build-settle-v1';
export const EVENT_NAMES=['visit','ready','first_action','first_build','first_settlement','extra_action','return_visit','mission_start','mission_complete','excluded'];
export const VISITOR_KEY='super-rich-visitor-v1',QUEUE_KEY='super-rich-events-v1';
export function createAnalytics({storage,projectId,fetch:request=globalThis.fetch,random=()=>crypto.randomUUID().replaceAll('-',''),now=()=>Date.now(),source='',device='desktop',browser='regular',enabled=true}={}){
 const read=k=>{try{return storage.getItem(k);}catch{return null;}},write=(k,v)=>{try{storage.setItem(k,v);}catch{}};
 let visitor=read(VISITOR_KEY),returning=!!visitor;if(!/^[a-zA-Z0-9]{16,40}$/.test(visitor||'')){visitor=random();returning=false;write(VISITOR_KEY,visitor);}
 const session=random(),started=now(),seen=new Set();let queue=[];try{const q=JSON.parse(read(QUEUE_KEY));if(Array.isArray(q))queue=q.filter(validEvent).slice(-60);}catch{}
 let pendingFlush=null,failed=false;
 function flush(){
  if(pendingFlush)return pendingFlush;if(!enabled||!projectId||!request)return Promise.resolve();
  pendingFlush=(async()=>{
  try{while(queue.length){const e=queue[0],fields=Object.fromEntries(Object.entries(e).map(([k,v])=>[k,typeof v==='number'?{integerValue:String(v)}:{stringValue:v}]));
   const r=await request(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/playEvents?documentId=${e.session}_${e.name}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields}),signal:AbortSignal.timeout(8000)});
   if(!r.ok&&r.status!==409){failed=true;break;}queue.shift();write(QUEUE_KEY,JSON.stringify(queue));failed=false;
  }}catch{failed=true;}
  })().finally(()=>{pendingFlush=null;});return pendingFlush;
 }
 function track(name,month=0){if(!enabled||!EVENT_NAMES.includes(name)||seen.has(name))return false;seen.add(name);
  const event={visitor,session,name,at:Math.round(now()),elapsed:Math.max(0,Math.min(86400000,Math.round(now()-started))),month:Number.isSafeInteger(month)&&month>=0?month:0,variant:ANALYTICS_VERSION,source:(String(source).toLowerCase().match(/^(youtube|yt|reddit|instagram|facebook|threads|discord|google|naver|newsletter|friend|direct)(?:[-_]|$)/)?.[1]||(!source?'direct':'other')).replace(/^yt$/,'youtube'),device:device==='mobile'?'mobile':'desktop',browser:browser==='in-app'?'in-app':'regular'};
  queue.push(event);queue=queue.slice(-60);write(QUEUE_KEY,JSON.stringify(queue));void flush();return true;
 }
 if(enabled){track('visit');if(returning)track('return_visit');}
 return{track,flush,get pending(){return queue.length;},get failed(){return failed;}};
}
export function validEvent(e){return !!e&&['visitor','session'].every(k=>/^[a-zA-Z0-9]{16,40}$/.test(e[k]||''))&&EVENT_NAMES.includes(e.name)&&Number.isInteger(e.at)&&e.at>0&&Number.isInteger(e.elapsed)&&e.elapsed>=0&&e.elapsed<=86400000&&Number.isInteger(e.month)&&e.month>=0&&e.variant===ANALYTICS_VERSION&&/^[a-zA-Z0-9_-]{1,40}$/.test(e.source||'')&&['mobile','desktop'].includes(e.device)&&['regular','in-app'].includes(e.browser);}
