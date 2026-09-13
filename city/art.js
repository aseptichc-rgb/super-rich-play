import {marketPrice} from './economy.js';
import {awardAssetFame} from './reputation.js';
import {reputationSummary} from './empire.js';
// Fictional in-game listings of famous public-domain masterpieces.
// The stylised previews are original CSS artwork, not museum photography.
export const BUYER_PREMIUM=.05;
export const ART_MAINTENANCE_RATE=.0008;

export const ARTWORKS={
 water_lilies:{name:'수련',original:'Nymphéas',artist:'클로드 모네',year:'1899–1926',price:12000000,annualRate:.035,rarity:'IMPRESSIONIST ICON',palette:['#547f78','#a9b987','#d3adbd'],description:'빛과 물의 순간을 담은 인상주의 대표 연작.'},
 the_kiss:{name:'키스',original:'Der Kuss',artist:'구스타프 클림트',year:'1907–1908',price:28000000,annualRate:.032,rarity:'GOLDEN PERIOD',palette:['#b7902d','#e2c765','#54452e'],description:'황금빛 장식과 인물이 결합된 빈 분리파의 상징.'},
 girl_pearl:{name:'진주 귀걸이를 한 소녀',original:'Girl with a Pearl Earring',artist:'요하네스 페르메이르',year:'c. 1665',price:42000000,annualRate:.03,rarity:'DUTCH MASTER',palette:['#142c39','#d2a33e','#efe1c5'],description:'빛과 시선으로 기억되는 네덜란드 황금시대의 걸작.'},
 starry_night:{name:'별이 빛나는 밤',original:'The Starry Night',artist:'빈센트 반 고흐',year:'1889',price:95000000,annualRate:.045,rarity:'POST-IMPRESSIONIST ICON',palette:['#183b62','#e6c64c','#5c87a4'],description:'소용돌이치는 밤하늘로 유명한 후기 인상주의의 아이콘.'},
 night_watch:{name:'야경',original:'The Night Watch',artist:'렘브란트 판 레인',year:'1642',price:110000000,annualRate:.028,rarity:'OLD MASTER',palette:['#2c2118','#9b7133','#b33f2f'],description:'빛과 움직임으로 집단 초상화를 혁신한 바로크 걸작.'},
 mona_lisa:{name:'모나리자',original:'Mona Lisa',artist:'레오나르도 다 빈치',year:'c. 1503–1519',price:500000000,annualRate:.025,rarity:'ULTIMATE MASTERPIECE',palette:['#403b28','#7b7450','#b4925e'],description:'게임 세계관의 최고가 트로피 아트. 현실의 루브르 소장품과 무관한 가상 매물.'}
};

export const artState=s=>s.artCollection??{owned:[]};
const total=(s,d)=>Math.round(marketPrice(s,d.price)*(1+BUYER_PREMIUM));
const money=n=>'₲'+Math.round(n).toLocaleString('ko-KR');

// Auction houses only invite collectors with a reputation; each lot has a fame threshold.
export const ART_FAME={water_lilies:0,the_kiss:40,girl_pearl:80,starry_night:150,night_watch:200,mona_lisa:300};
export const artFame=s=>reputationSummary(s).fame;
export function artQuote(s,id){
 const d=ARTWORKS[id],owned=artState(s).owned;
 if(!d)return'선택한 작품이 없습니다.';
 if(owned.some(item=>item.id===id))return'이미 소장한 작품입니다.';
 if(s.mode!=='sandbox'&&artFame(s)<(ART_FAME[id]||0))return`명성 ${ART_FAME[id]} 필요 (현재 ${Math.round(artFame(s))})`;
 if(s.money<total(s,d))return`현금 ${money(total(s,d))} 필요`;
 return null;
}

export function buyArtwork(s,id){
 const error=artQuote(s,id);if(error)return{ok:false,msg:error};
 const d=ARTWORKS[id],paid=total(s,d);
 s.artCollection??={owned:[]};s.money-=paid;
 s.artCollection.owned.push({id,price:d.price,paid:marketPrice(s,d.price),boughtMonth:s.month});
 s.log.unshift(`🖼 ${d.artist} 〈${d.name}〉 낙찰 · ${money(paid)} (수수료 포함)`);s.log=s.log.slice(0,25);
 awardAssetFame(s,`art:${id}`,d.price,d.name+' 낙찰');
 return{ok:true,msg:`${d.artist} 〈${d.name}〉 · 프라이빗 갤러리에 전시!`,paid};
}

