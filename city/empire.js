import {L} from './i18n.js';
import {marketPrice,incomeFactor} from './economy.js';
import {publicActivitiesPanel} from './reputation.js';
export const EMPIRE_ASSETS={
 company:{name:L('Hanbit Global'),role:L('Major company chairman'),icon:'▦',sector:L('Industrial · Tech group'),unlock:20000000,cost:12000000,income:120000,description:L('A controlling stake in the conglomerate behind the city\'s manufacturing and tech subsidiaries.')},
 broadcaster:{name:L('Prime Broadcast Network'),role:L('Broadcaster owner'),icon:'▣',sector:L('News · Entertainment'),unlock:60000000,cost:35000000,income:300000,description:L('A media group with national channels and production studios.')},
 club:{name:L('Riverside United'),role:L('Sports club owner'),icon:'◆',sector:L('Pro sports club'),unlock:150000000,cost:90000000,income:700000,description:L('A storied club that runs its own stadium and youth academy.')}
};

const money=n=>'₲'+Math.round(n).toLocaleString('en-US');
export const OWNER_PERKS={company:{fame:50,monthly:3,label:L('Chairman networking'),gain:20,skill:3,stress:0,benefit:L('Chairman networking gives Skill +3'),alt:L('Shaking hands with business leaders at a skyscraper reception at dusk'),caption:L('Deals start with a handshake. Tonight the city\'s business elite came to meet you.')},broadcaster:{fame:150,monthly:5,label:L('Host a premiere'),gain:30,skill:2,stress:0,benefit:L('Creative progress +25% while owned'),alt:L('Walking the red carpet at a premiere your network hosts'),caption:L('Flashbulbs and cheers. The premiere your network hosts is tonight\'s biggest story.')},club:{fame:250,monthly:8,label:L('Match day in the owner box'),gain:40,skill:0,stress:20,benefit:L('Stress −5 monthly while owned'),alt:L('Cheering a goal from the owner\'s box at a floodlit stadium'),caption:L('The stadium erupts. From the owner\'s box, every goal feels like your own.')}};
export const REPUTATION_TIERS=[
 {min:0,name:L('Private Owner'),field:L('Economy'),relief:0,creative:1,ownerIncome:1,benefit:L('Starting reputation title')},
 {min:100,name:L('Community Patron'),field:L('Society'),relief:1,creative:1,ownerIncome:1,benefit:L('Stress −1 monthly')},
 {min:200,name:L('City Celebrity'),field:L('Society'),relief:2,creative:1,ownerIncome:1,benefit:L('Stress −2 monthly')},
 {min:500,name:L('Arts Patron'),field:L('Culture'),relief:4,creative:1.05,ownerIncome:1,benefit:L('Creative speed +5% · Stress −4')},
 {min:1000,name:L('Business Tycoon'),field:L('Economy'),relief:6,creative:1.05,ownerIncome:1.05,benefit:L('Owner dividends +5% · Stress −6')},
 {min:1500,name:L('City Councilor'),field:L('Politics'),relief:7,creative:1.05,ownerIncome:1.05,benefit:L('Stress −7 monthly')},
 {min:2000,name:L('Charity Foundation Chair'),field:L('Society'),relief:7,creative:1.05,ownerIncome:1.08,benefit:L('Owner dividends +8% · Stress −7')},
 {min:2500,name:L('Member of Parliament'),field:L('Politics'),relief:8,creative:1.05,ownerIncome:1.08,benefit:L('Stress −8 monthly')},
 {min:3200,name:L('Global Business Leader'),field:L('Economy'),relief:8,creative:1.1,ownerIncome:1.1,benefit:L('Creative +10% · Owner dividends +10%')},
 {min:4000,name:L('Minister'),field:L('Politics'),relief:9,creative:1.1,ownerIncome:1.1,benefit:L('Stress −9 monthly')},
 {min:5500,name:L('World Figure'),field:L('Culture'),relief:9,creative:1.15,ownerIncome:1.15,benefit:L('Creative +15% · Owner dividends +15%')},
 {min:7000,name:L('President'),field:L('Politics'),relief:10,creative:1.2,ownerIncome:1.2,benefit:L('Creative +20% · Dividends +20% · Stress −10')}
];
// Fame = owner base + owner activities + public giving + lifestyle prestige (s.prestige: parties, collections, landmarks; fades 3% a month).
export function reputationSummary(s){const owned=s.empire?.owned||[],fame=owned.reduce((n,id)=>n+(OWNER_PERKS[id]?.fame||0),0)+(s.empire?.earnedFame||0)+(s.prestige||0),tier=REPUTATION_TIERS.filter(t=>fame>=t.min).at(-1);return{fame,tier,next:REPUTATION_TIERS.find(t=>t.min>fame),earned:REPUTATION_TIERS.filter(t=>fame>=t.min),monthly:owned.reduce((n,id)=>n+(OWNER_PERKS[id]?.monthly||0),0),creativeMultiplier:(owned.includes('broadcaster')?1.25:1)*tier.creative,ownerIncomeMultiplier:tier.ownerIncome,stressRelief:(owned.includes('club')?5:0)+tier.relief,premium:1+Math.min(300,Math.max(0,fame-acquisitionFame(s)))/1500,salvage:fame>=100};}
// Fame earned merely by buying assets or completing landmarks does not raise operating revenue; activity, giving and lifestyle fame do.
function acquisitionFame(s){return Object.values(s.reputation?.assets||{}).reduce((n,v)=>n+v,0)+Object.values(s.empire?.landmarkFame||{}).reduce((n,v)=>n+v,0);}
export function settleOwnerBenefits(s){const r=reputationSummary(s);if(!r.monthly&&!r.stressRelief)return;const e=ensureEmpire(s);e.earnedFame=(e.earnedFame||0)+r.monthly;s.stress=Math.max(0,s.stress-r.stressRelief);}
export function ownerActivity(s,id){if(!Object.hasOwn(OWNER_PERKS,id)||!s.empire?.owned.includes(id))return{ok:false,msg:L('Acquire this asset first.')};const e=s.empire,d=OWNER_PERKS[id];if(e.lastActivities?.[id]===s.month)return{ok:false,msg:L('Already done this month.')};e.lastActivities??={};e.lastActivities[id]=s.month;e.earnedFame=(e.earnedFame||0)+d.gain;s.skill=Math.min(100,s.skill+d.skill);s.stress=Math.max(0,s.stress-d.stress);const msg=L`${d.label} · Reputation +${d.gain}${d.skill?L(' · Skill +')+d.skill:''}${d.stress?L(' · Stress −')+d.stress:''}`;s.log.unshift(msg);s.log=s.log.slice(0,25);return{ok:true,msg};}

