import {L} from './i18n.js';
import {SIZE,coords,neighbors,TYPES,footprintCells,mapOffset,buildingName} from './engine.js';
import {flexState} from './flex.js';
import {selectedModel} from './luxury-models.js';
import {drawMapCar} from './map-vehicles.js';
import {drawPersonArt,walkerLook,PERSON_HEIGHT} from './people-art.js';
import {reducedMotion} from './motion.js';
// Visual agents follow the actual road graph. Their visits illustrate demand;
// financial settlement remains exclusively in the economic engine.
export function createWorldLife(ctx,screen,box,circle,line,getState,getAnalysis,getAssetTop=()=>null){
 let actors=[],roads=[],previousState=null,previousSize=0,last=0,buckets=new Map(),particles=[],clock=0,hero=null;
 function route(from,to){if(from===to)return[from];const seen=new Map([[from,null]]),q=[from];for(let k=0;k<q.length;k++){for(const n of neighbors(q[k])){if(seen.has(n)||getState().tiles[n].type!=='road')continue;seen.set(n,q[k]);q.push(n);if(n===to){const path=[n];while(seen.get(path[0])!==null)path.unshift(seen.get(path[0]));return path;}}}return[from];}
 function roadAt(i){return footprintCells(i,getState().tiles[i].footprint).flatMap(neighbors).find(n=>getState().tiles[n].type==='road')??roads[0];}
 function destination(actor){
  const owned=getAnalysis().owned.filter(({t})=>TYPES[t.type]?.group==='business');
  const pick=owned.length&&actor.id%3!==0?owned[(actor.id+actor.trips)%owned.length].i:null;
  actor.target=pick;const end=pick===null?roads[(actor.id*31+actor.trips*47)%roads.length]:roadAt(pick);
  const from=Math.round(actor.y)*SIZE+Math.round(actor.x);actor.path=route(from,end);actor.step=0;actor.trips++;
 }
 const homeRoad=()=>(9+mapOffset(getState()))*(SIZE+1);
 function reset(){previousState=getState();previousSize=getState().tiles.length;roads=[...getAnalysis().connected];actors=[];particles=[];for(let n=0;n<34;n++){const i=roads[n*13%roads.length],p=coords(i),a={id:n,x:p.x,y:p.y,path:[i],step:0,trips:0,wait:0,car:n%7===0,color:['#d88264','#e4bb5d','#598c91','#b68aae','#687d5a'][n%5]};destination(a);actors.push(a);}const p=coords(roadAt(homeRoad()));hero={id:100,x:p.x,y:p.y,path:[],step:0,color:'#ee986d',wait:0};actors.push(hero);}
 function update(time){if(previousState!==getState()||previousSize!==getState().tiles.length)reset();if(roads.length!==getAnalysis().connected.size)roads=[...getAnalysis().connected];const dt=Math.min(.06,(time-last)/1000||0);last=time;clock=time;buckets=new Map();
  for(const a of actors){if(!reducedMotion()){if(a.wait>0)a.wait-=dt;else if(a.step<a.path.length-1){const dest=coords(a.path[a.step+1]),dx=dest.x-a.x,dy=dest.y-a.y,d=Math.hypot(dx,dy),move=dt*(a.car?2.4:a===hero?2.8:1.05);if(d<=move){a.x=dest.x;a.y=dest.y;a.step++;}else{a.x+=dx/d*move;a.y+=dy/d*move;}}else if(a!==hero){a.wait=1+(a.id%4)*.35;destination(a);}}
   const i=Math.floor(a.y+.5)*SIZE+Math.floor(a.x+.5);if(!buckets.has(i))buckets.set(i,[]);buckets.get(i).push(a);
  }
  particles=particles.filter(p=>time-p.start<p.life);
 }
 function person(a,time){const moving=a.step<a.path.length-1,bob=moving?Math.sin(time*.013+a.id)*1.1:0;
  const next=a.path[a.step+1];if(next!==undefined){const dest=coords(next);a.heading=Math.abs(dest.x-a.x)>.01?(dest.x>a.x?1:-1):(dest.y>a.y?2:-2);}
  const driving=a.car||(a===hero&&flexState(getState()).owned.includes('sportscar'));
  // Walkers keep to the pavement strip along the tile edge (the asphalt is inset .1); cars stay in the lane.
  const side=a.id%2?.42:-.42,lane=driving?[0,0]:Math.abs(a.heading||1)===1?[0,side]:[side,0];
  a.ox=(a.ox??lane[0])+(lane[0]-(a.ox??lane[0]))*.12;a.oy=(a.oy??lane[1])+(lane[1]-(a.oy??lane[1]))*.12;
  const x=a.x+.5+a.ox,y=a.y+.5+a.oy;
  if(driving&&a===hero){const model=selectedModel(getState(),'sportscar');drawMapCar(ctx,screen,x,y,model,a.heading||1);const p=screen(x,y,29);ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#765322';ctx.fillText('✦ '+model.name,p.x,p.y);return;}
  if(a.car){drawMapCar(ctx,screen,x,y,{color:a.color,length:.7},a.heading||1);return;}
  // People stay small against the building sprites; the primitive figure only covers the sprite download.
  const height=a===hero?PERSON_HEIGHT.hero:PERSON_HEIGHT.walker,base=screen(x,y),unit=screen(x+1,y),zoom=Math.hypot(unit.x-base.x,unit.y-base.y)/Math.hypot(28,14);
  if(!drawPersonArt(ctx,base,zoom,a===hero?'hero':walkerLook(a.id),a.heading||1,{bob,height})){
   const z=height/19,step=moving?Math.sin(time*.016+a.id)*.05:0;
   circle(base,2.7*z,'#203c3330');line(screen(x-step,y,1),screen(x,y,6*z+bob),'#3e535c',1.6*z);line(screen(x+step,y,1),screen(x,y,6*z+bob),'#3e535c',1.6*z);
   line(screen(x,y,6*z+bob),screen(x,y,12*z+bob),a.color,4*z);circle(screen(x,y,15*z+bob),2.5*z,'#edc59d');circle(screen(x-.01,y,17*z+bob),2.1*z,'#5d5449');
  }
  if(a===hero){const p=screen(x,y,height+13);ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#264a3b';ctx.fillText(L('Me'),p.x,p.y);}
 }
 function drawTile(i,time){const here=buckets.get(i);if(!here)return false;for(const a of here)person(a,time);return true;}
 function drawFront(time,phase=0){
  const dusk=Math.max(0,Math.sin(phase*Math.PI))*0.19;
  if(dusk>0){ctx.fillStyle=`rgba(64,58,108,${dusk})`;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);}
  const owned=getAnalysis().owned;
  for(const{t,i}of owned){const{x,y}=coords(i),r=getAnalysis().reports[i];if(!r||t.type==='plot')continue;const p=getAssetTop(i)||(['golf','resort'].includes(t.type)?screen(x+(t.footprint?.width||1)/2,y+(t.footprint?.height||1)/2,t.type==='golf'?32:43):screen(x+.5,y+.5,57+t.level*10)),pulse=reducedMotion()?1:.7+Math.sin(time*.003+i)*.3;
   if(dusk>.06){const glow=ctx.createRadialGradient(p.x,p.y+20,1,p.x,p.y+20,34);glow.addColorStop(0,'#ffe4a55c');glow.addColorStop(1,'#ffe4a500');ctx.fillStyle=glow;ctx.fillRect(p.x-34,p.y-15,68,70);}
   ctx.font='bold 9px sans-serif';ctx.textAlign='center';const label=buildingName(t)+' · '+(t.type==='atelier'?L('Creative +15%'):r.profit>=0?L('Profitable'):L('Needs attention')),width=ctx.measureText(label).width+16;ctx.fillStyle=t.type==='atelier'||r.profit>=0?'#284d42e8':'#954f44e8';ctx.beginPath();ctx.roundRect(p.x-width/2,p.y-10,width,19,5);ctx.fill();ctx.fillStyle='#fff6d9';ctx.fillText(label,p.x,p.y+3);
   if(!reducedMotion()&&TYPES[t.type].group==='business'){const cycle=(time/1000+i*.17)%5;if(cycle<2){const q=screen(x+.6,y+.5,78+t.level*10+cycle*12);ctx.globalAlpha=Math.min(1,2-cycle);ctx.fillStyle='#426e4b';ctx.font='bold 11px sans-serif';ctx.fillText(r.demand>85?L('♥ Be back soon!'):r.demand>55?L('To go, please'):L('Waiting for customers'),q.x,q.y);ctx.globalAlpha=1;}}
  }
  for(const p of particles){const age=(time-p.start)/p.life,center=screen(p.x,p.y,35),dx=p.dx*age,dy=p.dy*age+50*age*age;ctx.globalAlpha=1-age;if(p.text){ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillStyle=p.color;ctx.fillText(p.text,center.x,center.y-age*65);}else{ctx.fillStyle=p.color;ctx.fillRect(center.x+dx,center.y+dy,4,6);}ctx.globalAlpha=1;}
  // A flock moves across the open river, away from interactive controls.
  if(!reducedMotion()){for(let n=0;n<4;n++){const pos=((time*.000035+n*.08)%1),o=mapOffset(getState()),p=screen(o+21+Math.sin(pos*6)*.5,o+2+pos*20,70+n*3);line({x:p.x-4,y:p.y+Math.sin(time*.007)*2},p,'#64828c',1);line(p,{x:p.x+4,y:p.y+Math.sin(time*.007)*2},'#64828c',1);}}
 }
 function burst(i,text,kind='build'){if(i<0)i=homeRoad();const{x,y}=coords(i);particles.push({x,y,start:clock,life:2400,text,color:kind==='loss'?'#b95249':'#376b49'});if(!reducedMotion())for(let n=0;n<30;n++)particles.push({x,y,start:clock,life:1300+n%5*150,dx:Math.sin(n*2.4)*(35+n),dy:-20-Math.cos(n*1.5)*55,color:['#efc965','#ed9e75','#8dc38d','#92c9d2'][n%4]});}
 function visit(i){if(!hero)reset();const start=roads.reduce((best,n)=>{const p=coords(n),q=coords(best);return Math.hypot(p.x-hero.x,p.y-hero.y)<Math.hypot(q.x-hero.x,q.y-hero.y)?n:best;},roads[0]);const p=coords(start);hero.x=p.x;hero.y=p.y;hero.path=route(start,roadAt(i));hero.step=0;}
 return{update,drawTile,drawFront,burst,visit};
}
