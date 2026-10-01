import {transaction} from './health.js';
import {L} from './i18n.js';
import {cycleFactor,incomeFactor,marketFactor,marketPrice} from './economy.js';
import {awardAssetFame} from './reputation.js';
export const COMPANY_LIMIT=50;
export const CORPORATE_TAX_RATE=.2;
export const SMALL_COMPANIES={shop:{name:L('Little Market Commerce'),cost:30000,description:L('A small online brand with loyal customers')},agency:{name:L('Pixel Design Agency'),cost:75000,description:L('A design firm with recurring corporate contracts')},software:{name:L('Flow Work Tools'),cost:150000,description:L('A small software company with subscribers')},
 bakery:{name:L('Morning Bakery'),cost:250000,description:L('A neighborhood bakery with wholesale orders')},
 studio:{name:L('Blue Note Studio'),cost:400000,description:L('A recording studio with local artists')},
 logistics:{name:L('Swift Parcel'),cost:600000,description:L('A growing regional delivery network')},
 coffee:{name:L('Harbor Coffee'),cost:900000,description:L('A chain of busy coffee shops')},
 clinic:{name:L('WellSpring Clinics'),cost:1500000,description:L('A network of neighborhood clinics')},
 fashion:{name:L('Mosaic Fashion'),cost:2500000,description:L('A fashion label with an online following')},
 games:{name:L('Comet Game Studio'),cost:4000000,description:L('A game studio building its next hit')},
 hotel:{name:L('Grand Harbor Hotels'),cost:6500000,description:L('Hotels serving business travelers')},
 food:{name:L('Fresh Table Foods'),cost:10000000,description:L('A national prepared-food producer')},
 education:{name:L('BrightPath Education'),cost:15000000,description:L('A chain of learning centers')},
 security:{name:L('Sentinel Security'),cost:22000000,description:L('Security services for major offices')},
 energy:{name:L('ClearSky Energy'),cost:32000000,description:L('A developer of renewable power plants')},
 media:{name:L('Vista Media Group'),cost:45000000,description:L('A regional media and production group')},
 biotech:{name:L('Nova Biotech'),cost:60000000,description:L('A biotechnology research company')},
 shipping:{name:L('OceanLink Shipping'),cost:80000000,description:L('An international shipping fleet')},
 telecom:{name:L('Horizon Telecom'),cost:110000000,description:L('A nationwide communications network')},
 aviation:{name:L('AeroStar Airlines'),cost:150000000,description:L('An airline with global routes')},
 retail:{name:L('Metro Retail Group'),cost:200000000,description:L('A national chain of stores')},
 robotics:{name:L('Vertex Robotics'),cost:270000000,description:L('Industrial automation at global scale')},
 finance:{name:L('Summit Finance'),cost:350000000,description:L('A diversified financial group')},
 pharma:{name:L('Helix Pharmaceuticals'),cost:450000000,description:L('A major drug development company')},
 cloud:{name:L('Nimbus Cloud'),cost:600000000,description:L('Cloud infrastructure for enterprises')},
 semiconductors:{name:L('Orion Semiconductors'),cost:800000000,description:L('Advanced chip design and manufacturing')},
 automotive:{name:L('Atlas Motors'),cost:1100000000,description:L('A worldwide vehicle manufacturer')},
 entertainment:{name:L('Aurora Entertainment'),cost:1500000000,description:L('Film, music and streaming worldwide')},
 infrastructure:{name:L('Continental Infrastructure'),cost:2000000000,description:L('Ports, rail and power across continents')},
 globaltech:{name:L('Zenith Global Tech'),cost:3000000000,description:L('A global technology conglomerate')},
 datacenter:{name:L('Polar Data Centers'),cost:4000000000,description:L('A network of hyperscale data centers')},
 satellites:{name:L('Skybridge Satellites'),cost:7000000000,description:L('Communications satellites around the globe')},
 minerals:{name:L('DeepCore Minerals'),cost:12000000000,description:L('Strategic mineral mines across regions')},
 ports:{name:L('WorldPort Holdings'),cost:20000000000,description:L('Major ports and logistics terminals')},
 payments:{name:L('Orbit Payments'),cost:35000000000,description:L('A global digital payments network')},
 aerospace:{name:L('Stratos Aerospace'),cost:60000000000,description:L('Aircraft and launch systems')},
 chips:{name:L('Quantum Chip Foundry'),cost:100000000000,description:L('A leading chip fabrication network')},
 water:{name:L('BluePlanet Water'),cost:170000000000,description:L('Water treatment across continents')},
 commerce:{name:L('Mercury Commerce'),cost:300000000000,description:L('A worldwide commerce platform')},
 transport:{name:L('TransWorld Mobility'),cost:500000000000,description:L('Rail, road and aviation networks')},
 power:{name:L('TerraGrid Power'),cost:800000000000,description:L('Power generation and transmission at scale')},
 healthcare:{name:L('Unity Health Systems'),cost:1200000000000,description:L('Hospitals and research centers worldwide')},
 globalbank:{name:L('Crown Global Bank'),cost:2000000000000,description:L('A banking group spanning continents')},
 platforms:{name:L('Nexus Platforms'),cost:3500000000000,description:L('Digital platforms used around the world')},
 fusion:{name:L('Helios Fusion Energy'),cost:6000000000000,description:L('A new generation of energy infrastructure')},
 space:{name:L('Frontier Space Industries'),cost:10000000000000,description:L('Orbital transport and space manufacturing')},
 biosphere:{name:L('Biosphere Life Sciences'),cost:18000000000000,description:L('Global medicine and life science systems')},
 ai:{name:L('Atlas Intelligence'),cost:30000000000000,description:L('Worldwide artificial intelligence services')},
 planetary:{name:L('Planetary Resources'),cost:55000000000000,description:L('Resource and infrastructure projects worldwide')},
 universal:{name:L('Universal Holdings'),cost:100000000000000,description:L('An immense group spanning every major industry')}
};
export const GROWTH_OUTCOMES=[{label:L('Value drop'),chance:.15,min:.7,max:.95},{label:L('Steady growth'),chance:.75,min:1.1,max:1.8},{label:L('High growth'),chance:.08,min:2,max:3},{label:L('Jackpot'),chance:.02,min:5,max:10}];
export function companyGrowth(roll){let start=0;for(const o of GROWTH_OUTCOMES){if(roll<start+o.chance)return{label:o.label,multiple:Math.round((o.min+(o.max-o.min)*(roll-start)/o.chance)*100)/100};start+=o.chance;}return{label:L('Jackpot'),multiple:10};}
function rollFor(s,serial){let x=(s.seed^Math.imul(serial,0x9e3779b1)^0x51ed270b)>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return((x^(x>>>16))>>>0)/4294967296;}
export function companyValue(s,p){return Math.round(SMALL_COMPANIES[p.type].cost*(s.month>=p.due?companyGrowth(p.roll).multiple:1)*(p.soldFactor??marketFactor(s))*(p.lossFactor??1));}
export function companyDividend(s,p){return Math.round(SMALL_COMPANIES[p.type].cost*(.005+(cycleFactor(s)-1)*.08)*incomeFactor(s));}
export function acquisitionSummary(s){const a=s.acquisitions,active=a?.active||[];return{active,history:a?.history||[],assets:active.reduce((n,p)=>n+companyValue(s,p),0),income:active.reduce((n,p)=>n+companyDividend(s,p),0),taxable:a?.taxable||0};}
function buyCompanyImpl(s,type){if(!Object.hasOwn(SMALL_COMPANIES,type))return{ok:false,msg:L('Check the company to acquire.')};const d=SMALL_COMPANIES[type];if((s.acquisitions?.active.length||0)>=COMPANY_LIMIT)return{ok:false,msg:L('You can run at most 50 companies at once.')};if(s.money<marketPrice(s,d.cost))return{ok:false,msg:L('Not enough cash to acquire.')};const a=s.acquisitions??={serial:0,active:[],history:[],taxable:0};const id=++a.serial,paid=marketPrice(s,d.cost);a.active.push({id,type,paid,started:s.month,due:s.month+3,roll:rollFor(s,id)});s.money-=paid;s.log.unshift(L`${d.name} acquired · ${money(paid)} · 3-month growth begins`);s.log=s.log.slice(0,25);awardAssetFame(s,`company:${type}`,d.cost,d.name+L(' acquisition'),10);return{ok:true,msg:L('Acquired · Growth result and sale price revealed in 3 months.')};}
function sellCompanyImpl(s,id){const a=s.acquisitions,p=a?.active.find(p=>p.id===id);if(!p)return{ok:false,msg:L('Check the company you own.')};if(s.month<p.due)return{ok:false,msg:L('You can sell after the 3-month growth period ends.')};const value=companyValue(s,p),profit=value-(p.paid??SMALL_COMPANIES[p.type].cost);s.money+=value;a.taxable=(a.taxable||0)+profit;a.active=a.active.filter(p=>p.id!==id);a.history.unshift({...p,soldMonth:s.month,soldFactor:marketFactor(s),value});a.history=a.history.slice(0,12);const msg=L`${SMALL_COMPANIES[p.type].name} sold · ${money(value)} recovered · P&L ${money(profit)}`;s.log.unshift(msg);s.log=s.log.slice(0,25);return{ok:true,msg};}
export function settleAcquisitions(s,income){const a=s.acquisitions;if(!a)return 0;a.taxable=(a.taxable||0)+income;if(s.month%12)return 0;const paid=Math.round(Math.max(0,a.taxable)*CORPORATE_TAX_RATE);a.taxable=0;s.money-=paid;if(paid)s.log.unshift(L`Corporate tax · ${money(paid)} paid for the year`);return paid;}
export function validAcquisitions(s){const a=s.acquisitions;if(a===undefined)return true;if(!a||!Number.isSafeInteger(a.serial)||a.serial<0||!Array.isArray(a.active)||a.active.length>COMPANY_LIMIT||!Array.isArray(a.history)||a.history.length>12||(a.taxable!==undefined&&(!Number.isSafeInteger(a.taxable)||Math.abs(a.taxable)>Number.MAX_SAFE_INTEGER)))return false;const ids=new Set();const valid=p=>{if(!p||(p.paid!==undefined&&(!Number.isFinite(p.paid)||p.paid<0))||(p.soldFactor!==undefined&&(!Number.isFinite(p.soldFactor)||p.soldFactor<.5||p.soldFactor>1))||(p.lossFactor!==undefined&&(!Number.isFinite(p.lossFactor)||p.lossFactor<=0||p.lossFactor>1))||!Number.isSafeInteger(p.id)||p.id<1||p.id>a.serial||ids.has(p.id)||!Object.hasOwn(SMALL_COMPANIES,p.type)||!Number.isSafeInteger(p.started)||p.started<0||p.started>s.month||p.due!==p.started+3||!Number.isFinite(p.roll)||p.roll<0||p.roll>=1)return false;ids.add(p.id);return true;};return a.active.every(p=>p.soldFactor===undefined&&valid(p))&&a.history.every(p=>valid(p)&&Number.isSafeInteger(p.soldMonth)&&p.soldMonth>=p.due&&p.soldMonth<=s.month&&p.value===companyValue({...s,economy:undefined},{...p,soldFactor:p.soldFactor??1}));}
const money=n=>'₲'+Math.round(n).toLocaleString('en-US');
export function acquisitionsDialog(s){const a=acquisitionSummary(s);return `<span class="eyebrow">${L('COMPANY ACQUISITIONS')}</span><h2>${L('Buy a company, earn income, then sell.')}</h2><p>${L('Choose from 50 companies, from ₲30,000 to ₲100 trillion. Each acquisition raises reputation. After 3 months its growth result is revealed and you can sell. Monthly company results follow the economy and can be losses. A 20% corporate tax on positive annual company income and sale gains is paid every 12 months.')}</p><div class="owner-reputation"><h3>${L('75% chance of moderate 1.1–1.8× growth')}</h3><p>${GROWTH_OUTCOMES.map(o=>L`${o.label} ${o.chance*100}% · ${o.min}–${o.max}×`).join('<br>')}</p><small>${L('The growth result is fixed at purchase, while market conditions still affect sale value. Reloading never changes the result.')}</small></div><p>${L`Projected monthly company income ${money(a.income)} · Taxable company result this year ${money(a.taxable)}`}${s.lastReport?.corporateTaxPaid?`<br>${L`Corporate tax paid last settlement ${money(s.lastReport.corporateTaxPaid)}`}`:''}</p><div class="empire-grid">${Object.entries(SMALL_COMPANIES).map(([id,d])=>`<section class="empire-card"><h3>${d.name}</h3><p>${d.description}</p><strong>${money(marketPrice(s,d.cost))}</strong><button data-company-buy="${id}" ${s.money<marketPrice(s,d.cost)||a.active.length>=COMPANY_LIMIT?'disabled':''}>${a.active.length>=COMPANY_LIMIT?L('Operating limit reached'):L('Acquire · ')+money(marketPrice(s,d.cost))}</button></section>`).join('')}</div><h3>${L`Companies running ${a.active.length}/50 · Valuation ${money(a.assets)}`}</h3>${a.active.map(p=>{const ready=s.month>=p.due,g=companyGrowth(p.roll);return`<section class="empire-card"><h3>${SMALL_COMPANIES[p.type].name} · #${p.id}</h3><p>${ready?L`${g.label} · ${g.multiple}× · Unrealized P&L ${money(companyValue(s,p)-(p.paid??SMALL_COMPANIES[p.type].cost))}`:L`Growing · Result in ${p.due-s.month} months`}</p><p>${L`Next monthly company result ${money(companyDividend(s,p))}`}</p><button data-company-sell="${p.id}" ${ready?'':'disabled'}>${ready?L('Sell · ')+money(companyValue(s,p)):L('Managers are growing the company')}</button></section>`;}).join('')||L('<p>No companies acquired yet.</p>')}${a.history.length?L`<details><summary>Recent Sales</summary>${a.history.map(p=>L`<p>${SMALL_COMPANIES[p.type].name} · ${companyGrowth(p.roll).multiple}× · Recovered ${money(p.value)} · P&L ${money(p.value-(p.paid??SMALL_COMPANIES[p.type].cost))}</p>`).join('')}</details>`:''}<p>${L('The acquisition price becomes company assets. Monthly results and sale proceeds change cash; growth changes net worth until the company is sold.')}</p>`;}

export function buyCompany(s,...args){return transaction(s,()=>buyCompanyImpl(s,...args));}

export function sellCompany(s,...args){return transaction(s,()=>sellCompanyImpl(s,...args));}