export function ownerScene(s,id){const d=OWNER_PERKS[id],r=reputationSummary(s);return L`<span class="eyebrow">OWNER'S CLUB · ${EMPIRE_ASSETS[id].name}</span><h2>${d.label}</h2><figure class="experience-scene"><img src="./city/assets/owners/${id}.jpg" alt="${d.alt}" width="1536" height="1024"><figcaption>${d.caption}</figcaption></figure><div class="flex-summary" role="status"><b>Reputation +${d.gain}${d.skill?L` · Skill +${d.skill}`:''}${d.stress?L` · Stress −${d.stress}`:''}</b><span>Reputation ${r.fame.toLocaleString('en-US')} · ${r.tier.name}</span></div><button data-action="owners" class="primary full">Back to the Owners Club →</button>`;}

export function ensureEmpire(s){if(!s.empire)s.empire={owned:[]};return s.empire;}

export function empireSummary(s){
 const owned=(s.empire?.owned||[]).filter(id=>Object.hasOwn(EMPIRE_ASSETS,id)),titleBenefit=reputationSummary(s).ownerIncomeMultiplier;
 return{owned,assets:Math.round(owned.reduce((sum,id)=>sum+marketPrice(s,EMPIRE_ASSETS[id].cost)*Math.pow(1.002,Math.max(0,s.month-(s.empire?.acquiredMonths?.[id]??s.month))),0)),income:owned.reduce((sum,id)=>sum+EMPIRE_ASSETS[id].income*incomeFactor(s)*titleBenefit,0)};
}

export function acquisitionReason(s,id,wealth){
 const d=EMPIRE_ASSETS[id];if(!d)return L('Check the acquisition target.');
 if((s.empire?.owned||[]).includes(id))return L('Already owned.');
 if(s.mode!=='sandbox'&&(s.highestWealth||wealth)<d.unlock)return L`Unlocks at peak net worth ${money(d.unlock)}`;
 if(s.mode!=='sandbox'&&wealth<marketPrice(s,d.unlock))return L`Requires current net worth ${money(marketPrice(s,d.unlock))}`;
 if(s.mode!=='sandbox'&&s.money<marketPrice(s,d.cost))return L`Requires ${money(marketPrice(s,d.cost))} cash to acquire`;
 return null;
}

export function acquireEmpireAsset(s,id,wealth){
 const error=acquisitionReason(s,id,wealth);if(error)return{ok:false,msg:error};
 const d=EMPIRE_ASSETS[id];if(s.mode!=='sandbox')s.money-=marketPrice(s,d.cost);const e=ensureEmpire(s);e.acquiredMonths??={};e.acquiredMonths[id]=s.month;
 ensureEmpire(s).owned.push(id);s.log.unshift(L`${d.icon} ${d.name} acquired · Now ${d.role} · ${money(marketPrice(s,d.cost))}`);s.log=s.log.slice(0,25);
 return{ok:true,msg:L`${d.name} acquired · You are now ${d.role}!`};
}

