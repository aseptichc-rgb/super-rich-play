// Local illustrations are decorative; names and prices remain readable HTML.
import {buildingArtURL} from './building-art.js';
import {mountainArtId,sceneryArtURL} from './scenery-art.js';
const DISPLAY_ART={marina:'city/assets/scenery/marina-pier.webp',garage:'city/assets/vehicles/car-sunset-front.webp',observatory:'city/assets/scenery/mountain-observatory.webp',cablecar:'city/assets/scenery/cablecar-station.webp'};
export function propertyArt(type,thumbnail=false,level=1,variant=1){
 // Thumbnails exist only for tier 1; the large illustration follows the expansion tier.
 const display=Object.hasOwn(DISPLAY_ART,type)?DISPLAY_ART[type]:null;
 const url=(!thumbnail&&sceneryArtURL(mountainArtId(type,level,variant)))||display||(type==='estate'?'city/assets/property/estate.webp':buildingArtURL(type,thumbnail?1:level,undefined,thumbnail?1:variant));
 if(!url)return '';
 return `<img class="${thumbnail?'property-thumbnail':'property-illustration'}" src="${thumbnail&&!display?url.replace('.webp','-thumb.webp'):url}" alt="" width="${thumbnail?192:768}" height="${thumbnail?192:768}" loading="lazy" decoding="async">`;
}
