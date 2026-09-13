import {drawLandmark} from './landmarks.js';
import {createWorldLife} from './world-life.js';
import {flexState} from './flex.js';
import {selectedModel} from './luxury-models.js';
import {drawMapYacht,YACHT_DESIGNS} from './map-vehicles.js';
import {mansionDesign,MANSION_COLORS} from './mansion.js';
import {SIZE,BOULEVARD,TYPES,coords,canBuild,footprintCells,buildingArea} from './engine.js';
export function createRenderer(canvas,getState,getAnalysis,onTile,onHover){
 const ctx=canvas.getContext('2d');let w=0,h=0,dpr=1,zoom=1,panX=0,panY=0,hover=-1,selected=-1,tool='inspect',layer='normal',groundView=false,down=null;
 let buildingHits=[],recordingHit=null,drawingFootprint=null;
 const halfW=28,halfH=14;
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(2,Math.max(window.devicePixelRatio||1,1.5));canvas.width=w*dpr;canvas.height=h*dpr;}
 new ResizeObserver(resize).observe(canvas);resize();
 function origin(){return{x:w*.5+panX,y:h*.5-260*zoom+panY};}
 function screen(x,y,z=0){if(drawingFootprint){const f=drawingFootprint;x=f.x+(x-f.x)*f.width;y=f.y+(y-f.y)*f.height;z*=1+(f.width*f.height-1)*.04;}const o=origin();return{x:o.x+(x-y)*halfW*zoom,y:o.y+(x+y)*halfH*zoom-z*zoom};}
 function pick(x,y){
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  let hit=-1;for(let n=buildingHits.length-1;n>=0&&!groundView;n--)if(buildingHits[n].paths.some(path=>ctx.isPointInPath(path,x,y))){hit=buildingHits[n].i;break;}
  ctx.restore();if(hit>=0)return hit;
  const o=origin(),a=(x-o.x)/(halfW*zoom),b=(y-o.y)/(halfH*zoom),gx=Math.floor((a+b)/2),gy=Math.floor((b-a)/2);return gx>=0&&gy>=0&&gx<SIZE&&gy<SIZE?gy*SIZE+gx:-1;}
 function poly(points,fill,stroke){
  if(recordingHit){const path=new Path2D(),m=ctx.getTransform();points.forEach((p,i)=>{const x=(m.a*p.x+m.c*p.y+m.e)/dpr,y=(m.b*p.x+m.d*p.y+m.f)/dpr;i?path.lineTo(x,y):path.moveTo(x,y);});path.closePath();recordingHit.paths.push(path);}
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.6;ctx.stroke();}}
 function tile(x,y,fill,stroke,z=0){poly([screen(x,y,z),screen(x+1,y,z),screen(x+1,y+1,z),screen(x,y+1,z)],fill,stroke);}
 function box(x,y,sx,sy,z,color,side='#73887d',front='#9cac96'){
  const top=screen(x,y,z),base=screen(x+sx,y+sy);
  const material=c=>{const g=ctx.createLinearGradient(top.x,top.y,base.x,base.y);g.addColorStop(0,c);g.addColorStop(.42,c);g.addColorStop(1,'#40545b');return g;};
  poly([screen(x,y+sy),screen(x+sx,y+sy),screen(x+sx,y+sy,z),screen(x,y+sy,z)],material(front));
  poly([screen(x+sx,y),screen(x+sx,y+sy),screen(x+sx,y+sy,z),screen(x+sx,y,z)],material(side));
  poly([screen(x,y,z),screen(x+sx,y,z),screen(x+sx,y+sy,z),screen(x,y+sy,z)],color,'#fff9e54d');
  line(screen(x,y+sy,z),screen(x+sx,y+sy,z),'#fffae780',.6);
 }
 function line(a,b,color,width=1){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width*zoom;ctx.stroke();}
 function circle(p,r,color){ctx.beginPath();ctx.arc(p.x,p.y,r*zoom,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 function assetBadge(x,y,t){const p=screen(x+.5,y+.5,badgeHeight(t.type,t.level)+16),label=`✦ ${t.landmark?.name||TYPES[t.type].name}${t.type==='plot'?'':' · Lv.'+t.level}`;ctx.font=`bold ${Math.max(10,11*zoom)}px sans-serif`;ctx.textAlign='center';const width=ctx.measureText(label).width+14;ctx.fillStyle='#2f4d3eeb';ctx.fillRect(p.x-width/2,p.y-13*zoom,width,19*zoom);ctx.fillStyle='#ffe59a';ctx.fillText(label,p.x,p.y+1*zoom);}
 function tree(x,y,scale=1){
  const p=screen(x,y),r=10*scale*zoom;
  ctx.fillStyle='#203c3430';ctx.beginPath();ctx.ellipse(p.x+9*scale*zoom,p.y+4*zoom,r*1.7,r*.55,.3,0,Math.PI*2);ctx.fill();
  line(p,screen(x,y,21*scale),'#75614b',2.2*scale);line(screen(x,y,12*scale),screen(x-.13,y,22*scale),'#8e7d5b',1.3*scale);
  const c=screen(x,y,25*scale),foliage=ctx.createRadialGradient(c.x-r*.4,c.y-r*.6,0,c.x,c.y,r*1.2);foliage.addColorStop(0,'#a2b87a');foliage.addColorStop(.45,'#668854');foliage.addColorStop(1,'#294d42');
  ctx.fillStyle=foliage;ctx.beginPath();for(let n=0;n<24;n++){const angle=n*Math.PI/12,radius=r*(.86+.14*Math.sin(n*2.7+x));const xx=c.x+Math.cos(angle)*radius,yy=c.y+Math.sin(angle)*radius*1.2;n?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.closePath();ctx.fill();
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
 function buildingScale(type,level){return TYPES[type]?.group&&type!=='garden'?[.8,1.05,1.4][Math.max(0,Math.min(2,level-1))]:1;}
 function badgeHeight(type,level){if(type==='plot')return 5;return (type==='hq'?200+level*20:type==='monument'?310+level*20:type==='office'?164+level*22:type==='hotel'?92+level*16:type==='resort'?69+level*8:(TYPES[type]?.shape||type)==='tower'?140:75+level*10)*buildingScale(type,level);}
 function building(x,y,t,time){
  drawingFootprint=t.footprint?{x,y,...t.footprint}:null;
  recordingHit={i:y*SIZE+x,paths:[]};buildingHits.push(recordingHit);
  const landmark=drawLandmark(ctx,t,screen(x+.5,y+.5),zoom);
  if(landmark){const path=new Path2D();path.rect(landmark.x,landmark.y,landmark.width,landmark.height);recordingHit.paths.push(path);recordingHit=null;drawingFootprint=null;return;}
  const scale=buildingScale(t.type,t.level),p=screen(x+.5,y+.5),width=scale===1?1:[.85,1,1.16][Math.max(0,Math.min(2,t.level-1))];
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(width,scale);ctx.translate(-p.x,-p.y);
  const custom=false;buildingBody(x,y,t,time);
  if(!custom&&TYPES[t.type]?.group&&!['garden','hotel','office','golf'].includes(t.type)&&t.level>=2){
   const c=TYPES[t.type].color,z=t.type==='office'?112+t.level*22:t.type==='hotel'?58+t.level*16:t.type==='resort'?27+t.level*8:(TYPES[t.type].shape||t.type)==='tower'?103:17+t.level*12;
   // A stepped penthouse and a broad colonnaded entrance distinguish expanded buildings.
   box(x+.3,y+.3,.4,.4,z+9,c,'#617b83','#b7c9c0');
   box(x+.23,y+.76,.55,.2,15,'#e8d6a4','#8f8164','#c6aa71');
   for(const dx of[.25,.49,.74])line(screen(x+dx,y+.94,1),screen(x+dx,y+.94,14),'#fff0cd',2);
   if(t.level>=3){
    box(x+.36,y+.36,.28,.28,z+21,'#ebcd7d','#877349','#cbb477');
    for(const dx of[.17,.82])line(screen(x+dx,y+.85,18),screen(x+dx,y+.85,z-3),'#f4d787',1.5);
    line(screen(x+.5,y+.5,z+21),screen(x+.5,y+.5,z+36),'#f4da8b',2);circle(screen(x+.5,y+.5,z+37),2.5,'#fff0b6');
   }
  }
  ctx.restore();recordingHit=null;drawingFootprint=null;
 }
 function buildingBody(x,y,t,time){const original=t.type,type=TYPES[original].shape||original,c=TYPES[original].color;
  if(type==='road')return;
  if(type==='golf'){
   tile(x+.04,y+.04,'#52804a');
   poly([screen(x+.12,y+.75),screen(x+.35,y+.25),screen(x+.87,y+.17),screen(x+.73,y+.68)],'#9dc878');
   box(x+.08,y+.08,.30,.25,12+t.level*3,'#eee0bd','#97846a','#bc9060');
   for(let n=0;n<t.level;n++){const xx=x+.52+n*.13,yy=y+.55-n*.13,p=screen(xx,yy,23);circle(screen(xx,yy),6,'#b4d791');line(screen(xx,yy),p,'#fff6dc',1.5);poly([p,screen(xx+.12,yy,20),screen(xx,yy,16)],'#ce6652');}
   circle(screen(x+.74,y+.77),5,'#e7d5a7');tree(x+.92,y+.4,.5);return;
  }
  if(type==='plot'){tile(x+.06,y+.06,'#c8bb8877','#efd78d',2);return;}
  poly([screen(x+.04,y+.04),screen(x+.96,y+.04),screen(x+.96,y+.96),screen(x+.04,y+.96)],'#c3c4b3','#e5dfc7');
  if(type==='park'){tile(x+.07,y+.07,'#81aa74');line(screen(x+.1,y+.5),screen(x+.9,y+.5),'#d4c7a5',5);tree(x+.3,y+.3);tree(x+.75,y+.7,.75);return;}
  if(type==='wind'){box(x+.32,y+.32,.35,.35,5,'#e3e8d8');const p=screen(x+.5,y+.5,55);line(screen(x+.5,y+.5,3),p,'#e2e9dc',4);for(let k=0;k<3;k++){const a=time*.0007+k*Math.PI*2/3;line(p,{x:p.x+Math.cos(a)*22*zoom,y:p.y+Math.sin(a)*22*zoom},'#f5f6e8',3);}circle(p,3,'#749398');return;}
  if(type==='water'){for(const dx of [.2,.65])for(const dy of [.2,.65])line(screen(x+dx,y+dy),screen(x+dx,y+dy,28),'#668c97',2);box(x+.14,y+.14,.65,.65,37,'#acd5d7','#6799aa','#86b7be');box(x+.22,y+.22,.49,.49,41,'#d3e6df','#87b4be','#acd0cf');return;}
  if(type==='plaza'){tile(x+.06,y+.06,'#d4c4b0');box(x+.3,y+.3,.4,.4,4,'#aacbd3');circle(screen(x+.5,y+.5,7),5,'#b4e4e1');tree(x+.16,y+.2,.6);tree(x+.8,y+.8,.6);return;}
  if(type==='factory'){box(x+.12,y+.15,.72,.68,17+8*t.level,c,'#9c946e','#c4b88b');box(x+.2,y+.22,.20,.2,38+6*t.level,'#aaa692','#827e6c','#b1a894');for(let j=0;j<3;j++){const phase=(time*.0002+j*.35)%1;circle(screen(x+.3-phase*.3,y+.3,46+6*t.level+phase*19),3+phase*5,`rgba(211,214,197,${.32*(1-phase)})`);}windows(x,y,17,1);return;}
  if(original==='hotel'){
   luxuryGround(x,y,'#d3a63d');const z=58+t.level*16;
   box(x+.08,y+.12,.84,.76,11,'#efe2c6','#9a8064','#c9aa7d');
   box(x+.10,y+.18,.80,.50,z,'#f0d9a9','#a18060','#d3b184');
   box(x+.10,y+.60,.22,.30,z-15,'#f0d9a9','#a18060','#d3b184');
   box(x+.68,y+.60,.22,.30,z-15,'#f0d9a9','#a18060','#d3b184');
   poly([screen(x+.07,y+.15,z),screen(x+.93,y+.15,z),screen(x+.84,y+.43,z+14),screen(x+.16,y+.43,z+14)],'#803f43');
   poly([screen(x+.16,y+.43,z+14),screen(x+.84,y+.43,z+14),screen(x+.93,y+.72,z),screen(x+.07,y+.72,z)],'#ab5953');
   luxuryWindows(x,y,z,Math.max(3,t.level+3));
   box(x+.31,y+.70,.38,.18,18,'#873e46','#613039','#e0b85f');
   line(screen(x+.5,y+.9,1),screen(x+.5,y+1.04,1),'#a64548',7);
   if(t.level>=2)for(const xx of[.14,.78]){box(x+xx,y+.63,.08,.08,z-6,'#edd397');line(screen(x+xx+.04,y+.67,z-6),screen(x+xx+.04,y+.67,z+6),'#ddbc6e',1);}
   for(const xx of[.34,.45,.56,.67])line(screen(x+xx,y+.88,2),screen(x+xx,y+.88,17),'#f4e5bf',1.7);
   const crown=screen(x+.5,y+.5,z+24);ctx.fillStyle='#783f35';ctx.font=`bold ${10*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText(t.level===3?'GRAND HOTEL':'HOTEL',crown.x,crown.y+3*zoom);return;
  }
  if(original==='resort'){
   luxuryGround(x,y,'#59a9a6');const z=27+t.level*8;
   box(x+.08,y+.12,.84,.31,z,'#e6d1aa','#806d59','#b88764');
   box(x+.10,y+.52,.50,.34,z+7,'#f0ddba','#7b7167','#c4946f');
   box(x+.62,y+.51,.29,.34,z-2,'#e8ceb0','#756e67','#b77e5f');
   poly([screen(x+.04,y+.08,z),screen(x+.96,y+.08,z),screen(x+.83,y+.28,z+11),screen(x+.17,y+.28,z+11)],'#9e5f43');
   for(const xx of[.18,.34,.50,.66,.82])line(screen(x+xx,y+.43,5),screen(x+xx,y+.43,z-3),'#f7e4b7',2);
   box(x+.13,y+.57,.42,.22,3,'#58bac6','#43899a','#8fdce0');
   for(const xx of[.17,.34,.51])line(screen(x+xx,y+.84,8),screen(x+xx+.09,y+.84,8),'#f3d492',3);
   tree(x+.88,y+.74,.75);tree(x+.08,y+.58,.68);
   const crown=screen(x+.5,y+.32,z+20);ctx.fillStyle='#775126';ctx.font=`bold ${10*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText('RESORT ✦',crown.x,crown.y);return;
  }
  if(original==='office'){
   luxuryGround(x,y,'#d8b64d');const z=112+t.level*22;
   box(x+.07,y+.10,.86,.79,13,'#d6c49b','#737b80','#a8a18d');
   box(x+.18,y+.18,.64,.64,z,'#80aeb9','#486874','#6e96a4');
   box(x+.25,y+.25,.50,.50,z+12,'#a5c8cb','#4f6d77','#83a8ae');
   luxuryWindows(x,y,z,Math.max(6,t.level*2+5),'#b9edf0','#8cd0e3');
   for(const offset of[.21,.39,.58,.76])line(screen(x+offset,y+.84,16),screen(x+offset,y+.84,z-5),'#d0e5ee',1.2);
   box(x+.32,y+.32,.36,.36,z+20,'#bfdce5','#496573','#85abba');
   if(t.level>=2)box(x+.05,y+.23,.17,.49,z*.7,'#a3cad7','#416576','#739cae');
   if(t.level>=3)box(x+.76,y+.32,.18,.45,z*.55,'#a3cad7','#416576','#739cae');
   line(screen(x+.5,y+.5,z+20),screen(x+.5,y+.5,z+47),'#e6d79f',2.4);
   circle(screen(x+.5,y+.5,z+49),3.4,'#ffe5a1');return;
  }
  if(original==='hq'){
   luxuryGround(x,y,'#c9a24a');const z=150+t.level*20;
   box(x+.08,y+.08,.84,.84,14,'#e7dcc0','#8b8468','#c8bf9e');box(x+.2,y+.2,.6,.6,z,'#c9a24a','#7d6430','#a9863a');box(x+.3,y+.3,.4,.4,z+18,'#e6c86b','#8e7135','#c6a44f');
   luxuryWindows(x,y,z,Math.max(8,t.level*2+7),'#fff1c2','#e9d492');
   line(screen(x+.5,y+.5,z+18),screen(x+.5,y+.5,z+48),'#f4e0a0',2.5);circle(screen(x+.5,y+.5,z+50),4,'#fff6d0');
   const crown=screen(x+.5,y+.5,z+62);ctx.fillStyle='#7a5a1c';ctx.font=`bold ${10*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText('HQ ✦',crown.x,crown.y);return;
  }
  if(original==='monument'){
   luxuryGround(x,y,'#e0c46a');const z=230+t.level*20;
   box(x+.1,y+.1,.8,.8,12,'#efe6cc','#9a9276','#d2c9a8');for(const [dx,dy]of[[.18,.18],[.7,.18],[.18,.7],[.7,.7]])box(x+dx,y+dy,.12,.12,40,'#e8d9a8','#8f855f','#cbbd8a');
   box(x+.36,y+.36,.28,.28,z,'#e0c46a','#8d7a3a','#c5a94e');box(x+.42,y+.42,.16,.16,z+30,'#f3dd8a','#9a8340','#d7bb5c');
   line(screen(x+.5,y+.5,z+30),screen(x+.5,y+.5,z+70),'#fff0b0',3);circle(screen(x+.5,y+.5,z+72),6,'#fff8d6');
   const crown=screen(x+.5,y+.5,z+86);ctx.fillStyle='#7a5a1c';ctx.font=`bold ${10*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText('LANDMARK ✦',crown.x,crown.y);return;
  }
  if(type==='tower'){const extra=original==='office'?(t.level-1)*20:0;box(x+.08,y+.08,.84,.84,10,'#e9d9b3','#abac9a','#cfcaac');box(x+.28,y+.28,.44,.44,94+extra,c,'#91a6a4','#b4c8ba');box(x+.35,y+.35,.3,.3,103+extra,'#ede6cb');line(screen(x+.5,y+.5,103+extra),screen(x+.5,y+.5,120+extra),'#d5c48b',2);return;}
  const z=type==='home'?17+t.level*10:type==='shop'?15+t.level*12:type==='hall'?29:22;
  const shades=type==='home'?['#749580','#adc3a1']:type==='shop'?['#6c9eac','#a3c4c9']:type==='hall'?['#b6ac8c','#ded1ab']:['#a59583','#cebba6'];
  box(x+.13,y+.13,.7,.7,z,c,...shades);windows(x,y,z,Math.max(1,Math.floor(z/12)));
  // Recessed entrance, stone lintels and balcony edges give small buildings scale.
  poly([screen(x+.43,y+.84,0),screen(x+.59,y+.84,0),screen(x+.59,y+.84,10),screen(x+.43,y+.84,10)],'#304b54','#d7d9c5');
  line(screen(x+.4,y+.89,1),screen(x+.64,y+.89,1),'#e3d9be',2.5);
  for(let floor=1;floor<Math.floor(z/12);floor++)line(screen(x+.13,y+.84,floor*10+1),screen(x+.83,y+.84,floor*10+1),'#e1dcc980',1);
  if(type==='home'&&t.level===1){poly([screen(x+.07,y+.12,z),screen(x+.9,y+.12,z),screen(x+.9,y+.5,z+12),screen(x+.07,y+.5,z+12)],'#b77f63');poly([screen(x+.07,y+.5,z+12),screen(x+.9,y+.5,z+12),screen(x+.9,y+.9,z),screen(x+.07,y+.9,z)],'#805e50');for(let n=1;n<6;n++)line(screen(x+.07+n*.135,y+.5,z+12),screen(x+.07+n*.135,y+.9,z),'#d6aa8260',.7);line(screen(x+.07,y+.5,z+12),screen(x+.9,y+.5,z+12),'#e0bd90',1);}
  else{box(x+.23,y+.23,.48,.48,z+3,c,...shades);if(type==='hall'){line(screen(x+.5,y+.5,z+3),screen(x+.5,y+.5,z+24),'#a79c7c',1);poly([screen(x+.5,y+.5,z+24),screen(x+.76,y+.5,z+24),screen(x+.76,y+.5,z+17),screen(x+.5,y+.5,z+17)],'#4e857c');}}
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
 const life=createWorldLife(ctx,screen,box,circle,line,getState,getAnalysis);
 function ground(s,a,time){
  const water=ctx.createLinearGradient(0,0,w,h);water.addColorStop(0,'#80aaa5');water.addColorStop(.4,'#438b95');water.addColorStop(1,'#205971');
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const i=y*SIZE+x,t=s.tiles[i],road=(xx,yy)=>xx>=0&&yy>=0&&xx<SIZE&&yy<SIZE&&s.tiles[yy*SIZE+xx].type==='road';
   ctx.globalAlpha=layer==='assets'&&t.owner!=='player'?.3:1;
   const tone=(Math.sin(x*.72+y*.37)+1)*2;
   const surface=t.terrain==='water'?water:`hsl(85,22%,${64+tone}%)`;tile(x,y,surface,surface);
   if(t.terrain==='water'&&t.type!=='road'){
    for(let n=0;n<3;n++){const p=screen(x+.15+n*.25,y+.25+n*.21),wave=Math.sin(time*.0007+y+n)*2*zoom;line({x:p.x-4*zoom,y:p.y+wave},{x:p.x+(6+n*2)*zoom,y:p.y+wave},n===1?'#c4e0d326':'#b4d8d91b',.6);}
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
     const horizontal=y===BOULEVARD.axis;
     for(const offset of [.46,.54])line(screen(x+(horizontal?0:offset),y+(horizontal?offset:0),2),screen(x+(horizontal?1:offset),y+(horizontal?offset:1),2),'#f4d477',1.5);
     ctx.setLineDash([4*zoom,4*zoom]);
     for(const offset of [.22,.78])line(screen(x+(horizontal?0:offset),y+(horizontal?offset:0),2),screen(x+(horizontal?1:offset),y+(horizontal?offset:1),2),'#fff5d9',.8);
     ctx.setLineDash([]);
    }
    if(road(x+1,y)&&road(x,y+1)&&road(x-1,y)&&road(x,y-1))for(let k=0;k<4;k++)line(screen(x+.2+k*.14,y+.08,2),screen(x+.2+k*.14,y+.25,2),'#eee8d1',1.8);
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
 function render(time,phase=0){
  buildingHits=[];
  life.update(time);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.lineJoin='round';ctx.lineCap='round';
  const sky=ctx.createLinearGradient(0,0,w,h);sky.addColorStop(0,'#f4f0e3');sky.addColorStop(.5,'#dbe5df');sky.addColorStop(1,'#b2c9cd');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  if(reducedMotion.matches)time=0;
  const s=getState(),a=getAnalysis();
  // Island edge gives the map its model-like depth.
  poly([screen(0,SIZE),screen(SIZE,SIZE),screen(SIZE,SIZE,-15),screen(0,SIZE,-15)],'#b8beaa');
  poly([screen(SIZE,0),screen(SIZE,SIZE),screen(SIZE,SIZE,-15),screen(SIZE,0,-15)],'#9cad9f');
  ground(s,a,time);
  for(let sum=0;sum<SIZE*2;sum++)for(let x=0;x<SIZE;x++){const y=sum-x;if(y<0||y>=SIZE)continue;const i=y*SIZE+x,t=s.tiles[i],assetFocus=layer==='assets'&&s.tiles[t.buildingAnchor??i].owner!=='player';if(assetFocus)ctx.globalAlpha=.22;
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
     building(p.x,p.y,asset,time);
     if(asset.owner==='player'){const center=screen(p.x+(asset.footprint?.width||1)/2,p.y+(asset.footprint?.height||1)/2,badgeHeight(asset.type,asset.level));circle(center,5,'#f3d68c');}
     if(asset.owner==='rival'){const center=screen(p.x+.5,p.y+.5,badgeHeight(asset.type,asset.level)+8);circle(center,7,'#a83d37');ctx.fillStyle='#fff3e6';ctx.font=`bold ${9*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText('⚑',center.x,center.y+3*zoom);}
    }
   }else if(t.tree&&t.terrain==='land')tree(x+.5,y+.5,.85+((x+y)%3)*.1);
   if(layer==='assets'&&s.tiles[t.buildingAnchor??i].owner==='player')tile(x,y,'#ffd75f88','#fff0a8',2);if(layer!=='normal'&&layer!=='assets'&&t.terrain==='land'){const d=a.details[i];let val=layer==='pollution'?1-d.pollution/100:layer==='value'?d.value/130:layer==='services'?(d.education+d.health+d.fire)/3:(d.connected?1:0);val=Math.max(0,Math.min(1,val));tile(x,y,`hsla(${val*130},55%,48%,.42)`);}
   life.drawTile(i,time);
   ctx.globalAlpha=1;if(layer==='assets'&&t.owner==='player')assetBadge(x,y,t);
   if(t.damage){const p=screen(x+.5,y+.5,53);circle(p,8,'#c8765e');ctx.fillStyle='white';ctx.font=`bold ${11*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText('!',p.x,p.y+4*zoom);}
   else if(t.type&&t.type!=='road'&&!a.active[i]){const p=screen(x+.5,y+.5,52);circle(p,6,'#dcb166');ctx.fillStyle='#544532';ctx.font=`${9*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText('↯',p.x,p.y+3*zoom);}
  }
  const target=s.rival?.target??-1;
  if(target>=0){const{x,y}=coords(target),pulse=.5+.5*Math.sin(time*.006);tile(x,y,`rgba(200,80,70,${(.15+.3*pulse).toFixed(2)})`,'#c0574d',2);const p=screen(x+.5,y+.5,34);ctx.fillStyle='#a83d37';ctx.font=`bold ${10*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText('⚑ Rival buy incoming',p.x,p.y);}
  if(selected>=0){for(const j of footprintCells(selected,s.tiles[selected].footprint)){const{x,y}=coords(j);tile(x,y,'#f8f0b42b','#f5e6a5',1);}}
  if(hover>=0){const{x,y}=coords(hover);const ok=tool==='inspect'||tool==='pan'||!canBuild(s,hover,tool,TYPES[tool]?.group==='property'?'buy':'lease');tile(x,y,ok?'#f6ffe255':'#e9947755',ok?'#f8ffe0':'#bb604f',2);
   if(TYPES[tool]?.radius){const radius=TYPES[tool].radius;for(let yy=0;yy<SIZE;yy++)for(let xx=0;xx<SIZE;xx++)if(Math.hypot(xx-x,yy-y)<=radius)tile(xx,yy,'#fff8ba12','#e8e8b344',1);}
  }
  if(groundView)return;
  const collection=flexState(s).owned;
  if(collection.includes('penthouse')){
   const d=mansionDesign(s),width=Math.min(3,.9+(d.area??({1:120,2:200,3:320,4:800,5:2000})[d.size])/250),z=14+d.floors*15,c=MANSION_COLORS[d.color];
   for(let xx=1;xx<=5;xx++)for(let yy=19;yy<=22;yy++)tile(xx,yy,(xx+yy)%2?'#acc195':'#b8cca0','#d8c986');
   line(screen(3.35,22.95),screen(3.35,21.55),'#e7ddc8',13);circle(screen(3.35,21.72,3),8,'#75b9bd');circle(screen(3.35,21.72,5),3,'#ead38a');
   for(const [xx,yy]of[[1.15,19.2],[5.75,19.2],[1.15,22.75],[5.75,22.75]]){box(xx,yy,.12,.12,10,'#e5d7b7','#81735d','#cbb78c');circle(screen(xx+.06,yy+.06,17),5,'#315f4f');}
   box(2,20,width,.85,z,c,'#718780',c);box(1.7,20.16,.48,.58,Math.max(18,z-5),c,'#687a75',c);box(2+width-.18,20.16,.48,.58,Math.max(18,z-5),c,'#687a75',c);
   if(d.roof==='gable'){poly([screen(1.95,19.95,z),screen(2+width+.05,19.95,z),screen(2+width+.05,20.43,z+14),screen(1.95,20.43,z+14)],'#89958b');poly([screen(1.95,20.43,z+14),screen(2+width+.05,20.43,z+14),screen(2+width+.05,20.9,z),screen(1.95,20.9,z)],d.style==='resort'?'#b77957':'#687e83');}
   else box(1.95,19.95,width+.1,.95,z+3,'#bccdc6','#6b807d','#c7d2c5');
   if(d.roof==='terrace'){line(screen(2,20,z+12),screen(2+width,20,z+12),'#d9eee2',2);box(2.15,20.15,.3,.25,z+8,'#d5b97b');}
   const cols=Math.ceil(d.rooms/d.floors);for(let n=0;n<d.rooms;n++){const xx=2.12+n%cols*(width-.15)/cols,zz=z-5-Math.floor(n/cols)*15;line(screen(xx,20.86,zz),screen(xx+width/cols*.5,20.86,zz),d.style==='modern'?'#90d4e4':'#f6d28f',5);}
   for(let floor=1;floor<d.floors;floor++)line(screen(2,20.91,floor*15),screen(2+width,20.91,floor*15),'#dfc889',1.5);
   if(d.style==='classic')for(const xx of[2.03,2.28,2+width-.35,2+width-.1])line(screen(xx,20.9,1),screen(xx,20.9,z),'#fff0d0',3);
   if(d.style==='resort')box(1.9,20.65,width+.2,.4,14,'#b7845e');
   box(2+width*.42,20.72,width*.20,.18,12,'#4c443d','#393630','#d5af5f');
   if(d.pool)box(2.05,21.10,1.65,.72,3,'#62bdcc','#4f98a8','#9be0e2');if(d.garden){for(const [xx,yy]of[[1.45,20],[1.45,21],[4.1,21.5],[5.25,20.2]])tree(xx,yy,.72);}
   if(d.golf){tile(2,22,'#72a969');tile(3,22,'#83b679');line(screen(3.3,22.4),screen(3.3,22.4,18),'#fff4d3',1);circle(screen(2.4,22.3),3,'#e6d7a5');}
   if(d.cinema)box(4.2,20.2,.6,.6,18,'#626d80','#414c62','#7a8794');if(d.spa)box(4.2,21.1,.6,.6,12,'#86c6c4');if(d.helipad){tile(4,22,'#899c99');const hp=screen(4.5,22.5,2);ctx.fillStyle='#fff1bf';ctx.font='bold 15px sans-serif';ctx.fillText('H',hp.x,hp.y);}
   const p=screen(3.25,20.45,z+38);circle(p,12,'#fff1bd88');ctx.font=`bold ${12*zoom}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#60451c';ctx.fillText(`♛ PRIVATE ESTATE · ${d.floors} floors · ${d.rooms} rooms`,p.x,p.y+4*zoom);
  }
  if(collection.includes('yacht')){const yy=12+(reducedMotion.matches?0:Math.sin(time*.0005)*.15),model=selectedModel(s,'yacht');drawMapYacht(ctx,screen,23.4,yy+.7,model,time);const design=YACHT_DESIGNS[model.id],p=screen(23.4,yy+.7,design.roof+Math.max(0,design.levels-1)*7+26);ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#21485a';ctx.fillText('✦ '+model.name,p.x,p.y);}
  life.drawFront(time,phase);
 }
 function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==1&&e.button!==2)return;const p=point(e);down={...p,panX,panY,pan:tool==='pan'||e.button!==0||e.altKey,moved:false};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{const p=point(e);hover=pick(p.x,p.y);onHover(hover);if(!down)return;if(Math.hypot(p.x-down.x,p.y-down.y)>6)down.moved=true;if(down.pan){panX=down.panX+p.x-down.x;panY=down.panY+p.y-down.y;}});
 canvas.addEventListener('pointerup',e=>{if(down&&!down.pan&&!down.moved){const p=point(e),i=pick(p.x,p.y);if(i>=0)onTile(i);}down=null;});
 canvas.addEventListener('pointercancel',()=>{down=null;});canvas.addEventListener('pointerleave',()=>{hover=-1;onHover(-1);});canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.tabIndex=0;
 canvas.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(e.key))return;e.preventDefault();if(hover<0)hover=9*SIZE+9;if(e.key==='Enter'){onTile(hover);return;}let{x,y}=coords(hover);if(e.key==='ArrowUp')y--;if(e.key==='ArrowDown')y++;if(e.key==='ArrowLeft')x--;if(e.key==='ArrowRight')x++;hover=Math.max(0,Math.min(SIZE-1,y))*SIZE+Math.max(0,Math.min(SIZE-1,x));onHover(hover);});
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.45,Math.min(2.3,zoom*(e.deltaY>0?.92:1.08)));},{passive:false});
 return{render,focus(i){const{x,y}=coords(i);zoom=w<650?1.1:1.5;panX=-(x-y)*halfW*zoom;panY=260*zoom-(x+y+1)*halfH*zoom;},burst:life.burst,visit:life.visit,setTool(v){tool=v;canvas.style.cursor=v==='pan'?'grab':v==='inspect'?'default':'crosshair';},setLayer(v){layer=v;},setGroundView(v){groundView=!!v;hover=-1;onHover(-1);},select(i){selected=i;},zoom(delta){zoom=Math.max(.45,Math.min(2.3,zoom+delta));},home(){zoom=w<650?.64:Math.min(1,w/1120);panX=0;panY=w<650?-55:-100;},position:screen};
}
