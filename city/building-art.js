// Maximum sprite heights at map zoom 1. Buildings retain their generated aspect ratio.
export const BUILDING_ART=Object.freeze({university:100,skyscraper:205,golf:48,hotel:120,resort:75,office:155,hq:205,monument:165,atelier:48,cafe:48,market:52,studio:65,workshop:65,rental:58,condo:100,garden:40,home:58,housing:80,hospital:130,themepark:90,shop:65,factory:75,park:42,hall:78,wind:115,water:90,school:75,clinic:80,fire:75,plaza:38,tower:145});
// Player-expandable buildings have richer `<type>-2.webp` / `<type>-3.webp` sprites for expansion tiers 2 and 3.
export const TIERED_ART=Object.freeze(['golf','hotel','resort','office','hq','monument','atelier','cafe','market','studio','workshop','rental','condo','garden','park','hospital','housing','themepark']);
// The buildable Public Park reuses the neighborhood park sprite.
const ART_ALIAS=Object.freeze({citypark:'park'});
const artType=type=>Object.hasOwn(ART_ALIAS,type)?ART_ALIAS[type]:type;
export const artTier=(type,level=1)=>TIERED_ART.includes(artType(type))?Math.max(1,Math.min(3,level||1)):1;
// Long lots (2×1, 3×1 and their mirrors) use `<type>[-tier]-wide.webp`, drawn for a 3×1 lot whose long side runs toward the lower right.
export const WIDE_ART=Object.freeze(['hotel','resort','office','hq','cafe','market','studio','workshop','rental','condo','hospital','themepark','housing','golf','garden','park']);
export const wideLot=footprint=>{const width=footprint?.width||1,height=footprint?.height||1;return Math.max(width,height)>=2*Math.min(width,height);};
// 3×2 and 2×3 lots use `<type>[-tier]-broad.webp`, drawn for a 3×2 lot whose long side runs toward the lower right; every building that can stand on a combined lot has one.
export const BROAD_ART=Object.freeze(['golf','garden','park','monument','hotel','resort','office','hq','cafe','market','studio','workshop','rental','condo','hospital','housing','themepark']);
export const broadLot=footprint=>{const width=footprint?.width||1,height=footprint?.height||1;return Math.min(width,height)===2&&Math.max(width,height)===3;};
export function buildingArtURL(type,level=1,footprint,variant=1){
 const id=artType(type);if(!Object.hasOwn(BUILDING_ART,id))return null;
 if(id==='skyscraper')return `city/assets/buildings/skyscraper${variant>1?'-v'+variant:level>=200?'-3':level>=100?'-2':''}.webp`;
 const tier=artTier(type,level),lot=variant>1?'':WIDE_ART.includes(id)&&wideLot(footprint)?'-wide':BROAD_ART.includes(id)&&broadLot(footprint)?'-broad':'';
 // Housing and theme parks gained square expansion art; their existing long-lot art remains shared across tiers.
 const lotTier=lot&&['housing','themepark'].includes(id)?1:tier;
 return `city/assets/buildings/${id}${lotTier>1?'-'+lotTier:''}${variant>1?'-v'+variant:''}${lot}.webp`;
}
const images=new Map();
function entry(type,level=1,footprint,variant=1){
 const url=buildingArtURL(type,level,footprint,variant);
 if(!url||typeof Image==='undefined')return null;
 if(!images.has(url)){
  // depth: how many squares deep a long-lot sprite's three-square base is (0 for square art).
  const image=new Image(),item={image,pending:true,depth:url.endsWith('-wide.webp')?1:url.endsWith('-broad.webp')?2:0};images.set(url,item);
  image.onload=()=>{item.pending=false;};image.onerror=()=>{item.pending=false;};
  image.src=url;
 }
 return images.get(url);
}
export const buildingArtPending=(type,level=1,footprint,variant=1)=>entry(type,level,footprint,variant)?.pending??false;
// How steeply each sprite's ground edges rise (screen rise per run at its base corners), measured from the art; the map grid rises 0.5.
// Steeper art is flattened to at most ART_SLOPE_CAP, then narrowed so its base stays on its own lot instead of spilling onto roads and neighbors.
export const ART_SLOPE=Object.freeze({university:.58,atelier:.55,'atelier-2':.56,'atelier-3':.56,cafe:.53,'cafe-2':.52,'cafe-3':.52,clinic:.56,condo:.59,'condo-2':.56,'condo-3':.55,factory:.6,fire:.57,garden:.72,'garden-2':.71,'garden-3':.69,golf:.61,'golf-2':.62,'golf-3':.63,hall:.58,home:.6,hospital:.5,'hospital-2':.5,'hospital-3':.5,hotel:.57,'hotel-2':.58,'hotel-3':.57,housing:.59,hq:.63,'hq-2':.61,'hq-3':.61,market:.54,'market-2':.54,'market-3':.55,monument:.54,'monument-2':.55,'monument-3':.56,office:.59,'office-2':.59,'office-3':.6,park:.65,'park-2':.69,'park-3':.73,plaza:.7,rental:.61,'rental-2':.63,'rental-3':.63,resort:.64,'resort-2':.84,'resort-3':.84,school:.61,shop:.57,studio:.58,'studio-2':.55,'studio-3':.57,themepark:.59,tower:.59,water:.58,workshop:.57,'workshop-2':.62,'workshop-3':.62});
export const ART_SLOPE_CAP=.64;
export const SKYSCRAPER_FLOOR_HEIGHT=6;
const SKYSCRAPER_REFERENCE_FLOORS=40;
const SKYSCRAPER_REPEAT_START=[0,.24,.30,.65],SKYSCRAPER_REPEAT_SPAN=.0125;
export function buildingArtBounds(t,p,zoom,imageWidth,imageHeight,depth=0){
 const width=t.footprint?.width||1,height=t.footprint?.height||1,side=Math.min(width,height);
 if(t.type==='skyscraper'){
  // Keep the illustrated tower at its natural proportions above 40 floors; add height only through a glass-floor strip.
  const w=56*side*.98*zoom,baseHeight=960/508*.25*w,towerHeight=SKYSCRAPER_FLOOR_HEIGHT*t.level*zoom,h=baseHeight+towerHeight;
  const repeatHeight=Math.max(0,t.level-SKYSCRAPER_REFERENCE_FLOORS)*SKYSCRAPER_FLOOR_HEIGHT*zoom;
  const illustratedHeight=baseHeight+Math.min(t.level,SKYSCRAPER_REFERENCE_FLOORS)*SKYSCRAPER_FLOOR_HEIGHT*zoom;
  const tier=t.artVariant>1?1:t.level>=200?3:t.level>=100?2:1,repeatStart=SKYSCRAPER_REPEAT_START[tier],repeatSpan=SKYSCRAPER_REPEAT_SPAN;
  const capHeight=illustratedHeight*repeatStart,repeatTileHeight=illustratedHeight*repeatSpan;
  return{x:p.x-w/2,y:p.y-h,width:w,height:h,baseHeight,capHeight,repeatHeight,repeatTileHeight,repeatStart,repeatSpan};
 }
 const tier=Math.max(1,Math.min(3,t.level||1)),growth=[.84,.92,1][tier-1],art=artTier(t.type,t.level);
 if(depth){
  // Long-lot art is a base three squares long and `depth` deep on the 2:1 grid (3×1 wide, 3×2 broad), scaled to fit the lot
  // (k = 1 on a lot of its own size) and centered on it.
  const k=Math.min(Math.max(width,height)/3,side/depth)*growth*zoom,w=28*(3+depth)*k*.98,h=w*imageHeight/imageWidth;
  const x=p.x-(width-height)*14*zoom,y=p.y-(width+height)*7*zoom+7*(3+depth)*k;
  return{x:x-w/2,y:y-h,width:w,height:h};
 }
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
 // While a long-lot or expansion sprite is still downloading, keep showing the square or tier-1 sprite instead of the procedural fallback.
 const variant=t.artVariant||1;
 let item;for(const args of [[t.level,t.footprint,variant],[t.level,undefined,variant],[1,undefined,variant],[t.level,t.footprint,1],[t.level,undefined,1],[1,undefined,1]]){item=entry(t.type,...args);if(ready(item))break;}
 const image=item?.image;
 if(!image?.complete||!image.naturalWidth)return false;
 const bounds=buildingArtBounds(t,p,zoom,image.naturalWidth,image.naturalHeight,item.depth);
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 // Long-lot art runs toward the lower right; a lot deeper than it is wide shows the sprite mirrored.
 const mirror=!!item.depth&&(t.footprint?.height||1)>(t.footprint?.width||1);
 if(mirror){ctx.translate(bounds.x*2+bounds.width,0);ctx.scale(-1,1);}
 if(t.type==='skyscraper'){
  if(!bounds.repeatHeight)ctx.drawImage(image,bounds.x,bounds.y,bounds.width,bounds.height);
  else{
   const sourceY=image.naturalHeight*bounds.repeatStart,insertY=bounds.y+bounds.capHeight;
   ctx.drawImage(image,0,0,image.naturalWidth,sourceY,bounds.x,bounds.y,bounds.width,bounds.capHeight);
   const transform=ctx.getTransform?.(),viewTop=transform&&ctx.canvas?-transform.f/transform.d:-Infinity,viewBottom=transform&&ctx.canvas?(ctx.canvas.height-transform.f)/transform.d:Infinity;
   const first=Math.max(0,Math.floor((viewTop-insertY)/bounds.repeatTileHeight)),last=Math.min(Math.ceil(bounds.repeatHeight/bounds.repeatTileHeight),Math.ceil((viewBottom-insertY)/bounds.repeatTileHeight));
   for(let n=first;n<last;n++){
    const y=insertY+n*bounds.repeatTileHeight,height=Math.min(bounds.repeatTileHeight,bounds.repeatHeight-n*bounds.repeatTileHeight);
    ctx.drawImage(image,0,sourceY,image.naturalWidth,image.naturalHeight*bounds.repeatSpan*height/bounds.repeatTileHeight,bounds.x,y,bounds.width,height);
   }
   ctx.drawImage(image,0,sourceY,image.naturalWidth,image.naturalHeight-sourceY,bounds.x,insertY+bounds.repeatHeight,bounds.width,bounds.height-bounds.capHeight-bounds.repeatHeight);
  }
 }else ctx.drawImage(image,bounds.x,bounds.y,bounds.width,bounds.height);
 if(t.type==='skyscraper'&&t.rooftopDeck){
  // A glass viewing terrace crowns the tower; its size stays fixed as floors grow.
  const x=bounds.x+bounds.width*.5,y=bounds.y+bounds.width*.10,rx=bounds.width*.14,ry=bounds.width*.045,h=8*zoom;
  ctx.fillStyle='#456875';ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#bde9edcc';ctx.fillRect(x-rx,y-h,rx*2,h);ctx.strokeStyle='#e4f7f5';ctx.lineWidth=zoom;ctx.strokeRect(x-rx,y-h,rx*2,h);
  ctx.fillStyle='#e4f4ed';ctx.beginPath();ctx.ellipse(x,y-h,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  for(let n=-2;n<=2;n++){ctx.beginPath();ctx.moveTo(x+n*rx/3,y-h);ctx.lineTo(x+n*rx/3,y);ctx.stroke();}
 }
 ctx.restore();
 return{...bounds,image,mirror};
}
