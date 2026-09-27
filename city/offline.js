// While the game is closed or in the background, the city keeps running: every AWAY_MONTH_MS of real time
// settles one more month, up to AWAY_MAX_MONTHS a visit. The same month-end simulation (engine.tick) runs, so
// nothing is invented: rent, dividends and upkeep settle as they would at 1× speed. The catch-up stops where
// live play pauses too (a decision event or a field rush), when cash flow is negative (so nothing is lost or
// fire-sold while away) and at a freshly reached legacy ending. app.js stamps state.savedAt on every save.
import {L} from './i18n.js';
import {analyze,tick} from './engine.js';
export const AWAY_MONTH_MS=30*60*1000;
export const AWAY_MAX_MONTHS=240;
const money=n=>'₲'+Math.round(n).toLocaleString('en-US'),signed=n=>(n<0?'−':'+')+money(Math.abs(n));
export function awayMonths(savedAt,now){
 if(!Number.isFinite(savedAt)||!Number.isFinite(now))return 0;
 return Math.max(0,Math.min(AWAY_MAX_MONTHS,Math.floor((now-savedAt)/AWAY_MONTH_MS)));
}
// Settles the months the player was away for and reports what happened for the welcome-back dialog.
// stop: null | 'decision' (event or field rush waiting) | 'cashflow' (negative cash flow) | 'ending'.
export function catchUp(s,now=Date.now()){
 const wanted=awayMonths(s.savedAt,now),r={away:wanted?now-s.savedAt:0,wanted,months:0,cash:s.money,wealth:analyze(s).wealth,stop:null};
 while(r.months<wanted){
  if(s.event||s.shift){r.stop='decision';break;}
  if(analyze(s).net<0){r.stop='cashflow';break;}
  tick(s);r.months++;
  if(s.ending&&!s.ending.shown){r.stop='ending';break;}
 }
 return{...r,earned:s.money-r.cash,growth:analyze(s).wealth-r.wealth,pending:!!(s.event||s.shift)};
}
export function awayText(ms){
 const m=Math.floor(ms/60000),h=Math.floor(m/60),d=Math.floor(h/24);
 if(d>=2)return L`${d} days ${h%24} h`;
 if(h>=1)return L`${h} h ${m%60} min`;
 return L`${m} min`;
}
export function awayDialog(s,r,mode='unavailable'){
 const note=r.pending?L('A decision is waiting for you, so the books paused there. It opens next.'):r.stop==='cashflow'?L('Cash flow turned negative, so the books paused until you were back.'):r.stop==='ending'?L('Your legacy ending arrived while you were away.'):r.months>=AWAY_MAX_MONTHS?L`The city settles at most ${AWAY_MAX_MONTHS} months a visit.`:'';
 const html=L`<span class="eyebrow">WHILE YOU WERE AWAY</span><h2>Your city kept running.</h2><p>Away ${awayText(r.away)} · ${r.months} months settled</p><div class="legacy-score"><div><span>Cash</span><b>${signed(r.earned)}</b><small>Now ${money(s.money)}</small></div><div><span>Net worth</span><b>${signed(r.growth)}</b><small>Now ${money(r.wealth+r.growth)}</small></div><div><span>Calendar</span><b>Year ${Math.floor(s.month/12)+1} · Month ${s.month%12+1}</b><small>${r.months} months passed</small></div></div><p class="help">Every ${AWAY_MONTH_MS/60000} minutes away settles one month, up to ${AWAY_MAX_MONTHS} a visit, while cash flow stays positive. ${note}</p><button data-action="close" class="primary full">Back to My City</button>`;
 const bonus=r.earned>0&&r.months>0?`<section class="reward-notice"><b>${L('Double your away earnings')}</b><p>${L`Receive an extra ${money(r.earned)}. Your original settlement is already saved.`}</p><button class="primary full" data-reward="away" ${mode==='local-demo'?'':'disabled'}>${mode==='local-demo'?L('Preview 2× reward · No real ad'):L('Watch an ad for 2× earnings · Coming soon')}</button><p class="help">${mode==='local-demo'?L('Developer reward preview · Not a real ad'):L('No real ad provider is connected yet. Normal play works as usual.')}</p></section>`:'';
 return html.replace('<button data-action="close"',bonus+'<button data-action="close"');
}

// An offer belongs to this loaded game and this settlement only. Reloading cannot replay it.
export function createAwayReward(state,result,id){
 const amount=result.months>0&&Number.isFinite(result.earned)?Math.max(0,result.earned):0;let claimed=false;
 return {amount,claim(current,receipt){
  if(claimed||amount<=0||current!==state||!receipt||receipt.id!==id||receipt.kind!=='away'||receipt.completed!==true||receipt.source!=='local-demo')return false;
  if(!Number.isFinite(state.money+amount)||state.money+amount>Number.MAX_SAFE_INTEGER)return false;
  claimed=true;state.money+=amount;state.highestWealth=Math.max(state.highestWealth||0,analyze(state).wealth);return true;
 }};
}
