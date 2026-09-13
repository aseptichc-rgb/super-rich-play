import {marketFactor,marketPrice,incomeFactor} from './economy.js';
import {ensureEconomy,advanceEconomy,validEconomy} from './economy.js';
import {validLandmarks} from './landmarks.js';
import {awardAssetFame,validReputation} from './reputation.js';
import {validJourney,journeyInventoryValue} from './journey.js';
import {compoundSummary,settleCompound,validCompound,COMPOUND_ASSETS} from './compound.js';
import {ARTWORKS} from './art.js';
import {reputationSummary} from './empire.js';
import {cycleFactor,economyReport} from './economy.js';
import {scheduleRichEvent,applyRichChoice,resolvePending,validRichEvent,validPending} from './events.js';
import {advanceRival,rivalOffer,validRival} from './rival.js';
import {chapterOf,settlePrestige,endingReport,validLegacy} from './legacy.js';
import {validFlex} from './flex.js';
import {artPortfolio,validArt} from './art.js';
import {RICH_GOALS,validRichLife} from './rich-life.js';
import {validRewards} from './rewards.js';
import {wageQuote,validCareer} from './careers.js';
import {investmentReport,recordTrade,validInvestment} from './investment.js';
import {projectReport,advanceProjects,validProjects} from './projects.js';
import {validShift} from './activity.js';
import {advanceVentures,validVentures} from './venture.js';
import {empireSummary,validEmpire,settleOwnerBenefits} from './empire.js';
import {acquisitionSummary,validAcquisitions} from './acquisitions.js';
import {lifestyleCostReport} from './living-costs.js';
// Personal wealth simulation. All money is fictional G; one tick is one month.
export const SIZE=26,SAVE_KEY='super-rich-life-v2';
export const TYPES={
 extension:{name:'통합 건물 부지',color:'#c8bb88'},
 golf:{name:'골프장',group:'property',icon:'⛳',cost:1000000,upkeep:18000,color:'#78aa58',shape:'golf',base:100000,staff:0,managed:true,desc:'클럽하우스와 코스를 갖춘 골프장. 입지에 따라 이용 수익이 달라져요 · 자동 운영 · 3단계 확장 가능.'},
 plot:{name:'보유 부지',group:'land',icon:'▱',cost:0,upkeep:0,color:'#c8bb88',base:0,staff:0,desc:'미리 매입한 빈 땅. 자동 개발되지 않으며 원하는 건물을 지을 수 있습니다.'},
 hotel:{name:'호텔',group:'property',icon:'🏨',cost:250000,upkeep:5000,color:'#d6b16c',shape:'shop',base:20000,staff:0,managed:true,desc:'건설하면 바로 개장! 입지와 경기에 따라 수익이 달라져요 · 근처 호텔·리조트와 클러스터를 이루면 매출이 오릅니다.'},
 resort:{name:'리조트',group:'property',icon:'🏝',cost:600000,upkeep:10000,color:'#6fb8ab',shape:'home',base:56000,staff:0,managed:true,unlock:10000000,desc:'디벨로퍼 챕터(최고 순자산 ₲10,000,000)에 해금. 강변·공원 근처에서 수익이 높아요 · 운영은 자동, 수익은 현금으로 들어옵니다.'},
 office:{name:'임대 빌딩',group:'property',icon:'🏢',cost:350000,upkeep:5000,color:'#85aabe',shape:'tower',base:28000,staff:0,managed:true,desc:'매달 월세가 들어오는 내 빌딩. 유동인구가 많을수록 월세가 높아요 · 불황엔 공실이 늘어 월세가 줄어듭니다.'},
 hq:{name:'본사 타워',group:'property',icon:'🏛',cost:5000000,upkeep:80000,color:'#c9a24a',shape:'tower',base:220000,staff:0,managed:true,unlock:30000000,unique:true,desc:'타이쿤 챕터(최고 순자산 ₲30,000,000)에 해금. 보유 중 모든 관리형 자산 매출 +5% · 매월 명성 +10 · 도시에 하나만 세울 수 있습니다.'},
 monument:{name:'도시 기념탑',group:'property',icon:'✦',cost:30000000,upkeep:300000,color:'#e0c46a',shape:'tower',base:900000,staff:0,managed:true,unlock:150000000,unique:true,desc:'레거시 챕터(최고 순자산 ₲150,000,000)에 해금. 관리형 자산 매출 +10% · 매월 명성 +30 · 레거시 점수 800 · 도시에 하나만 세울 수 있습니다.'},
 atelier:{name:'내 작업실',group:'homebase',icon:'⚒',cost:1200,upkeep:35,color:'#e3ad69',shape:'school',base:0,staff:0,desc:'첫 거래로 마련한 작업실. 현장 수리비 20% 절감 · 창작 효율 +15%. 월 임대료가 발생합니다.'},
 cafe:{name:'카페',group:'business',icon:'♨',cost:2400,upkeep:240,color:'#d1aa85',shape:'shop',base:2400,staff:1,desc:'유동 인구가 많은 곳에 유리합니다. 가격·품질·직원 수를 직접 결정하세요.'},
 market:{name:'동네 마켓',group:'business',icon:'▤',cost:4200,upkeep:380,color:'#86b7a4',shape:'shop',base:3800,staff:2,desc:'주거지 근처에서 안정적인 매출. 인건비와 상품 원가를 관리해야 합니다.'},
 studio:{name:'디자인 스튜디오',group:'business',icon:'✧',cost:3500,upkeep:180,color:'#b3a6ca',shape:'school',base:3100,staff:1,desc:'실력이 수익을 만듭니다. 학습으로 전문성을 키우면 계약 매출이 증가합니다.'},
 workshop:{name:'제작 공방',group:'business',icon:'⚒',cost:5000,upkeep:320,color:'#d8bb7c',shape:'factory',base:4200,staff:2,desc:'유동 인구 의존도는 낮고 전문성과 품질이 중요합니다.'},
 rental:{name:'임대 주택',group:'property',icon:'⌂',cost:7000,upkeep:90,color:'#b2c498',shape:'home',base:620,staff:0,desc:'땅을 매입한 뒤 건설합니다. 월세가 높을수록 공실이 늘어납니다.'},
 condo:{name:'임대 아파트',group:'property',icon:'▥',cost:18000,upkeep:230,color:'#88b8cb',shape:'shop',base:1800,staff:0,unlock:50000,desc:'최고 순자산 ₲50,000에 해금. 큰 투자와 높은 임대 수익을 갖는 자산입니다.'},
 garden:{name:'프라이빗 정원',group:'property',icon:'♣',cost:1600,upkeep:35,color:'#80ae77',shape:'park',base:0,staff:0,desc:'주변 4칸의 내 상권과 임대 선호도를 높입니다. 정원 자체는 수익이 없습니다.'},
 home:{name:'주거지',color:'#afc897'},shop:{name:'상점',color:'#8abcc4'},factory:{name:'물류 회사',color:'#c8b38a'},park:{name:'공원',color:'#83b17b'},hall:{name:'커뮤니티 센터',color:'#eee0b8'},wind:{name:'풍력 발전소',color:'#dbe4d6'},water:{name:'급수탑',color:'#8fbcc6'},school:{name:'학교',color:'#d9b699'},clinic:{name:'병원',color:'#e0b2a5'},fire:{name:'소방서',color:'#c99580'},road:{name:'도로',color:'#8b988d'},plaza:{name:'광장',color:'#b6a3cf'},tower:{name:'오피스',color:'#d7cfb0'}
};
export const STOCKS=[{id:'local',name:'타운 리테일',base:100,risk:.06,annualRate:.20},{id:'tech',name:'넥스트 테크',base:160,risk:.13,annualRate:.30},{id:'estate',name:'리버 리츠',base:80,risk:.035,annualRate:.10}];
export const MILESTONES=[{wealth:20000,name:'첫 자산가'},{wealth:50000,name:'동네 사업가'},{wealth:100000,name:'자산 포트폴리오'},{wealth:300000,name:'슈퍼 리치'}];
export const EVENTS=[];
// Retained only to recognize and clear pending events in older saves.
const RETIRED_EVENTS=[
 {title:'업계 네트워킹 초대',text:'새 고객과 파트너를 만날 기회입니다. 생활의 여유와 성장 중 무엇에 투자할까요?',options:[{label:'참가하고 배운다',cost:450,skill:8,stress:4,desc:'₲450 지출 · 전문성 +8 · 스트레스 +4'},{label:'충분히 쉬어간다',cost:0,skill:0,stress:-12,desc:'비용 없음 · 스트레스 −12'}]},
 {title:'단체 주문이 들어왔어요',text:'지역 행사에서 대량 주문을 제안했습니다. 선투자와 추가 운영 시간이 필요합니다.',options:[{label:'주문을 맡는다',cost:500,bonus:420,stress:8,desc:'지금 ₲500 지출 · 2개월 사업 수익 +₲420 · 스트레스 +8'},{label:'현재 고객에 집중한다',cost:0,bonus:0,stress:-6,desc:'추가 지출 없음 · 스트레스 −6'}]},
 {title:'원자재 공동 구매',text:'다음 두 달 동안 사용할 상품을 공동 구매하면 할인받을 수 있습니다.',options:[{label:'선결제한다',cost:400,bonus:280,stress:0,desc:'지금 ₲400 지출 · 2개월 사업 수익 +₲280'},{label:'현금을 보유한다',cost:0,bonus:0,stress:0,desc:'추가 지출과 수익 없음'}]}
];
export function migrateSave(s){
 if(s){ensureEconomy(s);s.growthStartMonth??=s.month;if(s.tiles?.length===SIZE*SIZE)installBoulevards(s);}
 if(s&&RETIRED_EVENTS.some(e=>JSON.stringify(e)===JSON.stringify(s.event)))s.event=null;
 return s;
}
export const coords=i=>({x:i%SIZE,y:Math.floor(i/SIZE)});
export const index=(x,y)=>y*SIZE+x;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dist=(a,b)=>{const p=coords(a),q=coords(b);return Math.hypot(p.x-q.x,p.y-q.y);};
export function neighbors(i){const{x,y}=coords(i);return[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&b>=0&&a<SIZE&&b<SIZE).map(([a,b])=>index(a,b));}
export function createGame(mode='standard',seed=42){
 const tiles=Array.from({length:SIZE*SIZE},(_,i)=>{const{x,y}=coords(i);return{terrain:x>20+Math.sin(y*.24)*1.5?'water':'land',type:null,level:1,tree:(i*31+seed)%17<3,owner:null};});
 const put=(x,y,type,level=1)=>Object.assign(tiles[index(x,y)],{type,level,tree:false,owner:'npc'});
 for(let x=3;x<=19;x++)for(const y of[7,11,16])put(x,y,'road');
 for(let y=3;y<=21;y++)for(const x of[6,11,17])put(x,y,'road');
 for(const[x,y,l]of[[5,5,1],[5,6,2],[7,5,1],[8,6,1],[9,6,2],[4,8,1],[5,8,1],[7,8,1],[8,8,2],[12,5,2],[13,6,1],[15,6,2],[16,6,1],[12,12,2],[13,12,1],[16,12,2],[18,12,1],[7,17,1],[8,17,2],[12,17,1],[15,17,2],[16,17,1]])put(x,y,'home',l);
 put(9,10,'hall');put(10,8,'park');put(8,10,'shop',2);put(13,10,'shop',2);put(18,8,'factory');put(19,8,'factory');put(12,8,'school');put(16,14,'park');put(4,15,'park');put(10,17,'clinic');put(18,17,'tower');
 installBoulevards({tiles});
 return{economy:ensureEconomy({month:0,seed}),version:2,growthStartMonth:0,name:'리버사이드',mode,seed,tiles,money:12000,debt:0,month:0,skill:10,stress:12,plan:{work:80,manage:40,learn:20,create:0},career:'flexible',costBasis:{local:0,tech:0,estate:0},realizedGains:0,holdings:{local:0,tech:0,estate:0},prices:{local:100,tech:160,estate:80},history:[],log:['리버사이드에 도착했습니다. 일하며 종잣돈을 만들고 첫 가게의 입지를 골라보세요.'],event:null,effect:null,highestWealth:12000,milestones:[],lastReport:null};
}
export const BOULEVARD={axis:11,land:1.5,rent:1.3};
// Upgrade existing streets and vacant parcels; never displace saved buildings or owned land.
export function installBoulevards(s){
 for(let n=0;n<SIZE;n++)for(const i of new Set([index(n,BOULEVARD.axis),index(BOULEVARD.axis,n)])){
  const t=s.tiles[i];if(t.owner==='player'||(t.type&&t.type!=='road'))continue;
  Object.assign(t,{type:'road',owner:'npc',level:1,tree:false,boulevard:true,bridge:t.terrain==='water'});
 }
}
export function hasBoulevardAccess(s,i,footprint){return footprintCells(i,footprint).some(j=>neighbors(j).some(n=>s.tiles[n].type==='road'&&s.tiles[n].boulevard===true));}
export const OFF_ROAD={land:.65,construction:.8,revenue:.45};
export function hasRoadAccess(s,i,footprint){return footprintCells(i,footprint).some(j=>neighbors(j).some(n=>s.tiles[n].type==='road'));}
// Connect completed buildings through unowned empty land, without demolishing assets.
function connectBuildingRoad(s,i){
 if(hasRoadAccess(s,i,s.tiles[i].footprint))return;
 const cells=new Set(footprintCells(i,s.tiles[i].footprint)),previous=new Map(),queue=[];
 const vacant=j=>!cells.has(j)&&s.tiles[j].terrain==='land'&&!s.tiles[j].type&&!s.tiles[j].owner;
 for(const j of cells)for(const n of neighbors(j))if(vacant(n)&&!previous.has(n)){previous.set(n,null);queue.push(n);}
 for(let k=0;k<queue.length;k++){
  const j=queue[k];
  if(neighbors(j).some(n=>s.tiles[n].type==='road')){
   let count=0;
   for(let n=j;n!==null;n=previous.get(n)){Object.assign(s.tiles[n],{type:'road',owner:'npc',level:1,tree:false});count++;}
   s.log.unshift(`도로 자동 연결 · ${coords(i).x+1}번가 ${coords(i).y+1}번지까지 ${count}칸 확장`);
   return;
  }
  for(const n of neighbors(j))if(vacant(n)&&!previous.has(n)){previous.set(n,j);queue.push(n);}
 }
}
export function landPrice(s,i){const{x,y}=coords(i);return Math.round((2600+Math.max(0,12-Math.hypot(x-10,y-10))*230+(x>=18?800:0))*(1+s.month*.002)*marketFactor(s)*(hasRoadAccess(s,i)?1:OFF_ROAD.land)*(hasBoulevardAccess(s,i)?BOULEVARD.land:1));}
// Monthly, deterministic growth uses the same location and land valuation as contracts.
export function advanceNeighborhood(s){
 const vacant=i=>s.tiles[i].terrain==='land'&&!s.tiles[i].type&&!s.tiles[i].owner&&s.rival?.target!==i;
 const roll=i=>((Math.imul(i+1,73856093)^Math.imul(s.month+1,19349663)^Math.imul(s.seed,83492791))>>>0)/4294967296;
 const scores=new Map();
 const candidates=s.tiles.map((t,i)=>i).filter(i=>vacant(i)&&neighbors(i).some(n=>s.tiles[n].type==='road'));
 for(const i of candidates)scores.set(i,location(s,i).footfall+landPrice(s,i)/150+roll(i)*60);
 candidates.sort((a,b)=>scores.get(b)-scores.get(a));
 const i=candidates[0];
 if(i!==undefined){
  const loc=location(s,i),price=landPrice(s,i)/(1+s.month*.002),r=roll(i);
  const choices=price>=4800&&loc.footfall>=70?['condo','office','hotel','market']:loc.residents>=60?['rental','condo','market','cafe']:['rental','rental','cafe','garden'];
  const type=choices[Math.floor(r*choices.length)];
  Object.assign(s.tiles[i],{type,owner:'npc',level:1,tree:false,constructionCost:developmentQuote(s,i,type).construction});
  s.log.unshift(`동네 개발 · ${coords(i).x+1}번가 ${coords(i).y+1}번지에 ${TYPES[type].name} 완공`);
 }
 // Each six additional buildings supports one new connected road tile.
 const buildings=s.tiles.filter(t=>t.type&&!['road','plot','extension','garden','park'].includes(t.type)).length;
 const roads=s.tiles.filter((t,i)=>t.type==='road'&&!(t.boulevard&&(coords(i).x<3||coords(i).x>19||coords(i).y<3||coords(i).y>21))).length;
 if(s.month%3===0&&buildings>=34+Math.max(0,roads-99)*6){
  const extensions=s.tiles.map((t,j)=>j).filter(j=>vacant(j)&&neighbors(j).some(n=>s.tiles[n].type==='road')&&neighbors(j).some(vacant));
  const score=j=>neighbors(j).filter(vacant).length*20+s.tiles.reduce((n,t,k)=>n+(t.type&&!['road','plot'].includes(t.type)&&dist(j,k)<=3?1:0),0)+roll(j)*10;
  extensions.sort((a,b)=>score(b)-score(a));
  if(extensions.length){const j=extensions[0];Object.assign(s.tiles[j],{type:'road',owner:'npc',level:1,tree:false});s.log.unshift(`도로 확장 · ${coords(j).x+1}번가 ${coords(j).y+1}번지까지 연결`);}
 }
 s.log=s.log.slice(0,25);
}
export function parcelQuote(s,i){
 const t=s.tiles[i];if(!t||t.terrain!=='land'||t.owner==='player')return null;
 if(t.owner==='rival'){if(!TYPES[t.type]?.managed||(s.mode!=='sandbox'&&(s.highestWealth||0)<30000000))return null;const construction=t.constructionCost??developmentQuote(s,i,t.type).construction,land=landPrice(s,i);return{type:t.type,construction,level:t.level,land,total:Math.round((land+construction*t.level)*1.5),premium:1.5,rival:true};}
 const type=!t.type&&!t.owner?'plot':t.owner==='npc'?({home:'rental',shop:'market',tower:'office',factory:'workshop'}[t.type]||(TYPES[t.type]?.group&&t.type!=='atelier'?t.type:null)):null;
 if(!type)return null;
 const construction=type==='plot'?0:t.constructionCost??developmentQuote(s,i,type).construction;
 return{type,construction,level:t.level,land:landPrice(s,i),total:landPrice(s,i)+marketPrice(s,construction*t.level)};
}
export function buyParcel(s,i){
 const q=parcelQuote(s,i);if(!q)return{ok:false,msg:'매입 가능한 빈 땅이나 민간 시설을 선택하세요.'};
 if(s.mode!=='sandbox'&&s.money<q.total)return{ok:false,msg:'부지를 매입할 현금이 부족합니다.'};
 if(s.mode!=='sandbox')s.money-=q.total;
 const wasRival=s.tiles[i].owner==='rival';
 Object.assign(s.tiles[i],{type:q.type,owner:'player',tenure:'buy',deposit:0,constructionCost:q.construction,level:q.level,tree:false,price:100,quality:1,staff:TYPES[q.type].staff,marketing:false,assetLedger:{initial:q.total,upgrades:0,operating:0,since:s.month,estimated:false,buildingValue:q.construction*q.level*.7,valuationMonth:s.month}});
 if(wasRival&&s.rival){s.rival.tiles=s.rival.tiles.filter(j=>j!==i);s.prestige=Math.max(0,(s.prestige||0)+15);}
 awardAssetFame(s,`parcel:${i}`,q.total,TYPES[q.type].name+' 취득');
 const msg=wasRival?`라이벌의 ${TYPES[q.type].name} 인수 · ₲${q.total.toLocaleString()} (프리미엄 50%) · 명성 +15`:`${TYPES[q.type].name} 매입 완료 · ₲${q.total.toLocaleString()}`;s.log.unshift(msg);s.log=s.log.slice(0,25);return{ok:true,msg};
}
export function location(s,i){let residents=0,competition=0,amenity=0;for(let j=0;j<s.tiles.length;j++){const t=s.tiles[j],d=dist(i,j);if(d<=4&&['home','rental','condo'].includes(t.type))residents+=t.level*12;if(d<=4&&['park','garden'].includes(t.type))amenity+=12*t.level;if(d<=4&&j!==i&&t.type===s.tiles[i].type)competition++;}const access=hasRoadAccess(s,i,s.tiles[i].footprint);return{residents,competition,amenity:Math.min(36,amenity),access,boulevard:hasBoulevardAccess(s,i,s.tiles[i].footprint),footfall:Math.round(clamp(35+residents*.32+amenity,20,100))};}
export function footprintCells(i,footprint={width:1,height:1}){
 const {width,height}=footprint||{},p=coords(i);
 if(!Number.isInteger(i)||i<0||i>=SIZE*SIZE||![width,height].every(n=>Number.isInteger(n)&&n>=1&&n<=3)||p.x+width>SIZE||p.y+height>SIZE)return [];
 return Array.from({length:width*height},(_,n)=>i+n%width+Math.floor(n/width)*SIZE);
}
export function buildingAnchor(s,i){return s.tiles[i]?.buildingAnchor??i;}
export function buildingArea(t){return (t.footprint?.width||1)*(t.footprint?.height||1);}
export function buildingAnnualGrowth(t){return .20+(buildingArea(t)-1)*.02;}
export function assetLandValue(s,i){return footprintCells(i,s.tiles[i]?.footprint).reduce((sum,j)=>sum+landPrice(s,j),0);}
// Owner's time: every managed building wants 12 hours of on-site management a month.
// Neglect costs up to 15% of revenue, full attention adds 10%; stress above 65 erodes the effect.
export const ATTENTION_HOURS=12;
export function ownerAttention(s){
 const buildings=s.tiles.filter(t=>t.owner==='player'&&TYPES[t.type]?.managed).length,need=buildings*ATTENTION_HOURS,hours=s.plan.manage||0;
 const ratio=need?clamp(hours/need,0,1):1,health=1-Math.max(0,s.stress-65)*.005;
 return{buildings,need,hours,ratio,health,multiplier:(.85+.25*ratio)*health};
}
// Tourism clusters: hotels, resorts and golf courses within two tiles of each other lift one another; HQ and monument lift everything.
export function synergyReport(s,i,type){
 if(!TYPES[type]?.managed)return{partners:0,hq:false,monument:false,bonus:0};
 let partners=0,hq=false,monument=false;const tourism=['hotel','resort','golf'],cluster=tourism.includes(type);
 for(let j=0;j<s.tiles.length;j++){const t=s.tiles[j];if(t.owner!=='player'||j===i)continue;if(t.type==='hq')hq=true;else if(t.type==='monument')monument=true;else if(cluster&&tourism.includes(t.type)&&dist(i,j)<=2)partners++;}
 partners=Math.min(3,partners);
 return{partners,hq,monument,bonus:partners*.08+(hq?.05:0)+(monument?.1:0)};
}
export function developmentQuote(s,i,type,level=1,footprint=s.tiles[i]?.footprint){
 const cells=footprintCells(i,footprint),view=footprint?{...s,tiles:s.tiles.map((t,j)=>cells.includes(j)?j===i?{...t,type,footprint}:{terrain:'land',type:null,level:1}:t)}:s;
 const d=TYPES[type],loc=location(view,i),{x,y}=coords(i),central=clamp(1-Math.hypot(x-10,y-10)/15,0,1);
 const waterfront=s.tiles.some((t,j)=>t.terrain==='water'&&dist(i,j)<=3);
 const score=clamp(.65*(loc.footfall/100)+.35*central+(type==='resort'?(waterfront?.25:0)+loc.amenity/36*.2:type==='hotel'?loc.amenity/36*.1:0),0,1);
 const area=cells.length||1,factor=(d.managed?.75+score*.6:1)*(loc.access?1:OFF_ROAD.construction),construction=Math.round(d.cost*factor*Math.pow(area,1.05));
 const land=cells.reduce((sum,j)=>sum+(s.tiles[buildingAnchor(s,j)]?.owner==='player'&&s.tiles[buildingAnchor(s,j)].tenure==='buy'?0:landPrice(s,j)),0);
 // Managed revenue rides the business cycle, tourism clusters, the owner's reputation premium and on-site attention.
 const synergy=synergyReport(s,i,type),premium=d.managed?reputationSummary(s).premium:1,cycle=d.managed?cycleFactor(s):1,attention=d.managed?ownerAttention(s):null,boost=cycle*(1+synergy.bonus)*premium*(attention?attention.multiplier:1);
 // Everything except the level multiplier is rounded first, so an expansion always earns an exact multiple of level 1.
 let revenue=Math.round(incomeFactor(s)*d.base*(d.managed?(.55+score*1.15)*boost:1)*Math.pow(area,1.3)*(loc.access?1:OFF_ROAD.revenue)*(type==='office'&&loc.boulevard?BOULEVARD.rent:1))*level,cost=d.upkeep*level*area;
 if(!d.managed&&d.group&&type!=='plot'){
  const virtual={...s,tiles:s.tiles.map((t,j)=>cells.includes(j)?j===i?{terrain:'land',type,owner:'player',tenure:'buy',level,price:100,quality:1,staff:d.staff,marketing:false,footprint}: {terrain:'land',type:'extension',owner:null,level:1,buildingAnchor:i}:t)};
  const report=businessReport(virtual,i);revenue=report.revenue;cost=report.cost;
 }
 revenue=Math.round(revenue);cost=Math.round(cost);
 return{loc,waterfront,score,factor,cells,area,label:score>=.8?'핵심 입지':score>=.55?'인기 입지':'실속 입지',construction,land,total:construction+land,revenue,cost,profit:revenue-cost,synergy,premium,cycle,attention,boost};
}
// Game-only appreciation: annual 20%, with the legacy rate preserved before migration.
export const BUILDING_GROWTH=Math.pow(1.20,1/12)-1;
function buildingValue(s,t){const l=t.assetLedger;if(!l)return(t.constructionCost??TYPES[t.type]?.cost??0)*(.7+(t.level-1)*.5);const months=Math.max(0,s.month-l.valuationMonth),legacy=Math.min(months,Math.max(0,(s.growthStartMonth??s.month)-l.valuationMonth));return l.buildingValue*Math.pow(1.003,legacy)*Math.pow(1+buildingAnnualGrowth(t),(months-legacy)/12);}
export function assetValue(s,i){const t=s.tiles[i];if(t?.owner!=='player')return 0;const market=Math.round((t.tenure==='buy'?assetLandValue(s,i):t.deposit||0)+buildingValue(s,t)*marketFactor(s));if(t.type!=='office')return market;const ledger=assetLedger(s,i);return Math.max(market,Math.round((ledger.initial+ledger.upgrades)*marketFactor(s)));}
export function assetLedger(s,i){
 const t=s.tiles[i],construction=t.constructionCost??TYPES[t.type]?.cost??0;
 return t.assetLedger??{initial:construction+(t.tenure==='buy'?assetLandValue(s,i):t.deposit||0),upgrades:Array.from({length:t.level-1},(_,n)=>Math.round(construction*.8*(n+1))).reduce((a,b)=>a+b,0),operating:0,since:s.month,estimated:true,buildingValue:buildingValue(s,t),valuationMonth:s.month};
}
export function assetSaleReport(s,i){
 const t=s.tiles[i];if(t?.owner!=='player')return null;
 const ledger=assetLedger(s,i),invested=ledger.initial+ledger.upgrades,value=assetValue(s,i),gain=value-ledger.initial,netGain=value-invested,totalGain=netGain+ledger.operating;
 return{...ledger,protectedPrincipal:t.type==='office'&&marketFactor(s)===1,name:TYPES[t.type].name,area:buildingArea(t),annualGrowth:buildingAnnualGrowth(t),invested,value,gain,netGain,totalGain,roi:ledger.initial?gain/ledger.initial*100:null,totalRoi:invested?totalGain/invested*100:null};
}
export function businessReport(s,i,context={}){
 if(TYPES[s.tiles[i].type]?.managed){const t=s.tiles[i],q=developmentQuote(s,i,t.type,t.level),revenue=q.revenue*(t.landmark?10:1),cost=q.cost;return{revenue,cost,profit:revenue-cost,occupancy:Math.round(60+q.score*40),demand:Math.round(q.score*100),wages:0,lease:0,maintenance:cost,goods:0,marketing:0,loc:q.loc,manage:100};}
 const t=s.tiles[i],d=TYPES[t.type],loc=location(s,i),rental=['rental','condo'].includes(t.type),businessCount=context.businessCount??s.tiles.filter(t=>t.owner==='player'&&TYPES[t.type]?.group==='business').length;
 const manage=clamp(s.plan.manage/Math.max(1,businessCount*28),.3,1.2),health=1-Math.max(0,s.stress-65)*.009;
 const price=t.price||100,quality=t.quality||1,staff=t.staff??d.staff,level=t.level;
 const cycle=cycleFactor(s);
 let occupancy=clamp(.84+(loc.amenity*.005)+(loc.footfall-55)*.002-(price-100)*.008, .15,1);
 let demand=clamp((loc.footfall/80)*(1-(price-100)*.009)*(1+(quality-1)*.2)/(1+loc.competition*.17),.1,1.55);
 if(['studio','workshop'].includes(t.type))demand=clamp((.7+s.skill*.009)*(1-(price-100)*.008)*(1+(quality-1)*.16)/(1+loc.competition*.12),.1,1.6);
 const staffing=clamp((staff+manage*.8)/Math.max(1,d.staff+level-1),.15,1.2);
 const area=buildingArea(t),revenue=incomeFactor(s)*(loc.access?1:OFF_ROAD.revenue)*(rental&&loc.boulevard?BOULEVARD.rent:1)*Math.pow(area,1.3)*d.base*(rental?occupancy*cycle:demand*staffing*manage*health*cycle)*(price/100)*(1+(level-1)*.65);
 const wages=staff*390*area,lease=t.tenure==='lease'?Math.round(landPrice(s,i)*.035):0,maintenance=d.upkeep*level*area;
 const marketing=t.marketing?150:0,boost=t.marketing&&!rental?revenue*.18:0;
 const gross=Math.round(revenue+boost),goods=rental?0:gross*(.29+quality*.07),cost=Math.round(goods+wages+lease+maintenance+marketing);
 return{revenue:gross,cost,profit:gross-cost,occupancy:Math.round(occupancy*100),demand:Math.round(demand*100),wages,lease,maintenance,goods:Math.round(goods),marketing,loc,manage:Math.round(manage*100)};
}
export function analyze(s){
 const owned=s.tiles.map((t,i)=>({t,i})).filter(({t})=>t.owner==='player'),businessCount=owned.filter(({t})=>TYPES[t.type]?.group==='business').length;
 const reports={};let revenue=0,expense=0,assets=0;
 for(const{t,i}of owned){assets+=assetValue(s,i);if(t.type){const r=businessReport(s,i,{businessCount});reports[i]=r;revenue+=r.revenue;expense+=r.cost;}}
 const career=wageQuote(s),wage=career.wage,investment=investmentReport(s);
 const lifestyleCosts=lifestyleCostReport(s),living=lifestyleCosts.total,tuition=s.plan.learn*4,interest=Math.round(s.debt*.012),stocks=STOCKS.reduce((sum,k)=>sum+s.holdings[k.id]*s.prices[k.id],0);
 const compound=compoundSummary(s),creative=projectReport(s),empire=empireSummary(s),bonus=s.effect?.bonus||0,net=wage+revenue-expense-living-tuition-interest+bonus+creative.income+investment.dividends+empire.income+(compound.auto?0:compound.income);
 const inventory=journeyInventoryValue(s),art=artPortfolio(s),wealth=acquisitionSummary(s).assets+s.money+assets+stocks+inventory+empire.assets+art.value+compoundSummary(s).assets-s.debt,connected=new Set();s.tiles.forEach((t,i)=>{if(t.type==='road')connected.add(i);});
 return{inventory,art,lifestyleCosts,career,investment,creative,empire,economy:economyReport(s),compound,owned,reports,businessCount,revenue,expense,assets,wage,living,tuition,interest,stocks,bonus,net,wealth,passive:owned.filter(({t})=>TYPES[t.type]?.group==='property').reduce((n,{i})=>n+reports[i].profit,0)+empire.income,free:160-s.plan.work-s.plan.manage-s.plan.learn-(s.plan.create||0)-(s.plan.inspect||0)-(s.plan.curate||0),attention:ownerAttention(s),connected,active:s.tiles.map(()=>true),details:s.tiles.map((t,i)=>{const l=location(s,i);return{connected:l.access,pollution:100-l.footfall,value:Math.round(landPrice(s,i)/80),education:l.residents>40,health:l.amenity>0,fire:t.owner==='player'};})};
}
export function canBuild(s,i,type,tenure='lease',footprint){
 if(footprint){
  const cells=footprintCells(i,footprint),d=TYPES[type];
  if(!cells.length)return'가로·세로 1~3칸, 지도 안쪽 부지를 선택하세요.';
  if(!d?.group||['plot','atelier'].includes(type))return'건설 가능한 사업을 선택하세요.';
  if(tenure!=='buy')return'통합 부지는 토지를 소유해야 건설할 수 있습니다.';
  for(const j of cells){const t=s.tiles[j],root=s.tiles[buildingAnchor(s,j)];
   if(t.terrain!=='land'||t.type==='road'||(t.type&&t.type!=='extension'&&!TYPES[t.type]?.group&&!parcelQuote(s,j)))return'강·도로·공공시설은 건설 부지에 포함할 수 없습니다.';
   if((t.type||t.owner)&&!(root.owner==='player'&&root.tenure==='buy'))return'부지 안의 기존 건물을 먼저 매입하세요.';
   if(root.footprint&&!footprintCells(buildingAnchor(s,j),root.footprint).every(k=>cells.includes(k)))return'기존 통합 건물의 부지를 전부 포함해야 재건축할 수 있습니다.';
   if(root.type==='atelier')return'작업실은 먼저 정리한 뒤 건설하세요.';
  }
  if(s.mode!=='sandbox'&&(d.unlock||0)>s.highestWealth)return'이 건물을 해금할 순자산이 부족합니다.';
  if(d.unique&&s.tiles.some((t,j)=>t.owner==='player'&&t.type===type&&!cells.includes(j)))return`${d.name}은(는) 도시에 하나만 세울 수 있습니다.`;
  if(s.mode!=='sandbox'&&s.money<developmentQuote(s,i,type,1,footprint).total)return'현금이 부족합니다.';
  return null;
 }
 const t=s.tiles[i],d=TYPES[type];if(!t||!d?.group||type==='plot')return'건설 가능한 사업을 선택하세요.';if(t.terrain==='water')return'강 위에는 건설할 수 없습니다.';if((t.type||t.owner)&&!(t.type==='plot'&&t.owner==='player'&&tenure==='buy'))return'이미 사용 중인 부지입니다. 빈 땅을 선택하세요.';
 if(s.mode!=='sandbox'&&(d.unlock||0)>s.highestWealth)return`최고 순자산 ₲${d.unlock.toLocaleString()} 달성 시 해금됩니다.`;
 if(d.unique&&s.tiles.some(t=>t.owner==='player'&&t.type===type))return`${d.name}은(는) 도시에 하나만 세울 수 있습니다.`;
 if(!['buy','lease'].includes(tenure))return'계약 방식을 선택하세요.';if(d.group==='property'&&tenure==='lease')return'임대 자산은 토지를 매입해야 건설할 수 있습니다.';
 const land=developmentQuote(s,i,type).land,cost=developmentQuote(s,i,type).construction+(tenure==='buy'?land:Math.round(land*.2));if(s.mode!=='sandbox'&&s.money<cost)return'현금이 부족합니다. 임차 창업이나 대출을 고려하세요.';return null;
}
export function build(s,i,type,tenure='lease',footprint){
 if(footprint){
  const error=canBuild(s,i,type,tenure,footprint);if(error)return{ok:false,msg:error};
  s.growthStartMonth??=s.month;
  const q=developmentQuote(s,i,type,1,footprint),ledgers=q.cells.filter(j=>s.tiles[j].owner==='player').map(j=>assetLedger(s,j));
  if(s.mode!=='sandbox')s.money-=q.total;
  for(const j of q.cells)s.tiles[j]={terrain:'land',type:'extension',owner:null,level:1,tree:false,buildingAnchor:i};
  s.tiles[i]={terrain:'land',type,owner:'player',tenure:'buy',deposit:0,constructionCost:q.construction,footprint:{...footprint},level:1,tree:false,price:100,quality:1,staff:TYPES[type].staff,marketing:false,
   assetLedger:{initial:q.total+ledgers.reduce((n,l)=>n+l.initial,0),upgrades:ledgers.reduce((n,l)=>n+l.upgrades,0),operating:ledgers.reduce((n,l)=>n+l.operating,0),since:Math.min(s.month,...ledgers.map(l=>l.since)),estimated:ledgers.some(l=>l.estimated),buildingValue:q.construction*.7*Math.pow(q.area,.15),valuationMonth:s.month}};
  
  connectBuildingRoad(s,i);
  s.log.unshift(`${TYPES[type].name} ${q.area}칸 통합 건설 · ₲${q.total.toLocaleString()} 투자`);s.log=s.log.slice(0,25);awardAssetFame(s,`parcel:${i}`,q.total,TYPES[type].name+' 취득');return{ok:true,msg:`${q.area}칸 ${TYPES[type].name} 건설 완료!`};
 }

 const error=canBuild(s,i,type,tenure);if(error)return{ok:false,msg:error};const previous=s.tiles[i].type==='plot'?assetLedger(s,i):null,land=developmentQuote(s,i,type).land,deposit=tenure==='lease'?Math.round(land*.2):0,constructionCost=developmentQuote(s,i,type).construction,cost=constructionCost+(tenure==='buy'?land:deposit);if(s.mode!=='sandbox')s.money-=cost;Object.assign(s.tiles[i],{type,owner:'player',tenure,deposit,constructionCost,assetLedger:{initial:cost+(previous?.initial||0),upgrades:0,operating:0,since:previous?.since??s.month,estimated:previous?.estimated||false,buildingValue:constructionCost*.7,valuationMonth:s.month},level:1,tree:false,price:100,quality:1,staff:TYPES[type].staff,marketing:false});connectBuildingRoad(s,i);s.log.unshift(`${TYPES[type].name} ${tenure==='buy'?'매입':'임차'} 창업 · ${cost.toLocaleString()}G 투자`);s.log=s.log.slice(0,25);awardAssetFame(s,`parcel:${i}`,cost,TYPES[type].name+' 취득');return{ok:true,msg:'계약 완료! 운영 설정에서 수익 전략을 정해보세요.'};
}
export function sellAsset(s,i){i=buildingAnchor(s,i);const t=s.tiles[i],report=assetSaleReport(s,i);if(!report)return{ok:false,msg:'내 자산만 매각할 수 있습니다.'};s.money+=report.value;for(const j of footprintCells(i,t.footprint))if(j!==i)s.tiles[j]={terrain:'land',type:null,owner:null,level:1,tree:false};delete t.footprint;Object.assign(t,{type:null,owner:null,level:1,tree:false});delete t.assetLedger;delete t.landmark;const msg=`${report.name} 매각 · ₲${report.value.toLocaleString()} 회수 · ${report.estimated?'추정 ':''}최초 투자금 대비 매각 손익 ${report.gain>=0?'+':''}₲${Math.round(report.gain).toLocaleString()}`;s.log.unshift(msg);s.log=s.log.slice(0,25);return{ok:true,msg,report};}
export function upgrade(s,i){i=buildingAnchor(s,i);const t=s.tiles[i];if(t?.owner!=='player'||!t.type||t.type==='plot'||t.level>=3)return{ok:false,msg:'더 확장할 수 없습니다.'};const construction=t.constructionCost??TYPES[t.type].cost,cost=Math.round(construction*.8*t.level);if(s.mode!=='sandbox'&&s.money<cost)return{ok:false,msg:'확장 자금이 부족합니다.'};t.assetLedger??=assetLedger(s,i);t.assetLedger.buildingValue=buildingValue(s,t)+construction*.5*Math.pow(buildingArea(t),.15);t.assetLedger.valuationMonth=s.month;t.assetLedger.upgrades+=cost;if(s.mode!=='sandbox')s.money-=cost;t.level++;return{ok:true,msg:'확장 완료. 직원과 운영 시간을 함께 점검하세요.'};}
export function trade(s,id,qty){if(!STOCKS.some(k=>k.id===id)||!Number.isInteger(qty)||!qty)return{ok:false,msg:'수량을 확인하세요.'};const value=s.prices[id]*qty,fee=Math.abs(value)*.005;if(qty>0&&s.money<value+fee)return{ok:false,msg:'매수할 현금이 부족합니다.'};if(s.holdings[id]+qty<0)return{ok:false,msg:'보유 수량이 부족합니다.'};recordTrade(s,id,qty,value,fee);s.money-=value+fee;s.holdings[id]+=qty;return{ok:true,msg:`${qty>0?'매수':'매도'} 완료 · 수수료 0.5%`};}
export function setPlan(s,key,value){if(!['work','manage','learn','create','inspect','curate'].includes(key)||!Number.isInteger(value)||value<0)return false;const other=Object.entries(s.plan).reduce((n,[k,v])=>n+(k===key?0:v),0);s.plan[key]=clamp(value,0,160-other);return true;}
export function chooseEvent(s,n){const o=s.event?.options[n];if(!o)return{ok:false,msg:'선택할 안건이 없습니다.'};if(s.mode!=='sandbox'&&s.money<(o.cost||0))return{ok:false,msg:'현금이 부족합니다. 비용 없는 대안을 선택할 수 있습니다.'};if(s.event.id){applyRichChoice(s,o);s.event=null;s.log.unshift('✎ 결정 · '+o.label);s.log=s.log.slice(0,25);return{ok:true,msg:o.label+' · 결정이 반영되었습니다.'};}if(s.mode!=='sandbox')s.money-=o.cost;s.stress=clamp(s.stress+(o.stress||0),0,100);s.skill=clamp(s.skill+(o.skill||0),0,100);s.effect={bonus:o.bonus||0,remaining:2};s.event=null;return{ok:true,msg:o.label+' · 결정이 반영되었습니다.'};}
// Liquidity crisis: negative cash forces distressed sales at 70%; three months in a row is a restructuring.
function fireSale(s){
 if(s.concept!=='rich-life'||s.mode==='sandbox')return null;
 if(s.money>=0){s.crisisMonths=0;return null;}
 s.crisisMonths=(s.crisisMonths||0)+1;const items=[];
 // Liquid first: stocks go at a 3% haircut, then compound accounts, buildings and art at 70%.
 for(const k of STOCKS){if(s.money>=0)break;const qty=s.holdings[k.id],price=s.prices[k.id];if(!qty)continue;const sell=Math.min(qty,Math.ceil(-s.money/(price*.97))),value=-price*sell,fee=Math.abs(value)*.03;recordTrade(s,k.id,-sell,value,fee);s.money-=value+fee;s.holdings[k.id]-=sell;items.push({name:`${k.name} 주식 ${sell}주`,value:Math.round(-value-fee)});}
 if(s.money<0&&s.compound)for(const id of Object.keys(COMPOUND_ASSETS)){if(s.money>=0)break;const balance=s.compound.balances[id];if(!balance)continue;const take=Math.min(balance,Math.ceil(-s.money/.7));s.compound.balances[id]-=take;s.money+=Math.round(take*.7);items.push({name:COMPOUND_ASSETS[id].name+' 계좌',value:Math.round(take*.7)});}
 const owned=s.tiles.map((t,i)=>i).filter(i=>s.tiles[i].owner==='player').sort((a,b)=>assetValue(s,a)-assetValue(s,b));
 for(const i of owned){if(s.money>=0)break;const r=sellAsset(s,i);if(!r.ok)continue;const haircut=Math.round(r.report.value*.3);s.money-=haircut;items.push({name:r.report.name,value:r.report.value-haircut});}
 if(s.money<0&&s.artCollection?.owned.length){const owned=[...s.artCollection.owned].sort((a,b)=>a.price-b.price);for(const item of owned){if(s.money>=0)break;const d=ARTWORKS[item.id],value=Math.round(marketPrice(s,item.price)*Math.pow(1+d.annualRate,(item.grown??Math.max(0,s.month-item.boughtMonth))/12)*.7);s.money+=value;s.artCollection.owned=s.artCollection.owned.filter(x=>x.id!==item.id);items.push({name:`〈${d.name}〉`,value});}}
 if(items.length){s.fireSales=(s.fireSales||0)+1;s.log.unshift(`⚠ 급매 처분 · ${items.map(i=>i.name).join(', ')} · ₲${items.reduce((n,i)=>n+i.value,0).toLocaleString('ko-KR')} 회수 (시세의 70%)`);}
 const restructure=s.crisisMonths>=3;
 if(restructure){s.crisisMonths=0;s.prestige=Math.max(0,(s.prestige||0)-50);s.log.unshift('⚠ 구조조정 · 3개월 연속 현금 부족 · 명성 −50');}
 return{items,restructure};
}
export function tick(s){
 if(s.event||s.shift)return analyze(s);ensureEconomy(s);const previousMarket=marketFactor(s),rich=s.concept==='rich-life',chapterBefore=rich?chapterOf(s).n:0;s.growthStartMonth??=s.month;const a=analyze(s);for(const {t,i} of a.owned){t.assetLedger??=assetLedger(s,i);t.assetLedger.operating+=a.reports[i]?.profit||0;}s.money+=a.net;advanceProjects(s);if(s.empire){s.empire.acquiredMonths??={};for(const id of s.empire.owned)s.empire.acquiredMonths[id]??=s.month;}settleCompound(s);s.month++;
 const crashed=advanceEconomy(s);
 advanceNeighborhood(s);
 advanceVentures(s);
 s.skill=clamp(s.skill+s.plan.learn*.08,0,100);s.stress=clamp(s.stress+(s.plan.work+s.plan.manage+(s.plan.create||0)+(s.plan.inspect||0)+(s.plan.curate||0))*.06-a.free*.3-3,0,100);
 // Curation: artworks only appreciate in months the owner spends at least 8 hours with the collection.
 if(rich&&s.artCollection?.owned.length){const curated=(s.plan.curate||0)>=8;for(const item of s.artCollection.owned){item.grown??=Math.max(0,s.month-1-item.boughtMonth);if(curated)item.grown++;}if(curated)s.prestige=Math.max(0,(s.prestige||0)+2);}
 settleOwnerBenefits(s);
 for(const k of STOCKS){const phase=s.seed+k.base,cycle=m=>Math.sin(m*Math.PI/6+phase),factor=Math.pow(1+k.annualRate,1/12)*Math.exp(k.risk*(cycle(s.month)-cycle(s.month-1)));s.prices[k.id]=Math.max(5,Math.round(s.prices[k.id]*(crashed?1:factor)*marketFactor(s)/previousMarket*100)/100);}
 if(s.effect&&--s.effect.remaining<=0)s.effect=null;
 const pending=rich?resolvePending(s):[];
 if(rich)settlePrestige(s);
 const rivalEvents=rich?advanceRival(s,a.wealth):[];
 const crisis=fireSale(s);
 s.lastReport={compoundIncome:compoundSummary(s).last,compoundReinvested:s.compound?.auto?compoundSummary(s).last:0,compoundShock:s.compound?.lastShock||null,dividends:a.investment.dividends,ownerIncome:a.empire.income,luxuryMaintenance:a.lifestyleCosts.maintenance,creative:a.creative.income,month:s.month,wage:a.wage,revenue:a.revenue,expense:a.expense,living:a.living,tuition:a.tuition,interest:a.interest,bonus:a.bonus,net:a.net,economy:economyReport(s).label,pending,rival:rivalEvents,fireSale:crisis?.items?.length?crisis.items:null,restructure:!!crisis?.restructure};
 const after=analyze(s);s.highestWealth=Math.max(s.highestWealth,after.wealth);
 for(const m of rich?RICH_GOALS:MILESTONES)if(after.wealth>=m.wealth&&!s.milestones.includes(m.wealth)){s.milestones.push(m.wealth);s.log.unshift(`✦ ${m.name} 달성! 순자산 ₲${m.wealth.toLocaleString()}`);}
 if(rich){const chapter=chapterOf(s);if(chapter.n>chapterBefore){s.lastReport.chapterUp=chapter.n;s.log.unshift(`✦ CHAPTER ${chapter.n} · ${chapter.name} 진입! ${chapter.unlocks[0]} 해금`);}
  if(!s.ending&&(s.month>=120||s.highestWealth>=300000000)){s.ending=endingReport(s,after);s.log.unshift(`✦ 레거시 엔딩 · ${s.ending.grade}등급 · ${s.ending.score.toLocaleString('ko-KR')}점`);}}
 s.history.push({prices:{...s.prices},month:s.month,wealth:Math.round(after.wealth),money:Math.round(s.money),net:a.net});s.history=s.history.slice(-36);
 if(rich){scheduleRichEvent(s,{wealth:after.wealth,fame:reputationSummary(s).fame})||rivalOffer(s,after.wealth);}
 else if(EVENTS.length&&s.month%6===0)s.event=EVENTS[(Math.floor(s.month/6)-1)%EVENTS.length];
 if(s.money<0)s.log.unshift('현금 부족: 적자 사업을 정리하거나 근로 시간을 늘려 현금흐름을 회복하세요.');else s.log.unshift(`${s.month}개월 차 결산 · ${a.net>=0?'+':''}${Math.round(a.net).toLocaleString()}G · 순자산 ${Math.round(after.wealth).toLocaleString()}G · 경기 ${economyReport(s).label}`);
 s.log=s.log.slice(0,25);return after;
}
export function validSave(s){
 if(!validEconomy(s)||!validLandmarks(s))return false;
 if(s?.growthStartMonth!==undefined&&(!Number.isInteger(s.growthStartMonth)||s.growthStartMonth<0||s.growthStartMonth>s.month))return false;
 if(Array.isArray(s?.tiles)&&!s.tiles.every(t=>t?.assetLedger===undefined||(t.assetLedger&&['initial','upgrades','buildingValue'].every(k=>Number.isFinite(t.assetLedger[k])&&t.assetLedger[k]>=0)&&Number.isFinite(t.assetLedger.operating)&&['since','valuationMonth'].every(k=>Number.isInteger(t.assetLedger[k])&&t.assetLedger[k]>=0&&t.assetLedger[k]<=s.month)&&typeof t.assetLedger.estimated==='boolean')))return false;
 if(!s||!validReputation(s)||!validAcquisitions(s)||!validCompound(s)||!validFlex(s)||!validArt(s)||!validRichLife(s)||!validVentures(s)||!validEmpire(s))return false;
 if(!s||!validShift(s)||!validProjects(s)||!validCareer(s)||!validInvestment(s)||!validRewards(s)||!validJourney(s)||s.version!==2||!['standard','sandbox'].includes(s.mode)||typeof s.name!=='string'||s.name.length>40)return false;
 if(!['money','month','debt','skill','stress','seed','highestWealth'].every(k=>Number.isFinite(s[k]))||!Number.isInteger(s.month)||s.month<0||s.debt<0||s.skill<0||s.skill>100||s.stress<0||s.stress>100)return false;
 if(!['create','inspect','curate'].every(k=>s.plan?.[k]===undefined||(Number.isInteger(s.plan[k])&&s.plan[k]>=0)))return false;
 if(!s.plan||!['work','manage','learn'].every(k=>Number.isInteger(s.plan[k])&&s.plan[k]>=0)||Object.values(s.plan).reduce((a,b)=>a+b,0)>160)return false;
 if(!s.holdings||!s.prices||!STOCKS.every(k=>Number.isInteger(s.holdings[k.id])&&s.holdings[k.id]>=0&&Number.isFinite(s.prices[k.id])&&s.prices[k.id]>0))return false;
 if(!Array.isArray(s.tiles)||s.tiles.length!==SIZE*SIZE||!s.tiles.every(t=>t&&['land','water'].includes(t.terrain)&&(t.type===null||Object.hasOwn(TYPES,t.type))&&[null,'npc','player','rival'].includes(t.owner)&&Number.isInteger(t.level)&&t.level>=1&&t.level<=3))return false;
 if(!s.tiles.every((t,i)=>{
  if(t.footprint!==undefined){const cells=footprintCells(i,t.footprint);if(t.terrain!=='land'||t.owner!=='player'||t.tenure!=='buy'||!TYPES[t.type]?.group||['plot','atelier'].includes(t.type)||!cells.length||!cells.every(j=>j===i||s.tiles[j].type==='extension'&&s.tiles[j].buildingAnchor===i))return false;}
  if(t.type==='extension'){const root=s.tiles[t.buildingAnchor];return Number.isInteger(t.buildingAnchor)&&t.buildingAnchor!==i&&t.terrain==='land'&&t.owner===null&&t.assetLedger===undefined&&t.footprint===undefined&&root?.footprint!==undefined&&root.owner==='player'&&footprintCells(t.buildingAnchor,root.footprint).includes(i);}
  return t.buildingAnchor===undefined;
 }))return false;
 if(!s.tiles.every(t=>t.constructionCost===undefined||(Number.isFinite(t.constructionCost)&&t.constructionCost>=0)))return false; if(!s.tiles.every(t=>t.owner!=='player'||(TYPES[t.type]?.group&&['buy','lease'].includes(t.tenure)&&Number.isFinite(t.deposit)&&t.deposit>=0&&Number.isInteger(t.price)&&t.price>=60&&t.price<=160&&Number.isInteger(t.quality)&&t.quality>=1&&t.quality<=3&&Number.isInteger(t.staff)&&t.staff>=0&&t.staff<=8&&typeof t.marketing==='boolean')))return false;
 if(!Array.isArray(s.log)||s.log.length>25||!s.log.every(l=>typeof l==='string')||!Array.isArray(s.history)||s.history.length>36||!s.history.every(h=>['month','wealth','money','net'].every(k=>Number.isFinite(h[k]))))return false;
 if(!Array.isArray(s.milestones)||!s.milestones.every(v=>[...MILESTONES,...RICH_GOALS].some(m=>m.wealth===v)))return false;
 if(s.effect&&(!Number.isFinite(s.effect.bonus)||!Number.isInteger(s.effect.remaining)||s.effect.remaining<1||s.effect.remaining>12||(s.effect.multiplier!==undefined&&!(Number.isFinite(s.effect.multiplier)&&s.effect.multiplier>0&&s.effect.multiplier<=3))))return false;
 if(s.event&&!(s.event.id?validRichEvent(s):EVENTS.some(e=>JSON.stringify(e)===JSON.stringify(s.event))))return false;
 if(!validPending(s)||!validRival(s)||!validLegacy(s))return false;
 if(s.lastReport&&!['month','wage','revenue','expense','living','tuition','interest','bonus','net'].every(k=>Number.isFinite(s.lastReport[k])))return false;return true;
}
