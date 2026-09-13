// Images live in private server storage; game saves contain only a small design reference.
export const landmarkURL=id=>`/api/landmarks/${id}/image`;
export function validLandmark(d){return !!d&&/^[a-f0-9-]{36}$/.test(d.id)&&typeof d.name==='string'&&d.name.length>0&&d.name.length<=40&&['office','hotel'].includes(d.type);}
export function validLandmarks(s){
 const rewards=s?.empire?.landmarkFame;
 if(rewards!==undefined&&(!rewards||typeof rewards!=='object'||Array.isArray(rewards)||!Object.entries(rewards).every(([i,n])=>/^(0|[1-9]\d*)$/.test(i)&&Number(i)<(s?.tiles?.length||0)&&[500,600,700,800,1000,1300].includes(n))))return false;
 return !Array.isArray(s?.tiles)||s.tiles.every(t=>t?.landmark===undefined||(validLandmark(t.landmark)&&t.owner==='player'&&t.type===t.landmark.type));}
export function landmarkPreview(d){if(!validLandmark(d))return '';const name=d.name.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return `<section class="landmark-preview"><img src="${landmarkURL(d.id)}" alt="${name} design image"><h3>${name}</h3><p>My landmark · ${d.type==='hotel'?'Hotel':'Office Building'}</p></section>`;}
const images=new Map();
export function landmarkBounds(t,p,zoom,imageWidth,imageHeight){
 const width=t.footprint?.width||1,height=t.footprint?.height||1;
 const maxWidth=28*(width+height)*.96*zoom,maxHeight=(105+t.level*24)*Math.sqrt(width*height)*zoom;
 const scale=Math.min(maxWidth/imageWidth,maxHeight/imageHeight);
 const w=imageWidth*scale,h=imageHeight*scale;
 return {x:p.x-w/2,y:p.y-h,width:w,height:h};
}
export function drawLandmark(ctx,t,p,zoom){
 if(!validLandmark(t.landmark))return false;
 let im=images.get(t.landmark.id);
 if(!im){im=new Image();im.src=landmarkURL(t.landmark.id);images.set(t.landmark.id,im);}
 if(!im.complete||!im.naturalWidth)return false;
 const b=landmarkBounds(t,p,zoom,im.naturalWidth,im.naturalHeight);
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,b.x,b.y,b.width,b.height);ctx.restore();return b;
}