export function artPortfolio(s){
 const owned=artState(s).owned;
 // item.grown counts curated months (rich life); without the counter, appreciation follows elapsed time. Crash pricing applies on top.
 const value=Math.round(owned.reduce((sum,item)=>{const d=ARTWORKS[item.id],months=item.grown??Math.max(0,s.month-item.boughtMonth);return sum+marketPrice(s,item.price)*Math.pow(1+d.annualRate,months/12);},0));
 return{owned,value,cost:owned.reduce((sum,item)=>sum+(item.paid??item.price),0)};
}

export function artMaintenance(s){return Math.round(artPortfolio(s).value*ART_MAINTENANCE_RATE);}

export function validArt(s){
 const c=s.artCollection;if(c===undefined)return true;
 if(!c||!Array.isArray(c.owned)||c.owned.length>Object.keys(ARTWORKS).length)return false;
 const ids=new Set();
 return c.owned.every(item=>item&&Object.hasOwn(ARTWORKS,item.id)&&!ids.has(item.id)&&ids.add(item.id)&&item.price===ARTWORKS[item.id].price&&(item.paid===undefined||(Number.isFinite(item.paid)&&item.paid>=0&&item.paid<=item.price))&&Number.isInteger(item.boughtMonth)&&item.boughtMonth>=0&&item.boughtMonth<=s.month&&(item.grown===undefined||(Number.isInteger(item.grown)&&item.grown>=0&&item.grown<=s.month)));
}

function preview(id,d){return `<div class="art-frame"><div class="art-canvas art-${id}" style="--art-a:${d.palette[0]};--art-b:${d.palette[1]};--art-c:${d.palette[2]}"><i></i><i></i><i></i></div></div>`;}
export function artDialog(s){const p=artPortfolio(s);return `<span class="eyebrow">PRIVATE MASTERPIECE SALE · GAME ONLY</span><h2>세계 명작 컬렉션</h2><p>해외 거장의 대표작을 게임 자금으로 낙찰받아 프라이빗 갤러리를 완성하세요.</p><div class="art-summary"><div><small>COLLECTION</small><b>${p.owned.length} / ${Object.keys(ARTWORKS).length}</b></div><div><small>감정 평가액</small><b>${money(p.value)}</b></div><div><small>월 보험 · 보관비</small><b>${money(artMaintenance(s))}</b></div><div><small>보유 현금</small><b>${money(s.money)}</b></div></div><div class="art-grid">${Object.entries(ARTWORKS).map(([id,d])=>{const owned=p.owned.some(item=>item.id===id),reason=artQuote(s,id);return `<article class="art-lot ${owned?'owned':''}">${preview(id,d)}<div class="art-copy"><small>${d.rarity} · ${d.year}</small><h3>${d.name}</h3><p>${d.artist}<br><em>${d.original}</em></p><span>${d.description}</span><strong>${money(marketPrice(s,d.price))}</strong><small>구매 수수료 5% · 총 ${money(total(s,d))}${ART_FAME[id]?` · 명성 ${ART_FAME[id]} 이상`:''}</small><button data-art-buy="${id}" ${reason?'disabled':''}>${owned?'✦ 소장 중':reason||'작품 낙찰받기'}</button></div></article>`;}).join('')}</div><p class="help">모든 작품과 거래는 게임 세계관의 가상 매물입니다. 표시 작품은 저작권 보호기간이 끝난 거장의 작품이며, 미리보기는 원본 사진을 복제하지 않은 게임용 추상 표현입니다. 작품은 정상 시세를 기준으로 연 2.5–4.5% 성장하고 경기 할인율에 따라 감정가가 변하며 순자산에 포함됩니다. 수퍼 리치 라이프에서는 컬렉션 큐레이션 시간을 8시간 이상 배분한 달에만 감정가가 오릅니다. 현재 감정가의 월 0.08%가 보험·보관·관리비로 청구됩니다.</p>`;}
