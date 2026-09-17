// Pedestrian sprites generated for the map (city/assets/people). Walkers cycle through six looks; the player has a distinct hero look.
export const WALKERS=Object.freeze(['walker-1','walker-2','walker-3','walker-4','walker-5','walker-6']);
export const PEOPLE=Object.freeze([...WALKERS,'hero']);
// Heights at map zoom 1, kept small against the building sprites (a home is 58px, a café 48px).
export const PERSON_HEIGHT=Object.freeze({walker:13,hero:15});
const images=new Map();
export function peopleArtURL(id,view='front'){
 return PEOPLE.includes(id)&&['front','rear'].includes(view)?`city/assets/people/${id}-${view}.webp`:null;
}
export const walkerLook=n=>WALKERS[Math.abs(n)%WALKERS.length];
// Headings follow world-life's road coordinates: +x SE, -x NW, +y SW, -y NE. Front faces SE; rear faces NE; mirroring supplies SW and NW.
export function personArtView(heading){return{view:heading<0?'rear':'front',mirror:heading===2||heading===-1};}
function picture(url){
 if(!url||typeof Image==='undefined')return null;
 if(!images.has(url)){const image=new Image();images.set(url,image);image.src=url;}
 const image=images.get(url);return image.complete&&image.naturalWidth?image:null;
}
// Draws one pedestrian with its feet at p; returns false until the sprite has loaded so the caller can fall back.
export function drawPersonArt(ctx,p,zoom,id,heading,{bob=0,height=PERSON_HEIGHT.walker}={}){
 const orientation=personArtView(heading||1);
 // Warm both views so a turn at a junction does not wait for another download.
 const front=picture(peopleArtURL(id)),rear=picture(peopleArtURL(id,'rear'));
 const image=orientation.view==='front'?front:rear;if(!image)return false;
 const h=height*zoom,w=h*image.naturalWidth/image.naturalHeight;
 ctx.save();ctx.translate(p.x,p.y);
 ctx.fillStyle='#203c3330';ctx.beginPath();ctx.ellipse(0,0,w*.55,w*.22,0,0,Math.PI*2);ctx.fill();
 if(orientation.mirror)ctx.scale(-1,1);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,-w/2,-h-bob*zoom,w,h);ctx.restore();return true;
}
