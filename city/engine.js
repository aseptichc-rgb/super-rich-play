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
import {advanceVentures,validVentures,repairVentureNames} from './venture.js';
import {empireSummary,validEmpire,settleOwnerBenefits} from './empire.js';
import {acquisitionSummary,validAcquisitions} from './acquisitions.js';
import {lifestyleCostReport} from './living-costs.js';
// Personal wealth simulation. All money is fictional G; one tick is one month.
export const SIZE=26,SAVE_KEY='super-rich-life-v2';
export const TYPES={
 extension:{name:'Combined building lot',color:'#c8bb88'},
 golf:{name:'Golf Course',group:'property',icon:'⛳',cost:1000000,upkeep:18000,color:'#78aa58',shape:'golf',base:100000,staff:0,managed:true,desc:'A golf course with a clubhouse and full course. Green-fee income depends on location · Runs automatically · Expands up to 3 tiers.'},
 plot:{name:'Owned Lot',group:'land',icon:'▱',cost:0,upkeep:0,color:'#c8bb88',base:0,staff:0,desc:'Empty land you bought early. It never auto-develops, so build whatever you like here.'},
 hotel:{name:'Hotel',group:'property',icon:'🏨',cost:250000,upkeep:5000,color:'#d6b16c',shape:'shop',base:20000,staff:0,managed:true,desc:'Opens as soon as it is built! Profit depends on location and the economy · Clustering with nearby hotels and resorts lifts revenue.'},
 resort:{name:'Resort',group:'property',icon:'🏝',cost:600000,upkeep:10000,color:'#6fb8ab',shape:'home',base:56000,staff:0,managed:true,unlock:10000000,desc:'Unlocks in the Developer chapter (peak net worth ₲10,000,000). Earns more near the river and parks · Runs itself and pays profit in cash.'},
 office:{name:'Office Building',group:'property',icon:'🏢',cost:350000,upkeep:5000,color:'#85aabe',shape:'tower',base:28000,staff:0,managed:true,desc:'Your own building paying rent every month. More foot traffic means higher rent · Vacancies rise and rent falls in a bust.'},
 hq:{name:'HQ Tower',group:'property',icon:'🏛',cost:5000000,upkeep:80000,color:'#c9a24a',shape:'tower',base:220000,staff:0,managed:true,unlock:30000000,unique:true,desc:'Unlocks in the Tycoon chapter (peak net worth ₲30,000,000). All managed assets +5% revenue while owned · Reputation +10 monthly · Only one per city.'},
 monument:{name:'City Monument',group:'property',icon:'✦',cost:30000000,upkeep:300000,color:'#e0c46a',shape:'tower',base:900000,staff:0,managed:true,unlock:150000000,unique:true,desc:'Unlocks in the Legacy chapter (peak net worth ₲150,000,000). Managed assets +10% revenue · Reputation +30 monthly · Legacy score 800 · Only one per city.'},
 atelier:{name:'My Workshop',group:'homebase',icon:'⚒',cost:1200,upkeep:35,color:'#e3ad69',shape:'school',base:0,staff:0,desc:'The workshop from your first deal. On-site repair costs −20% · Creative output +15%. Charges monthly rent.'},
 cafe:{name:'Cafe',group:'business',icon:'♨',cost:2400,upkeep:240,color:'#d1aa85',shape:'shop',base:2400,staff:1,desc:'Thrives where foot traffic is high. You set the price, quality and staff count.'},
 market:{name:'Corner Market',group:'business',icon:'▤',cost:4200,upkeep:380,color:'#86b7a4',shape:'shop',base:3800,staff:2,desc:'Steady revenue near homes. Keep labor and goods costs under control.'},
 studio:{name:'Design Studio',group:'business',icon:'✧',cost:3500,upkeep:180,color:'#b3a6ca',shape:'school',base:3100,staff:1,desc:'Skill makes the money here. Raise your skill through study and contract revenue grows.'},
 workshop:{name:'Maker Workshop',group:'business',icon:'⚒',cost:5000,upkeep:320,color:'#d8bb7c',shape:'factory',base:4200,staff:2,desc:'Barely depends on foot traffic; skill and quality matter most.'},
 rental:{name:'Rental House',group:'property',icon:'⌂',cost:7000,upkeep:90,color:'#b2c498',shape:'home',base:620,staff:0,desc:'Buy the land, then build. Higher rent means more vacancies.'},
 condo:{name:'Rental Apartments',group:'property',icon:'▥',cost:18000,upkeep:230,color:'#88b8cb',shape:'shop',base:1800,staff:0,unlock:50000,desc:'Unlocks at peak net worth ₲50,000. A big investment with high rental income.'},
 garden:{name:'Private Garden',group:'property',icon:'♣',cost:1600,upkeep:35,color:'#80ae77',shape:'park',base:0,staff:0,desc:'Boosts your businesses and rental appeal within 4 tiles. The garden itself earns nothing.'},
 home:{name:'Homes',color:'#afc897'},shop:{name:'Shop',color:'#8abcc4'},factory:{name:'Logistics Co.',color:'#c8b38a'},park:{name:'Park',color:'#83b17b'},hall:{name:'Community Center',color:'#eee0b8'},wind:{name:'Wind Farm',color:'#dbe4d6'},water:{name:'Water Tower',color:'#8fbcc6'},school:{name:'School',color:'#d9b699'},clinic:{name:'Hospital',color:'#e0b2a5'},fire:{name:'Fire Station',color:'#c99580'},road:{name:'Road',color:'#8b988d'},plaza:{name:'Plaza',color:'#b6a3cf'},tower:{name:'Office',color:'#d7cfb0'}
};
export const STOCKS=[{id:'local',name:'Town Retail',base:100,risk:.06,annualRate:.20},{id:'tech',name:'Next Tech',base:160,risk:.13,annualRate:.30},{id:'estate',name:'River REIT',base:80,risk:.035,annualRate:.10}];
export const MILESTONES=[{wealth:20000,name:'First Fortune'},{wealth:50000,name:'Local Entrepreneur'},{wealth:100000,name:'Asset Portfolio'},{wealth:300000,name:'Super Rich'}];
export const EVENTS=[];
// Retained only to recognize and clear pending events in older saves.
const RETIRED_EVENTS=[
 {title:'Industry networking invite',text:'A chance to meet new clients and partners. Invest in growth, or in some breathing room?',options:[{label:'Attend and learn',cost:450,skill:8,stress:4,desc:'Spend ₲450 · Skill +8 · Stress +4'},{label:'Take a proper rest',cost:0,skill:0,stress:-12,desc:'No cost · Stress −12'}]},
 {title:'A bulk order came in',text:'A local event wants a bulk order. It needs upfront spending and extra operating hours.',options:[{label:'Take the order',cost:500,bonus:420,stress:8,desc:'Spend ₲500 now · Business profit +₲420 over 2 months · Stress +8'},{label:'Focus on current customers',cost:0,bonus:0,stress:-6,desc:'No extra spending · Stress −6'}]},
 {title:'Group buy on supplies',text:'Buy the next two months of stock together and get a discount.',options:[{label:'Prepay',cost:400,bonus:280,stress:0,desc:'Spend ₲400 now · Business profit +₲280 over 2 months'},{label:'Keep the cash',cost:0,bonus:0,stress:0,desc:'No extra spending or profit'}]}
];
export function migrateSave(s){
 if(s){ensureEconomy(s);s.growthStartMonth??=s.month;if(s.tiles?.length===SIZE*SIZE)installBoulevards(s);repairVentureNames(s);}
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
 return{economy:ensureEconomy({month:0,seed}),version:2,growthStartMonth:0,name:'Riverside',mode,seed,tiles,money:12000,debt:0,month:0,skill:10,stress:12,plan:{work:80,manage:40,learn:20,create:0},career:'flexible',costBasis:{local:0,tech:0,estate:0},realizedGains:0,holdings:{local:0,tech:0,estate:0},prices:{local:100,tech:160,estate:80},history:[],log:['You\'ve arrived in Riverside. Work to build seed money and pick a spot for your first shop.'],event:null,effect:null,highestWealth:12000,milestones:[],lastReport:null};
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
   s.log.unshift(`Road auto-connected · ${count} tiles extended to (${coords(i).x+1}, ${coords(i).y+1})`);
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
  s.log.unshift(`Neighborhood growth · ${TYPES[type].name} completed at (${coords(i).x+1}, ${coords(i).y+1})`);
 }
 // Each six additional buildings supports one new connected road tile.
 const buildings=s.tiles.filter(t=>t.type&&!['road','plot','extension','garden','park'].includes(t.type)).length;
 const roads=s.tiles.filter((t,i)=>t.type==='road'&&!(t.boulevard&&(coords(i).x<3||coords(i).x>19||coords(i).y<3||coords(i).y>21))).length;
 if(s.month%3===0&&buildings>=34+Math.max(0,roads-99)*6){
  const extensions=s.tiles.map((t,j)=>j).filter(j=>vacant(j)&&neighbors(j).some(n=>s.tiles[n].type==='road')&&neighbors(j).some(vacant));
  const score=j=>neighbors(j).filter(vacant).length*20+s.tiles.reduce((n,t,k)=>n+(t.type&&!['road','plot'].includes(t.type)&&dist(j,k)<=3?1:0),0)+roll(j)*10;
  extensions.sort((a,b)=>score(b)-score(a));
  if(extensions.length){const j=extensions[0];Object.assign(s.tiles[j],{type:'road',owner:'npc',level:1,tree:false});s.log.unshift(`Road extended · Connected to (${coords(j).x+1}, ${coords(j).y+1})`);}
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
 const q=parcelQuote(s,i);if(!q)return{ok:false,msg:'Select an empty lot or private building that\'s for sale.'};
 if(s.mode!=='sandbox'&&s.money<q.total)return{ok:false,msg:'Not enough cash to buy this lot.'};
 if(s.mode!=='sandbox')s.money-=q.total;
 const wasRival=s.tiles[i].owner==='rival';
 Object.assign(s.tiles[i],{type:q.type,owner:'player',tenure:'buy',deposit:0,constructionCost:q.construction,level:q.level,tree:false,price:100,quality:1,staff:TYPES[q.type].staff,marketing:false,assetLedger:{initial:q.total,upgrades:0,operating:0,since:s.month,estimated:false,buildingValue:q.construction*q.level*.7,valuationMonth:s.month}});
 if(wasRival&&s.rival){s.rival.tiles=s.rival.tiles.filter(j=>j!==i);s.prestige=Math.max(0,(s.prestige||0)+15);}
 awardAssetFame(s,`parcel:${i}`,q.total,TYPES[q.type].name+' acquired');
 const msg=wasRival?`Acquired rival's ${TYPES[q.type].name} · ₲${q.total.toLocaleString()} (50% premium) · Reputation +15`:`${TYPES[q.type].name} purchased · ₲${q.total.toLocaleString()}`;s.log.unshift(msg);s.log=s.log.slice(0,25);return{ok:true,msg};
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
 return{loc,waterfront,score,factor,cells,area,label:score>=.8?'Prime location':score>=.55?'Popular location':'Value location',construction,land,total:construction+land,revenue,cost,profit:revenue-cost,synergy,premium,cycle,attention,boost};
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
  if(!cells.length)return'Select a lot 1–3 tiles wide and tall, inside the map.';
  if(!d?.group||['plot','atelier'].includes(type))return'Select a business you can build.';
  if(tenure!=='buy')return'You must own the land to build on a combined lot.';
  for(const j of cells){const t=s.tiles[j],root=s.tiles[buildingAnchor(s,j)];
   if(t.terrain!=='land'||t.type==='road'||(t.type&&t.type!=='extension'&&!TYPES[t.type]?.group&&!parcelQuote(s,j)))return'River, road and public tiles can\'t be part of a building lot.';
   if((t.type||t.owner)&&!(root.owner==='player'&&root.tenure==='buy'))return'Buy the existing buildings inside the lot first.';
   if(root.footprint&&!footprintCells(buildingAnchor(s,j),root.footprint).every(k=>cells.includes(k)))return'Include the entire lot of the existing combined building to rebuild it.';
   if(root.type==='atelier')return'Clear out the workshop before building here.';
  }
  if(s.mode!=='sandbox'&&(d.unlock||0)>s.highestWealth)return'Your net worth is too low to unlock this building.';
  if(d.unique&&s.tiles.some((t,j)=>t.owner==='player'&&t.type===type&&!cells.includes(j)))return`${d.name} can only be built once per city.`;
  if(s.mode!=='sandbox'&&s.money<developmentQuote(s,i,type,1,footprint).total)return'Not enough cash.';
  return null;
 }
 const t=s.tiles[i],d=TYPES[type];if(!t||!d?.group||type==='plot')return'Select a business you can build.';if(t.terrain==='water')return'You can\'t build on water.';if((t.type||t.owner)&&!(t.type==='plot'&&t.owner==='player'&&tenure==='buy'))return'This lot is already in use. Pick an empty one.';
 if(s.mode!=='sandbox'&&(d.unlock||0)>s.highestWealth)return`Unlocks once peak net worth reaches ₲${d.unlock.toLocaleString()}.`;
 if(d.unique&&s.tiles.some(t=>t.owner==='player'&&t.type===type))return`${d.name} can only be built once per city.`;
 if(!['buy','lease'].includes(tenure))return'Choose a contract type.';if(d.group==='property'&&tenure==='lease')return'Rental properties require buying the land first.';
 const land=developmentQuote(s,i,type).land,cost=developmentQuote(s,i,type).construction+(tenure==='buy'?land:Math.round(land*.2));if(s.mode!=='sandbox'&&s.money<cost)return'Not enough cash. Consider leasing or taking a loan.';return null;
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
  s.log.unshift(`${TYPES[type].name} built on ${q.area} tiles · ₲${q.total.toLocaleString()} invested`);s.log=s.log.slice(0,25);awardAssetFame(s,`parcel:${i}`,q.total,TYPES[type].name+' acquired');return{ok:true,msg:`${q.area}-tile ${TYPES[type].name} complete!`};
 }

 const error=canBuild(s,i,type,tenure);if(error)return{ok:false,msg:error};const previous=s.tiles[i].type==='plot'?assetLedger(s,i):null,land=developmentQuote(s,i,type).land,deposit=tenure==='lease'?Math.round(land*.2):0,constructionCost=developmentQuote(s,i,type).construction,cost=constructionCost+(tenure==='buy'?land:deposit);if(s.mode!=='sandbox')s.money-=cost;Object.assign(s.tiles[i],{type,owner:'player',tenure,deposit,constructionCost,assetLedger:{initial:cost+(previous?.initial||0),upgrades:0,operating:0,since:previous?.since??s.month,estimated:previous?.estimated||false,buildingValue:constructionCost*.7,valuationMonth:s.month},level:1,tree:false,price:100,quality:1,staff:TYPES[type].staff,marketing:false});connectBuildingRoad(s,i);s.log.unshift(`${TYPES[type].name} opened · ${tenure==='buy'?'Buy':'Lease'} contract · ${cost.toLocaleString()}G invested`);s.log=s.log.slice(0,25);awardAssetFame(s,`parcel:${i}`,cost,TYPES[type].name+' acquired');return{ok:true,msg:'Contract signed! Set your profit strategy in Operations.'};
}
export function sellAsset(s,i){i=buildingAnchor(s,i);const t=s.tiles[i],report=assetSaleReport(s,i);if(!report)return{ok:false,msg:'You can only sell your own assets.'};s.money+=report.value;for(const j of footprintCells(i,t.footprint))if(j!==i)s.tiles[j]={terrain:'land',type:null,owner:null,level:1,tree:false};delete t.footprint;Object.assign(t,{type:null,owner:null,level:1,tree:false});delete t.assetLedger;delete t.landmark;const msg=`${report.name} sold · ₲${report.value.toLocaleString()} recovered · ${report.estimated?'Est. ':''}gain vs. initial investment ${report.gain>=0?'+':''}₲${Math.round(report.gain).toLocaleString()}`;s.log.unshift(msg);s.log=s.log.slice(0,25);return{ok:true,msg,report};}
export function upgrade(s,i){i=buildingAnchor(s,i);const t=s.tiles[i];if(t?.owner!=='player'||!t.type||t.type==='plot'||t.level>=3)return{ok:false,msg:'Can\'t expand any further.'};const construction=t.constructionCost??TYPES[t.type].cost,cost=Math.round(construction*.8*t.level);if(s.mode!=='sandbox'&&s.money<cost)return{ok:false,msg:'Not enough cash to expand.'};t.assetLedger??=assetLedger(s,i);t.assetLedger.buildingValue=buildingValue(s,t)+construction*.5*Math.pow(buildingArea(t),.15);t.assetLedger.valuationMonth=s.month;t.assetLedger.upgrades+=cost;if(s.mode!=='sandbox')s.money-=cost;t.level++;return{ok:true,msg:'Expansion complete. Review staffing and hours too.'};}
export function trade(s,id,qty){if(!STOCKS.some(k=>k.id===id)||!Number.isInteger(qty)||!qty)return{ok:false,msg:'Check the quantity.'};const value=s.prices[id]*qty,fee=Math.abs(value)*.005;if(qty>0&&s.money<value+fee)return{ok:false,msg:'Not enough cash to buy.'};if(s.holdings[id]+qty<0)return{ok:false,msg:'Not enough shares.'};recordTrade(s,id,qty,value,fee);s.money-=value+fee;s.holdings[id]+=qty;return{ok:true,msg:`${qty>0?'Buy':'Sell'} complete · 0.5% fee`};}
export function setPlan(s,key,value){if(!['work','manage','learn','create','inspect','curate'].includes(key)||!Number.isInteger(value)||value<0)return false;const other=Object.entries(s.plan).reduce((n,[k,v])=>n+(k===key?0:v),0);s.plan[key]=clamp(value,0,160-other);return true;}
export function chooseEvent(s,n){const o=s.event?.options[n];if(!o)return{ok:false,msg:'No decision to make.'};if(s.mode!=='sandbox'&&s.money<(o.cost||0))return{ok:false,msg:'Not enough cash. You can pick a no-cost option.'};if(s.event.id){applyRichChoice(s,o);s.event=null;s.log.unshift('✎ Decision · '+o.label);s.log=s.log.slice(0,25);return{ok:true,msg:o.label+' · Decision applied.'};}if(s.mode!=='sandbox')s.money-=o.cost;s.stress=clamp(s.stress+(o.stress||0),0,100);s.skill=clamp(s.skill+(o.skill||0),0,100);s.effect={bonus:o.bonus||0,remaining:2};s.event=null;return{ok:true,msg:o.label+' · Decision applied.'};}
// Liquidity crisis: negative cash forces distressed sales at 70%; three months in a row is a restructuring.
function fireSale(s){
 if(s.concept!=='rich-life'||s.mode==='sandbox')return null;
 if(s.money>=0){s.crisisMonths=0;return null;}
 s.crisisMonths=(s.crisisMonths||0)+1;const items=[];
 // Liquid first: stocks go at a 3% haircut, then compound accounts, buildings and art at 70%.
 for(const k of STOCKS){if(s.money>=0)break;const qty=s.holdings[k.id],price=s.prices[k.id];if(!qty)continue;const sell=Math.min(qty,Math.ceil(-s.money/(price*.97))),value=-price*sell,fee=Math.abs(value)*.03;recordTrade(s,k.id,-sell,value,fee);s.money-=value+fee;s.holdings[k.id]-=sell;items.push({name:`${sell} ${k.name} shares`,value:Math.round(-value-fee)});}
 if(s.money<0&&s.compound)for(const id of Object.keys(COMPOUND_ASSETS)){if(s.money>=0)break;const balance=s.compound.balances[id];if(!balance)continue;const take=Math.min(balance,Math.ceil(-s.money/.7));s.compound.balances[id]-=take;s.money+=Math.round(take*.7);items.push({name:COMPOUND_ASSETS[id].name+' account',value:Math.round(take*.7)});}
 const owned=s.tiles.map((t,i)=>i).filter(i=>s.tiles[i].owner==='player').sort((a,b)=>assetValue(s,a)-assetValue(s,b));
 for(const i of owned){if(s.money>=0)break;const r=sellAsset(s,i);if(!r.ok)continue;const haircut=Math.round(r.report.value*.3);s.money-=haircut;items.push({name:r.report.name,value:r.report.value-haircut});}
 if(s.money<0&&s.artCollection?.owned.length){const owned=[...s.artCollection.owned].sort((a,b)=>a.price-b.price);for(const item of owned){if(s.money>=0)break;const d=ARTWORKS[item.id],value=Math.round(marketPrice(s,item.price)*Math.pow(1+d.annualRate,(item.grown??Math.max(0,s.month-item.boughtMonth))/12)*.7);s.money+=value;s.artCollection.owned=s.artCollection.owned.filter(x=>x.id!==item.id);items.push({name:`〈${d.name}〉`,value});}}
 if(items.length){s.fireSales=(s.fireSales||0)+1;s.log.unshift(`⚠ Fire sale · ${items.map(i=>i.name).join(', ')} · ₲${items.reduce((n,i)=>n+i.value,0).toLocaleString('en-US')} recovered (70% of market)`);}
 const restructure=s.crisisMonths>=3;
 if(restructure){s.crisisMonths=0;s.prestige=Math.max(0,(s.prestige||0)-50);s.log.unshift('⚠ Restructuring · 3 straight months short on cash · Reputation −50');}
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
 for(const m of rich?RICH_GOALS:MILESTONES)if(after.wealth>=m.wealth&&!s.milestones.includes(m.wealth)){s.milestones.push(m.wealth);s.log.unshift(`✦ ${m.name} reached! Net worth ₲${m.wealth.toLocaleString()}`);}
 if(rich){const chapter=chapterOf(s);if(chapter.n>chapterBefore){s.lastReport.chapterUp=chapter.n;s.log.unshift(`✦ CHAPTER ${chapter.n} · ${chapter.name} begins! ${chapter.unlocks[0]} unlocked`);}
  if(!s.ending&&(s.month>=120||s.highestWealth>=300000000)){s.ending=endingReport(s,after);s.log.unshift(`✦ Legacy ending · Grade ${s.ending.grade} · ${s.ending.score.toLocaleString('en-US')} pts`);}}
 s.history.push({prices:{...s.prices},month:s.month,wealth:Math.round(after.wealth),money:Math.round(s.money),net:a.net});s.history=s.history.slice(-36);
 if(rich){scheduleRichEvent(s,{wealth:after.wealth,fame:reputationSummary(s).fame})||rivalOffer(s,after.wealth);}
 else if(EVENTS.length&&s.month%6===0)s.event=EVENTS[(Math.floor(s.month/6)-1)%EVENTS.length];
 if(s.money<0)s.log.unshift('Short on cash: close loss-making businesses or work more hours to restore cash flow.');else s.log.unshift(`Month ${s.month} report · ${a.net>=0?'+':''}${Math.round(a.net).toLocaleString()}G · Net worth ${Math.round(after.wealth).toLocaleString()}G · Economy ${economyReport(s).label}`);
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
