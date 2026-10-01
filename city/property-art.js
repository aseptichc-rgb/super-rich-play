// Local illustrations are decorative; names and prices remain readable HTML.
import {buildingArtURL} from './building-art.js';
const DISPLAY_ART={marina:'city/assets/scenery/marina-pier.webp',garage:'city/assets/vehicles/car-sunset-front.webp'};
export function propertyArt(type,thumbnail=false,level=1){
 // Thumbnails exist only for tier 1; the large illustration follows the expansion tier.
 const display=Object.hasOwn(DISPLAY_ART,type)?DISPLAY_ART[type]:null;
 const url=display||(type==='estate'?'city/assets/property/estate.webp':buildingArtURL(type,thumbnail?1:level));
 if(!url)return '';
 return `<img class="${thumbnail?'property-thumbnail':'property-illustration'}" src="${thumbnail&&!display?url.replace('.webp','-thumb.webp'):url}" alt="" width="${thumbnail?192:768}" height="${thumbnail?192:768}" loading="lazy" decoding="async">`;
}
