// Fictional advertisers for building billboards. The river display is drawn separately in render.js.
// Logos are fitted inside the panel; the name is used when images are unavailable.
export const BILLBOARD_ADS=[
 {name:'NOVA',color:'#152d65',ink:'#f9dd60',logo:'city/assets/billboards/nova-energy.svg'},
 {name:'ORBIT',color:'#502b7c',ink:'#fff3fb',logo:'city/assets/billboards/orbit-mobile.svg'},
 {name:'MORI',color:'#164e40',ink:'#f4edcd',logo:'city/assets/billboards/mori-market.svg'},
 {name:'BLOOM',color:'#8d3548',ink:'#fff1db',logo:'city/assets/billboards/bloom-coffee.svg'},
 {name:'AERO',color:'#dd6339',ink:'#fff8e7',logo:'city/assets/billboards/aero-delivery.svg'},
 {name:'LUMA',color:'#f2d77d',ink:'#263e51',logo:'city/assets/billboards/luma-living.svg'}
];
// Each building keeps one advertiser, picked by its tile index, so saves need no ad data.
export const billboardAd=i=>BILLBOARD_ADS[i%BILLBOARD_ADS.length];
// Deterministic formats need no save migration. Keep the format independent of the advertiser.
export function billboardLayout(i,t){
 const f=t.footprint||{width:1,height:1},size=Math.min(1.35,.85+.1*(f.width+f.height-2));
 const kind=['roadside','rooftop','pylon'][(i+Math.floor(i/3))%3];
 const [width,height,posts]=kind==='rooftop'?[40,18,5]:kind==='pylon'?[64,28,26]:[30,15,10];
 return{kind,width:width*size,height:height*size,posts:posts*size};
}
const images=new Map();
// p is the support base (ground or rooftop). Returns false while a logo is still loading.
export function drawBillboard(ctx,ad,p,zoom,layout={width:30,height:15,posts:10}){
 const w=layout.width*zoom,h=layout.height*zoom,posts=layout.posts*zoom,x=p.x-w/2,y=p.y-posts-h,frame=1.5*zoom;
 ctx.save();
 ctx.fillStyle='#4a5358';for(const dx of[.22,.78])ctx.fillRect(x+w*dx-zoom,y+h,2*zoom,posts);
 if(layout.kind==='pylon'){
  ctx.fillStyle='#86908d';for(const dx of[.22,.78])ctx.fillRect(x+w*dx-4*zoom,p.y-2*zoom,8*zoom,3*zoom);
  ctx.fillStyle='#65716f';ctx.fillRect(x+w*.16,y+h+posts*.45,w*.68,2*zoom);
 }
 ctx.fillStyle='#2b3236';ctx.fillRect(x-frame,y-frame,w+frame*2,h+frame*2);
 ctx.fillStyle=ad.color;ctx.fillRect(x,y,w,h);
 let ready=true;
 if(ad.logo&&typeof Image!=='undefined'){
  let im=images.get(ad.logo);if(!im){im=new Image();im.src=ad.logo;images.set(ad.logo,im);}
  ready=im.complete;
  if(im.complete&&im.naturalWidth){const scale=Math.min(w*.9/im.naturalWidth,h*.84/im.naturalHeight),iw=im.naturalWidth*scale,ih=im.naturalHeight*scale;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,p.x-iw/2,y+(h-ih)/2,iw,ih);}
 }else{ctx.fillStyle=ad.ink;ctx.font=`bold ${7*zoom}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ad.name,p.x,y+h/2+.5*zoom,w*.9);}
 ctx.restore();
 return ready;
}
