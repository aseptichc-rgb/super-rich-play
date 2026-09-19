// Billboard creatives shown on the map. Every billboard carries the mediwork AI logo, which replaced the placeholder brands.
// To add an advertiser, add an entry with `logo:'city/assets/billboards/<file>.png'`. The logo is fitted inside the panel
// on the entry's background color; the name is drawn only while there is no logo.
export const BILLBOARD_ADS=[
 {name:'mediwork AI',color:'#ffffff',ink:'#111111',logo:'city/assets/billboards/mediwork-ai.png'}
];
// Each building keeps one advertiser, picked by its tile index, so saves need no ad data.
export const billboardAd=i=>BILLBOARD_ADS[i%BILLBOARD_ADS.length];
const images=new Map();
// p is the ground point under the panel's center. Returns false while a logo is still loading.
export function drawBillboard(ctx,ad,p,zoom){
 const w=30*zoom,h=15*zoom,x=p.x-w/2,y=p.y-10*zoom-h,frame=1.5*zoom;
 ctx.save();
 ctx.fillStyle='#4a5358';for(const dx of[.22,.78])ctx.fillRect(x+w*dx-zoom,y+h,2*zoom,10*zoom);
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
