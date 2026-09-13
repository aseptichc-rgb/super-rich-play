// Dimensions and silhouettes follow each collection photograph, independently of price.
export const CAR_DESIGNS={
 roadster:{length:37,width:16,height:7,roof:13,aft:-.22,front:.13,open:true,round:true,lights:'oval',intake:'small'},
 sunset:{length:44,width:18,height:6.5,roof:13,aft:-.23,front:.16,round:true,lights:'swept',intake:'scoop'},
 gt:{length:49,width:17,height:8,roof:15,aft:-.29,front:.03,round:true,lights:'slim',intake:'vent'},
 super:{length:46,width:20,height:6,roof:11,aft:-.22,front:.20,round:false,lights:'blade',intake:'angular'},
 hyper:{length:53,width:21,height:6.5,roof:13,aft:-.17,front:.13,round:true,lights:'twin',intake:'carbon',wing:true}
};
export const YACHT_DESIGNS={
 small:{length:50,beam:16,transom:.72,taper:.42,cabinAft:-.13,cabinFront:.12,roof:12,levels:0,hull:'#eee9df',deck:'#b99061'},
 medium:{length:67,beam:21,transom:.93,taper:.57,cabinAft:-.29,cabinFront:.22,roof:19,levels:1,hull:'#e4eceb',deck:'#b38d61',canopy:true},
 riverside:{length:91,beam:25,transom:.82,taper:.50,cabinAft:-.27,cabinFront:.24,roof:18,levels:2,hull:'#f2ebd9',deck:'#c5a16f'},
 super:{length:126,beam:33,transom:.88,taper:.60,cabinAft:-.32,cabinFront:.14,roof:21,levels:3,hull:'#edf3f1',deck:'#bf996b',pool:true},
 mega:{length:166,beam:43,transom:.94,taper:.66,cabinAft:-.36,cabinFront:.08,roof:25,levels:5,hull:'#9eabb3',deck:'#ad987b',helipad:true}
};
export function drawMapCar(ctx,screen,x,y,model,heading=1){
 const d=CAR_DESIGNS[model.id]||{...CAR_DESIGNS.gt,length:29,width:13,roof:12},L=d.length,B=d.width,H=d.height;
 const anchor=screen(x,y),unit=screen(x+1,y),scale=Math.hypot(unit.x-anchor.x,unit.y-anchor.y)/Math.hypot(28,14),dir=heading<0?-1:1,axis=Math.abs(heading)===1?1:-1;
 const project=([u,v,z])=>({x:(u*.92-v*.7*axis)*dir,y:(u*.4*axis+v*.48)*dir-z});
 const shape=(points,fill,stroke,width=.6)=>{ctx.beginPath();points.forEach((v,i)=>{const p=project(v);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}};
 const line=(points,color,width=1)=>{ctx.beginPath();points.forEach((v,i)=>{const p=project(v);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
 ctx.save();ctx.translate(anchor.x,anchor.y);ctx.scale(scale,scale);ctx.lineJoin='round';ctx.lineCap='round';
 const outline=[[-.5,-.32],[-.45,-.48],[-.3,-.5],[.18,-.49],[.40,-.43],[.5,-.30],[.5,.30],[.40,.43],[.18,.49],[-.3,.5],[-.45,.48],[-.5,.32]].map(([u,v])=>[u*L,v*B,H+(u<-.28?1:0)]);
 ctx.save();ctx.filter='blur(1px)';shape(outline.map(([u,v])=>[u+1,v+1,0]),'#11232c48');ctx.restore();
 const paint=ctx.createLinearGradient(-20,-19,20,12);paint.addColorStop(0,model.color);paint.addColorStop(.38,model.color);paint.addColorStop(.46,'#e5e1d5');paint.addColorStop(.51,model.color);paint.addColorStop(1,'#15232d');
 const faces=outline.map((v,i)=>{const w=outline[(i+1)%outline.length];return [v,w,[w[0],w[1]*.96,3],[v[0],v[1]*.96,3]];});
 faces.sort((a,b)=>a.reduce((n,v)=>n+project([v[0],v[1],0]).y,0)-b.reduce((n,v)=>n+project([v[0],v[1],0]).y,0));faces.forEach(face=>shape(face,paint));
 shape(outline,model.color,'#edf1e15c');
 // Curved shoulder lines on the roadster/GT, straight creases on the wedge supercar.
 for(const side of[-1,1]){
  const points=[[-L*.43,side*B*.39,H+1],[-L*.22,side*B*.39,H+1],[L*.27,side*B*.36,H+.5],[L*.46,side*B*.25,H]];
  if(d.round){const p=points.map(project);ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);ctx.bezierCurveTo(p[1].x,p[1].y,p[2].x,p[2].y,p[3].x,p[3].y);ctx.strokeStyle='#f2ead37a';ctx.lineWidth=.65;ctx.stroke();}else line(points,'#fce8c4a0',.7);
 }
 const a=d.aft*L,f=d.front*L,roofA=a+3,roofF=f-3,cb=B*.32;
 const glass=ctx.createLinearGradient(-10,-20,10,2);glass.addColorStop(0,'#9ab4bc');glass.addColorStop(.35,'#172b38');glass.addColorStop(1,'#405a67');
 if(d.open){
  shape([[a,-cb,H],[f,-cb,H],[f,cb,H],[a,cb,H]],'#171f24');
  for(const v of[-B*.17,B*.17]){shape([[a+2,v-2,H+.5],[a+7,v-2,H+.5],[a+7,v+2,H+.5],[a+2,v+2,H+.5]],'#5e5145');line([[a+1,v-2,H+2],[a+1,v-2,H+5],[a+1,v+2,H+5],[a+1,v+2,H+2]],'#313437',1.2);}
 }else{
  for(const side of[-1,1])shape([[a,side*cb,H],[f,side*cb,H],[roofF,side*cb*.85,d.roof],[roofA,side*cb*.85,d.roof]],glass,model.color);
  shape([[a,-cb,H],[a,cb,H],[roofA,cb*.85,d.roof],[roofA,-cb*.85,d.roof]],glass);
  shape([[roofA,-cb*.85,d.roof],[roofF,-cb*.85,d.roof],[roofF,cb*.85,d.roof],[roofA,cb*.85,d.roof]],model.id==='hyper'?'#20272c':paint,'#ece8db70');
 }
 shape([[f,-cb,H],[f,cb,H],[roofF,cb*.85,d.roof],[roofF,-cb*.85,d.roof]],glass,'#b9c5c47a');
 const near=dir;
 for(const u of[-L*.32,L*.32]){
  const p=project([u,near*B*.49,4]);ctx.fillStyle='#12191e';ctx.beginPath();ctx.ellipse(p.x,p.y,3.1,4.4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=model.id==='roadster'?'#687078':'#40494e';ctx.beginPath();ctx.ellipse(p.x,p.y,2.2,3.3,0,0,Math.PI*2);ctx.fill();
  for(let n=0;n<7;n++){const t=n*Math.PI*2/7;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(t)*2.1,p.y+Math.sin(t)*3.1);ctx.strokeStyle='#c0c6c5';ctx.lineWidth=.4;ctx.stroke();}
 }
 const side=near*B*.485;
 if(d.intake==='vent')for(let n=0;n<3;n++)line([[L*.09,side,H-1-n*.7],[L*.22,side,H-1-n*.7]],'#bfc5bd',.45);
 else shape([[-L*.27,side,H-.4],[-L*.08,side,H-1],[-L*.13,side,3.2],[-L*.24,side,3.2]],'#13212a');
 line([[a,side,H-.5],[a+1,side,3.5],[f-2,side,3.5],[f,side,H-.5]],'#101e293f',.6);
 // Photo-specific lamps and front grille, visible even at map scale.
 for(const s of[-1,1]){
  const u=L*.38,v=s*B*.31;
  if(d.lights==='oval'||d.lights==='twin')for(let n=0;n<(d.lights==='twin'?2:1);n++){const p=project([u-n*2,v,H+.2]);ctx.fillStyle='#283b46';ctx.beginPath();ctx.ellipse(p.x,p.y,2,1.5,-.4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d9e9e6';ctx.beginPath();ctx.arc(p.x,p.y,.65,0,Math.PI*2);ctx.fill();}
  else line([[L*.30,s*B*.40,H+.3],[L*.44,s*B*.27,H+.2]],'#e8f5ed',1.15);
  line([[-L*.49,s*B*.27,H-1],[-L*.48,s*B*.40,H-1]],'#cf3b35',1.2);
 }
 shape([[L*.495,-B*.25,H-1],[L*.495,B*.25,H-1],[L*.495,B*.24,3.5],[L*.495,-B*.24,3.5]],'#111e24');
 if(model.id==='gt')for(let z=4;z<H-1;z+=1)line([[L*.5,-B*.23,z],[L*.5,B*.23,z]],'#bcc4c2',.4);
 if(model.id==='hyper'){
  shape([[f,-B*.15,H+.2],[L*.47,-B*.11,H+.2],[L*.47,B*.11,H+.2],[f,B*.15,H+.2]],'#252d32');
  shape([[roofA,-2,d.roof+.3],[roofF,-2,d.roof+.3],[roofF,2,d.roof+.3],[roofA,2,d.roof+.3]],'#121a20');
  for(const v of[-B*.29,B*.29])line([[-L*.36,v,H],[-L*.39,v,H+7]],'#253039',1.2);
  shape([[-L*.47,-B*.59,H+7],[-L*.34,-B*.59,H+7],[-L*.34,B*.59,H+7],[-L*.47,B*.59,H+7]],'#232c31','#8b969a');
 }
 for(const s of[-1,1])line([[f-2,s*cb,H+1],[f-2,s*B*.49,H+1]],model.id==='super'||model.id==='hyper'?'#1e272e':model.color,1.6);
 ctx.restore();
}

export function yachtHullProfile(metres){
 const design=YACHT_DESIGNS[({8:'small',15:'medium',30:'riverside',60:'super',100:'mega'})[metres]];
 const length=design?.length??58+Math.min(100,metres)*.9,beam=design?.beam??length*.27,port=[],starboard=[],taper=design?.taper??.52,transom=design?.transom??.82;
 for(let n=0;n<=32;n++){
  const t=n/32,u=(t-.5)*length;
  const half=beam*.5*(t<taper?transom+(1-transom)*Math.sin(t/taper*Math.PI/2):1-Math.pow((t-taper)/(1-taper),1.6));
  const sheer=7+3.8*t*t*t*t;
  port.push([u,-half,sheer]);starboard.push([u,half,sheer]);
 }
 return{length,beam,port,starboard};
}

export function drawMapYacht(ctx,screen,x,y,model,time=0){
 const design=YACHT_DESIGNS[model.id]||YACHT_DESIGNS.riverside;
 const p=screen(x,y),q=screen(x+1,y),scale=Math.hypot(q.x-p.x,q.y-p.y)/Math.hypot(28,14);
 const {length:L,beam:B,port,starboard}=yachtHullProfile(model.length),bob=Math.sin(time*.0009)*.45,roll=Math.sin(time*.0007)*.012;
 // Project a curved, raised deck and its tapered lower hull in the map's view.
 const project=([u,v,z])=>({x:u*.93+v*.5,y:-u*.36+v*.48-z});
 const path=(points,fill,stroke,width=.7)=>{ctx.beginPath();points.forEach((v,i)=>{const a=project(v);i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y);});ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}};
 const trace=(points,color,width=1)=>{ctx.beginPath();points.forEach((v,i)=>{const a=project(v);i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
 const top=[...port,...starboard.toReversed()],lower=top.map(([u,v])=>[u*.96-1,v*.77,.5]);
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);ctx.lineJoin='round';ctx.lineCap='round';
 // Water contact remains fixed while the hull gently rocks above its reflection.
 ctx.save();ctx.translate(4,6);ctx.filter='blur(2px)';path(lower,'#0d304e30');ctx.restore();
 ctx.save();ctx.translate(0,4);ctx.filter='blur(1px)';
 const reflection=ctx.createLinearGradient(0,-12,0,28);reflection.addColorStop(0,'#c7e3de23');reflection.addColorStop(1,'#c7e3de00');
 path(top.map(([u,v,z])=>[u,v,-z*.7]),reflection);
 const reflectedGlass=ctx.createLinearGradient(0,0,0,28);reflectedGlass.addColorStop(0,'#132e4526');reflectedGlass.addColorStop(1,'#132e4500');path([[L*.12,-B*.3,-8],[L*.24,B*.3,-8],[0,B*.3,-23],[-L*.15,-B*.3,-23]],reflectedGlass);ctx.restore();
 const waterline=starboard.map(([u,v])=>[u*.96-1,v*.77,0]);trace(waterline,'#c4e7dd7a',1.5);
 for(let n=0;n<2;n++){const spread=2+n*2+Math.sin(time*.001+n)*.5;trace(starboard.slice(19).map(([u,v])=>[u+spread,v+spread,-.3]),'#e6f4e662',.8);}
 ctx.save();ctx.translate(0,bob);ctx.rotate(roll);
 path(lower,'#1b2a3a');
 const gelcoat=ctx.createLinearGradient(-L*.3,-25,L*.15,18);gelcoat.addColorStop(0,'#ffffff');gelcoat.addColorStop(.25,design.hull);gelcoat.addColorStop(.55,design.hull);gelcoat.addColorStop(.8,'#b4c8ce');gelcoat.addColorStop(1,'#608090');
 path([...starboard,...starboard.toReversed().map(([u,v])=>[u*.96-1,v*.77,1.6])],gelcoat);
 path([port[0],starboard[0],[starboard[0][0]*.96-1,starboard[0][1]*.77,1.6],[port[0][0]*.96-1,port[0][1]*.77,1.6]],'#a2b4b9');
 trace(starboard.map(([u,v])=>[u*.98-.5,v*.86,2.4]),'#0e3a5c',1.4);
 path(top,design.hull,'#ffffff',.85);
 const teak=[...port.map(([u,v,z])=>[u*.91,v*.84,z+.15]),...starboard.toReversed().map(([u,v,z])=>[u*.91,v*.84,z+.15])];
 path(teak,design.deck);
 // Clip deck seams to the curved gunwale instead of crossing the pointed bow.
 ctx.save();path(teak);ctx.clip();for(let v=-B*.4;v<B*.45;v+=2)trace([[-L*.46,v,7.3],[L*.46,v,10.5]],'#f1d0a16b',.45);ctx.restore();
 trace(starboard,'#fffdf0',1.1);
 // Open aft cockpit, with a pale U-shaped seat distinct from the dark recess.
 path([[-L*.40,-B*.28,7.6],[-L*.21,-B*.28,7.6],[-L*.21,B*.28,7.6],[-L*.40,B*.28,7.6]],'#203642');
 trace([[-L*.24,-B*.23,8.3],[-L*.36,-B*.23,8.3],[-L*.36,B*.23,8.3],[-L*.24,B*.23,8.3]],'#ebe8da',2.3);
 // A 0.3L cabin uses 70% of the beam, leaving visible side decks.
 const aft=L*design.cabinAft,front=L*design.cabinFront,cb=B*.35,deck=8,roof=design.roof,roofFront=front-(roof-deck)*.33,roofAft=aft+1;
 const glass=ctx.createLinearGradient(0,-30,10,0);glass.addColorStop(0,'#88b5c5');glass.addColorStop(.22,'#12202b');glass.addColorStop(.7,'#284b60');glass.addColorStop(1,'#7fa4b4');
 if(design.levels)path([[aft,cb,deck],[front,cb,deck],[roofFront,cb*.92,roof],[roofAft,cb*.92,roof]],glass,'#e5ebe5',.65);
 path([[front,-cb,deck],[front,cb,deck],[roofFront,cb*.92,roof],[roofFront,-cb*.92,roof]],glass,'#eef1e8',.8);
 trace([[aft,cb,deck+1],[front,cb,deck+1]],'#f3f1ea',2.3);
 if(design.levels){
  for(let n=1;n<4;n++){const u=aft+(front-aft)*n/4;trace([[u,cb,deck+2],[u-1,cb*.92,roof-1]],'#bac8c7',.7);}
  path([[roofAft,-cb*.97,roof],[roofFront,-cb*.97,roof],[roofFront,cb*.97,roof],[roofAft,cb*.97,roof]],gelcoat,'#ffffff',.9);
  for(let floor=1;floor<design.levels;floor++){
   const z=roof+floor*7,back=aft+floor*L*.035,nose=front-floor*L*.045,beam=cb*(1-floor*.11);
   path([[back,beam,z-6],[nose+2,beam,z-6],[nose,beam*.92,z],[back+2,beam*.92,z]],glass);
   path([[nose+2,-beam,z-6],[nose+2,beam,z-6],[nose,beam*.92,z],[nose,-beam*.92,z]],glass);
   path([[back,-beam,z],[nose,-beam,z],[nose,beam,z],[back,beam,z]],'#f0eee5','#ffffff',.8);
   trace([[back,beam,z-5],[nose+2,beam,z-5]],design.hull,1.8);
  }
 }
 if(design.canopy){
  for(const v of[-cb*.7,cb*.7])trace([[aft+3,v,roof],[aft+5,v,roof+9],[front-6,v,roof+9],[front-4,v,roof]],'#dce5e1',1.4);
  path([[aft+3,-cb*.8,roof+9],[front-4,-cb*.8,roof+9],[front-4,cb*.8,roof+9],[aft+3,cb*.8,roof+9]],'#24363e','#dbe4df');
 }
 // A swept radar arch creates a recognizable vertical silhouette.
 const archZ=roof+Math.max(0,design.levels-1)*7+2;
 if(design.levels){
 trace([[-L*.09,-cb*.8,roof],[-L*.12,-cb*.8,archZ+7],[-L*.12,cb*.8,archZ+7],[-L*.09,cb*.8,roof]],'#f4f4e9',1.8);
 trace([[-L*.12,0,archZ+7],[-L*.12,0,archZ+11]],'#d9e4df',.8);trace([[-L*.16,0,archZ+11],[-L*.08,0,archZ+11]],'#fffef1',1.8);
 }
 // Thin bow rails follow the sheer, supported by sparse vertical stanchions.
 for(const side of[port,starboard]){
  const rail=side.slice(18).map(([u,v,z])=>[u,v,z+3]);trace(rail,'#eaf2ee',.6);
  for(const n of[18,24,29]){const[u,v,z]=side[n];trace([[u,v,z],[u,v,z+3]],'#f3f6ef',.55);}
 }
 for(const n of[5,10,15,20,24]){const[u,v]=starboard[n];trace([[u-1,v*.91,4.3],[u+1,v*.91,4.3]],'#233e52',1.5);}
 if(design.pool){path([[L*.20,-B*.2,9],[L*.33,-B*.2,9],[L*.33,B*.2,9],[L*.20,B*.2,9]],'#439aaa','#f9f1d9',1.2);}
 if(design.helipad){const a=project([L*.30,0,9.7]);ctx.fillStyle='#8b928d';ctx.beginPath();ctx.ellipse(a.x,a.y,12,6,-.36,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ece7d5';ctx.lineWidth=.7;ctx.stroke();ctx.fillStyle='#f4efdb';ctx.textAlign='center';ctx.font='8px sans-serif';ctx.fillText('H',a.x,a.y+2);}
 ctx.restore();ctx.restore();
}