export function validEmpire(s){
 const e=s.empire;if(e===undefined)return true;
 if(e?.acquiredMonths!==undefined&&(!e.acquiredMonths||typeof e.acquiredMonths!=='object'||Array.isArray(e.acquiredMonths)||!Object.entries(e.acquiredMonths).every(([id,m])=>e.owned?.includes(id)&&Number.isInteger(m)&&m>=0&&m<=s.month)))return false;
 if(e?.earnedFame!==undefined&&(!Number.isSafeInteger(e.earnedFame)||e.earnedFame<0))return false;
 if(e?.lastActivities!==undefined&&(!e.lastActivities||typeof e.lastActivities!=='object'||Array.isArray(e.lastActivities)||!Object.entries(e.lastActivities).every(([id,month])=>Object.hasOwn(OWNER_PERKS,id)&&e.owned?.includes(id)&&Number.isInteger(month)&&month>=0&&month<=s.month)))return false;
 return!!(e&&Array.isArray(e.owned)&&e.owned.length<=Object.keys(EMPIRE_ASSETS).length&&new Set(e.owned).size===e.owned.length&&e.owned.every(id=>Object.hasOwn(EMPIRE_ASSETS,id)));
}

export function empireDialog(s,wealth){
 const summary=empireSummary(s);
 return L`<span class="eyebrow">OWNER'S CLUB · ENDGAME</span><h2>Beyond investing: become an owner who moves the world.</h2><p>Top-tier assets you can't buy from day one. Reach the peak net worth first, then have the acquisition price ready in cash.</p><div class="empire-summary"><span>Peak net worth <b>${money(s.highestWealth||wealth)}</b></span><span>Owner assets <b>${money(summary.assets)}</b></span><span>Monthly owner dividends <b>+${money(summary.income)}</b></span></div>${reputationPanel(s)}<button data-action="reputation" class="full">Build Reputation via Giving & Interviews →</button><div class="empire-grid">${Object.entries(EMPIRE_ASSETS).map(([id,d])=>{const reason=acquisitionReason(s,id,wealth),owned=summary.owned.includes(id),progress=Math.min(100,(s.highestWealth||wealth)/d.unlock*100);return L`<section class="empire-card ${owned?'owned':''}"><div class="empire-head"><span>${d.icon}</span><div><small>${d.sector}</small><h3>${d.name}</h3></div></div><b class="empire-role">${owned?'✓ '+d.role:d.role}</b><p>${d.description}</p><div class="owner-perks"><b>Reputation +${OWNER_PERKS[id].fame} · Monthly +${OWNER_PERKS[id].monthly}</b><p>${OWNER_PERKS[id].benefit}</p><p>Once a month, ${OWNER_PERKS[id].label}: Reputation +${OWNER_PERKS[id].gain}${OWNER_PERKS[id].skill?L` · Skill +${OWNER_PERKS[id].skill}`:""}${OWNER_PERKS[id].stress?L` · Stress −${OWNER_PERKS[id].stress}`:""}</p>${owned?`<button data-owner-activity="${id}" ${s.empire.lastActivities?.[id]===s.month?'disabled':''}>${s.empire.lastActivities?.[id]===s.month?L('Done This Month'):OWNER_PERKS[id].label}</button>`:""}</div><div class="empire-numbers"><span>Unlock at <b>${money(d.unlock)}</b></span><span>Acquisition price <b>${money(marketPrice(s,d.cost))}</b></span><span>Monthly dividends <b>+${money(d.income*incomeFactor(s))}</b></span></div><div class="meter"><i style="width:${progress}%"></i></div><button data-empire-acquire="${id}" ${reason?'disabled':''}>${owned?L('Acquired'):reason||L('Acquire Controlling Stake')}</button></section>`;}).join('')}</div><p class="help">The acquisition price leaves your cash and an owner asset of equal value joins your net worth. Dividends from acquired assets settle automatically each month. Owner asset value compounds 0.2% per month held; the gain counts toward net worth, not cash, until sold. Assets from older saves start appreciating from the next monthly settlement.</p>`;
}
export function reputationPanel(s){const r=reputationSummary(s),progress=r.next?Math.max(0,Math.min(100,(r.fame-r.tier.min)/(r.next.min-r.tier.min)*100)):100;return L`<section class="owner-reputation"><span>My reputation · No cap</span><h3>${r.fame.toLocaleString('en-US')} · ${r.tier.name}</h3><p>Current perk · ${r.tier.benefit}</p><p>Monthly reputation +${r.monthly}${r.next?L` · ${(r.next.min-r.fame).toLocaleString('en-US')} pts to next title ‘${r.next.name}’`:L(' · Reputation keeps growing after the top title')}</p><div class="reputation-progress" aria-label="Progress to next title"><i style="width:${progress}%"></i></div><div class="reputation-tiers">${REPUTATION_TIERS.map(t=>L`<span class="${r.fame>=t.min?'earned':''}${t===r.tier?' current':''}"><b>${r.fame>=t.min?'✓':'○'} ${t.name}</b><small>${t.min.toLocaleString('en-US')} pts · ${t.field}</small><em>${t.benefit}</em></span>`).join('')}</div><small>Earn society, culture, economy and politics titles in turn. Perks follow your current title and stack with broadcaster and club ownership perks.</small></section>`;}

export function reputationDialog(s){return L`<span class="eyebrow">REPUTATION & GIVING</span><h2>My Reputation & Giving</h2>${reputationPanel(s)}${publicActivitiesPanel(s)}`;}
