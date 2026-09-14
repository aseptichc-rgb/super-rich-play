// Chapters, prestige as a currency, philanthropy, the foundation and the legacy ending.
import {L} from './i18n.js';
import {reputationSummary} from './empire.js';
const money=n=>'₲'+Math.round(n).toLocaleString('en-US');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const CHAPTERS=[
 {n:1,name:L('Heir','chapter'),en:'THE HEIR',min:0,unlocks:[L('Hotel · rental building construction'),L('Compound risk ladder'),L('Venture · small business acquisitions')],symbol:L('First hotel'),hint:L('Build cash flow and grab the best land before your rival does.')},
 {n:2,name:L('Developer'),en:'THE DEVELOPER',min:10000000,unlocks:[L('Resort construction'),L('Tourism cluster synergy (+8% per adjacent hotel/resort)'),L('Top-tier masterpiece auctions')],symbol:L('Resort complex'),hint:L('Build hotels and resorts side by side to lift each other\'s revenue.')},
 {n:3,name:L('Tycoon'),en:'THE TYCOON',min:30000000,unlocks:[L('HQ tower (managed revenue +5%)'),L('Company · broadcaster acquisitions'),L('Rival M&A offers and rival building buyouts')],symbol:L('HQ tower'),hint:L('Build your HQ and buy out your rival\'s buildings at a premium.')},
 {n:4,name:L('Legacy'),en:'THE LEGACY',min:150000000,unlocks:[L('City monument (managed revenue +10%)'),L('Found a foundation'),L('Legacy ending and new runs')],symbol:L('City monument'),hint:L('Time to decide what you leave behind. The ending opens in year 10 or at ₲300M.')}
];
export const SCENARIOS={
 heir:{name:L('Heir'),icon:'♛',tagline:L('Net worth ₲2,000,000 · mansion, sports car, 3 rentals, stocks'),desc:L('The default start. The assets are ready; the question is what you leave behind.')},
 selfmade:{name:L('Self-made'),icon:'⚒',tagline:L('Cash ₲500,000 · no assets · expertise 85'),desc:L('Start from nothing. The road to your first hotel is the longest, and the most thrilling.')},
 windfall:{name:L('Windfall'),icon:'✦',tagline:L('Cash ₲3,500,000 · mansion, car and yacht · 3× living costs'),desc:L('You bought everything at once. Upkeep eats your cash every month.')}
};
export const PRESTIGE_DECAY=.03;
export function chapterOf(s){const peak=s.mode==='sandbox'?Infinity:(s.highestWealth||0);return CHAPTERS.filter(c=>peak>=c.min).at(-1);}
export function nextChapter(s){return s.mode==='sandbox'?null:CHAPTERS.find(c=>c.min>(s.highestWealth||0))||null;}
export function addPrestige(s,n){s.prestige=Math.max(0,Math.round(((s.prestige||0)+n)*10)/10);return s.prestige;}
// Lifestyle fame fades 3% a month; landmark buildings feed it every month.
export function settlePrestige(s){
 if(s.prestige)s.prestige=Math.max(0,Math.round(s.prestige*(1-PRESTIGE_DECAY)*10)/10);
 const owned=s.tiles.filter(t=>t.owner==='player');
 const gain=(owned.some(t=>t.type==='hq')?10:0)+(owned.some(t=>t.type==='monument')?30:0);
 if(gain)addPrestige(s,gain);
}
export function foundationQuote(s,wealth){return Math.max(5000000,Math.round(wealth*.05));}
export function foundFoundation(s,wealth){
 if(chapterOf(s).n<4)return{ok:false,msg:L('Available in the Legacy chapter (peak net worth ₲150,000,000).')};
 if(s.foundation)return{ok:false,msg:L('You already founded a foundation.')};
 const amount=foundationQuote(s,wealth);if(s.money<amount)return{ok:false,msg:L`Endowment of ${money(amount)} required`};
 s.money-=amount;s.foundation={month:s.month,endowment:amount};addPrestige(s,100);
 s.log.unshift(L`✦ ${s.name} Foundation established · endowment ${money(amount)} · Reputation +100`);s.log=s.log.slice(0,25);
 return{ok:true,msg:L('Foundation established. Your name lives on in the city.')};
}
export function legacyScore(s,a){
 const peak=Math.max(s.highestWealth||0,a.wealth),owned=s.tiles.filter(t=>t.owner==='player'),fame=Math.round(reputationSummary(s).fame);
 const beatRival=!!s.rival&&a.wealth>=s.rival.wealth;
 const parts=[
  {name:L('Peak net worth'),value:Math.min(3000,Math.round(peak/10000000*100)),note:L('100 pts per ₲10M · max 3,000')},
  {name:L('Reputation'),value:fame,note:L('1 pt per reputation point')},
  {name:L('Memories'),value:(s.lifestyle?.memories||0)*20,note:L('20 pts per experience')},
  {name:L('Landmark buildings'),value:(owned.some(t=>t.type==='hq')?300:0)+(owned.some(t=>t.type==='monument')?800:0),note:L('HQ 300 · monument 800')},
  {name:L('Foundation'),value:s.foundation?400:0,note:L('400 if founded')},
  {name:L('Rival race'),value:beatRival?500:0,note:L('500 for finishing ahead of your rival')},
  {name:L('Clean management'),value:(s.fireSales||0)?0:200,note:L('200 for finishing with no fire sales')}
 ];
 const total=parts.reduce((n,p)=>n+p.value,0),grade=total>=4500?'S':total>=3000?'A':total>=1800?'B':'C';
 return{parts,total,grade,beatRival};
}
export function endingReport(s,a){const score=legacyScore(s,a);return{month:s.month,wealth:Math.round(a.wealth),peak:Math.round(Math.max(s.highestWealth||0,a.wealth)),score:score.total,grade:score.grade,parts:score.parts,beatRival:score.beatRival,shown:false};}
export function validLegacy(s){
 if(s.prestige!==undefined&&!(Number.isFinite(s.prestige)&&s.prestige>=0))return false;
 if(s.lastDonation!==undefined&&!(Number.isInteger(s.lastDonation)&&s.lastDonation>=0&&s.lastDonation<=s.month))return false;
 if(s.donated!==undefined&&!(Number.isFinite(s.donated)&&s.donated>=0))return false;
 if(s.foundation!==undefined&&!(s.foundation&&Number.isInteger(s.foundation.month)&&s.foundation.month>=0&&s.foundation.month<=s.month&&Number.isFinite(s.foundation.endowment)&&s.foundation.endowment>0))return false;
 if(s.ending!==undefined&&!(s.ending&&Number.isInteger(s.ending.month)&&s.ending.month>=0&&s.ending.month<=s.month&&Number.isFinite(s.ending.score)&&['S','A','B','C'].includes(s.ending.grade)&&typeof s.ending.shown==='boolean'&&Array.isArray(s.ending.parts)))return false;
 if(s.scenario!==undefined&&!Object.hasOwn(SCENARIOS,s.scenario))return false;
 return ['crisisMonths','fireSales'].every(k=>s[k]===undefined||(Number.isInteger(s[k])&&s[k]>=0));
}
export function chapterDialog(s,chapter){
 const c=CHAPTERS.find(x=>x.n===chapter)||chapterOf(s),next=CHAPTERS.find(x=>x.n===c.n+1);
 return L`<div class="chapter-card"><span class="eyebrow">CHAPTER ${String(c.n).padStart(2,'0')} · ${c.en}</span><h2>The ${c.name} era has begun.</h2><p>${c.hint}</p><ul class="chapter-unlocks">${c.unlocks.map(u=>`<li>✦ ${u}</li>`).join('')}</ul><p class="help">Map symbol: <b>${c.symbol}</b>${next?L` · The next chapter ‘${next.name}’ opens at a peak net worth of ${money(next.min)}.`:L(' · This is the final chapter. The ending opens in year 10 or at ₲300,000,000.')}</p><button data-action="close" class="primary full">Continue →</button></div>`;
}
export function chapterCard(s,a){
 const c=chapterOf(s),next=nextChapter(s),progress=next?Math.min(100,Math.max(0,(a.wealth-c.min)/(next.min-c.min)*100)):100;
 return L`<section class="side-section chapter-section"><h3>CHAPTER ${String(c.n).padStart(2,'0')} · ${c.name} <span>✦</span></h3><div class="meter milestone"><i style="width:${progress}%"></i></div><p class="help">${next?L`${money(Math.max(0,next.min-a.wealth))} to chapter ‘${next.name}’ · unlocks ${next.unlocks[0]}`:L('Final chapter · complete your legacy')}</p><button class="portfolio-link" data-action="legacy">Reputation · Giving · Legacy score →</button></section>`;
}
export function legacyDialog(s,a){
 const r=reputationSummary(s),score=legacyScore(s,a),c=chapterOf(s),endowment=foundationQuote(s,a.wealth);
 return L`<span class="eyebrow">REPUTATION &amp; LEGACY</span><h2>The money is made. Now leave a name.</h2><p>Lifestyle reputation fades 3% a month; parties, collections and landmark buildings refill it. Reputation from giving and interviews stays. Beyond title perks, reputation sets your hotel, resort and building revenue premium (up to +20%), auction access, and recovery when a venture fails.</p><section class="owner-reputation"><span>My reputation</span><h3>${Math.round(r.fame).toLocaleString('en-US')} · ${r.tier.name}</h3><p>Lifestyle ${Math.round(s.prestige||0)} · Owner & social ${Math.round(r.fame-(s.prestige||0))} · Revenue premium +${Math.round(r.premium*100-100)}%</p><p>${r.next?L`${Math.ceil(r.next.min-r.fame).toLocaleString('en-US')} pts to the next title ‘${r.next.name}’`:L('Highest title reached')}</p></section><div class="legacy-actions"><section><h3>♡ Giving · Interviews</h3><p>Community giving earns 1 reputation per ₲1,000 donated; a press interview once a month gives +20.</p><button data-action="reputation">Giving · Interviews · Titles</button></section><section><h3>✦ ${esc(s.name)} Foundation</h3><p>${s.foundation?L`Founded in month ${s.foundation.month} · endowment ${money(s.foundation.endowment)}`:L`5% of net worth (min ₲5,000,000 · now ${money(endowment)}) · Reputation +100 · Legacy 400 pts`}</p><button data-action="found" ${s.foundation||c.n<4||s.money<endowment?'disabled':''}>${s.foundation?L('Founded'):c.n<4?L('Unlocks in Legacy chapter'):s.money<endowment?L('Not enough cash'):L('Found a foundation')}</button></section></div><h3>Legacy score preview · ${score.total.toLocaleString('en-US')} pts · Grade ${score.grade}</h3><div class="legacy-score">${score.parts.map(p=>`<div><span>${p.name}</span><b>${p.value.toLocaleString('en-US')}</b><small>${p.note}</small></div>`).join('')}</div><p class="help">The ending opens in year 10 (month 120) or at a peak net worth of ₲300,000,000, and you can keep playing after. Grades: S 4,500 · A 3,000 · B 1,800.</p>`;
}
export function endingDialog(s){
 const e=s.ending;if(!e)return'';
 const scenario=SCENARIOS[s.scenario||'heir'];
 return L`<div class="ending-card grade-${e.grade}"><span class="eyebrow">LEGACY · ${scenario.name} route · Month ${e.month}</span><h2>Grade ${e.grade} · ${e.score.toLocaleString('en-US')} pts</h2><p>${e.grade==='S'?L('An owner who defined an era. The city remembers your name.'):e.grade==='A'?L('A national icon. Wealth and reputation both endure.'):e.grade==='B'?L('A successful investor. Leave a bigger legacy next run.'):L('You lived rich but left little behind. Try a different path.')}</p><div class="legacy-score">${e.parts.map(p=>`<div><span>${p.name}</span><b>${p.value.toLocaleString('en-US')}</b><small>${p.note}</small></div>`).join('')}</div><p class="help">Peak net worth ${money(e.peak)} · Net worth at ending ${money(e.wealth)}${e.beatRival?L(' · Won the rival race'):L(' · Behind your rival')}</p><div class="button-row"><button data-action="close" class="primary">Keep playing</button><button data-action="settings">Start a new run (different start) →</button></div></div>`;
}
