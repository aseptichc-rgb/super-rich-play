// Local illustrations are decorative; names and prices remain readable HTML.
import {buildingArtURL} from './building-art.js';
export function propertyArt(type,thumbnail=false,level=1){
 // Thumbnails exist only for tier 1; the large illustration follows the expansion tier.
 const url=type==='estate'?'city/assets/property/estate.webp':buildingArtURL(type,thumbnail?1:level);
 if(!url)return '';
 return `<img class="${thumbnail?'property-thumbnail':'property-illustration'}" src="${thumbnail?url.replace('.webp','-thumb.webp'):url}" alt="" width="${thumbnail?192:768}" height="${thumbnail?192:768}" loading="lazy" decoding="async">`;
}
