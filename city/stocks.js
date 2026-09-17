import {L} from './i18n.js';
// Fictional listed companies. Each has a character: growth stocks compound fast but fall hardest in a
// crash, dividend stocks pay every month, defensive stocks barely move, cyclicals ride the business
// cycle, REITs pay rent that follows the cycle and speculative names swing wildly. `beta` scales a market crash, `shares` sets market cap.
export const STOCK_TYPES={
 growth:{name:L('Growth','stock'),desc:L('Fast compounding, no dividend, and the biggest drop in a crash.')},
 dividend:{name:L('Dividend','stock'),desc:L('Slow price growth, but a payout lands every month.')},
 defensive:{name:L('Defensive','stock'),desc:L('Steady demand in any economy. Small moves, small crash damage.')},
 cyclical:{name:L('Cyclical','stock'),desc:L('Rises with the boom and sinks in the bust.')},
 speculative:{name:L('Speculative','stock'),desc:L('Wild swings. A deep collapse can end in delisting.')},
 reit:{name:L('REIT','stock'),desc:L('Owns office buildings. Rent rises and falls with the economy and lands as a monthly dividend.')},
 ipo:{name:L('New listing','stock'),desc:L('Freshly listed. Within a few years it either hits a jackpot or gets delisted.')}
};
const LAUNCH_STOCKS=[
 {id:'local',name:L('Town Retail'),sector:L('Retail'),type:'defensive',base:100,risk:.05,annualRate:.12,yield:.03,beta:.6,shares:30000000},
 {id:'tech',name:L('Next Tech'),sector:L('Software'),type:'growth',base:160,risk:.12,annualRate:.19,yield:0,beta:1.4,shares:40000000},
 {id:'estate',name:L('River REIT'),sector:L('Real estate'),type:'dividend',base:80,risk:.04,annualRate:.10,yield:.07,beta:.8,shares:40000000},
 {id:'bank',name:L('Harbor Bank'),sector:L('Finance'),type:'dividend',base:60,risk:.05,annualRate:.11,yield:.06,beta:1,shares:60000000},
 {id:'power',name:L('Riverside Power'),sector:L('Utilities'),type:'defensive',base:120,risk:.03,annualRate:.09,yield:.05,beta:.4,shares:40000000},
 {id:'ship',name:L('Blue Dock Shipping'),sector:L('Shipping'),type:'cyclical',base:45,risk:.10,annualRate:.14,yield:.02,beta:1.3,shares:25000000},
 {id:'steel',name:L('Ironworks Steel'),sector:L('Materials'),type:'cyclical',base:70,risk:.08,annualRate:.13,yield:.03,beta:1.2,shares:30000000},
 {id:'bio',name:L('Helix Bio'),sector:L('Biotech'),type:'speculative',base:30,risk:.20,annualRate:.20,yield:0,beta:1.8,shares:15000000},
 {id:'game',name:L('Pixel Forge'),sector:L('Games'),type:'growth',base:50,risk:.14,annualRate:.20,yield:0,beta:1.5,shares:30000000},
 {id:'solar',name:L('Solar Fields'),sector:L('Clean energy'),type:'growth',base:35,risk:.15,annualRate:.18,yield:0,beta:1.6,shares:25000000}
];
// Listed after launch. Older saves list it once (market.added), and its seed key sits after the IPO pool so existing IPO fates stay the same.
export const ADDED_STOCKS=[
 {id:'officereit',name:L('Metro Office REIT'),sector:L('Real estate'),type:'reit',base:50,risk:.05,annualRate:.09,yield:.08,beta:1.1,shares:40000000}
];
export const STOCKS=[...LAUNCH_STOCKS,...ADDED_STOCKS];
// One of these lists every twelve months. A seeded, hidden fate decides whether it ends in a jackpot
// (price multiplies, then it trades like a growth stock) or a collapse that leads to delisting.
export const IPO_POOL=[
 {id:'drone',name:L('Orbit Drones'),sector:L('Logistics tech'),base:24,shares:8000000},
 {id:'kitchen',name:L('Cloud Kitchen Co.'),sector:L('Food delivery'),base:18,shares:10000000},
 {id:'quantum',name:L('Quantum Lab'),sector:L('Deep tech'),base:40,shares:5000000},
 {id:'robotaxi',name:L('Robo Taxi'),sector:L('Mobility'),base:32,shares:9000000},
 {id:'farm',name:L('Vertical Farm'),sector:L('Agritech'),base:15,shares:12000000},
 {id:'fusion',name:L('Fusion Cell'),sector:L('Energy storage'),base:28,shares:7000000},
 {id:'petcare',name:L('Pet Care Chain'),sector:L('Consumer'),base:20,shares:10000000},
 {id:'spacetour',name:L('Space Tour'),sector:L('Travel'),base:50,shares:4000000},
 {id:'aitutor',name:L('AI Tutor'),sector:L('Education'),base:22,shares:9000000},
 {id:'seamine',name:L('Deep Sea Mining'),sector:L('Resources'),base:36,shares:6000000},
 {id:'metastudio',name:L('Meta Studio'),sector:L('Media'),base:26,shares:8000000},
 {id:'neonfood',name:L('Neon Foods'),sector:L('Food tech'),base:16,shares:12000000}
].map(k=>({...k,type:'ipo',risk:.18,annualRate:0,yield:0,beta:1.8,ipo:true}));
const ALL=new Map([...LAUNCH_STOCKS,...IPO_POOL,...ADDED_STOCKS].map((k,n)=>[k.id,{...k,key:n}]));
export const stockInfo=id=>ALL.get(id);
export const dividendPerShare=(s,id)=>Math.round((s.prices[id]||0)*(stockInfo(id)?.yield||0)/12*100)/100;
