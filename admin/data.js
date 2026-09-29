import {remoteSave} from '../city/cloud-save.js';
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
 const [users,documents]=await Promise.all([
  pages(`https://identitytoolkit.googleapis.com/v1/projects/${id}/accounts:batchGet`,'users',{maxResults:'1000',fields:'users(localId,displayName,email,createdAt,lastLoginAt,disabled),nextPageToken'}),
  pages(`https://firestore.googleapis.com/v1/projects/${id}/databases/(default)/documents/playerSaves`,'documents',{pageSize:'100', 'mask.fieldPaths':'save'})
 ]);
 return summarizeDashboard(users,documents,now);
}
const timestamp=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?n:null;};
export function summarizeDashboard(users,documents,now=Date.now()){
 const saves=new Map(documents.map(d=>[d.name?.split('/').at(-1),d]));
 const rows=users.map(user=>{
  const doc=saves.get(user.localId);
  const row={uid:user.localId,name:user.displayName||'',email:user.email||'',disabled:!!user.disabled,createdAt:timestamp(user.createdAt),lastLoginAt:timestamp(user.lastLoginAt),updatedAt:doc?.updateTime||null,status:doc?'invalid':'missing',game:null};
  if(doc)try{
   const raw=JSON.parse(doc.fields?.save?.stringValue),save=remoteSave(raw);
   if(save){
    const a=analyze(save),debt=save.debt+(save.market?.margin||0);
    const values={wealth:a.wealth,cash:save.money,property:a.assets,stocks:a.stocks,compound:a.compound.assets,debt,other:a.wealth+debt-save.money-a.assets-a.stocks-a.compound.assets};
    if(!Object.values(values).every(Number.isFinite))throw new Error('invalid');
    row.status='saved';row.game={...values,name:save.name,month:save.month,properties:a.owned.length,seconds:save.playTime?.seconds??null,measuredSince:save.playTime?.startedAt??null};
   }
  }catch{/* A damaged save must not turn into zero wealth or hide other accounts. */}
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
 return{updatedAt:new Date(now).toISOString(),summary,rows,signups};
}
