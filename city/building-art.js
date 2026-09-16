// Maximum sprite heights at map zoom 1. Buildings retain their generated aspect ratio.
export const BUILDING_ART=Object.freeze({golf:48,hotel:120,resort:75,office:155,hq:205,monument:165,atelier:48,cafe:48,market:52,studio:65,workshop:65,rental:58,condo:100,garden:40,home:58,housing:80,themepark:90,shop:65,factory:75,park:42,hall:78,wind:115,water:90,school:75,clinic:80,fire:75,plaza:38,tower:145});
// Player-expandable buildings have richer `<type>-2.webp` / `<type>-3.webp` sprites for expansion tiers 2 and 3.
export const TIERED_ART=Object.freeze(['golf','hotel','resort','office','hq','monument','atelier','cafe','market','studio','workshop','rental','condo','garden','park']);
// The buildable Public Park reuses the neighborhood park sprite.
const ART_ALIAS=Object.freeze({citypark:'park'});
const artType=type=>Object.hasOwn(ART_ALIAS,type)?ART_ALIAS[type]:type;
export const artTier=(type,level=1)=>TIERED_ART.includes(artType(type))?Math.max(1,Math.min(3,level||1)):1;
export function buildingArtURL(type,level=1){
 const id=artType(type);if(!Object.hasOwn(BUILDING_ART,id))return null;
 const tier=artTier(type,level);return `city/assets/buildings/${id}${tier>1?'-'+tier:''}.webp`;
}
const images=new Map();
function entry(type,level=1){
 const url=buildingArtURL(type,level);
 if(!url||typeof Image==='undefined')return null;
 if(!images.has(url)){
  const image=new Image(),item={image,pending:true};images.set(url,item);
  image.onload=()=>{item.pending=false;};image.onerror=()=>{item.pending=false;};
  image.src=url;
 }
 return images.get(url);
}
export const buildingArtPending=(type,level=1)=>entry(type,level)?.pending??false;
// How steeply each sprite's ground edges rise (screen rise per run at its base corners), measured from the art; the map grid rises 0.5.
// Steeper art is flattened to at most ART_SLOPE_CAP, then narrowed so its base stays on its own lot instead of spilling onto roads and neighbors.
export const ART_SLOPE=Object.freeze({atelier:.55,'atelier-2':.56,'atelier-3':.56,cafe:.53,'cafe-2':.52,'cafe-3':.52,clinic:.56,condo:.59,'condo-2':.56,'condo-3':.55,factory:.6,fire:.57,garden:.72,'garden-2':.71,'garden-3':.69,golf:.61,'golf-2':.62,'golf-3':.63,hall:.58,home:.6,hotel:.57,'hotel-2':.58,'hotel-3':.57,housing:.59,hq:.63,'hq-2':.61,'hq-3':.61,market:.54,'market-2':.54,'market-3':.55,monument:.54,'monument-2':.55,'monument-3':.56,office:.59,'office-2':.59,'office-3':.6,park:.65,'park-2':.69,'park-3':.73,plaza:.7,rental:.61,'rental-2':.63,'rental-3':.63,resort:.64,'resort-2':.84,'resort-3':.84,school:.61,shop:.57,studio:.58,'studio-2':.55,'studio-3':.57,themepark:.59,tower:.59,water:.58,workshop:.57,'workshop-2':.62,'workshop-3':.62});
export const ART_SLOPE_CAP=.64;
export function buildingArtBounds(t,p,zoom,imageWidth,imageHeight){
 const width=t.footprint?.width||1,height=t.footprint?.height||1,side=Math.min(width,height);
 const tier=Math.max(1,Math.min(3,t.level||1)),growth=[.84,.92,1][tier-1],art=artTier(t.type,t.level);
 const slope=Math.max(.5,ART_SLOPE[artType(t.type)+(art>1?'-'+art:'')]||.5),ground=Math.min(slope,ART_SLOPE_CAP),flatten=ground/slope;
 // A base rising `ground` per run covers `side` tiles when it is 28·side/ground wide; on a 2:1 grid and a square lot that is the full lot width.
 const maxWidth=28*side/ground*.98*zoom*growth,maxHeight=(BUILDING_ART[artType(t.type)]||65)*Math.sqrt(width*height)*zoom*growth;
 const scale=Math.min(maxWidth/imageWidth,maxHeight/(imageHeight*flatten)),w=imageWidth*scale,h=imageHeight*scale*flatten;
 // On a long lot the square base moves from the front corner to the middle of the long side.
 const x=p.x-(width-height)*14*zoom,y=p.y-Math.abs(width-height)*7*zoom;
 return{x:x-w/2,y:y-h,width:w,height:h};
}
export function drawBuildingArt(ctx,t,p,zoom){
 const ready=item=>item?.image.complete&&item.image.naturalWidth;
 // While an expansion sprite is still downloading, keep showing the tier-1 sprite instead of the procedural fallback.
 const image=(ready(entry(t.type,t.level))?entry(t.type,t.level):entry(t.type,1))?.image;
 if(!image?.complete||!image.naturalWidth)return false;
 const bounds=buildingArtBounds(t,p,zoom,image.naturalWidth,image.naturalHeight);
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(image,bounds.x,bounds.y,bounds.width,bounds.height);ctx.restore();
 return{...bounds,image};
}
