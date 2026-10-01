import {ultraDuration} from './ultra.js';
import {lifeEnded} from './longevity.js';
import {drawSceneryArt} from './scenery-art.js';

// Use game time, so pausing, speed changes and restored saves share the same six-month cycle.
export function spaceportLaunch(s,phase=0){
 const item=s.ultra?.items?.launch;
 if(s.concept!=='rich-life'||!item?.complete||!item.position||lifeEnded(s))return null;
 const age=s.month-item.start-ultraDuration('launch',item);
 if(age<0)return null;
 const active=age>=6&&age%6===0;
 return{active,progress:active?Math.max(0,Math.min(1,Number.isFinite(phase)?phase:0)):0,nextIn:6-age%6};
}

export function drawLaunchRocket(ctx,front,width,zoom,flight){
 const p=flight?.active?flight.progress:0,launching=!!flight?.active;
 const rise=launching?Math.pow(Math.max(0,(p-.14)/.68),2)*520*zoom:0;
 const x=front.x,y=front.y-width*.30;
 ctx.save();
 if(launching&&p<.94){
  const fade=Math.min(1,p*12)*Math.min(1,(.94-p)*5);
  for(let i=0;i<12;i++){
   const spread=(10+p*55)*zoom,angle=i*2.4;
   ctx.fillStyle=`rgba(220,225,224,${fade*(.22+.12*(i%3))})`;
   ctx.beginPath();ctx.ellipse(x+Math.cos(angle)*spread,y+Math.sin(angle)*spread*.3,(8+p*16)*zoom,(5+p*7)*zoom,0,0,Math.PI*2);ctx.fill();
  }
  if(p<.82){
   const nozzle=y-rise,length=(18+12*Math.sin(p*170)**2)*zoom;
   ctx.fillStyle='#ff993bee';ctx.beginPath();ctx.moveTo(x-6*zoom,nozzle-2*zoom);ctx.lineTo(x,nozzle+length);ctx.lineTo(x+6*zoom,nozzle-2*zoom);ctx.closePath();ctx.fill();
   ctx.fillStyle='#fff5c8';ctx.beginPath();ctx.moveTo(x-3*zoom,nozzle);ctx.lineTo(x,nozzle+length*.65);ctx.lineTo(x+3*zoom,nozzle);ctx.closePath();ctx.fill();
  }
 }
 ctx.globalAlpha=launching?Math.max(0,Math.min(1,(.84-p)*12)):1;
 drawSceneryArt(ctx,'city/assets/ultra/launch-rocket.webp',{x,y:y-rise},width*.13,{maxHeight:width*.55});
 ctx.restore();
}
