import {L} from './i18n.js';

export const MOON_SIZE=9;
export const moonOrigin=s=>({x:Math.sqrt(s.tiles.length)+8,y:2});
export function ultraCells(s,position){
 const size=Math.sqrt(s.tiles.length),p=position;
 if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0||p.x+3>size||p.y+3>size)return [];
 return Array.from({length:9},(_,n)=>(p.y+Math.floor(n/3))*size+p.x+n%3);
}
export function ultraPlacementError(s,id,position){
 const p=position;
 if(id==='moon')return p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x+3<=MOON_SIZE&&p.y+3<=MOON_SIZE?null:L('Choose a 3×3 site on the Moon.');
 const cells=ultraCells(s,p);
 if(cells.length!==9)return L('Choose a 3×3 site inside the city.');
 const size=Math.sqrt(s.tiles.length),offset=s.mapOffset||0;
 if(s.flex?.owned?.includes('penthouse')&&cells.some(i=>{const x=i%size-offset,y=Math.floor(i/size)-offset;return x>=1&&x<=5&&y>=19&&y<=22;}))return L('All 9 tiles must be empty land.');
 if(cells.some(i=>{const t=s.tiles[i];return !t||t.terrain!=='land'||t.owner||t.type&&!(t.type==='ultra'&&t.ultraId===id);} ))return L('All 9 tiles must be empty land.');
 return null;
}
export function clearUltraSite(s,id){
 const p=s.ultra?.items?.[id]?.position;if(!p||id==='moon')return;
 for(const i of ultraCells(s,p))if(s.tiles[i].type==='ultra'&&s.tiles[i].ultraId===id)s.tiles[i]={terrain:'land',type:null,owner:null,level:1,tree:false};
}
export function setUltraSite(s,id,position){
 clearUltraSite(s,id);
 s.ultra.items[id].position={x:position.x,y:position.y};
 if(id!=='moon')for(const i of ultraCells(s,position))s.tiles[i]={terrain:'land',type:'ultra',ultraId:id,owner:null,level:1,tree:false};
}
