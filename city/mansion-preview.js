// A deterministic architectural model: every facility is drawn from the draft.
export function mansionSitePreview(d,{area,color,styleName}){
 const p=(x,y,z=0)=>[480+(x-y)*.84,100+(x+y)*.4-z];
 const points=vertices=>vertices.map(v=>p(...v).join(',')).join(' ');
 const poly=(v,fill,stroke='none',width=1)=>`<polygon points="${points(v)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
 const line=(a,b,stroke,width=1)=>`<polyline points="${points([a,b])}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
 const tile=(x,y,w,h,fill,z=0,stroke='none')=>poly([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],fill,stroke);
 const box=(x,y,w,h,z,top,front,side,bottom=0)=>tile(x,y,w,h,top,z)+poly([[x,y+h,bottom],[x+w,y+h,bottom],[x+w,y+h,z],[x,y+h,z]],front)+poly([[x+w,y,bottom],[x+w,y+h,bottom],[x+w,y+h,z],[x+w,y,z]],side);
 const ellipse=(x,y,rx,ry,fill,z=0)=>{const [cx,cy]=p(x,y,z);return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;};
 const tree=(x,y,r=12,blossom=false)=>{const [cx,cy]=p(x,y);return `<ellipse cx="${cx+7}" cy="${cy+3}" rx="${r+8}" ry="7" fill="#34584720"/><path d="M${cx} ${cy}v-23m0 9-6-8m6 3 6-9" stroke="#a28a6a" stroke-width="3" stroke-linecap="round"/><g fill="${blossom?'url(#estate-blossom)':'url(#estate-tree)'}"><circle cx="${cx}" cy="${cy-28}" r="${r}"/><circle cx="${cx-r*.6}" cy="${cy-23}" r="${r*.75}"/><circle cx="${cx+r*.65}" cy="${cy-24}" r="${r*.72}"/><circle cx="${cx-2}" cy="${cy-36}" r="${r*.65}"/></g><circle cx="${cx-5}" cy="${cy-34}" r="${r*.43}" fill="#fff9dd" opacity=".2"/>`;};
 const parasol=(x,y)=>{const [cx,cy]=p(x,y,25);return line([x,y,3],[x,y,25],'#bca583',2)+`<path d="M${cx-19} ${cy}q19-22 38 0l-9 4-10-3-10 3Z" fill="#fff2d5" stroke="#dfcbab" stroke-width="1"/><path d="M${cx} ${cy-10}v11m0-11-10 14m10-14 10 14" stroke="#e0cbb0" fill="none"/>`;};
 const lamp=(x,y)=>{const [cx,cy]=p(x,y,13);return line([x,y,1],[x,y,12],'#88775e',2)+`<circle cx="${cx}" cy="${cy}" r="7" fill="#ffe3a8" opacity=".18"/><circle cx="${cx}" cy="${cy}" r="3" fill="#fff2c4" stroke="#b6a075" stroke-width=".6"/>`;};
 const label=(key,name,x,y)=>{const [cx,cy]=p(x,y);return `<g class="site-label" data-site-label="${key}" aria-label="${name}" transform="translate(${cx} ${cy})"><circle r="11"/><text text-anchor="middle" y="4">${Object.keys(names).indexOf(key)+1}</text></g>`;};
 const facility=(key,content)=>d[key]?`<g data-facility="${key}">${content}</g>`:'';
 const names={pool:'Pool',garden:'Landscaped garden',cinema:'Cinema',golf:'Golf course',spa:'Wellness spa',helipad:'Helipad'};
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
 // Rear amenities are painted first to preserve depth.
 scene+=facility('helipad',box(46,23,155,92,3,'#eee8d7','#bec6b2','#ccd0be')+tile(52,29,143,80,'#829c97',4)+
  poly([[123,33,3],[179,68,3],[123,103,3],[67,68,3]],'none','#e6dfb4',2)+
  line([108,52,5],[108,84,5],'#fff4d7',5)+line([138,52,5],[138,84,5],'#fff4d7',5)+line([108,68,5],[138,68,5],'#fff4d7',5)+[62,186].map(xx=>lamp(xx,35)+lamp(xx,99)).join(''));
 scene+=facility('golf',tile(477,22,145,177,'#71945c',1)+
  poly([[489,37,2],[568,35,2],[609,84,2],[599,160,2],[558,188,2],[504,166,2],[516,95,2]],'#a3bf76')+
  ellipse(565,76,27,11,'#e3d7b0',3)+ellipse(545,143,30,13,'#84ac62',3)+
  line([551,141,3],[551,141,33],'#faf4d8',2)+poly([[551,141,33],[570,141,28],[551,141,23]],'#bb7451'));
 if(d.garden){
  let garden=tile(35,134,159,111,'#efe4d5',1);
  for(const [x,y]of [[43,142],[126,142],[43,201],[126,201]]){
   garden+=box(x,y,60,33,7,'#91b887','#6f9b70','#83aa7a')+tile(x+6,y+5,48,23,'#bace9c',8);
   for(let n=0;n<8;n++)garden+=ellipse(x+10+(n%4)*13,y+9+Math.floor(n/4)*13,4,3,['#e9b7b2','#efe0c0','#d1c1df'][n%3],10);
  }
  garden+=ellipse(114,191,20,10,'#d3c9b2',3)+ellipse(114,191,18,9,'#fff2d7',5)+ellipse(114,191,14,7,'#91cfc6',6)+ellipse(114,191,7,3,'#e9e2c9',15)+line([114,191,6],[114,191,23],'#effff3',2);
  for(const [tx,ty,blossom]of [[32,127,true],[194,126,false],[29,243,false],[199,242,true],[37,65,false],[226,39,true]])garden+=tree(tx,ty,17,blossom);
  garden+=box(44,180,37,10,8,'#bda184','#ad8f73','#927961')+box(44,180,37,3,17,'#d8bea0','#b7a087','#9b856c',8);
  scene+=facility('garden',garden);
 }
 // House massing responds to floor area, floor count, facade, and roof.
 const w=174+Math.min(56,(area-120)/25),depth=109+Math.min(25,(area-120)/60),x=335-w/2,y=139,height=12+d.floors*23,roof=d.style==='resort'?'#bb927b':d.style==='classic'?'#687a85':'#637b7a';
 scene+=poly([[x+14,y+depth+8,1],[x+w+46,y+depth+8,1],[x+w+53,y+14,1],[x+w,y,1]],'#30432c35');
 scene+=`<g data-site-building="${d.style}" data-floors="${d.floors}">`;
 // Stone plinth, generous glazing, and visible facade layers.
 scene+=box(x-3,y-3,w+6,depth+6,5,'#f8ecdb','#d5c5af','#c1b49f')+box(x,y,w,depth,height,color,color,d.color==='charcoal'?'#43595a':'#c3b9a9');
 for(let f=0;f<d.floors;f++)scene+=box(x-2,y-2,w+4,depth+4,12+f*23,'#f5e9d6','#e4d5bf','#cfc4b0',10+f*23);
 const windows=Math.min(9,Math.max(3,Math.ceil(d.rooms/d.floors))),unit=w/(windows+1);
 for(let f=0;f<d.floors;f++){
  const bottom=14+f*23,top=bottom+17;
  for(let n=1;n<=windows;n++){
   const wx=x+n*unit;
   const ww=d.style==='modern'?unit*.32:7;
   scene+=poly([[wx-ww-2,y+depth+.1,bottom-2],[wx+ww+2,y+depth+.1,bottom-2],[wx+ww+2,y+depth+.1,top+2],[wx-ww-2,y+depth+.1,top+2]],'#fff1d9');
   scene+=poly([[wx-ww,y+depth+.3,bottom],[wx+ww,y+depth+.3,bottom],[wx+ww,y+depth+.3,top],[wx-ww,y+depth+.3,top]],'url(#estate-glass)','#bead91',.8);
   scene+=line([wx,y+depth+.5,bottom],[wx,y+depth+.5,top],'#ffefd0',1)+line([wx-ww,y+depth+.5,bottom+9],[wx+ww,y+depth+.5,bottom+9],'#ffefd0',.8);
   if(f===0)scene+=box(wx-10,y+depth+1,20,7,12,'#8aaf82','#bb9e83','#9d8b72',8)+[0,1,2].map(i=>ellipse(wx-6+i*6,y+depth+4,2,1.4,'#efc4b4',13)).join('');
  }
  for(let n=1;n<=4;n++)scene+=poly([[x+w+.2,y+n*depth/5-7,bottom],[x+w+.2,y+n*depth/5+7,bottom],[x+w+.2,y+n*depth/5+7,top],[x+w+.2,y+n*depth/5-7,top]],'url(#estate-glass)','#f2e3c9',1.5);
 }
 if(d.roof==='gable'){
  scene+=poly([[x-6,y-5,height],[x+w/2,y-5,height+27],[x+w/2,y+depth+5,height+27],[x-6,y+depth+5,height]],roof);
  scene+=poly([[x+w/2,y-5,height+27],[x+w+6,y-5,height],[x+w+6,y+depth+5,height],[x+w/2,y+depth+5,height+27]],d.style==='resort'?'#d9b197':'#90a3ae');
  scene+=poly([[x-6,y+depth+5,height],[x+w/2,y+depth+5,height+27],[x+w+6,y+depth+5,height]],color);
  for(let n=1;n<10;n++)scene+=line([x+w/2+n*w/20,y-5,height+27-n*2.7],[x+w/2+n*w/20,y+depth+5,height+27-n*2.7],'#eff5f040',.8);
  for(let n=1;n<8;n++)scene+=line([x+w/2,y-5+n*(depth+10)/8,height+27],[x+w+6,y-5+n*(depth+10)/8,height],'#53697928',.7);
  scene+=box(x+w-32,y+24,15,17,height+28,'#f4e7d2','#d8c8b0','#baae9b',height+7)+tile(x+w-30,y+26,11,13,'#637170',height+28.3);
  const [gx,gy]=p(x+w/2,y+depth+5,height+11);
  scene+=`<circle cx="${gx}" cy="${gy}" r="7" fill="#f6ecd5"/><circle cx="${gx}" cy="${gy}" r="4.5" fill="#a7c5c5" stroke="#d4ba94"/><path d="M${gx-4} ${gy}h8m-4-4v8" stroke="#f6e9cc" stroke-width=".8"/>`;
 }else{
  scene+=box(x-4,y-4,w+8,depth+8,height+4,d.roof==='terrace'?'#b9b39a':roof,color,'#7c8472',height);
  if(d.roof==='terrace'){
   scene+=line([x,y+depth,height+12],[x+w,y+depth,height+12],'#eee5cf',1.5)+line([x+w,y,height+12],[x+w,y+depth,height+12],'#eee5cf',1.5);
   for(let n=0;n<5;n++)scene+=line([x+n*w/4,y+depth,height+4],[x+n*w/4,y+depth,height+12],'#ddd9c1',1);
   scene+=box(x+25,y+24,40,15,height+12,'#eee3c7','#d0c7ae','#a2a88d',height+4)+ellipse(x+92,y+55,10,5,'#ddd2b6',height+8);
  }
 }
 // Entrance steps and glass door.
 for(let step=0;step<3;step++)scene+=box(309+step*3,y+depth+20-step*6,52-step*6,7,2+step*2,'#fff0d9','#cfbea6','#ddcfba');
 scene+=poly([[327,y+depth+.5,6],[343,y+depth+.5,6],[343,y+depth+.5,29],[327,y+depth+.5,29]],'url(#estate-glass)','#d0b28a',2);
 // A projecting balcony with slim balusters gives the facade a residential scale.
 if(d.floors>1){
  scene+=box(302,y+depth,66,19,36,'#fff2da','#d6c5aa','#bcaf96',32);
  for(let n=0;n<8;n++)scene+=line([305+n*8,y+depth+18,36],[305+n*8,y+depth+18,45],'#d4b58a',1.1);
  scene+=line([303,y+depth+18,45],[367,y+depth+18,45],'#e8cc9e',2);
 }
 scene+=box(303,y+depth+3,5,15,31,'#fff1d6','#eadcc3','#ccbda4',6)+box(362,y+depth+3,5,15,31,'#fff1d6','#eadcc3','#ccbda4',6);
 for(const tx of [298,377])scene+=box(tx,y+depth+13,9,9,10,'#b99576','#bd9c80','#a2846a')+tree(tx+4,y+depth+17,7);
 // A side veranda, timber pergola and little outdoor dining set.
 scene+=box(x+w+5,y+33,39,70,4,'#e4c7a4','#ccb18d','#bdac8d');
 for(const yy of [y+36,y+96])scene+=box(x+w+7,yy,3,3,28,'#d4b996','#c5a988','#b09576',4)+box(x+w+40,yy,3,3,28,'#d4b996','#c5a988','#b09576',4);
 for(let n=0;n<6;n++)scene+=box(x+w+4,y+33+n*13,42,3,29,'#dfc5a1','#c6aa87','#b29c7b',26);
 scene+=ellipse(x+w+22,y+67,9,4,'#f8e8ca',12)+box(x+w+12,y+47,13,8,9,'#e3d6b9','#c4b598','#b4aa8a',4)+box(x+w+14,y+80,13,8,9,'#e3d6b9','#c4b598','#b4aa8a',4);
 scene+='</g>';
 if(d.pool){
  let pool=box(311,310,145,110,4,'#fff0dc','#d9c8af','#c4bca5')+tile(322,320,102,88,'#86babd',4.5)+tile(325,323,96,82,'url(#estate-water)',4.7);
  for(let row=0;row<6;row++)for(let n=0;n<5;n++){const [cx,cy]=p(333+n*17,332+row*12,5);pool+=`<path d="M${cx-4} ${cy}q4-3 8 0t8 0" fill="none" stroke="#e8fff0" opacity="${.15+(n%3)*.1}" stroke-width=".9"/>`;}
  pool+=ellipse(352,364,10,4.8,'#fff6e0',6)+ellipse(352,364,5.7,2.6,'#73c9cb',6.3)+ellipse(394,384,7,3.3,'#edc1b4',6)+ellipse(394,384,3.8,1.7,'#5dbfc6',6.3);
  for(let n=0;n<3;n++)pool+=box(432,323+n*28,13,23,6,'#fff5d8','#d3c6a8','#b9ac8d',3)+line([434,328+n*28,7],[443,328+n*28,7],'#cab995',1);
  pool+=parasol(442,314)+parasol(441,410)+box(309,338,8,20,8,'#a5be8a','#c1a38a','#ac947c',4);
  scene+=facility('pool',pool);
 }
 if(d.cinema){
  let cinema=box(66,308,164,111,6,'#677178','#cabda9','#aea994')+box(66,308,164,6,43,'#f2e5d6','#d4c4b5','#b7ad9e',6)+box(66,308,6,111,43,'#f6eadb','#d5c6b6','#b4ab9c',6);
  cinema+=poly([[86,315,13],[207,315,13],[207,315,37],[86,315,37]],'#e5e8cc','#9a977f',2)+poly([[97,315.3,16],[145,315.3,34],[166,315.3,21],[196,315.3,29],[196,315.3,16]],'#8daea2');
  for(let row=0;row<3;row++)for(let seat=0;seat<5;seat++){
   const sx=82+seat*27,sy=337+row*24;
   cinema+=box(sx,sy,17,16,14+row*2,'#d3a5a0','#b78482','#9b7378',6)+box(sx,sy+12,17,4,23+row*2,'#e2b6ac','#c89791','#a47c7e',6);
   cinema+=box(sx-2,sy+3,3,12,18+row*2,'#e4bbb1','#bb908a','#a47c7e',6)+box(sx+16,sy+3,3,12,18+row*2,'#e4bbb1','#bb908a','#a47c7e',6);
  }
  for(let n=0;n<7;n++)cinema+=line([76+n*21,314,9],[76+n*21,314,41],'#e9d8c7',.8);
  cinema+=line([72,415,7],[225,415,7],'#ffe1a5',1.5)+lamp(75,324)+lamp(218,324);
  scene+=facility('cinema',cinema);
 }
 if(d.spa){
  let spa=box(490,304,130,110,6,'#ecdbc9','#c8b59d','#b9b69c')+box(490,304,130,5,37,'#fff0dc','#e0cdb7','#c4baa2',6)+box(615,304,5,110,37,'#fff2df','#dfc9b4','#c0b7a0',6);
  spa+=ellipse(537,349,29,14,'#f1e7ce',7)+ellipse(537,349,23,10,'#77b8b0',8)+ellipse(539,348,15,6,'#a9d3c2',8);
  for(let n=0;n<2;n++)spa+=box(505+n*48,381,33,17,12,'#fcf2d8','#d6c4a4','#c6b999',6);
  for(let n=0;n<3;n++){const [cx,cy]=p(530+n*9,344,12);spa+=`<path d="M${cx} ${cy}q-4-7 0-13t0-12" fill="none" stroke="#eef2db" stroke-width="2" opacity=".65"/>`;}
  spa+=tree(605,322,9)+tree(605,398,9)+lamp(500,370)+lamp(588,407);
  scene+=facility('spa',spa);
 }
 // Labels occupy the front edge of their corresponding plots.
 const spots={helipad:[125,112],golf:[550,216],garden:[112,252],cinema:[147,438],pool:[381,438],spa:[556,438]};
 if(d.garden){
  let border='';
  for(const [tx,ty,r,pink]of [[42,423,16,true],[87,434,12,false],[614,215,18,true],[628,259,14,false],[357,33,17,false],[427,32,15,true]])border+=tree(tx,ty,r,pink);
  scene+=`<g data-garden-detail="border">${border}</g>`;
 }
 scene+=selected.map(key=>label(key,names[key],...spots[key])).join('');
 const description=`${styleName} · ${d.floors} floors · ${d.rooms} rooms · ${selected.length?selected.map(k=>names[k]).join(', '):'No extra facilities'}`;
 return `<section class="estate-live-model" aria-label="Rendering with your selected facilities"><header><div><span>MAISON MINIATURE · YOUR PRIVATE WORLD</span><h3>A little world, a home all your own.</h3></div><b>${selected.length} facilities</b></header><svg viewBox="0 20 1050 580" role="img" aria-label="${description}" class="estate-site-art"><defs><linearGradient id="estate-lawn" x2=".5" y2="1"><stop stop-color="#bad4ac"/><stop offset="1" stop-color="#91bb94"/></linearGradient><radialGradient id="estate-blossom" cx=".3" cy=".25" r=".8"><stop stop-color="#fae1dc"/><stop offset=".5" stop-color="#e9bdbb"/><stop offset="1" stop-color="#cc999f"/></radialGradient><filter id="estate-soft-shadow" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="12"/></filter><linearGradient id="estate-ground" x2=".3" y2="1"><stop stop-color="#c5dabc"/><stop offset="1" stop-color="#a4c2a0"/></linearGradient><linearGradient id="estate-water" x2=".6" y2="1"><stop stop-color="#b2eae0"/><stop offset=".4" stop-color="#72cfd3"/><stop offset="1" stop-color="#49adbe"/></linearGradient><linearGradient id="estate-glass" x2="1" y2="1"><stop stop-color="#fff0c8"/><stop offset=".5" stop-color="#b5d6d8"/><stop offset="1" stop-color="#79a9b8"/></linearGradient><radialGradient id="estate-tree" cx=".3" cy=".25" r=".8"><stop stop-color="#b3d5a5"/><stop offset="1" stop-color="#6b9e7d"/></radialGradient><radialGradient id="estate-backdrop"><stop stop-color="#fff9f0"/><stop offset="1" stop-color="#f2eae1"/></radialGradient></defs><rect width="1050" height="600" fill="url(#estate-backdrop)"/><ellipse cx="560" cy="455" rx="354" ry="93" fill="#69796535" filter="url(#estate-soft-shadow)"/>${scene}<text x="42" y="551" class="site-orientation">N ↗</text><text x="42" y="574" class="site-footnote">PRIVATE RESIDENCE / CONCEPT PLAN</text></svg><div class="site-legend">${selected.map(key=>`<span><i>${Object.keys(names).indexOf(key)+1}</i>${names[key]}</span>`).join('')||'<span>Pick facilities to fill in your own scene.</span>'}</div><p>Selecting or removing a facility updates the view instantly. The cinema and spa are drawn as cutaways showing the interior.</p></section>`;
}
