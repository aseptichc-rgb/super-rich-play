// The renderer and mountain attractions share this deterministic terrain surface.
export function mountainCorners(s,x,y){
 const size=Math.sqrt(s.tiles.length),offset=s.mapOffset||0;
 const rock=(a,b)=>a>=0&&b>=0&&a<size&&b<size&&s.tiles[b*size+a].terrain==='mountain';
 const rise=(a,b)=>{
  if(!rock(a-1,b-1)||!rock(a,b-1)||!rock(a-1,b)||!rock(a,b))return 0;
  let nearby=0;for(let yy=b-2;yy<=b+1;yy++)for(let xx=a-2;xx<=a+1;xx++)if(rock(xx,yy))nearby++;
  const wx=a-offset,wy=b-offset,ridge=.82+.32*Math.sin(wx*.63+wy*.24)+.2*Math.cos(wy*.71-wx*.18);
  return nearby*3.5*ridge;
 };
 return [rise(x,y),rise(x+1,y),rise(x+1,y+1),rise(x,y+1)];
}
export function mountainElevation(s,x,y,u=.5,v=.5,z=mountainCorners(s,x,y)){
 const offset=s.mapOffset||0,bump=2+(((x-offset)*11+(y-offset)*5)%3+3)%3;
 return z[0]*(1-u)*(1-v)+z[1]*u*(1-v)+z[2]*u*v+z[3]*(1-u)*v+bump*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
}
// Decorative terminals follow a free downhill mountain surface; no land or save data is changed.
export function cablecarStations(s,x,y){
 const size=Math.sqrt(s.tiles.length),upper={x:x+.5,y:y+.5,z:mountainElevation(s,x,y)};
 let lower=null,best=0;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const xx=x+dx,yy=y+dy,t=s.tiles[yy*size+xx];
  if(xx<0||yy<0||xx>=size||yy>=size||!t||t.terrain!=='mountain'||t.type||t.owner||!dx&&!dy)continue;
  const z=mountainElevation(s,xx,yy),distance=Math.hypot((dx-dy)*28,(dx+dy)*14-(z-upper.z));
  if(z>upper.z||distance<70)continue;
  const score=upper.z-z+distance*.3;if(score>best){best=score;lower={x:xx+.5,y:yy+.5,z};}
 }
 if(lower)return [lower,upper];
 return [[.06,.94],[.94,.06]].map(([u,v])=>({x:x+u,y:y+v,z:mountainElevation(s,x,y,u,v)})).sort((a,b)=>a.z-b.z);
}
