import {L} from './i18n.js';
import {drawLandmark} from './landmarks.js';
import {drawBuildingArt,buildingArtPending} from './building-art.js';
import {drawSceneryArt,sceneryPending} from './scenery-art.js';
import {landmarkAnchor,landmarkBuildError} from './landmark-construction.js';
import {createWorldLife} from './world-life.js';
import {reducedMotion} from './motion.js';
import {flexState} from './flex.js';
import {selectedModel} from './luxury-models.js';
import {drawMapYacht,YACHT_DESIGNS} from './map-vehicles.js';
import {mansionDesign,MANSION_COLORS,MANSION_HIT} from './mansion.js';
import {mansionArtURL,estateArtURL} from './mansion-art.js';
import {SIZE,BOULEVARD,TYPES,coords,canBuild,footprintCells,buildingArea,mapOffset,buildingName} from './engine.js';
// Expansion adds facade detail with only a small change to the architectural envelope.
export function buildingHeight(type,level){const step=Math.max(0,Math.min(2,level-1)),shape=TYPES[type]?.shape||type;
 if(type==='hq')return 170+step*5;if(type==='office')return 134+step*4;if(type==='hotel')return 74+step*3;if(type==='monument')return 72+step*3;if(type==='condo')return 48+step*3;
 if(type==='resort')return 17;if(type==='golf')return 9;if(type==='themepark')return 30;if(type==='garden'||type==='citypark')return 0;
 return (shape==='home'||shape==='shop'?27:shape==='factory'?25:22)+step*2;
}
// Stable site-based materials: expansion keeps each building's colour identity.
const BUILDING_PALETTES={
 office:[['#88c9ee','#285a91','#438cc5','#deebef','#c0e6f7'],['#8adbc9','#256e70','#399c97','#f0dfac','#bceee2'],['#c1b0df','#655182','#9480b7','#eee0c6','#e0d6f2']],
 hq:[['#ead195','#91713c','#c5a45f','#fff0c4','#f7e7b2'],['#9ad6b7','#285e51','#438d73','#e9ce8f','#bee9d0'],['#bbccec','#3f5b89','#6c91bc','#efcf91','#d8e9fc']],
 condo:[['#f3d6bf','#a56454','#d7987c','#fff0d4','#b6dce6'],['#d8e8c0','#66845d','#9fbe83','#f6e9c6','#cee7e0'],['#ebd5e3','#896984','#bea0b9','#fff0df','#dce4f4'],['#f3e4b6','#aa8c58','#dac081','#fff6dd','#bbdfe5']],
 home:[['#efd3b3','#a27159','#d8ab81','#f7e8c8','#c1dfe3'],['#d6e5c5','#68836b','#a1bd94','#f8e5c0','#d1e8de'],['#e9c9bd','#995f59','#cf9185','#f9dfbd','#c5dce7']],
 shop:[['#9ed8dc','#347b88','#63b3bf','#f5e2b8','#d4eff0'],['#f0cfac','#a3634d','#d89570','#ffe9c1','#c5e2e6'],['#d5c5e6','#79638e','#ae94c8','#f9e5c7','#e5def2']]
};
export function buildingPalette(type,x,y){
 const shape=TYPES[type]?.shape||type,palettes=BUILDING_PALETTES[type]||BUILDING_PALETTES[shape==='tower'?'office':shape]||BUILDING_PALETTES.home;
 const index=((Math.floor(x)*7+Math.floor(y)*11)%palettes.length+palettes.length)%palettes.length;
 const [roof,side,front,trim,window]=palettes[index];return{roof,side,front,trim,window};
}
export function createRenderer(canvas,getState,getAnalysis,onTile,onHover){
 let ctx=canvas.getContext('2d');const mainCtx=ctx;let w=0,h=0,dpr=1,zoom=1,panX=0,panY=0,hover=-1,selected=-1,tool='inspect',layer='normal',groundView=false,down=null;
 let hits=[],recordingHit=null,drawingFootprint=null,buildingTransform=null,depth=0,column=0,dynamics=[],pendingImages=false,buildFootprint={width:1,height:1},landmarkPlacement=null;
 // world shifts fixed scenery (estate, yacht) by the map expansion offset; viewState keeps the camera still when the map grows.
 let world=0,viewState=null,viewOffset=0;
 // X-ray: buildings drawn in front of the pointed-at or selected building fade, so it stays visible and clickable.
 let under=-1,faded=new Set(),fadeKey='';
 const imageMasks=new WeakMap(),imageTops=new Map();
 // The map is drawn into an offscreen canvas and reused until the state, camera or layer changes; a margin lets small pans reuse it.
 const MARGIN=200,cacheCanvas=offscreen(),cacheCtx=cacheCanvas.getContext('2d'),stamp=offscreen();let cache=null,shift={x:0,y:0};
 function offscreen(){return typeof document==='undefined'?{width:0,height:0,getContext:()=>ctx}:document.createElement('canvas');}
 const halfW=28,halfH=14;
 function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(2,Math.max(window.devicePixelRatio||1,1.5));canvas.width=w*dpr;canvas.height=h*dpr;}
 new ResizeObserver(resize).observe(canvas);resize();
 function origin(){return{x:w*.5+panX,y:h*.5-260*zoom+panY};}
 function screen(x,y,z=0){x+=world;y+=world;if(drawingFootprint){const f=drawingFootprint;x=f.x+(x-f.x)*f.width;y=f.y+(y-f.y)*f.height;z*=1+(f.width*f.height-1)*.04;}const o=origin();return{x:o.x+(x-y)*halfW*zoom,y:o.y+(x+y)*halfH*zoom-z*zoom};}
 function pick(x,y){
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  let hit=-1;for(let n=hits.length-1;n>=0&&!groundView;n--)if((hits[n].i>=0||hits[n].i===MANSION_HIT)&&!faded.has(hits[n].i)&&ctx.isPointInPath(hits[n].path,x-shift.x,y-shift.y)&&imageHit(hits[n],x-shift.x,y-shift.y)){hit=hits[n].i;break;}
  ctx.restore();if(hit!==-1)return hit;
  return groundTile(x,y);}
 function groundTile(x,y){
  const o=origin(),a=(x-o.x)/(halfW*zoom),b=(y-o.y)/(halfH*zoom),gx=Math.floor((a+b)/2),gy=Math.floor((b-a)/2);return gx>=0&&gy>=0&&gx<SIZE&&gy<SIZE?gy*SIZE+gx:-1;}
 function imageHit(hit,x,y){
  if(!hit.image||typeof document==='undefined')return true;
  if(!imageMasks.has(hit.image)){
   try{const c=document.createElement('canvas'),scale=Math.min(128/hit.image.naturalWidth,256/hit.image.naturalHeight,1);c.width=Math.max(1,Math.ceil(hit.image.naturalWidth*scale));c.height=Math.max(1,Math.ceil(hit.image.naturalHeight*scale));const mask=c.getContext('2d',{willReadFrequently:true});mask.drawImage(hit.image,0,0,c.width,c.height);imageMasks.set(hit.image,{data:mask.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height});}
   catch{imageMasks.set(hit.image,null);}
  }
  const mask=imageMasks.get(hit.image);if(!mask)return true;
  const b=hit.box,px=Math.floor((x-b[0])/(b[2]-b[0])*mask.width),py=Math.floor((y-b[1])/(b[3]-b[1])*mask.height);
  return px>=0&&py>=0&&px<mask.width&&py<mask.height&&mask.data[(py*mask.width+(hit.mirror?mask.width-1-px:px))*4+3]>24;
 }
 function poly(points,fill,stroke){
  if(recordingHit)record(points);
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.6;ctx.stroke();}}
 // A building's hit shape is one path of same-winding polygons, so isPointInPath finds a click inside any of them and clip() covers all of them at once.
 function record(points){const m=ctx.getTransform(),pts=points.map(p=>({x:(m.a*p.x+m.c*p.y+m.e)/dpr,y:(m.b*p.x+m.d*p.y+m.f)/dpr}));
  let area=0;for(let k=0;k<pts.length;k++){const p=pts[k],q=pts[(k+1)%pts.length];area+=p.x*q.y-q.x*p.y;}if(area<0)pts.reverse();
  const path=recordingHit.path;pts.forEach((p,k)=>{k?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y);extend(recordingHit.box,p.x,p.y);});path.closePath();}
 function extend(box,x,y){if(x<box[0])box[0]=x;if(y<box[1])box[1]=y;if(x>box[2])box[2]=x;if(y>box[3])box[3]=y;}
 function startHit(i){recordingHit={i,path:new Path2D(),box:[Infinity,Infinity,-Infinity,-Infinity],depth,col:column,alpha:ctx.globalAlpha};hits.push(recordingHit);}
 function endHit(){if(recordingHit&&recordingHit.box[0]===Infinity)hits.pop();recordingHit=null;}
 function scenery(id,p,width,options={},hitDepth=depth){
  const picture=drawSceneryArt(ctx,id,p,width,options),pending=sceneryPending(id);if(pending)pendingImages=true;
  if(picture){const saved=recordingHit;if(!saved||saved.box[0]!==Infinity)startHit(saved?.i??-1);recordingHit.image=picture.image;recordingHit.mirror=picture.mirror;recordingHit.depth=hitDepth;recordingHit.path.rect(picture.x,picture.y,picture.width,picture.height);extend(recordingHit.box,picture.x,picture.y);extend(recordingHit.box,picture.x+picture.width,picture.y+picture.height);recordingHit=saved;}
  // A loading sprite counts as drawn so callers skip their older procedural stand-in instead of flashing it.
  return picture||pending;
 }
 function sceneryPlot(id,x,y,width,height){const center=screen(x+width/2,y+height/2),front=screen(x+width,y+height);return scenery(id,{x:center.x,y:front.y},(width+height)*halfW*zoom);}
 // Moving details of the cached scene (waves, blades, smoke) are redrawn every frame at their depth. box is in canvas px before any building scale.
 function animate(box,draw){const tf=buildingTransform;if(tf){const p=screen(tf.x,tf.y);box=[p.x+(box[0]-p.x)*tf.width,p.y+(box[1]-p.y)*tf.scale,p.x+(box[2]-p.x)*tf.width,p.y+(box[3]-p.y)*tf.scale];}dynamics.push({depth,col:column,box,draw,transform:tf});}
 function tileBox(x,y,zTop,pad){return[screen(x,y+1).x-pad,screen(x,y,zTop).y-pad,screen(x+1,y).x+pad,screen(x+1,y+1).y+pad];}
 function tile(x,y,fill,stroke,z=0){poly([screen(x,y,z),screen(x+1,y,z),screen(x+1,y+1,z),screen(x,y+1,z)],fill,stroke);}
 function box(x,y,sx,sy,z,color,side='#73887d',front='#9cac96',baseZ=0){
  const top=screen(x,y,z),base=screen(x+sx,y+sy,baseZ);
  const material=c=>{const g=ctx.createLinearGradient(top.x,top.y,base.x,base.y);g.addColorStop(0,c);g.addColorStop(.42,c);g.addColorStop(1,/^#[0-9a-f]{6}$/i.test(c)?'#'+c.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*.76).toString(16).padStart(2,'0')).join(''):c);return g;};
  poly([screen(x,y+sy,baseZ),screen(x+sx,y+sy,baseZ),screen(x+sx,y+sy,z),screen(x,y+sy,z)],material(front));
  poly([screen(x+sx,y,baseZ),screen(x+sx,y+sy,baseZ),screen(x+sx,y+sy,z),screen(x+sx,y,z)],material(side));
  poly([screen(x,y,z),screen(x+sx,y,z),screen(x+sx,y+sy,z),screen(x,y+sy,z)],color,'#fff9e54d');
  line(screen(x,y+sy,z),screen(x+sx,y+sy,z),'#fffae780',.6);
 }
 function line(a,b,color,width=1){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width*zoom;ctx.stroke();}
 function circle(p,r,color){if(recordingHit){const pts=[];for(let n=0;n<12;n++)pts.push({x:p.x+Math.cos(n*Math.PI/6)*r*zoom,y:p.y+Math.sin(n*Math.PI/6)*r*zoom});record(pts);}ctx.beginPath();ctx.arc(p.x,p.y,r*zoom,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 function assetBadge(x,y,t){const p=imageTops.get(y*SIZE+x)||screen(x+.5,y+.5,badgeHeight(t.type,t.level)+16),label=`✦ ${t.landmark?.name||buildingName(t)}${t.type==='plot'?'':' · Lv.'+t.level}`;ctx.font=`bold ${Math.max(10,11*zoom)}px sans-serif`;ctx.textAlign='center';const width=ctx.measureText(label).width+14;if(recordingHit)record([{x:p.x-width/2,y:p.y-13*zoom},{x:p.x+width/2,y:p.y-13*zoom},{x:p.x+width/2,y:p.y+6*zoom},{x:p.x-width/2,y:p.y+6*zoom}]);ctx.fillStyle='#2f4d3eeb';ctx.fillRect(p.x-width/2,p.y-13*zoom,width,19*zoom);ctx.fillStyle='#ffe59a';ctx.fillText(label,p.x,p.y+1*zoom);}
 function tree(x,y,scale=1){
  const p=screen(x,y),r=10*scale*zoom;
  ctx.fillStyle='#203c3430';ctx.beginPath();ctx.ellipse(p.x+9*scale*zoom,p.y+4*zoom,r*1.7,r*.55,.3,0,Math.PI*2);ctx.fill();
  const species=['tree-oak','tree-plane','tree-cypress'][Math.abs(Math.round(x*13+y*7))%3];
  if(scenery(species,p,30*scale*zoom,{maxHeight:(species==='tree-cypress'?46:40)*scale*zoom}))return;
  const top=screen(x,y,21*scale),half=1.4*scale*zoom;if(recordingHit)record([{x:p.x-half,y:p.y},{x:p.x+half,y:p.y},{x:top.x+half,y:top.y},{x:top.x-half,y:top.y}]);
  line(p,top,'#75614b',2.2*scale);line(screen(x,y,12*scale),screen(x-.13,y,22*scale),'#8e7d5b',1.3*scale);
  const c=screen(x,y,25*scale),foliage=ctx.createRadialGradient(c.x-r*.4,c.y-r*.6,0,c.x,c.y,r*1.2);foliage.addColorStop(0,'#a2b87a');foliage.addColorStop(.45,'#668854');foliage.addColorStop(1,'#294d42');
  const crown=[];for(let n=0;n<24;n++){const angle=n*Math.PI/12,radius=r*(.86+.14*Math.sin(n*2.7+x));crown.push({x:c.x+Math.cos(angle)*radius,y:c.y+Math.sin(angle)*radius*1.2});}
  if(recordingHit)record(crown);
  ctx.fillStyle=foliage;ctx.beginPath();crown.forEach((q,n)=>n?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill();
  for(let n=0;n<23;n++){const angle=n*2.4,radius=r*Math.sqrt((n+.5)/25)*.86;ctx.fillStyle=n%3?'#b2c18b45':'#1b493d45';ctx.beginPath();ctx.ellipse(c.x+Math.cos(angle)*radius,c.y+Math.sin(angle)*radius*1.1,1.8*scale*zoom,1.1*scale*zoom,angle,0,Math.PI*2);ctx.fill();}
 }
 function windows(x,y,z,levels){for(let k=0;k<levels;k++)for(let j=0;j<3;j++){
  const base=z-7-k*10;poly([screen(x+.19+j*.19,y+.83,base),screen(x+.31+j*.19,y+.83,base),screen(x+.31+j*.19,y+.83,base-6),screen(x+.19+j*.19,y+.83,base-6)],j===1&&k%2?'#ead3a1':'#a6c9cf','#eee8d280');
  poly([screen(x+.83,y+.2+j*.18,base),screen(x+.83,y+.32+j*.18,base),screen(x+.83,y+.32+j*.18,base-6),screen(x+.83,y+.2+j*.18,base-6)],'#365c71','#bdd4d370');
 }}
 function luxuryGround(x,y,accent){
  tile(x+.025,y+.025,'#e8e1cf','#ccb77d');tile(x+.12,y+.12,'#b7c69d','#f1d78a');
  line(screen(x+.5,y+.92),screen(x+.5,y+.58),'#e9dfca',7);circle(screen(x+.5,y+.78,2),3.8,'#79b9bd');circle(screen(x+.5,y+.78,3),1.5,accent);
  for(const [dx,dy]of[[.12,.2],[.84,.2],[.12,.76],[.84,.76]])tree(x+dx,y+dy,.48);
 }
 function luxuryWindows(x,y,z,levels,front='#ffe09a',side='#a9d9df'){
  for(let k=0;k<levels;k++)for(let j=0;j<3;j++){
   const zz=z-9-k*12,offset=.18+j*.205;
   poly([screen(x+offset,y+.86,zz),screen(x+offset+.11,y+.86,zz),screen(x+offset+.11,y+.86,zz-6),screen(x+offset,y+.86,zz-6)],front);
   poly([screen(x+.86,y+offset,zz),screen(x+.86,y+offset+.11,zz),screen(x+.86,y+offset+.11,zz-6),screen(x+.86,y+offset,zz-6)],side);
  }
 }
 function buildingScale(type,level){return TYPES[type]?.group&&!['garden','citypark','golf','resort','themepark'].includes(type)?[.9,.92,.94][Math.max(0,Math.min(2,level-1))]:1;}
 function badgeHeight(type,level){if(type==='plot')return 5;if(type==='golf')return 24;if(type==='themepark')return 44;if(type==='resort')return 35;return TYPES[type]?.group?(buildingHeight(type,level)+24)*buildingScale(type,level):(type==='tower'?140:75+level*10);}
 function building(x,y,t){
  drawingFootprint=t.footprint?{x,y,...t.footprint}:null;
  startHit(y*SIZE+x);
  const landmark=drawLandmark(ctx,t,screen(x+.5,y+.5),zoom);
  if(t.landmark&&!landmark)pendingImages=true;
  const picture=landmark||(!t.landmark&&drawBuildingArt(ctx,t,screen(x+1,y+1),zoom));
  const artPending=!t.landmark&&buildingArtPending(t.type,t.level,t.footprint);if(artPending)pendingImages=true;
  if(picture){recordingHit.image=picture.image;recordingHit.mirror=picture.mirror;recordingHit.path.rect(picture.x,picture.y,picture.width,picture.height);extend(recordingHit.box,picture.x,picture.y);extend(recordingHit.box,picture.x+picture.width,picture.y+picture.height);imageTops.set(y*SIZE+x,{x:picture.x+picture.width/2,y:picture.y-12*zoom});recordingHit=null;drawingFootprint=null;return picture;}
  // Leave the lot empty until the sprite loads rather than flashing the older procedural building.
  if(artPending){endHit();drawingFootprint=null;return;}
  const scale=buildingScale(t.type,t.level),p=screen(x+.5,y+.5),width=scale===1?1:[.90,.94,.98][Math.max(0,Math.min(2,t.level-1))];
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(width,scale);ctx.translate(-p.x,-p.y);
  buildingTransform=width===1&&scale===1?null:{x:x+.5,y:y+.5,width,scale};const custom=false;buildingBody(x,y,t);buildingTransform=null;
  if(!custom&&TYPES[t.type]?.group&&(!TYPES[t.type].managed||t.type==='hospital')&&!['garden','citypark','condo'].includes(t.type)&&t.level>=2){
   const c=TYPES[t.type].color,z=buildingHeight(t.type,t.level);
   // A stepped penthouse and a broad colonnaded entrance distinguish expanded buildings.
   box(x+.22,y+.22,.56,.56,z+5,'#d5dfcd','#617b83','#b7c9c0',z);
   for(const yy of[.25,.75])line(screen(x+.24,y+yy,z+11),screen(x+.76,y+yy,z+11),'#eaf4df',1.2);
   if(t.level===2){box(x+.32,y+.33,.30,.30,z+7,'#9bbec5','#486c78','#81a3b0',z+5);}
   else{for(const dx of[.26,.69])box(x+dx,y+.62,.1,.1,z+9,'#729c67','#73887d','#9cac96',z+5);}
   box(x+.23,y+.76,.55,.2,15,'#e8d6a4','#8f8164','#c6aa71');
   for(const dx of[.25,.49,.74])line(screen(x+dx,y+.94,1),screen(x+dx,y+.94,14),'#fff0cd',2);
   if(t.level>=3){
    box(x+.36,y+.36,.28,.28,z+8,'#ebcd7d','#877349','#cbb477',z+5);
    for(const dx of[.17,.82])line(screen(x+dx,y+.85,18),screen(x+dx,y+.85,z-3),'#f4d787',1.5);
    line(screen(x+.36,y+.65,z+9),screen(x+.65,y+.65,z+9),'#d9e9df',1.2);
   }
  }
  ctx.restore();recordingHit=null;drawingFootprint=null;
 }
 function buildingBody(x,y,t){const original=t.type,type=TYPES[original].shape||original,c=TYPES[original].color,palette=buildingPalette(original,x,y);
  if(type==='road')return;
  if(type==='golf'){
   // A golf course grows across the ground, not into an office tower.
   const oval=(xx,yy,rx,ry,color)=>poly(Array.from({length:24},(_,n)=>{const a=n*Math.PI/12;return screen(x+xx+Math.cos(a)*rx,y+yy+Math.sin(a)*ry);}),color);
   poly([screen(x+.03,y+.03),screen(x+.97,y+.03),screen(x+.97,y+.97),screen(x+.03,y+.97)],'#527e42','#b4c790');
   poly([[.09,.89],[.13,.67],[.30,.50],[.44,.46],[.60,.30],[.80,.33],[.86,.49],[.70,.59],[.51,.58],[.35,.72],[.27,.92]].map(([dx,dy])=>screen(x+dx,y+dy)),'#8db85f');
   for(let n=0;n<4;n++)line(screen(x+.16+n*.04,y+.84-n*.07),screen(x+.32+n*.04,y+.81-n*.07),'#a0c77b',1.2);
   oval(.66,.43,.14,.11,'#b5d886');oval(.79,.55,.075,.035,'#dfd1a1');oval(.28,.78,.06,.025,'#e3d8ae');
   if(t.level>=2){oval(.79,.20,.12,.10,'#bacda0');oval(.79,.20,.095,.078,'#65aeb7');line(screen(x+.74,y+.20),screen(x+.82,y+.20),'#bee3dd',1);oval(.42,.69,.10,.08,'#aed17c');}
   if(t.level>=3){oval(.15,.48,.09,.07,'#b9d98b');oval(.23,.42,.05,.035,'#e5d6aa');poly([[.1,.30],[.52,.30],[.56,.35],[.1,.35]].map(([dx,dy])=>screen(x+dx,y+dy)),'#d7c49a');}
   // Keep flags short and on separate putting greens.
   for(const [xx,yy]of [[.66,.43],[.42,.69],[.15,.48]].slice(0,t.level)){circle(screen(x+xx,y+yy),1.2,'#405b35');line(screen(x+xx,y+yy),screen(x+xx,y+yy,10),'#f7f4d8',1);poly([screen(x+xx,y+yy,10),screen(x+xx+.045,y+yy,8.5),screen(x+xx,y+yy,7)],'#d48654');}
   // One-storey clubhouse: wider facilities and an open terrace on later tiers.
   const cw=.25+(t.level-1)*.08;
   box(x+.10,y+.09,cw,.18,9,'#ede2c5','#8c8e71','#c0b38f');
   box(x+.08,y+.07,cw+.04,.22,11,'#617e6e','#425e50','#829780',9);
   for(let n=0;n<t.level+1;n++)line(screen(x+.14+n*.075,y+.275,3),screen(x+.14+n*.075,y+.275,7),'#a7d9d4',2);
   if(t.level>=2){for(const dx of[.13,.36])line(screen(x+dx,y+.34,0),screen(x+dx,y+.34,7),'#e7dec1',1.2);box(x+.10,y+.27,.29,.08,8,'#e5d3a9','#9c9476','#cabd98',7);}
   if(t.level>=3){box(x+.52,y+.13,.14,.17,2,'#d9c59a');for(const yy of[.16,.25]){circle(screen(x+.59,y+yy,4),2,'#e9e0bd');line(screen(x+.59,y+yy,2),screen(x+.59,y+yy,6),'#dfd2aa',1);}}
   for(const [xx,yy]of [[.08,.82],[.91,.74],[.57,.10]])tree(x+xx,y+yy,.28);
   return;
  }
  if(type==='themepark'){
   // A low-rise amusement park: every tier adds rides across the ground, never a taller tower.
   poly([[.03,.03],[.97,.03],[.97,.97],[.03,.97]].map(([dx,dy])=>screen(x+dx,y+dy)),'#9cc27f','#e8d9b4');
   poly([[.08,.52],[.92,.52],[.92,.66],[.08,.66]].map(([dx,dy])=>screen(x+dx,y+dy)),'#e6d3a6');
   poly([[.44,.10],[.56,.10],[.56,.92],[.44,.92]].map(([dx,dy])=>screen(x+dx,y+dy)),'#e6d3a6');
   // Entrance gate with striped awning.
   box(x+.36,y+.84,.28,.10,9,'#f3e4c4','#9c7e5e','#d8b88a');box(x+.34,y+.82,.32,.14,12,'#d9574f','#8f3a37','#f0a35c',9);
   // Ferris wheel on the left, carousel on the right.
   const hub=screen(x+.24,y+.30,26);line(screen(x+.18,y+.34),hub,'#7d6a5a',2);line(screen(x+.30,y+.34),hub,'#7d6a5a',2);
   circle(hub,15,'#f7efd8');circle(hub,12,'#9cc27f');for(let n=0;n<8;n++){const a=n*Math.PI/4,p={x:hub.x+Math.cos(a)*13*zoom,y:hub.y+Math.sin(a)*13*zoom};line(hub,p,'#fff7e0',1);circle(p,2.2,['#e36f5d','#f2c14e','#5fb2c9','#a98bd1'][n%4]);}
   box(x+.66,y+.22,.20,.20,7,'#f2d27a','#a4803f','#e0b45c');poly([screen(x+.64,y+.20,7),screen(x+.88,y+.20,7),screen(x+.76,y+.32,17)],'#e36f5d');poly([screen(x+.76,y+.32,17),screen(x+.88,y+.20,7),screen(x+.88,y+.44,7)],'#c9514a');
   for(const [xx,yy]of [[.10,.90],[.90,.88],[.12,.60]])tree(x+xx,y+yy,.3);
   if(t.level>=2){
    // Roller coaster: raised track on striped supports and a fairy-tale castle.
    const track=[[.60,.60,6],[.70,.52,16],[.82,.58,24],[.90,.70,12],[.82,.82,5],[.66,.76,14]];
    for(const [dx,dy,z]of track)box(x+dx-.01,y+dy-.01,.02,.02,z,'#c9c1b0','#8a8375','#b5ad9c');
    for(let n=0;n<track.length;n++){const [ax,ay,az]=track[n],[bx,by,bz]=track[(n+1)%track.length];line(screen(x+ax,y+ay,az),screen(x+bx,y+by,bz),'#d9574f',2.4);}
    box(x+.12,y+.64,.20,.18,18,'#efe6f4','#8e7fa3','#cbbfdc');for(const dx of[.12,.28])box(x+dx,y+.64,.05,.05,26,'#efe6f4','#8e7fa3','#cbbfdc',18);
    for(const dx of[.14,.30])poly([screen(x+dx-.01,y+.66,26),screen(x+dx+.04,y+.66,26),screen(x+dx+.015,y+.66,34)],'#6f8fd1');
   }
   if(t.level>=3){
    // Drop tower, log flume lagoon and a parade of food stalls.
    box(x+.46,y+.14,.08,.08,30,'#e9e1cf','#8c8577','#c7bfad');box(x+.44,y+.12,.12,.12,32,'#f2c14e','#a4803f','#e0a93c',30);
    const lagoon=Array.from({length:20},(_,n)=>{const a=n*Math.PI/10;return screen(x+.76+Math.cos(a)*.12,y+.36+Math.sin(a)*.06);});poly(lagoon,'#6cc2cf','#d6f0ee');
    for(let n=0;n<4;n++)box(x+.10+n*.09,y+.46,.07,.05,6,['#f5d6a0','#f2b6ad','#bfe0c8','#cfd8f2'][n],'#8f8474','#d8c9a8');
   }
   return;
  }
  if(type==='plot'){tile(x+.06,y+.06,'#c8bb8877','#efd78d',2);return;}
  poly([screen(x+.04,y+.04),screen(x+.96,y+.04),screen(x+.96,y+.96),screen(x+.04,y+.96)],'#c3c4b3','#e5dfc7');
  if(type==='park'){tile(x+.07,y+.07,'#81aa74');line(screen(x+.1,y+.5),screen(x+.9,y+.5),'#d4c7a5',5);tree(x+.3,y+.3);tree(x+.75,y+.7,.75);if(['garden','citypark'].includes(original)&&t.level>=2){box(x+.12,y+.62,.28,.24,3,'#e6d5b2');for(const [dx,dy]of[[.14,.64],[.37,.64],[.14,.83],[.37,.83]])line(screen(x+dx,y+dy,3),screen(x+dx,y+dy,22),'#e8dfc4',2);box(x+.1,y+.60,.32,.28,23,'#8eaa8c','#73887d','#9cac96',21);}if(['garden','citypark'].includes(original)&&t.level>=3){circle(screen(x+.64,y+.34,3),8,'#e8d8a9');circle(screen(x+.64,y+.34,5),6,'#79c9cf');line(screen(x+.64,y+.34,5),screen(x+.64,y+.34,21),'#b9e8e7',2);for(const dx of[.15,.35,.55,.75])circle(screen(x+dx,y+.93,4),2,'#dba4a0');}return;}
  if(type==='wind'){box(x+.32,y+.32,.35,.35,5,'#e3e8d8');const p=screen(x+.5,y+.5,55);line(screen(x+.5,y+.5,3),p,'#e2e9dc',4);animate([p.x-26*zoom,p.y-26*zoom,p.x+26*zoom,p.y+26*zoom],time=>{const p=screen(x+.5,y+.5,55);for(let k=0;k<3;k++){const a=time*.0007+k*Math.PI*2/3;line(p,{x:p.x+Math.cos(a)*22*zoom,y:p.y+Math.sin(a)*22*zoom},'#f5f6e8',3);}circle(p,3,'#749398');});return;}
  if(type==='water'){for(const dx of [.2,.65])for(const dy of [.2,.65])line(screen(x+dx,y+dy),screen(x+dx,y+dy,28),'#668c97',2);box(x+.14,y+.14,.65,.65,37,'#acd5d7','#6799aa','#86b7be');box(x+.22,y+.22,.49,.49,41,'#d3e6df','#87b4be','#acd0cf');return;}
  if(type==='plaza'){tile(x+.06,y+.06,'#d4c4b0');box(x+.3,y+.3,.4,.4,4,'#aacbd3');circle(screen(x+.5,y+.5,7),5,'#b4e4e1');tree(x+.16,y+.2,.6);tree(x+.8,y+.8,.6);return;}
  if(type==='factory'){box(x+.12,y+.15,.72,.68,buildingHeight(original,t.level),c,'#9c946e','#c4b88b');box(x+.2,y+.22,.20,.2,44+2*(t.level-1),'#aaa692','#827e6c','#b1a894');{const lo=screen(x+.3,y+.3,46+2*(t.level-1)),hi=screen(x,y+.3,46+2*(t.level-1)+19);animate([Math.min(lo.x,hi.x)-9*zoom,hi.y-9*zoom,Math.max(lo.x,hi.x)+9*zoom,lo.y+9*zoom],time=>{for(let j=0;j<3;j++){const phase=(time*.0002+j*.35)%1;circle(screen(x+.3-phase*.3,y+.3,46+2*(t.level-1)+phase*19),3+phase*5,`rgba(211,214,197,${.32*(1-phase)})`);}});}windows(x,y,17,1);return;}
  if(original==='hotel'){
   luxuryGround(x,y,'#d3a63d');const z=buildingHeight(original,t.level);
   box(x+.08,y+.12,.84,.76,11,'#efe2c6','#9a8064','#c9aa7d');
   box(x+.10,y+.18,.80,.50,z,'#f0d9a9','#a18060','#d3b184');
   box(x+.10,y+.60,.22,.30,z-15,'#f0d9a9','#a18060','#d3b184');
   box(x+.68,y+.60,.22,.30,z-15,'#f0d9a9','#a18060','#d3b184');
   poly([screen(x+.07,y+.15,z),screen(x+.93,y+.15,z),screen(x+.84,y+.43,z+14),screen(x+.16,y+.43,z+14)],'#803f43');
   poly([screen(x+.16,y+.43,z+14),screen(x+.84,y+.43,z+14),screen(x+.93,y+.72,z),screen(x+.07,y+.72,z)],'#ab5953');
   luxuryWindows(x,y,z,Math.max(3,t.level+3));
   if(t.level>=2)for(const xx of[.13,.73]){box(x+xx,y+.20,.14,.16,z+18,'#f2dcaa','#987754','#d1af74',z);box(x+xx-.02,y+.18,.18,.20,z+22,'#bd8d46','#73887d','#9cac96',z+18);}
   if(t.level>=3){box(x+.33,y+.29,.34,.29,z+28,'#f2deb0','#927452','#c4a271',z+10);box(x+.30,y+.26,.40,.35,z+32,'#b98740','#73887d','#9cac96',z+28);for(const xx of[.39,.52])line(screen(x+xx,y+.59,z+14),screen(x+xx,y+.59,z+25),'#fff3c6',3);}
   box(x+.31,y+.70,.38,.18,18,'#873e46','#613039','#e0b85f');
   line(screen(x+.5,y+.9,1),screen(x+.5,y+1.04,1),'#a64548',7);
   if(t.level>=2)for(const xx of[.14,.78]){box(x+xx,y+.63,.08,.08,z-6,'#edd397');line(screen(x+xx+.04,y+.67,z-6),screen(x+xx+.04,y+.67,z+6),'#ddbc6e',1);}
   for(const xx of[.34,.45,.56,.67])line(screen(x+xx,y+.88,2),screen(x+xx,y+.88,17),'#f4e5bf',1.7);
   const crown=screen(x+.5,y+.5,z+24);ctx.fillStyle='#783f35';ctx.font=`bold ${10*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText(t.level===3?'GRAND HOTEL':'HOTEL',crown.x,crown.y+3*zoom);return;
  }
  if(original==='resort'){
   // Low-rise hospitality: richer landscaping and facilities, never extra storeys.
   const premium=t.level>=2,exclusive=t.level>=3,wall=premium?'#f3eee0':'#e4cfac',roof=premium?'#bbcbbb':'#a57455';
   poly([[.03,.03],[.97,.03],[.97,.97],[.03,.97]].map(([dx,dy])=>screen(x+dx,y+dy)),exclusive?'#b4c6a3':'#acc49a','#e6d9ba');
   poly([[.09,.40],[.90,.40],[.90,.88],[.09,.88]].map(([dx,dy])=>screen(x+dx,y+dy)),exclusive?'#ebe1c9':'#d7c19d');
   // A larger infinity pool, shallow ledge and loungers take up the foreground.
   const pw=premium?.53:.36;
   box(x+.15,y+.47,pw,.28,2,'#67bfce','#428e9c','#88d7dc');
   poly([[.16,.48],[.16+pw,.48],[.16+pw,.53],[.16,.53]].map(([dx,dy])=>screen(x+dx,y+dy,2.2)),'#a6e0df');
   line(screen(x+.16,y+.75,2),screen(x+.15+pw,y+.75,2),'#d1f3e9',1.5);
   for(let n=0;n<(exclusive?4:premium?3:2);n++){const xx=x+.17+n*.13;box(xx,y+.80,.07,.10,2,premium?'#faf0d7':'#e7c785');line(screen(xx,y+.82,3),screen(xx+.07,y+.82,3),'#b69d74',1);}
   // The same one-storey roof line across all levels.
   box(x+.12,y+.10,.60,.24,17,wall,'#8e9382',wall);
   box(x+.10,y+.08,.64,.28,20,roof,'#718777','#ced7c7',17);
   for(const dx of[.18,.32,.46,.60])poly([screen(x+dx,y+.345,3),screen(x+dx+.085,y+.345,3),screen(x+dx+.085,y+.345,13),screen(x+dx,y+.345,13)],'#82b5bb','#dbebdf');
   if(!premium){line(screen(x+.12,y+.08,20),screen(x+.72,y+.08,20),'#ead6ae',2);}
   if(premium){
    // A private side villa with a shaded veranda, at the existing roof height.
    box(x+.74,y+.16,.16,.27,15,wall,'#849083','#e4e6d5');box(x+.72,y+.14,.20,.31,18,'#b6cabd','#748b7b','#cbd9c9',15);
    for(const dx of[.20,.60])line(screen(x+dx,y+.41),screen(x+dx,y+.41,10),'#e8dcc1',1.2);
    box(x+.17,y+.34,.49,.09,11,'#cab18a','#907d5c','#dbc8a3',9);
    for(const dx of[.19,.31,.43,.55])line(screen(x+dx,y+.35,12),screen(x+dx,y+.42,12),'#f4e7c9',1);
   }
   if(exclusive){
    // Garden roof, private cabana and spa deck instead of a penthouse tower.
    for(const dx of[.16,.57])box(x+dx,y+.13,.12,.12,22,'#77966d','#7a8d67','#9eaf85',20);
    box(x+.74,y+.55,.15,.22,2,'#e7d8b8');
    for(const [dx,dy]of[[.75,.57],[.87,.57],[.75,.75],[.87,.75]])line(screen(x+dx,y+dy,2),screen(x+dx,y+dy,10),'#d2c1a0',1.2);
    box(x+.73,y+.54,.18,.24,11,'#f4ebd7','#c8baa1','#e3d8c2',10);
    poly([[.76,.85],[.88,.85],[.90,.93],[.75,.93]].map(([dx,dy])=>screen(x+dx,y+dy)),'#75bcc1');
    line(screen(x+.16,y+.10,24),screen(x+.70,y+.10,24),'#eee8d1',1);
   }
   for(const [dx,dy]of [[.06,.32],[.93,.86],...(premium?[[.93,.48]]:[])])tree(x+dx,y+dy,.38);
   return;
  }
  if(original==='office'||original==='hq'){
   const z=buildingHeight(original,t.level),up=t.level>=2,lux=t.level>=3;
   const trim=palette.trim,glass=palette.roof;
   luxuryGround(x,y,trim);
   box(x+.10,y+.10,.80,.80,8,'#e8e3d1','#8e9689','#c7cdbe');
   box(x+.20,y+.20,.60,.60,z,glass,palette.side,palette.front);
   // Glazing remains on the facade; thin mullions do not turn into solid towers.
   for(let floor=0;floor<Math.floor((z-14)/12);floor++)for(const dx of[.25,.42,.59]){
    const zz=16+floor*12;
    poly([screen(x+dx,y+.805,zz),screen(x+dx+.105,y+.805,zz),screen(x+dx+.105,y+.805,zz+7),screen(x+dx,y+.805,zz+7)],palette.window);
    poly([screen(x+.805,y+dx,zz),screen(x+.805,y+dx+.105,zz),screen(x+.805,y+dx+.105,zz+7),screen(x+.805,y+dx,zz+7)],palette.roof);
   }
   for(const dx of[.22,.77])line(screen(x+dx,y+.81,9),screen(x+dx,y+.81,z),trim,up?1.8:1);
   box(x+.18,y+.18,.64,.64,z+3,trim,palette.side,palette.front,z);
   if(up){
    box(x+.27,y+.27,.46,.46,z+8,palette.roof,palette.side,palette.front,z+3);
    for(const zz of[z*.34,z*.67]){line(screen(x+.20,y+.82,zz),screen(x+.80,y+.82,zz),trim,1.7);line(screen(x+.82,y+.20,zz),screen(x+.82,y+.80,zz),trim,1.2);}
    box(x+.28,y+.81,.44,.11,12,'#c8ddd7','#64887f','#abc5b6',10);
   }
   if(lux){
    // A planted sky terrace and a restrained crown, only a few pixels taller.
    for(const [dx,dy]of[[.23,.64],[.64,.64]])box(x+dx,y+dy,.12,.12,z+6,'#72966c','#607c59','#92ab7d',z+3);
    line(screen(x+.23,y+.79,z+9),screen(x+.78,y+.79,z+9),'#d7ece5',1.4);
    box(x+.35,y+.35,.30,.30,z+12,trim,palette.side,palette.roof,z+8);
    for(const dx of[.30,.63])line(screen(x+dx,y+.82,12),screen(x+dx,y+.82,z-2),trim,1);
   }
   return;
  }
  if(original==='condo'){
   const z=buildingHeight(original,t.level),up=t.level>=2,lux=t.level>=3;
   box(x+.10,y+.10,.80,.80,4,'#dfe0cd','#9ea99a','#c4cdbb');
   box(x+.16,y+.16,.68,.68,z,palette.roof,palette.side,palette.front);
   for(let floor=0;floor<4;floor++){
    const zz=8+floor*10;
    for(const dx of[.23,.43,.63]){poly([screen(x+dx,y+.85,zz),screen(x+dx+.11,y+.85,zz),screen(x+dx+.11,y+.85,zz+6),screen(x+dx,y+.85,zz+6)],'#6f9da9');if(up){box(x+dx-.015,y+.84,.15,.08,zz,'#d9e4dc','#8ca7a2','#afc6bc',zz-1);line(screen(x+dx-.01,y+.92,zz+3),screen(x+dx+.13,y+.92,zz+3),'#d2eee9',1);}}
    if(lux)line(screen(x+.85,y+.20,zz),screen(x+.85,y+.81,zz),'#d6ddc8',1.5);
   }
   box(x+.14,y+.14,.72,.72,z+3,palette.trim,palette.side,palette.roof,z);
   if(up)box(x+.30,y+.26,.35,.34,z+7,'#dce3d3','#93aa99','#c0cebb',z+3);
   if(lux){for(const dx of[.20,.63])box(x+dx,y+.65,.14,.13,z+6,'#73976e','#6e845f','#9bb181',z+3);for(const dx of[.23,.69])line(screen(x+dx,y+.28,z+3),screen(x+dx,y+.28,z+10),'#ddd7bb',1);box(x+.20,y+.22,.54,.14,z+11,'#e2dbc3','#aaa58e','#c8c4ae',z+10);}
   box(x+.41,y+.81,.21,.08,10,'#a6cbc9','#69948e','#86b1a7');return;
  }
  if(original==='monument'){
   // A compact limestone obelisk: a stepped plaza, tapered faces and a bronze cap.
   const z=buildingHeight(original,t.level),up=t.level>=2,lux=t.level>=3;
   box(x+.06,y+.06,.88,.88,3,'#dce1da','#919f99','#bbc7bd');
   box(x+.16,y+.16,.68,.68,6,'#f1ede1','#a0a69b','#d2d5c8',3);
   box(x+.29,y+.29,.42,.42,12,'#e8e2d2','#9caaa2','#c7cec0',6);
   const a=screen(x+.36,y+.64,12),b=screen(x+.64,y+.64,12),c=screen(x+.64,y+.36,12);
   const aa=screen(x+.43,y+.57,z),bb=screen(x+.57,y+.57,z),cc=screen(x+.57,y+.43,z),tip=screen(x+.5,y+.5,z+9);
   poly([a,b,bb,aa],'#e9e7dc');poly([b,c,cc,bb],'#7d9690');
   line(b,bb,'#d3b77a',1.2);line(a,aa,'#fbf5e5',.8);
   poly([aa,bb,tip],'#dfc28a');poly([bb,cc,tip],'#a17b49');
   box(x+.42,y+.705,.16,.01,10,'#b39765','#8c774e','#b39765',8);
   for(const [dx,dy]of[[.13,.70],[.70,.13]]){box(x+dx,y+dy,.16,.16,5,'#9bab98','#718877','#92a58e',3);box(x+dx+.025,y+dy+.025,.11,.11,8,'#6e937e','#486f62','#86a28a',5);}
   if(up){for(const zz of[22,29,36])poly([screen(x+.455,y+.64,zz),screen(x+.545,y+.64,zz),screen(x+.545,y+.64,zz+1),screen(x+.455,y+.64,zz+1)],'#b6afa0');}
   if(lux){for(const [dx,dy]of[[.21,.76],[.76,.21]]){box(x+dx,y+dy,.035,.035,10,'#d4b574','#63796f','#899b85',6);circle(screen(x+dx+.018,y+dy+.018,10),1.3,'#f6ddb1');}}
   return;
  }
  if(type==='tower'){const extra=original==='office'?(t.level-1)*20:0;box(x+.08,y+.08,.84,.84,10,'#e9d9b3','#abac9a','#cfcaac');box(x+.28,y+.28,.44,.44,94+extra,palette.roof,palette.side,palette.front);box(x+.35,y+.35,.3,.3,103+extra,'#ede6cb');line(screen(x+.5,y+.5,103+extra),screen(x+.5,y+.5,120+extra),'#d5c48b',2);return;}
  const z=TYPES[original].group?buildingHeight(original,t.level):type==='home'?17+t.level*10:type==='shop'?15+t.level*12:type==='hall'?29:22;
  const varied=type==='home'||type==='shop',roof=varied?palette.roof:c,shades=varied?[palette.side,palette.front]:type==='hall'?['#b6ac8c','#ded1ab']:['#a59583','#cebba6'];
  box(x+.13,y+.13,.7,.7,z,roof,...shades);windows(x,y,z,Math.max(1,Math.floor(z/12)));
  // Recessed entrance, stone lintels and balcony edges give small buildings scale.
  poly([screen(x+.43,y+.84,0),screen(x+.59,y+.84,0),screen(x+.59,y+.84,10),screen(x+.43,y+.84,10)],'#304b54','#d7d9c5');
  line(screen(x+.4,y+.89,1),screen(x+.64,y+.89,1),'#e3d9be',2.5);
  for(let floor=1;floor<Math.floor(z/12);floor++)line(screen(x+.13,y+.84,floor*10+1),screen(x+.83,y+.84,floor*10+1),'#e1dcc980',1);
  if(type==='home'&&t.level===1){poly([screen(x+.07,y+.12,z),screen(x+.9,y+.12,z),screen(x+.9,y+.5,z+12),screen(x+.07,y+.5,z+12)],'#b77f63');poly([screen(x+.07,y+.5,z+12),screen(x+.9,y+.5,z+12),screen(x+.9,y+.9,z),screen(x+.07,y+.9,z)],'#805e50');for(let n=1;n<6;n++)line(screen(x+.07+n*.135,y+.5,z+12),screen(x+.07+n*.135,y+.9,z),'#d6aa8260',.7);line(screen(x+.07,y+.5,z+12),screen(x+.9,y+.5,z+12),'#e0bd90',1);}
  else{box(x+.23,y+.23,.48,.48,z+3,roof,...shades,z);if(type==='hall'){line(screen(x+.5,y+.5,z+3),screen(x+.5,y+.5,z+24),'#a79c7c',1);poly([screen(x+.5,y+.5,z+24),screen(x+.76,y+.5,z+24),screen(x+.76,y+.5,z+17),screen(x+.5,y+.5,z+17)],'#4e857c');}}
  if(TYPES[original].group==='business'){for(let n=0;n<5;n++)box(x+.09+n*.15,y+.73,.15,.23,11,n%2?'#f2edd5':c,'#847f65',n%2?'#f2edd5':c);const p=screen(x+.5,y+.88,18);ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#335047';ctx.fillText(TYPES[original].icon,p.x,p.y);}
  if(type==='clinic'){const p=screen(x+.5,y+.5,z+5);line({x:p.x-4*zoom,y:p.y},{x:p.x+4*zoom,y:p.y},'#bc625b',3);line({x:p.x,y:p.y-4*zoom},{x:p.x,y:p.y+4*zoom},'#bc625b',3);}
 }
 // Water roads share one continuous arch span; road connectivity and traffic stay unchanged.
 function bridge(x,y,s){
  const wet=(xx,yy)=>xx>=0&&yy>=0&&xx<SIZE&&yy<SIZE&&s.tiles[yy*SIZE+xx].type==='road'&&s.tiles[yy*SIZE+xx].terrain==='water';
  const horizontal=wet(x-1,y)||wet(x+1,y),dx=horizontal?1:0,dy=horizontal?0:1;
  if(wet(x-dx,y-dy))return;
  let length=1;while(wet(x+dx*length,y+dy*length))length++;
  const at=(u,side,z)=>screen(x+(horizontal?u:side),y+(horizontal?side:u),z);
  for(const side of [.08,.92]){
   // Deep concrete piers, a continuous deck edge and slim pedestrian railings.
   for(let u=.5;u<length;u+=2){
    poly([at(u-.10,side,-16),at(u+.10,side,-16),at(u+.10,side,-3),at(u-.10,side,-3)],'#748e8d','#c5d1c0');
    line(at(u-.16,side,-3),at(u+.16,side,-3),'#d4d6c5',5);
   }
   line(at(0,side,-3),at(length,side,-3),'#405f66',6);
   line(at(0,side,1),at(length,side,1),'#efe5c9',3);
   if(groundView)continue;
   const a=at(0,side,1),b=at(length,side,1);
   // The generated railing's baseline slope is .601; fit it to the road's .5 slope.
   if(scenery('bridge-arch',{x:(a.x+b.x)/2,y:Math.max(a.y,b.y)},Math.abs(b.x-a.x),{mirror:!horizontal,heightRatio:.831872},x+y+(side>.5?length:0)))continue;
   const height=Math.min(48,18+length*6),steps=length*8;
   for(let n=0;n<steps;n++){
    const u=length*n/steps,v=length*(n+1)/steps;
    line(at(u,side,7+Math.sin(Math.PI*u/length)*height),at(v,side,7+Math.sin(Math.PI*v/length)*height),'#e7d3a3',3.5);
   }
   for(let u=.25;u<length;u+=.5){
    line(at(u,side,5),at(u,side,7+Math.sin(Math.PI*u/length)*height),'#c4d8d2',.9);
    line(at(u,side,1),at(u,side,7),'#f4ebd3',1);
   }
   line(at(0,side,7),at(length,side,7),'#f7eccd',1.5);
   for(const u of [0,length]){line(at(u,side,1),at(u,side,14),'#d4bd8b',3);circle(at(u,side,15),2,'#fff3c5');}
  }
 }
 const life=createWorldLife(ctx,screen,box,circle,line,getState,getAnalysis,i=>{const p=imageTops.get(i);return p?{x:p.x+shift.x,y:p.y+shift.y}:null;});
 function ground(s,a){
  const water=ctx.createLinearGradient(MARGIN,MARGIN,w+MARGIN,h+MARGIN);water.addColorStop(0,'#80aaa5');water.addColorStop(.4,'#438b95');water.addColorStop(1,'#205971');
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   depth=-1;column=x;const i=y*SIZE+x,t=s.tiles[i],road=(xx,yy)=>xx>=0&&yy>=0&&xx<SIZE&&yy<SIZE&&s.tiles[yy*SIZE+xx].type==='road';
   ctx.globalAlpha=layer==='assets'&&t.owner!=='player'?.3:1;
   const tone=(Math.sin(x*.72+y*.37)+1)*2;
   const surface=t.terrain==='water'?water:`hsl(85,22%,${64+tone}%)`;tile(x,y,surface,surface);
   if(t.terrain==='water'&&t.type!=='road'){
    animate(tileBox(x,y,0,12*zoom),time=>{for(let n=0;n<3;n++){const p=screen(x+.15+n*.25,y+.25+n*.21),wave=Math.sin(time*.0007+y+n)*2*zoom;line({x:p.x-4*zoom,y:p.y+wave},{x:p.x+(6+n*2)*zoom,y:p.y+wave},n===1?'#c4e0d326':'#b4d8d91b',.6);}});
    continue;
   }
   if(t.type==='road'){
    tile(x,y,t.boulevard?'#ded4b9':'#c6c6b5');const inset=t.boulevard?.015:.1;box(x+inset,y+inset,1-inset*2,1-inset*2,1,'#52616a','#52616a','#52616a');
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(road(x+dx,y+dy)){
     const p=screen(x+.5,y+.5,1),q=screen(x+.5+dx*.51,y+.5+dy*.51,1);
     line(p,q,a.connected.has(i)?'#53626a':'#718087',t.boulevard?30:20);
     ctx.setLineDash([3*zoom,5*zoom]);line(p,q,'#e3ddbf9c',.75);ctx.setLineDash([]);
    }
    if(t.boulevard){
     const horizontal=y===BOULEVARD.axis+mapOffset(s);
     for(const offset of [.46,.54])line(screen(x+(horizontal?0:offset),y+(horizontal?offset:0),2),screen(x+(horizontal?1:offset),y+(horizontal?offset:1),2),'#f4d477',1.5);
     ctx.setLineDash([4*zoom,4*zoom]);
     for(const offset of [.22,.78])line(screen(x+(horizontal?0:offset),y+(horizontal?offset:0),2),screen(x+(horizontal?1:offset),y+(horizontal?offset:1),2),'#fff5d9',.8);
     ctx.setLineDash([]);
    }
    // Crosswalks mark real crossroads only, not the inside of a wide paved area.
    if(road(x+1,y)&&road(x,y+1)&&road(x-1,y)&&road(x,y-1)&&!road(x+1,y+1)&&!road(x-1,y+1)&&!road(x+1,y-1)&&!road(x-1,y-1))for(let k=0;k<4;k++)line(screen(x+.2+k*.14,y+.08,2),screen(x+.2+k*.14,y+.25,2),'#eee8d1',1.8);
   }else{
    // Stable lawn grain does not consume the simulation's random seed.
    for(let n=0;n<3;n++){const u=((i*17+n*31)%97)/100,v=((i*29+n*19)%89)/100;line(screen(x+u,y+v),screen(x+u+.04,y+v),'#e3e6c82b',.6);}
   }
   if(t.type==='road'&&t.terrain==='water')continue;
   for(const[dx,dy]of[[1,0],[0,1],[-1,0],[0,-1]]){
    const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=SIZE||yy>=SIZE||s.tiles[yy*SIZE+xx].terrain!=='water')continue;
    const p=screen(x+(dx===1?1:0),y+(dy===1?1:0),2),q=screen(x+(dx===0?1:dx===1?1:0),y+(dy===0?1:dy===1?1:0),2);
    line({...p,y:p.y+4*zoom},{...q,y:q.y+4*zoom},'#45696a',6);line(p,q,'#d7cfb7',7);line(p,q,'#f4ecd6',.8);
    if((x+y)%2===0){const mid={x:(p.x+q.x)/2,y:(p.y+q.y)/2};line(mid,{x:mid.x,y:mid.y-16*zoom},'#52615b',1.2);circle({x:mid.x,y:mid.y-17*zoom},1.8,'#fff1c9');}
   }
  }
  ctx.globalAlpha=1;
  // Draw ground shadows before architecture, so they cannot cover facades.
  for(let i=0;!groundView&&i<s.tiles.length;i++){const t=s.tiles[i];if(!t.type||['road','plot','park'].includes(t.type))continue;const{x,y}=coords(i),z=Math.min(105,badgeHeight(t.type,t.level)*.7),p=screen(x+.15,y+.2),q=screen(x+.85,y+.85),dx=z*.42*zoom;
   poly([p,screen(x+.85,y+.15),{x:q.x+dx,y:q.y+dx*.28},{x:p.x+dx,y:p.y+dx*.28},q],'#203c4220');
  }
 }
 // Keep the private estate in the architecture depth pass, never over the completed scene.
 function estate(s){
  if(groundView||!flexState(s).owned.includes('penthouse'))return;
  world=mapOffset(s);startHit(MANSION_HIT);
  {
   const d=mansionDesign(s),width=Math.min(3,.9+(d.area??({1:120,2:200,3:320,4:800,5:2000})[d.size])/250),z=14+d.floors*15,c=MANSION_COLORS[d.color];
   line(screen(3.35,22.95),screen(3.35,21.55),'#e7ddc8',13);circle(screen(3.35,21.72,3),8,'#75b9bd');circle(screen(3.35,21.72,5),3,'#ead38a');
   for(const [xx,yy]of[[1.15,19.2],[5.75,19.2],[1.15,22.75],[5.75,22.75]]){box(xx,yy,.12,.12,10,'#e5d7b7','#81735d','#cbb78c');circle(screen(xx+.06,yy+.06,17),5,'#315f4f');}
   // Generated art for the design's style, height band and color, kept clear of the side facilities; the drawn massing remains while it loads.
   const house=sceneryPlot(mansionArtURL(d),2,20,Math.min(2.1,width),.85);
   if(!house){
   box(2,20,width,.85,z,c,'#718780',c);box(1.7,20.16,.48,.58,Math.max(18,z-5),c,'#687a75',c);box(2+width-.18,20.16,.48,.58,Math.max(18,z-5),c,'#687a75',c);
   if(d.roof==='gable'){poly([screen(1.95,19.95,z),screen(2+width+.05,19.95,z),screen(2+width+.05,20.43,z+14),screen(1.95,20.43,z+14)],'#89958b');poly([screen(1.95,20.43,z+14),screen(2+width+.05,20.43,z+14),screen(2+width+.05,20.9,z),screen(1.95,20.9,z)],d.style==='resort'?'#b77957':'#687e83');}
   else box(1.95,19.95,width+.1,.95,z+3,'#bccdc6','#6b807d','#c7d2c5');
   if(d.roof==='terrace'){line(screen(2,20,z+12),screen(2+width,20,z+12),'#d9eee2',2);box(2.15,20.15,.3,.25,z+8,'#d5b97b');}
   const cols=Math.ceil(d.rooms/d.floors);for(let n=0;n<d.rooms;n++){const xx=2.12+n%cols*(width-.15)/cols,zz=z-5-Math.floor(n/cols)*15;line(screen(xx,20.86,zz),screen(xx+width/cols*.5,20.86,zz),d.style==='modern'?'#90d4e4':'#f6d28f',5);}
   for(let floor=1;floor<d.floors;floor++)line(screen(2,20.91,floor*15),screen(2+width,20.91,floor*15),'#dfc889',1.5);
   if(d.style==='classic')for(const xx of[2.03,2.28,2+width-.35,2+width-.1])line(screen(xx,20.9,1),screen(xx,20.9,z),'#fff0d0',3);
   if(d.style==='resort')box(1.9,20.65,width+.2,.4,14,'#b7845e');
   box(2+width*.42,20.72,width*.20,.18,12,'#4c443d','#393630','#d5af5f');
   }
   if(d.pool&&!sceneryPlot('estate-pool',2.05,21.10,1.65,.72))box(2.05,21.10,1.65,.72,3,'#62bdcc','#4f98a8','#9be0e2');
   if(d.garden&&!sceneryPlot('estate-garden',1.05,21.1,.8,1.4)){for(const [xx,yy]of[[1.45,20],[1.45,21],[4.1,21.5],[5.25,20.2]])tree(xx,yy,.72);}
   if(d.golf&&!sceneryPlot(estateArtURL('golf'),2.25,22.2,1.45,.7)){tile(2,22,'#72a969');tile(3,22,'#83b679');line(screen(3.3,22.4),screen(3.3,22.4,18),'#fff4d3',1);circle(screen(2.4,22.3),3,'#e6d7a5');}
   if(d.cinema&&!sceneryPlot(estateArtURL('cinema'),4.15,20.15,.75,.7))box(4.2,20.2,.6,.6,18,'#626d80','#414c62','#7a8794');if(d.spa&&!sceneryPlot(estateArtURL('spa'),4.15,21.05,.7,.7))box(4.2,21.1,.6,.6,12,'#86c6c4');if(d.helipad&&!sceneryPlot(estateArtURL('helipad'),4.05,22.05,.9,.8)){tile(4,22,'#899c99');const hp=screen(4.5,22.5,2);ctx.fillStyle='#fff1bf';ctx.font='bold 15px sans-serif';ctx.fillText('H',hp.x,hp.y);}
   const p=house?{x:house.x+house.width/2,y:house.y-10*zoom}:screen(3.25,20.45,z+38);circle(p,12,'#fff1bd88');ctx.font=`bold ${12*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#60451c';ctx.fillText(L`♛ PRIVATE ESTATE · ${d.floors} floors · ${d.rooms} rooms`,p.x,p.y+4*zoom);
  }
  endHit();world=0;
 }
 // A building-sized mediwork AI billboard stands on two poles in the river off the west bank, in rows the boulevard bridge and road
 // growth never cross (new roads only claim land). Its face is a wall seen from the city side, so the logo is sheared with it.
 function billboard(s){
  world=mapOffset(s);
  const xb=22.7,y0=5.3,y1=8.3,base=18,top=base+28,W=(y1-y0)*halfW,H=top-base,posts=[y0+.6,y1-.6];
  ctx.globalAlpha=layer==='assets'?.22:1;
  for(const y of posts){poly([screen(xb-.3,y-.12),screen(xb-.06,y-.12),screen(xb-.06,y+.12),screen(xb-.3,y+.12)],'#9aa7a6','#c8d4d0');box(xb-.22,y-.05,.1,.1,base,'#5d686f','#48545b','#5d686f');}
  poly([screen(xb-.1,y0,top),screen(xb,y0,top),screen(xb,y1,top),screen(xb-.1,y1,top)],'#46524c');
  poly([screen(xb-.1,y1,base),screen(xb,y1,base),screen(xb,y1,top),screen(xb-.1,y1,top)],'#2e3a34');
  const o=screen(xb,y1,top);ctx.save();ctx.translate(o.x,o.y);ctx.transform(zoom,-halfH/halfW*zoom,0,zoom,0,0);
  ctx.fillStyle='#2f4a3f';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fbfaf6';ctx.fillRect(1.5,1.5,W-3,H-3);
  // The logo: a red mark of three crossing bars each way, then the wordmark, laid out in the logo's own proportions (6 marks wide).
  const m=Math.min(H*.52,(W-13)/6),left=(W-6*m)/2,cx=left+m/2,cy=H/2,t=m*.049,p=m*.1156;
  ctx.fillStyle='#c1121f';for(const k of [-1,0,1]){ctx.fillRect(cx+k*p-t/2,cy-m/2,t,m);ctx.fillRect(left,cy+k*p-t/2,m,t);}
  const family='"Century Gothic","Futura","Avenir Next","Segoe UI",sans-serif';ctx.font=`400 20px ${family}`;
  ctx.font=`400 ${20*4.63*m/ctx.measureText('mediwork AI').width}px ${family}`;ctx.textAlign='left';ctx.fillStyle='#111111';ctx.fillText('mediwork AI',left+1.36*m,cy+.384*m);
  ctx.restore();ctx.globalAlpha=1;world=0;
 }
 function scene(s,a){
  const cw=w+2*MARGIN,ch=h+2*MARGIN;
  if(cacheCanvas.width!==Math.floor(cw*dpr)||cacheCanvas.height!==Math.floor(ch*dpr)){cacheCanvas.width=cw*dpr;cacheCanvas.height=ch*dpr;}
  ctx=cacheCtx;panX+=MARGIN;panY+=MARGIN;hits=[];dynamics=[];pendingImages=false;imageTops.clear();
  try{
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineJoin='round';ctx.lineCap='round';
  // The sky is part of the picture, so the cache is opaque and frames are plain copies of it.
  const sky=ctx.createLinearGradient(MARGIN,MARGIN,w+MARGIN,h+MARGIN);sky.addColorStop(0,'#f4f0e3');sky.addColorStop(.5,'#dbe5df');sky.addColorStop(1,'#b2c9cd');ctx.fillStyle=sky;ctx.fillRect(0,0,cw,ch);
  // Island edge gives the map its model-like depth.
  poly([screen(0,SIZE),screen(SIZE,SIZE),screen(SIZE,SIZE,-15),screen(0,SIZE,-15)],'#b8beaa');
  poly([screen(SIZE,0),screen(SIZE,SIZE),screen(SIZE,SIZE,-15),screen(SIZE,0,-15)],'#9cad9f');
  ground(s,a);
  if(!groundView&&s.flex?.owned?.includes('yacht')){world=mapOffset(s);depth=39+2*world;column=22+world;sceneryPlot('marina-pier',19.8,17.6,2.1,1.6);world=0;}
  if(!groundView&&flexState(s).owned.includes('penthouse')){
   world=mapOffset(s);for(let xx=1;xx<=5;xx++)for(let yy=19;yy<=22;yy++)tile(xx,yy,(xx+yy)%2?'#acc195':'#b8cca0','#d8c986');world=0;
  }
  for(let sum=0;sum<SIZE*2;sum++)for(let x=0;x<SIZE;x++){const y=sum-x;if(y<0||y>=SIZE)continue;depth=sum;column=x;const i=y*SIZE+x,t=s.tiles[i],assetFocus=layer==='assets'&&s.tiles[t.buildingAnchor??i].owner!=='player';
   if(sum===27+2*mapOffset(s)&&x===5+mapOffset(s))estate(s);
   if(!groundView&&sum===30+2*mapOffset(s)&&x===22+mapOffset(s))billboard(s);
   if(assetFocus)ctx.globalAlpha=.22;
   if(t.type==='road'&&t.terrain==='water')bridge(x,y,s);
   if(groundView){
    const asset=s.tiles[t.buildingAnchor??i];
    if(t.type&&t.type!=='road')tile(x,y,TYPES[asset.type]?.color||'#c8bb88',asset.owner==='player'?'#ffe395':'#f2efdf');
    ctx.globalAlpha=1;continue;
   }
   if(t.type==='road'){}
   else if(t.type){
    const root=t.buildingAnchor??i,asset=s.tiles[root],cells=footprintCells(root,asset.footprint),last=cells.at(-1),p=coords(root);
    if(asset.owner==='player')tile(x,y,'#e4cd8244','#edd48a');
    if(asset.owner==='rival')tile(x,y,'#b8505033','#c0574d');
    if((!asset.footprint||last===i)&&t.type!=='road'){
     if(faded.has(root))ctx.globalAlpha*=.3;
     const picture=building(p.x,p.y,asset);startHit(-1);
     if(asset.owner==='player'){const center=picture?{x:picture.x+picture.width/2,y:picture.y-7*zoom}:screen(p.x+(asset.footprint?.width||1)/2,p.y+(asset.footprint?.height||1)/2,badgeHeight(asset.type,asset.level));circle(center,5,'#f3d68c');}
     if(asset.owner==='rival'){const center=picture?{x:picture.x+picture.width/2,y:picture.y-7*zoom}:screen(p.x+.5,p.y+.5,badgeHeight(asset.type,asset.level)+8);circle(center,7,'#a83d37');ctx.fillStyle='#fff3e6';ctx.font=`bold ${9*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText('⚑',center.x,center.y+3*zoom);}
     endHit();
    }
   }else if(t.tree&&t.terrain==='land'){startHit(-1);tree(x+.5,y+.5,.85+((x+y)%3)*.1);endHit();}
   if(layer==='assets'&&s.tiles[t.buildingAnchor??i].owner==='player')tile(x,y,'#ffd75f88','#fff0a8',2);if(layer!=='normal'&&layer!=='assets'&&t.terrain==='land'){const d=a.details[i];let val=layer==='pollution'?1-d.pollution/100:layer==='value'?d.value/130:layer==='services'?(d.education+d.health+d.fire)/3:(d.connected?1:0);val=Math.max(0,Math.min(1,val));tile(x,y,`hsla(${val*130},55%,48%,.42)`);}
   ctx.globalAlpha=1;startHit(-1);
   const badgeRoot=t.buildingAnchor??i,badgeAsset=s.tiles[badgeRoot];
   if(layer==='assets'&&badgeAsset.owner==='player'&&(!badgeAsset.footprint||footprintCells(badgeRoot,badgeAsset.footprint).at(-1)===i)){const p=coords(badgeRoot);assetBadge(p.x,p.y,badgeAsset);}
   if(t.damage){const p=screen(x+.5,y+.5,53);circle(p,8,'#c8765e');ctx.fillStyle='white';ctx.font=`bold ${11*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText('!',p.x,p.y+4*zoom);}
   else if(t.type&&t.type!=='road'&&!a.active[i]){const p=screen(x+.5,y+.5,52);circle(p,6,'#dcb166');ctx.fillStyle='#544532';ctx.font=`${9*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText('↯',p.x,p.y+3*zoom);}
   endHit();
  }
  recordingHit=null;
  }finally{panX-=MARGIN;panY-=MARGIN;ctx=mainCtx;}
  cache={a,zoom,w,h,dpr,layer,groundView,panX,panY,fade:fadeKey,at:performance.now()};
 }
 // Uses the cached hit shapes: a building fades when it is drawn later than the focus and its outline overlaps the focus volume.
 function occluders(s){
  const set=new Set();if(!cache||groundView)return set;
  const sx=Math.round((panX-cache.panX-MARGIN)*dpr)/dpr,sy=Math.round((panY-cache.panY-MARGIN)*dpr)/dpr,placing=!!landmarkPlacement||!!TYPES[tool]?.group;
  const focus=[selected];if(under>=0&&(placing||(s.tiles[under]?.type&&s.tiles[under].type!=='road')))focus.push(under);
  for(const i of focus){
   if(!s.tiles[i])continue;
   const root=s.tiles[i].buildingAnchor??i,t=s.tiles[root],{x,y}=coords(root),built=!!t.type&&t.type!=='road';
   const f=built?t.footprint||{width:1,height:1}:placing?landmarkPlacement?.footprint||buildFootprint:{width:1,height:1};
   const z=built?badgeHeight(t.type,t.level):30,col=x+f.width-1,d=col+y+f.height-1;
   const box=[screen(x,y+f.height).x-sx,screen(x,y,z).y-sy,screen(x+f.width,y).x-sx,screen(x+f.width,y+f.height).y-sy];
   for(const o of hits)if(o.i>=0&&o.i!==root&&(o.depth>d||o.depth===d&&o.col>col)&&o.box[0]<box[2]&&o.box[2]>box[0]&&o.box[1]<box[3]&&o.box[3]>box[1])set.add(o.i);
  }
  return set;
 }
 function composite(s,a){
  const now=performance.now();
  if(!cache||cache.a!==a||cache.zoom!==zoom||cache.w!==w||cache.h!==h||cache.dpr!==dpr||cache.layer!==layer||cache.groundView!==groundView||cache.fade!==fadeKey||Math.abs(panX-cache.panX)>MARGIN||Math.abs(panY-cache.panY)>MARGIN||(pendingImages&&now-cache.at>400))scene(s,a);
  shift={x:Math.round((panX-cache.panX-MARGIN)*dpr)/dpr,y:Math.round((panY-cache.panY-MARGIN)*dpr)/dpr};
  ctx.drawImage(cacheCanvas,shift.x,shift.y,cacheCanvas.width/dpr,cacheCanvas.height/dpr);
 }
 // Sprites are drawn in depth order; a cached building in front of a sprite is stamped back over it through its own hit shape.
 function sprites(time){
  const byDepth=[];for(const d of dynamics)(byDepth[d.depth+1]??=[]).push(d);
  const toMain=b=>[b[0]+shift.x,b[1]+shift.y,b[2]+shift.x,b[3]+shift.y],overlap=(k,b)=>k[0]<b[2]&&k[2]>b[0]&&k[1]<b[3]&&k[3]>b[1];
  for(let sum=-1;sum<SIZE*2-1;sum++){
   const ds=byDepth[sum+1]||[],band=[];
   for(let x=0;x<SIZE;x++){
    const y=sum-x,here=[];
    if(y>=0&&y<SIZE&&life.drawTile(y*SIZE+x,time)){const c=screen(x+.5,y+.5);here.push([c.x-48*zoom,c.y-46*zoom,c.x+48*zoom,c.y+18*zoom]);}
    for(const d of ds){if(d.col!==x)continue;const tf=d.transform;if(tf){const p=screen(tf.x,tf.y);ctx.save();ctx.translate(p.x,p.y);ctx.scale(tf.width,tf.scale);ctx.translate(-p.x,-p.y);d.draw(time);ctx.restore();}else d.draw(time);here.push(toMain(d.box));}
    if(!here.length)continue;
    for(const o of hits)if(o.depth===sum&&o.col>x&&here.some(k=>overlap(k,toMain(o.box))))cover(o);
    band.push(...here);
   }
   if(band.length)for(const o of hits)if(o.depth>sum&&band.some(k=>overlap(k,toMain(o.box))))cover(o);
  }
 }
 function cover(o){const X0=Math.floor(o.box[0]*dpr),Y0=Math.floor(o.box[1]*dpr),sw=Math.ceil(o.box[2]*dpr)-X0,sh=Math.ceil(o.box[3]*dpr)-Y0;ctx.save();ctx.globalAlpha=o.alpha;
  if(o.image){// A building picture covers only where it is opaque.
   stamp.width=sw;stamp.height=sh;const c=stamp.getContext('2d');c.drawImage(cacheCanvas,X0,Y0,sw,sh,0,0,sw,sh);c.globalCompositeOperation='destination-in';c.save();const ix=o.box[0]*dpr-X0,iy=o.box[1]*dpr-Y0,iw=(o.box[2]-o.box[0])*dpr,ih=(o.box[3]-o.box[1])*dpr;c.translate(o.mirror?ix+iw:ix,iy);if(o.mirror)c.scale(-1,1);c.drawImage(o.image,0,0,iw,ih);c.restore();ctx.setTransform(1,0,0,1,shift.x*dpr,shift.y*dpr);ctx.drawImage(stamp,X0,Y0);}
  else{ctx.setTransform(dpr,0,0,dpr,shift.x*dpr,shift.y*dpr);ctx.clip(o.path);ctx.setTransform(1,0,0,1,shift.x*dpr,shift.y*dpr);ctx.drawImage(cacheCanvas,X0,Y0,sw,sh,X0,Y0,sw,sh);}
  ctx.restore();}
 function render(time,phase=0){
  life.update(time);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineJoin='round';ctx.lineCap='round';
  if(reducedMotion())time=0;
  const s=getState(),a=getAnalysis();
  if(viewState===s&&viewOffset!==mapOffset(s))panY-=(mapOffset(s)-viewOffset)*2*halfH*zoom;viewState=s;viewOffset=mapOffset(s);
  faded=occluders(s);fadeKey=[...faded].sort((p,q)=>p-q).join();
  composite(s,a);
  if(!groundView)sprites(time);
  const target=s.rival?.target??-1;
  if(target>=0){const{x,y}=coords(target),pulse=.5+.5*Math.sin(time*.006);tile(x,y,`rgba(200,80,70,${(.15+.3*pulse).toFixed(2)})`,'#c0574d',2);const p=screen(x+.5,y+.5,34);ctx.fillStyle='#a83d37';ctx.font=`bold ${10*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText(L('⚑ Rival buy incoming'),p.x,p.y);}
  const combined=!!landmarkPlacement||TYPES[tool]?.group&&(buildFootprint.width>1||buildFootprint.height>1);
  const footprint=landmarkPlacement?.footprint||(combined?buildFootprint:{width:1,height:1});
  if(selected>=0){for(const j of footprintCells(selected,combined?footprint:s.tiles[selected].footprint)){const{x,y}=coords(j);tile(x,y,'#f8f0b42b','#f5e6a5',1);}}
  if(hover>=0){const anchor=landmarkPlacement?(landmarkAnchor(s,hover,landmarkPlacement.design,footprint)??hover):hover,{x,y}=coords(anchor);const ok=landmarkPlacement?!landmarkBuildError(s,anchor,landmarkPlacement.design,footprint):tool==='inspect'||!canBuild(s,hover,tool,combined||TYPES[tool]?.group==='property'?'buy':'lease',combined?buildFootprint:undefined);
   for(let dy=0;dy<footprint.height;dy++)for(let dx=0;dx<footprint.width;dx++)tile(x+dx,y+dy,ok?'#f6ffe255':'#e9947755',ok?'#f8ffe0':'#bb604f',2);
   if(TYPES[tool]?.radius){const radius=TYPES[tool].radius;for(let yy=0;yy<SIZE;yy++)for(let xx=0;xx<SIZE;xx++)if(Math.hypot(xx-x,yy-y)<=radius)tile(xx,yy,'#fff8ba12','#e8e8b344',1);}
  }
  if(groundView)return;
  const collection=flexState(s).owned;
  if(collection.includes('yacht')){world=mapOffset(s);const yy=16+(reducedMotion()?0:Math.sin(time*.0005)*.15),model=selectedModel(s,'yacht');const art=drawMapYacht(ctx,screen,22.4,yy+.2,model,time);const design=YACHT_DESIGNS[model.id],p=art?.top||screen(22.4,yy+.2,design.roof+Math.max(0,design.levels-1)*7+26);world=0;ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#21485a';ctx.fillText('✦ '+model.name,p.x,p.y);}
  life.drawFront(time,phase);
 }
 function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 const cursorFor=v=>v==='inspect'||v==='pan'?'default':'crosshair';
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==1&&e.button!==2)return;const p=point(e);down={...p,panX,panY,button:e.button,moved:false};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{const p=point(e);under=groundView?-1:groundTile(p.x,p.y);hover=pick(p.x,p.y);onHover(hover);if(!down)return;if(Math.hypot(p.x-down.x,p.y-down.y)>6){down.moved=true;canvas.style.cursor='grabbing';}if(down.moved){panX=down.panX+p.x-down.x;panY=down.panY+p.y-down.y;}});
 canvas.addEventListener('pointerup',e=>{if(down&&down.button===0&&!down.moved){const p=point(e),i=pick(p.x,p.y);if(i>=0||i===MANSION_HIT)onTile(i);}down=null;canvas.style.cursor=cursorFor(tool);});
 canvas.addEventListener('pointercancel',()=>{down=null;canvas.style.cursor=cursorFor(tool);});canvas.addEventListener('pointerleave',()=>{hover=-1;under=-1;onHover(-1);});canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.tabIndex=0;
 canvas.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(e.key))return;e.preventDefault();if(hover<0)hover=(9+mapOffset(getState()))*(SIZE+1);if(e.key==='Enter'){onTile(hover);return;}let{x,y}=coords(hover);if(e.key==='ArrowUp')y--;if(e.key==='ArrowDown')y++;if(e.key==='ArrowLeft')x--;if(e.key==='ArrowRight')x++;hover=Math.max(0,Math.min(SIZE-1,y))*SIZE+Math.max(0,Math.min(SIZE-1,x));onHover(hover);});
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.45,Math.min(2.3,zoom*(e.deltaY>0?.92:1.08)));},{passive:false});
 return{render,focus(i){const{x,y}=coords(i);zoom=w<650?1.1:1.5;panX=-(x-y)*halfW*zoom;panY=260*zoom-(x+y+1)*halfH*zoom;},burst:life.burst,visit:life.visit,setLandmarkPlacement(design,footprint){landmarkPlacement=design?{design,footprint:{...footprint}}:null;selected=-1;canvas.style.cursor=design?'crosshair':cursorFor(tool);},setTool(v,footprint={width:1,height:1}){landmarkPlacement=null;tool=v;buildFootprint={...footprint};canvas.style.cursor=cursorFor(v);},setLayer(v){layer=v;},setGroundView(v){groundView=!!v;hover=-1;onHover(-1);},select(i){selected=i;},zoom(delta){zoom=Math.max(.45,Math.min(2.3,zoom+delta));},home(){zoom=w<650?.64:Math.min(1,w/1120);panX=0;panY=(w<650?-55:-100)-mapOffset(getState())*2*halfH*zoom;},position:screen};
}
