// Anonymous, write-only playtest feedback. Firestore assigns each document its creation time.
export async function sendFeedback({projectId,body,version,fetch:request=globalThis.fetch,timeout=12000}){
 if(!projectId||!request)return false;
 try{
  const response=await request(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/feedback`,{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({fields:{body:{stringValue:String(body).slice(0,8000)},version:{stringValue:String(version).slice(0,30)}}}),
   signal:AbortSignal.timeout(timeout)
  });
  return response.ok;
 }catch{return false;}
}
