import {inspectSave} from '../city/save-diagnostics.js';
import {OPERATOR_EMAIL} from './insights.js';
import {analyze} from '../city/engine.js';

export class DashboardError extends Error{
 constructor(code){super(code);this.code=code;}
}
// OAuth access tokens are held only in memory. Google IAM, not a client email check,
// authorizes these read-only admin APIs. Never use a Firebase ID token here.
export async function loadDashboard({projectId,token,fetch:request=globalThis.fetch,signal,now=Date.now()}){
 async function pages(base,key,params={}){
  const rows=[],seen=new Set();let pageToken='';
  do{
   const url=new URL(base);
   for(const [k,v]of Object.entries(params))url.searchParams.set(k,v);
   if(pageToken)url.searchParams.set(key==='users'?'nextPageToken':'pageToken',pageToken);
   const response=await request(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal});
   if(!response.ok)throw new DashboardError(response.status===401?'expired':response.status===403?'permission':'network');
   const data=await response.json();
   const list=key==='users'?data.users:data.documents;
   if(list!==undefined&&!Array.isArray(list))throw new DashboardError('invalid');
   rows.push(...(list||[]));pageToken=data.nextPageToken||'';
   if(pageToken&&seen.has(pageToken))throw new DashboardError('invalid');
   seen.add(pageToken);
  }while(pageToken);
  return rows;
 }
 // Auth calls its request cursor nextPageToken; Firestore calls it pageToken.
 const id=encodeURIComponent(projectId);
 const [users,documents,feedbackDocuments,eventDocuments]=await Promise.all([
  pages(`https://identitytoolkit.googleapis.com/v1/projects/${id}/accounts:batchGet`,'users',{maxResults:'1000',fields:'users(localId,displayName,email,createdAt,lastLoginAt,disabled),nextPageToken'}),
  pages(`https://firestore.googleapis.com/v1/projects/${id}/databases/(default)/documents/playerSaves`,'documents',{pageSize:'100', 'mask.fieldPaths':'save'}),
  pages(`https://firestore.googleapis.com/v1/projects/${id}/databases/(default)/documents/feedback`,'documents',{pageSize:'100'}),
  readEvents()
 ]);
 return summarizeDashboard(users,documents,now,feedbackDocuments,eventDocuments);
 async function readEvents(){
  const response=await request(new URL(`https://firestore.googleapis.com/v1/projects/${id}/databases/(default)/documents:runQuery`),{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({structuredQuery:{from:[{collectionId:'playEvents'}],where:{fieldFilter:{field:{fieldPath:'at'},op:'GREATER_THAN_OR_EQUAL',value:{integerValue:String(now-14*86400000)}}},orderBy:[{field:{fieldPath:'at'},direction:'DESCENDING'}],limit:10000}}),cache:'no-store',signal});
  if(!response.ok)throw new DashboardError(response.status===401?'expired':response.status===403?'permission':'network');
  const result=await response.json();if(!Array.isArray(result))throw new DashboardError('invalid');return result.map(r=>r.document).filter(Boolean);
 }
}
const timestamp=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?n:null;};
export function summarizeDashboard(users,documents,now=Date.now(),feedbackDocuments=[],eventDocuments=[]){
 const saves=new Map(documents.map(d=>[d.name?.split('/').at(-1),d]));
 const rows=users.map(user=>{
  const doc=saves.get(user.localId);
  const row={uid:user.localId,name:user.displayName||'',email:user.email||'',disabled:!!user.disabled,createdAt:timestamp(user.createdAt),lastLoginAt:timestamp(user.lastLoginAt),updatedAt:doc?.updateTime||null,status:doc?'invalid':'missing',reason:doc?'game-rules':null,excluded:String(user.email||'').toLowerCase()===OPERATOR_EMAIL,game:null};
  if(doc)try{
   const checked=inspectSave(doc.fields?.save?.stringValue),save=checked.save;row.reason=checked.reason;
   if(save){
    const a=analyze(save),debt=save.debt+(save.market?.margin||0);
    const values={wealth:a.wealth,cash:save.money,property:a.assets,stocks:a.stocks,compound:a.compound.assets,debt,other:a.wealth+debt-save.money-a.assets-a.stocks-a.compound.assets};
    if(!Object.values(values).every(Number.isFinite))throw new Error('invalid');
    row.status='saved';row.reason=null;row.excluded||=save.mode==='sandbox';row.game={...values,name:save.name,month:save.month,properties:a.owned.length,seconds:save.playTime?.seconds??null,measuredSince:save.playTime?.startedAt??null,missions:save.missions?.completed.length||0,projects:save.missions?.history.filter(h=>h.won).length||0,landmarks:save.tiles.filter(t=>t.owner==='player'&&t.landmark&&!t.construction).length,skyscraper:Math.max(0,...save.tiles.filter(t=>t.owner==='player'&&t.type==='skyscraper'&&!t.construction).map(t=>t.level))};
   }
  }catch{row.reason='evaluation';/* Keep damaged saves separate from zero wealth. */}
  return row;
 });
 const saved=rows.filter(r=>r.game),measured=saved.filter(r=>r.game.seconds!==null);
 const within=(value,days)=>value!==null&&value<=now&&value>=now-days*86400000;
 const summary={registered:rows.length,new7:rows.filter(r=>within(r.createdAt,7)).length,login7:rows.filter(r=>within(r.lastLoginAt,7)).length,saved:saved.length,invalid:rows.filter(r=>r.status==='invalid').length,orphanSaves:documents.filter(d=>!users.some(u=>u.localId===d.name?.split('/').at(-1))).length,measured:measured.length,seconds:measured.reduce((n,r)=>n+r.game.seconds,0)};
 for(const key of ['wealth','cash','property','stocks','compound','debt','other'])summary[key]=saved.reduce((n,r)=>n+r.game[key],0);
 summary.averageWealth=saved.length?summary.wealth/saved.length:null;
 summary.averageSeconds=measured.length?summary.seconds/measured.length:null;
 const signups=Array.from({length:14},(_,i)=>{
  const date=new Date(now-(13-i)*86400000).toISOString().slice(0,10);
  return{date,count:rows.filter(r=>r.createdAt&&new Date(r.createdAt).toISOString().slice(0,10)===date).length};
 });
 const feedback=feedbackDocuments.map(d=>({id:d.name?.split('/').at(-1)||'',body:d.fields?.body?.stringValue,test:/Codex smoke test|배포 확인용 테스트 피드백/i.test(d.fields?.body?.stringValue||''),version:d.fields?.version?.stringValue,createdAt:d.createTime})).filter(d=>typeof d.body==='string').sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
 return{updatedAt:new Date(now).toISOString(),summary,rows,signups,feedback,eventDocuments,eventTruncated:eventDocuments.length>=10000};
}
