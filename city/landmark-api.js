import {L} from './i18n.js';
import {LANDMARK_API_URL} from './landmark-config.js';

// Firebase tokens travel in request headers only. Private pictures use temporary browser blob URLs.
export function createLandmarkAPI({baseURL='',fetch:request=(...args)=>globalThis.fetch(...args),urls=URL}={}){
 const base=baseURL.replace(/\/$/,'');
 if(base&&new URL(base).protocol!=='https:'&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base))throw Error('Invalid landmark server URL');
 let user=null,epoch=0;
 const pictures=new Map(),pending=new Map(),retryAt=new Map();
 const placeholder=id=>'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7#'+id;
 function replaceImage(before,after){if(typeof document!=='undefined')document.querySelectorAll('img').forEach(img=>{if(img.getAttribute('src')===before)img.src=after;});}
 async function call(path='/api/landmarks',options={}){
  const id=epoch,active=user,headers=new Headers(options.headers);
  if(base){
   if(!active)throw Object.assign(Error(L('Sign in with Google to use landmark designs.')),{status:401});
   headers.set('Authorization','Bearer '+await active.getIdToken());
   if(id!==epoch)throw Error(L('The active account changed. Reopen the studio.'));
  }
  const response=await request(base+path,{...options,headers,credentials:base?'omit':'same-origin',cache:'no-store',signal:AbortSignal.timeout(200000)});
  if(id!==epoch)throw Error(L('The active account changed. Reopen the studio.'));
  if(base&&!response.ok){
   const data=await response.json().catch(()=>({}));
   const messages={
    "This landmark has reached its daily limit of 3 AI requests. Try again after midnight in Korea.":L("This landmark has reached its daily limit of 3 AI requests. Try again after midnight in Korea."),

    "This studio is out of date. Reload the game to create an AI building from your image.":L("This studio is out of date. Reload the game to create an AI building from your image."),
    "The description or reference image was blocked by OpenAI safety checks. Change the description or remove the reference image and try again.":L("The description or reference image was blocked by OpenAI safety checks. Change the description or remove the reference image and try again."),
    "Check the OpenAI key or image model permissions.":L("Check the OpenAI key or image model permissions."),
    "Check your OpenAI usage limit or billing balance.":L("Check your OpenAI usage limit or billing balance."),
    "The AI could not generate an image. Change the description or reference image and try again.":L("The AI could not generate an image. Change the description or reference image and try again."),
    "Image generation timed out. Check the gallery, then try again.":L("Image generation timed out. Check the gallery, then try again."),
    "Invalid generated image response.":L("Invalid generated image response."),
    "Could not determine the generated image format.":L("Could not determine the generated image format."),
    "Could not process the request. Try again shortly.":L("Could not process the request. Try again shortly."),
    "Could not verify your Google account. Try again shortly.":L("Could not verify your Google account. Try again shortly."),
    "This game address is not allowed.":L("This game address is not allowed."),
    "The design gallery is being set up.":L("The design gallery is being set up."),
    "The design gallery holds up to 100 designs.":L("The design gallery holds up to 100 designs."),
    'The daily AI limit for this game has been reached. Try again tomorrow.':L('The daily AI limit for this game has been reached. Try again tomorrow.'),
    'AI generation is temporarily paused.':L('AI generation is temporarily paused.'),
    'AI connection is not configured.':L('AI connection is not configured.'),
    'Image generation is limited to once per minute.':L('Image generation is limited to once per minute.'),
    'You have reached the daily AI generation limit of 20.':L('You have reached the daily AI generation limit of 20.'),
    'All 3 designs are ready. Select one to build.':L('All 3 designs are ready. Select one to build.'),
    'A previous request is still processing. Try again shortly.':L('A previous request is still processing. Try again shortly.'),
    'Another request is already in progress.':L('A previous request is still processing. Try again shortly.')
   };
   throw Object.assign(Error(response.status===401?L('Sign in with Google to use landmark designs.'):(Object.hasOwn(messages,data?.error)?messages[data.error]:null)||L('Could not complete the landmark request. Please try again.')),{status:response.status,quota:data?.quota});
  }
  return response;
 }
 async function image(id){
  if(!base||!user||pictures.has(id)||pending.has(id)||(retryAt.get(id)||0)>Date.now())return pending.get(id);
  const generation=epoch;
  const task=(async()=>{
   const r=await call(`/api/landmarks/${id}/image`);
   if(!r.ok||!/^image\/(png|jpeg|webp)$/.test(r.headers.get('Content-Type')||''))throw Error('Image unavailable');
   const blob=await r.blob();if(epoch!==generation)return;
   const url=urls.createObjectURL(blob);pictures.set(id,url);replaceImage(placeholder(id),url);
  })().catch(()=>{if(epoch===generation)retryAt.set(id,Date.now()+30000);}).finally(()=>{if(epoch===generation)pending.delete(id);});
  pending.set(id,task);return task;
 }
 return{
  remote:!!base,call,
  imageURL(id){if(!base)return `/api/landmarks/${id}/image`;image(id);return pictures.get(id)||placeholder(id);},
  setUser(next){
   if(user?.uid===next?.uid)return false;
   user=next;epoch++;
   for(const [id,url]of pictures){replaceImage(url,placeholder(id));urls.revokeObjectURL(url);}
   pictures.clear();pending.clear();retryAt.clear();return true;
  },
  async prepare(designs){await Promise.all(designs.map(d=>image(d.id)));}
 };
}
export const landmarkAPI=createLandmarkAPI({baseURL:LANDMARK_API_URL});
