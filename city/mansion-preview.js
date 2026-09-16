import {L} from './i18n.js';
import {sceneryArtURL} from './scenery-art.js';
import {mansionArtURL,mansionArtSize,estateArtURL} from './mansion-art.js';
// Facility plots [x, y, w, h] on the 650 × 460 site. Each keeps its picture's footprint proportions and stays clear of the walls, drive, cross path, terrace and the other plots.
export const ESTATE_PLOTS={garden:[40,120,145,145],golf:[494,24,110,153],helipad:[490,193,115,74],cinema:[74,302,158,120],pool:[305,312,155,105],spa:[492,308,120,120]};
// Where each facility picture meets the ground: the front corner's share of the width, then the left and right corners' share of the height.
const GROUND={garden:[.497,.533,.533],golf:[.418,.631,.486],helipad:[.608,.537,.702],cinema:[.568,.534,.66],pool:[.596,.497,.647],spa:[.497,.585,.579]};
// Architecture and selected facilities follow the current draft.
export function mansionSitePreview(d,{area,styleName}){
 const p=(x,y,z=0)=>[480+(x-y)*.84,100+(x+y)*.4-z];
 const points=vertices=>vertices.map(v=>p(...v).join(',')).join(' ');
 const poly=(v,fill,stroke='none',width=1)=>`<polygon points="${points(v)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
 const line=(a,b,stroke,width=1)=>`<polyline points="${points([a,b])}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
 const tile=(x,y,w,h,fill,z=0,stroke='none')=>poly([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],fill,stroke);
 const box=(x,y,w,h,z,top,front,side,bottom=0)=>tile(x,y,w,h,top,z)+poly([[x,y+h,bottom],[x+w,y+h,bottom],[x+w,y+h,z],[x,y+h,z]],front)+poly([[x+w,y,bottom],[x+w,y+h,bottom],[x+w,y+h,z],[x+w,y,z]],side);
 const tree=(x,y,r=12,blossom=false)=>{const [cx,cy]=p(x,y);return `<ellipse cx="${cx+7}" cy="${cy+3}" rx="${r+8}" ry="7" fill="#34584720"/><image href="${sceneryArtURL(blossom?'tree-plane':'tree-oak')}" x="${cx-r*1.25}" y="${cy-r*4.2}" width="${r*2.5}" height="${r*4.2}" preserveAspectRatio="xMidYMax meet"/>`;};
 // Facility pictures are drawn with a slightly steeper camera than the site, so each one is pinned by its own ground corners to its plot's corners and every edge runs along the paths.
 const plot=(key,url)=>{const [x,y,w,h]=ESTATE_PLOTS[key],[front,left,right]=GROUND[key],[fx,fy]=p(x+w,y+h),width=(w+h)*.84,height=(w+h)*.4/(2-left-right);return `<image href="${url}" x="${fx-front*width}" y="${fy-height}" width="${width}" height="${height}" preserveAspectRatio="none"/>`;};
 // The generated house stands on its plot keeping the picture's own proportions.
 const art=(url,[iw,ih],x,y,w,h)=>{const [cx]=p(x+w/2,y+h/2),[,bottom]=p(x+w,y+h),width=(w+h)*.84,height=width*ih/iw;return `<image href="${url}" x="${cx-width/2}" y="${bottom-height}" width="${width}" height="${height}"/>`;};
 const lamp=(x,y)=>{const [cx,cy]=p(x,y,13);return line([x,y,1],[x,y,12],'#88775e',2)+`<circle cx="${cx}" cy="${cy}" r="7" fill="#ffe3a8" opacity=".18"/><circle cx="${cx}" cy="${cy}" r="3" fill="#fff2c4" stroke="#b6a075" stroke-width=".6"/>`;};
 const label=(key,name,x,y)=>{const [cx,cy]=p(x,y);return `<g class="site-label" data-site-label="${key}" aria-label="${name}" transform="translate(${cx} ${cy})"><circle r="11"/><text text-anchor="middle" y="4">${Object.keys(names).indexOf(key)+1}</text></g>`;};
 const facility=(key,content)=>d[key]?`<g data-facility="${key}">${content}</g>`:'';
 const names={pool:L('Pool'),garden:L('Landscaped garden'),cinema:L('Cinema'),golf:L('Golf course'),spa:L('Wellness spa'),helipad:L('Helipad')};
 const selected=Object.keys(names).filter(k=>d[k]);
 let scene=box(-7,-7,664,474,-5,'#ece6d5','#c3c9b6','#d7d7c4',-19)+box(0,0,650,460,0,'url(#estate-ground)','#8daa89','#a7bea0',-5);
 // Gravel perimeter, entrance drive, and the main residence's stone terrace.
 scene+=tile(12,12,626,436,'#e8e3cf')+tile(19,19,612,422,'url(#estate-lawn)')+tile(257,22,32,420,'#f0e9da')+tile(55,272,565,18,'#f0e9da')+tile(213,126,250,164,'#f1e9da',2);
 // Fine stone joints, a low garden wall, and tiny warm path lights.
 for(let y=32;y<435;y+=17)scene+=line([260,y,1],[286,y,1],'#d5cfbc',.7);
 for(let i=0;i<9;i++)scene+=tile(20+i*69,20,34,419,'#ffffff06',.3);
 scene+=box(16,16,616,5,9,'#e9e2cd','#c9ccb5','#b6c4a9')+box(16,16,5,420,9,'#eee7d3','#c8cdb4','#b7c5aa');
 for(let yy=56;yy<435;yy+=66)scene+=lamp(295,yy);
 for(let xx=52;xx<630;xx+=88)scene+=lamp(xx,291);
 // Amenities are painted from back to front to preserve depth.
 scene+=facility('garden',plot('garden',sceneryArtURL('estate-garden')));
 // The house is generated art for the style, height band and exterior color; floor area sets its footprint.
 const w=174+Math.min(56,(area-120)/25),depth=109+Math.min(25,(area-120)/60),x=335-w/2,y=139;
 scene+=poly([[x+14,y+depth+8,1],[x+w+46,y+depth+8,1],[x+w+53,y+14,1],[x+w,y,1]],'#30432c35');
 scene+=`<g data-site-building="${d.style}" data-floors="${d.floors}" data-color="${d.color}">${art(mansionArtURL(d),mansionArtSize(d),x,y,w,depth)}</g>`;
 // The golf course and helipad share the right wing beside the house, where even a ten-storey tower cannot hide them.
 scene+=facility('golf',plot('golf',estateArtURL('golf')));
 scene+=facility('cinema',plot('cinema',estateArtURL('cinema')));
 scene+=facility('pool',plot('pool',sceneryArtURL('estate-pool')));
 scene+=facility('helipad',plot('helipad',estateArtURL('helipad')));
 scene+=facility('spa',plot('spa',estateArtURL('spa')));
 // Labels occupy the front edge of their corresponding plots.
 const spots={helipad:[617,230],golf:[616,100],garden:[112,270],cinema:[153,436],pool:[382,438],spa:[552,438]};
 if(d.garden){
  let border='';
  for(const [tx,ty,r,pink]of [[42,423,16,true],[26,438,12,false],[636,168,16,true],[636,292,13,false],[357,33,17,false],[427,32,15,true]])border+=tree(tx,ty,r,pink);
  scene+=`<g data-garden-detail="border">${border}</g>`;
 }
 scene+=selected.map(key=>label(key,names[key],...spots[key])).join('');
 const description=L`${styleName} · ${d.floors} floors · ${d.rooms} rooms · ${selected.length?selected.map(k=>names[k]).join(', '):L('No extra facilities')}`;
 return L`<section class="estate-live-model" aria-label="Rendering with your selected facilities"><header><div><span>MAISON MINIATURE · YOUR PRIVATE WORLD</span><h3>A little world, a home all your own.</h3></div><b>${selected.length} facilities</b></header><svg viewBox="0 20 1050 580" role="img" aria-label="${description}" class="estate-site-art"><defs><linearGradient id="estate-lawn" x2=".5" y2="1"><stop stop-color="#bad4ac"/><stop offset="1" stop-color="#91bb94"/></linearGradient><radialGradient id="estate-blossom" cx=".3" cy=".25" r=".8"><stop stop-color="#fae1dc"/><stop offset=".5" stop-color="#e9bdbb"/><stop offset="1" stop-color="#cc999f"/></radialGradient><filter id="estate-soft-shadow" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="12"/></filter><linearGradient id="estate-ground" x2=".3" y2="1"><stop stop-color="#c5dabc"/><stop offset="1" stop-color="#a4c2a0"/></linearGradient><linearGradient id="estate-water" x2=".6" y2="1"><stop stop-color="#b2eae0"/><stop offset=".4" stop-color="#72cfd3"/><stop offset="1" stop-color="#49adbe"/></linearGradient><linearGradient id="estate-glass" x2="1" y2="1"><stop stop-color="#fff0c8"/><stop offset=".5" stop-color="#b5d6d8"/><stop offset="1" stop-color="#79a9b8"/></linearGradient><radialGradient id="estate-tree" cx=".3" cy=".25" r=".8"><stop stop-color="#b3d5a5"/><stop offset="1" stop-color="#6b9e7d"/></radialGradient><radialGradient id="estate-backdrop"><stop stop-color="#fff9f0"/><stop offset="1" stop-color="#f2eae1"/></radialGradient></defs><rect width="1050" height="600" fill="url(#estate-backdrop)"/><ellipse cx="560" cy="455" rx="354" ry="93" fill="#69796535" filter="url(#estate-soft-shadow)"/>${scene}<text x="42" y="551" class="site-orientation">N ↗</text><text x="42" y="574" class="site-footnote">PRIVATE RESIDENCE / CONCEPT PLAN</text></svg><div class="site-legend">${selected.map(key=>`<span><i>${Object.keys(names).indexOf(key)+1}</i>${names[key]}</span>`).join('')||L('<span>Pick facilities to fill in your own scene.</span>')}</div><p>Selecting or removing a facility updates the view instantly. The cinema and spa are drawn as cutaways showing the interior.</p></section>`;
}
