const CARS=['roadster','sunset','gt','super','hyper','commuter'],YACHTS=['small','medium','riverside','super','mega'];
const images=new Map();
export function vehicleArtURL(kind,id,view='front'){
 if(kind==='sportscar'&&CARS.includes(id)&&['front','rear'].includes(view))return `city/assets/vehicles/car-${id}-${view}.webp`;
 if(kind==='yacht'&&YACHTS.includes(id))return `city/assets/vehicles/yacht-${id}.webp`;
 return null;
}
// Headings follow world-life's road coordinates: +x SE, -x NW, +y SW, -y NE.
export function carArtView(heading){return{view:heading<0?'rear':'front',mirror:heading===2||heading===-1};}
function picture(url){
 if(!url||typeof Image==='undefined')return null;
 if(!images.has(url)){const image=new Image();images.set(url,image);image.src=url;}
 const image=images.get(url);return image.complete&&image.naturalWidth?image:null;
}
export function drawCarArt(ctx,p,scale,model,design,heading){
 const id=CARS.includes(model.id)?model.id:'commuter',orientation=carArtView(heading);
 // Warm both angles so a road turn does not wait for another image download.
 const front=picture(vehicleArtURL('sportscar',id)),rear=picture(vehicleArtURL('sportscar',id,'rear'));
 const image=orientation.view==='front'?front:rear;if(!image)return false;
 const width=design.length*.92+design.width*.7,height=width*image.naturalHeight/image.naturalWidth;
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
 if(orientation.mirror)ctx.scale(-1,1);
 ctx.fillStyle='#102c3540';ctx.beginPath();ctx.ellipse(0,2,width*.42,design.width*.38,orientation.view==='front'?.46:-.46,0,Math.PI*2);ctx.fill();
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,-width/2,-height*.68,width,height);ctx.restore();return true;
}
export function drawYachtArt(ctx,p,scale,model,design,time){
 const image=picture(vehicleArtURL('yacht',model.id));if(!image)return false;
 const width=design.length*.93+design.beam*.5,height=width*image.naturalHeight/image.naturalWidth;
 const bottom=design.length*.18+design.beam*.24,bob=Math.sin(time*.0009)*.45,roll=Math.sin(time*.0007)*.012;
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 // A shallow reflection and ripples anchor the transparent hull on the river.
 ctx.save();ctx.globalAlpha*=.12;ctx.translate(0,8);ctx.scale(1,-.25);ctx.drawImage(image,-width/2,-height+bottom,width,height);ctx.restore();
 ctx.fillStyle='#103c4b35';ctx.beginPath();ctx.ellipse(0,3,width*.43,design.beam*.36,-.46,0,Math.PI*2);ctx.fill();
 for(let n=0;n<2;n++){ctx.strokeStyle=n?'#d4eeeb32':'#d4eeeb65';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(0,3,width*(.46+n*.025),design.beam*(.42+n*.12)+Math.sin(time*.001+n)*.5,-.46,0,Math.PI*2);ctx.stroke();}
 ctx.translate(0,bob);ctx.rotate(roll);ctx.drawImage(image,-width/2,-height+bottom,width,height);ctx.restore();
 return{top:{x:p.x,y:p.y+(-height+bottom+bob-12)*scale}};
}
