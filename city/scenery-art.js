const MOUNTAIN_ART=Object.freeze({observatory:'mountain-observatory',cablecar:'cablecar-station'});
export const mountainArtId=(type,level=1,variant=1)=>{
 const base=MOUNTAIN_ART[type];return base?`${base}${level>1?'-'+Math.min(3,level):''}${variant>1?'-v'+variant:''}`:null;
};
export const SCENERY_ART=Object.freeze(['estate-pool','estate-garden','marina-pier','bridge-arch','tree-oak','tree-plane','tree-cypress','cablecar-cabin',...Object.keys(MOUNTAIN_ART).flatMap(type=>[1,2,3].flatMap(level=>[1,2,3,4,5].map(variant=>mountainArtId(type,level,variant))))]);
export const sceneryArtURL=id=>SCENERY_ART.includes(id)?`city/assets/scenery/${id}.webp`:null;
const images=new Map();
// Scenery ids resolve to their files; the estate passes its generated mansion art (city/assets/mansion) by URL.
const urlOf=id=>sceneryArtURL(id)??(/^city\/assets\/(?:(?:mansion|ultra)\/[\w-]+\.webp|island\/private-island-(?:map|retreat)\.png)$/.test(id)?id:null);
function entry(id){
 const url=urlOf(id);if(!url||typeof Image==='undefined')return null;
 if(!images.has(id)){const image=new Image(),item={image,pending:true};images.set(id,item);image.onload=()=>item.pending=false;image.onerror=()=>item.pending=false;image.src=url;}
 return images.get(id);
}
export const sceneryPending=id=>entry(id)?.pending??false;
export const sceneryReady=id=>{const image=entry(id)?.image;return !!(image?.complete&&image.naturalWidth);};
export function drawSceneryArt(ctx,id,p,width,{maxHeight=Infinity,mirror=false,heightRatio=1}={}){
 const image=entry(id)?.image;if(!image?.complete||!image.naturalWidth)return false;
 const ratio=Math.min(width/image.naturalWidth,maxHeight/(image.naturalHeight*heightRatio)),w=image.naturalWidth*ratio,h=image.naturalHeight*ratio*heightRatio;
 const bounds={x:p.x-w/2,y:p.y-h,width:w,height:h,image,mirror};
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.translate(p.x,p.y);if(mirror)ctx.scale(-1,1);ctx.drawImage(image,-w/2,-h,w,h);ctx.restore();return bounds;
}
