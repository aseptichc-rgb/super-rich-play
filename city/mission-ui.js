import {propertyArt} from './property-art.js';
import {L} from './i18n.js';
import {missionProgress,missionStats,MISSION_STAGES,CONTRACT_IDS,contractQuote,contractProgress} from './missions.js';
import {canBuild,developmentQuote,coords,hasRoadAccess} from './engine.js';
const money=n=>'₲'+Math.round(n).toLocaleString('en-US');
export const missionNames=()=>({
 'first-build':L('My first new building'),'first-settlement':L('Collect my first building settlement'),'first-profit':L('Finish a profitable month'),
 'second-build':L('Build my second new place'),'first-upgrade':L('Expand one of my buildings once'),'first-park':L('Complete one neighborhood park'),'third-build':L('Build three new places'),'profit-three':L('Record three profitable months'),'reserve-one':L('Keep one month of operating reserves'),'reserve-two':L('Keep two months of operating reserves'),district:L('Build a street with three new assets and a park'),'income-ten':L('Reach ₲10,000 projected monthly cash flow'),
 'profit-six':L('Record six profitable months'),'wealth-quarter':L('Reach ₲2,250,000 net worth'),'wealth-half':L('Reach ₲2,500,000 net worth'),wealth:L('Reach ₲3,000,000 net worth'),'fifth-build':L('Build five new places'),'skyscraper-start':L('Start my first small skyscraper'),'first-skyscraper':L('Complete my first skyscraper'),'tower-five':L('Grow a completed skyscraper to five floors'),reserve:L('Keep three months of operating reserves'),
 'profit-twelve':L('Record twelve profitable months'),'wealth-five':L('Reach ₲5,000,000 net worth'),'wealth-ten':L('Reach ₲10,000,000 net worth'),landmark:L('Complete one landmark'),tourism:L('Tourism development'),cashflow:L('Twelve months without a fire sale'),redevelopment:L('Neighborhood renewal'),skyline:L('A new skyline')
});
const stageNames=()=>[L('1 · My first income'),L('2 · Grow my neighborhood'),L('3 · Grow my city'),L('4 · Long-term ambitions')];
function missionHint(p){
 const id=p.id;
 if(['first-build','second-build','third-build','fifth-build'].includes(id))return L('Build one affordable place at a time. New construction counts; your starting rentals do not.');
 if(id==='first-settlement')return L('Settle one month after building. Income and costs use the normal game rules.');
 if(id==='first-profit'||id.startsWith('profit-'))return L('Each settlement with positive total cash flow counts. The months do not need to be consecutive.');
 if(id==='first-upgrade')return L('Open an existing building and expand it once. Check the cost and expected profit before confirming.');
 if(id==='first-park')return L('Build one Public Park on empty land. It helps nearby buildings attract visitors.');
 if(id==='district')return L('Add three non-park properties and one Public Park beyond your starting holdings.');
 if(id.startsWith('reserve'))return L('Keep cash for the stated share of operating reserves. Avoid spending it all on construction.');
 if(id==='income-ten')return L('Review profit, rent and operating costs to raise projected total monthly cash flow.');
 if(id.startsWith('wealth'))return L('Grow cash and asset value gradually. This goal uses net worth, not cash alone.');
 if(id==='skyscraper-start')return L('Start with one floor on the required 3×3 lot. Review the real cost before signing; income begins after construction.');
 if(id==='first-skyscraper')return L('Let the construction months pass. Starting construction and completing it are separate achievements.');
 if(id==='tower-five')return L('Expand a completed skyscraper one floor at a time until it reaches five floors.');
 return L('A later goal: complete My Own Landmark, HQ Tower or City Monument. Ordinary hotels do not count.');
}
function missionAction(p){
 const id=p.id;
 if(['first-build','second-build','third-build','fifth-build','district'].includes(id))return `<button class="primary" data-action="mission-build">${L('Choose my next building')}</button>`;
 if(['first-settlement','first-profit','first-skyscraper'].includes(id)||id.startsWith('profit-'))return `<button class="primary" data-action="mission-settle">${L('Settle a month and see the result')}</button>`;
 if(id==='first-park')return `<button class="primary" data-mission-tool="citypark">${L('Choose a park site')}</button>`;
 if(id==='skyscraper-start')return `<button class="primary" data-mission-tool="skyscraper">${L('Choose a one-floor tower site')}</button>`;
 if(id==='first-upgrade'||id==='tower-five')return `<button class="primary" data-mission-manage="${id==='tower-five'?'skyscraper':'upgrade'}">${L('Review a building expansion')}</button>`;
 if(id==='landmark')return `<button class="primary" data-landmark="open">${L('View landmark designs')}</button>`;
 return `<button class="primary" data-action="${id.startsWith('reserve')?'stocks':'portfolio'}">${id.startsWith('reserve')?L('Review stocks to release cash'):L('Review property operations')}</button>`;
}
export function starterSites(s,a){
 const currentReserve=missionStats(s,a).reserve,result=[];
 // Quote a small spread of roadside lots plus those near existing holdings.
 // A full-map quote scan blocks the first click on large cities.
 const vacant=s.tiles.map((t,i)=>({t,i})).filter(({t,i})=>t.terrain==='land'&&!t.type&&!t.owner&&hasRoadAccess(s,i)).map(({i})=>i);
 const origins=a.owned.map(({i})=>coords(i)),distance=i=>{const p=coords(i);return origins.length?Math.min(...origins.map(o=>Math.abs(o.x-p.x)+Math.abs(o.y-p.y))):i;};
 const nearby=[...vacant].sort((i,j)=>distance(i)-distance(j)).slice(0,24),spread=Array.from({length:Math.min(24,vacant.length)},(_,n)=>vacant[Math.floor(n*vacant.length/Math.min(24,vacant.length))]);
 const candidates=[...new Set([...nearby,...spread])];
 for(const type of ['hotel','housing']){
  let best=null;
  for(const i of candidates){if(canBuild(s,i,type,'buy',{width:1,height:1}))continue;
   const q=developmentQuote(s,i,type,1,{width:1,height:1}),reserve=currentReserve+Math.ceil(q.cost*3);if(q.profit<=0||s.money-q.total<reserve)continue;
   if(!best||q.profit/q.total>best.q.profit/best.q.total)best={i,type,q,reserve};
  }
  if(best)result.push(best);
 }
 return result;
}
export function firstMoveChoices(s,sites){
 const site=sites.find(x=>x.type==='hotel')||sites[0];if(!site)return '';
 const {i,type,q}=site;
 return `<h2 id="tutorial-title" tabindex="-1">${type==='hotel'?L('Open your first hotel'):L('Build your first homes')}</h2><p>${L('We picked a suitable spot. One click turns this empty lot into your place.')}</p><div class="first-move-option">${propertyArt(type,true).replace('loading="lazy"','loading="eager"')}<strong>${L`Projected monthly profit +${money(q.profit)}`}</strong><button class="primary" data-first-build="${i}" data-first-type="${type}" data-first-price="${q.total}">${type==='hotel'?L`Open this hotel · ${money(q.total)}`:L`Build these homes · ${money(q.total)}`}</button></div><p class="first-move-hint">${L('The displayed cost buys the land and building. Next, collect your first month.')}</p>`;
}
export function firstMoveOpening(s,a,i){
 const t=s.tiles[i],r=a.reports[i];if(t?.owner!=='player'||!r||!['hotel','housing'].includes(t.type))return '';
 return `<h2 id="tutorial-title" tabindex="-1">${L('The doors are open. This place is yours.')}</h2><div class="first-move-opening">${propertyArt(t.type,true)}<div><b>${t.type==='hotel'?L('My first hotel'):L('Homes for my neighborhood')}</b><strong>${L`Projected profit ${money(r.profit)} / month`}</strong></div></div><p>${L('Your place is ready. Press once to collect a real month of income.')}</p><button class="primary full" data-action="tutorial-next">${L('Collect my first month →')}</button><small>${L('This settles the whole city. Markets and costs can change the result.')}</small>`;
}
export function missionCard(s,a){
 const names=missionNames(),progress=missionProgress(s,a),next=progress.find(p=>!p.complete);
 const m=s.missions,c=m?.active,cp=contractProgress(s,a);
 return `<section class="mission-card"><span class="eyebrow">${c||!next?L('MY NEXT ACHIEVEMENT'):stageNames()[MISSION_STAGES.findIndex(ids=>ids.includes(next.id))]}</span><h3>${c?names[c.id]:next?names[next.id]:L('Your city is ready for a new challenge')}</h3>${c?`<p>${L`Current progress ${Math.round(cp.value).toLocaleString('en-US')} / ${Math.round(cp.target).toLocaleString('en-US')}`}</p><p>${L`Game months left: ${Math.max(0,c.deadline-s.month)} · Property investment ${money(c.spent)} / ${money(c.budget)}`}</p>`:next?`<p>${missionHint(next)}</p><div class="meter"><i style="width:${Math.max(0,Math.min(100,next.value/next.target*100))}%"></i></div><p>${L`Progress ${Math.max(0,Math.min(next.value,next.target)).toLocaleString('en-US')} / ${next.target.toLocaleString('en-US')}`}</p>`:''}<div class="button-row">${!c&&next?missionAction(next):''}<button data-action="missions">${L('Missions and city projects')}</button></div><small>${L`Achievements ${m?.completed.length||0} / ${progress.length+CONTRACT_IDS.length}`}</small></section>`;
}
export function starterDialog(s,a){
 const sites=starterSites(s,a);
 return `<h2>${L('Choose your next building')}</h2><p>${L('Both recommendations use real prices and leave three months of reserves. Nothing is spent until you confirm the contract.')}</p>${sites.map(({i,type,q,reserve})=>{const p=coords(i);return `<section class="mission-option"><h3>${type==='hotel'?L('Recommended hotel'):L('Homes for my neighborhood')}</h3><p>${L`Lot ${p.x+1}, ${p.y+1} · Total ${money(q.total)} · Projected profit ${money(q.profit)} / month`}</p><p>${L`Cash after building ${money(s.money-q.total)} · Reserve ${money(reserve)}`}</p><button class="primary" data-starter-site="${i}" data-starter-type="${type}">${L('Review this build contract')}</button></section>`;}).join('')||`<p>${L('No affordable positive-profit site meets the reserve rule right now. Review your holdings or settle a month before investing.')}</p>`}<button data-action="stocks">${L('Review stocks to release cash')}</button><button data-action="mission-settle">${L('Settle a month and see the result')}</button>`;
}
const descriptions=()=>({tourism:L('Grow tourism revenue by 20% or ₲5,000, whichever is higher, within twelve game months.'),cashflow:L('Keep every settlement non-negative for twelve game months. No forced asset sales.'),redevelopment:L('Lift average foot traffic at your properties by eight points, up to 100, within twelve game months.'),skyline:L('Raise your highest completed skyscraper by 10% or five floors, whichever is higher, within twelve game months.')});
function missionStages(progress,names){
 const current=progress.find(p=>!p.complete),stages=stageNames();
 return MISSION_STAGES.map((ids,n)=>{const rows=progress.filter(p=>ids.includes(p.id)),done=rows.filter(p=>p.complete).length;return `<details class="mission-stage" ${current&&ids.includes(current.id)?'open':''}><summary>${stages[n]} <small>${done} / ${rows.length}</small></summary><div class="mission-list">${rows.map(p=>`<div><b>${p.complete?'✓':'○'} ${names[p.id]}</b><small>${p.complete?L('Achieved'):L`Progress ${Math.max(0,Math.min(p.value,p.target)).toLocaleString('en-US')} / ${p.target.toLocaleString('en-US')}`}</small></div>${current?.id===p.id?`<p class="help">${missionHint(p)}</p><div class="button-row">${missionAction(p)}</div>`:''}`).join('')}</div></details>`;}).join('');
}
export function missionsDialog(s,a){
 const names=missionNames(),progress=missionProgress(s,a),m=s.missions,desc=descriptions();
 return `<h2>${L('My city, my next achievement')}</h2><p>${L('Build, earn and shape your city. Completed achievements stay in this saved story.')}</p>${missionStages(progress,names)}<h3>${L('Choose a twelve-month city project')}</h3><p>${L('Your city stays intact. Property purchases, construction and expansion count toward the stated investment budget. Exceeding it or a forced sale ends the project. No cash rewards or permanent income multipliers.')}</p>${m.active?`<section class="mission-option"><h3>${names[m.active.id]}</h3><p>${L`Current progress ${Math.round(contractProgress(s,a).value).toLocaleString('en-US')} / ${Math.round(m.active.target).toLocaleString('en-US')}`}</p><p>${desc[m.active.id]}</p><p>${L`Game months left: ${Math.max(0,m.active.deadline-s.month)} · Property investment ${money(m.active.spent)} / ${money(m.active.budget)}`}</p><p>${L`Target ${Math.round(m.active.target).toLocaleString('en-US')} · Baseline ${Math.round(m.active.baseline).toLocaleString('en-US')}`}</p><button data-action="mission-cancel">${L('End this project and keep my city')}</button></section>`:CONTRACT_IDS.map(id=>{const q=contractQuote(s,a,id);return `<section class="mission-option"><h3>${names[id]}</h3><p>${desc[id]}</p>${id==='skyline'&&q.baseline===0?`<p>${L('Complete a skyscraper before choosing this project.')}</p>`:''}<p>${L`Property investment budget ${money(q.budget)} · Target ${Math.round(q.target).toLocaleString('en-US')}`}</p><button data-mission-start="${id}" ${id==='redevelopment'&&q.baseline>=100||id==='skyline'&&q.baseline===0?'disabled':''}>${L('Start this city project')}</button></section>`;}).join('')}<section class="mission-option"><h3>${L('Twelve-month development challenge')}</h3><p>${L('Try the same starting city as other players for twelve months. Keep your main city and compare your best result.')}</p><button data-action="trial-start">${L('Start an equal-start challenge')}</button></section><h3>${L('City honors')}</h3><p>${L('A completed project earns its city title and a record. Scores reward unspent budget; comparisons are personal records from different cities, not an equal-start competition.')}</p>${m.history.length?m.history.slice().reverse().map(h=>`<p>${h.won?'🏅':'○'} ${names[h.id]} · ${L`Month ${h.month} · Score ${h.score}`} · ${h.won?L('Completed'):h.reason==='budget'?L('Investment budget exceeded'):h.reason==='fire-sale'?L('Forced asset sale'):h.reason==='cancelled'?L('Ended by player'):L('Target not reached')}</p>`).join(''):`<p>${L('Your first city honor is waiting.')}</p>`}`;
}
export function cashAdvice(s,a){const reserve=missionStats(s,a).reserve;if(s.money>=reserve&&a.net>=0)return'';return `<section class="mission-cash"><h3>${L('Protect cash for your next move')}</h3><p>${L`Cash ${money(s.money)} · Three-month reserve ${money(reserve)} · Projected monthly cash flow ${money(a.net)}`}</p><p>${L('Selling part of your stocks can release cash. Check rent, upkeep and management before expanding; property sales show their costs before confirmation.')}</p><div class="button-row"><button data-action="stocks">${L('Review stocks to release cash')}</button><button data-action="portfolio">${L('Review property operations')}</button></div></section>`;}
