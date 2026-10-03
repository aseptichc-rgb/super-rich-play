import {L} from './i18n.js';

// Onboarding is a device preference, separate from game saves and account sync.
export const TUTORIAL_KEY='super-rich-tutorial-v1';
export function tutorialSteps(){return [
 {id:'welcome',title:L('Welcome to your rich life'),text:L('Your goal is to grow your wealth and enjoy it. You already own income-producing assets. Follow this short tour of the real game screens. You can skip it and restart from ? anytime.')},
 {id:'budget',title:L('Cash is what you can spend'),text:L('Net worth includes your assets; cash is money available now. In Cash Flow, compare income with living costs and upkeep. Keep cash in reserve: a negative month-end balance can force asset sales.')},
 {id:'assets',title:L('Meet the assets you own'),text:L('These are your businesses and properties. Each row shows its monthly profit. Select one to inspect its income, costs and management options. On the map, gold name tags mark your assets.')},
 {id:'invest',title:L('Let your money work'),text:L('Choose a stock and check its price, quantity and monthly dividend before using Buy. Start small and keep cash for costs. Prices can fall. Buying is optional; every purchase uses your real game cash. You can continue without trading.')},
 {id:'month',title:L('Try one month of play'),text:L('Settle one month to collect income and pay costs. This advances your real game once. The arrow button does the same; play and speed buttons run time automatically. Decisions pause time until you choose.')},
 {id:'settlement',title:L('See what the month earned'),text:L('Last Month Settlement shows the actual cash flow; the projection estimates the next month. Investment values can also change, so cash flow and net worth growth are different. Check this screen before spending more.')},
 {id:'plan',title:L('Give yourself time to rest'),text:L('Time & Life divides your monthly hours. Managed buildings need attention, and unused hours become rest. Watch stress as you trade and expand. More rest and experiences help you recover.')},
 {id:'lifestyle',title:L('Enjoy the wealth you build'),text:L('Choose travel, culture or a cruise here. Check the price before confirming: experiences spend cash and create memories. You can also explore your mansion, collections and the map at your own pace.')},
 {id:'finish',title:L('You are ready to play'),text:L('Keep cash flow healthy, invest at your own pace, settle months and enjoy your life. Next, try selecting an empty lot on the map to compare a property contract. Nothing is purchased until you confirm. Open ? whenever you want this tour again.')}
];}

export function createTutorial(storage,key=TUTORIAL_KEY){
 const steps=tutorialSteps();let progress=null;
 try{const p=JSON.parse(storage.getItem(key));if(p&&['active','complete','skipped'].includes(p.status)&&Number.isInteger(p.step)&&p.step>=0&&p.step<steps.length)progress=p;}catch{}
 const persist=()=>{try{storage.setItem(key,JSON.stringify(progress));}catch{}};
 return {
  get active(){return progress?.status==='active';},
  get unseen(){return progress===null;},
  get index(){return progress?.step??0;},
  get step(){return steps[progress?.step??0];},
  start(){progress={status:'active',step:0};persist();},
  move(offset){if(progress?.status!=='active')return;progress.step=Math.max(0,Math.min(steps.length-1,progress.step+offset));persist();},
  finish(skipped=false){if(progress?.status!=='active')return;progress.status=skipped?'skipped':'complete';persist();},
  html(){const i=progress?.step??0,s=steps[i];return `<section id="tutorial-card" aria-labelledby="tutorial-title"><span class="eyebrow">${L`Play tutorial · ${i+1} / ${steps.length}`}</span><h2 id="tutorial-title" tabindex="-1">${s.title}</h2><p>${s.text}</p><div class="button-row">${i?`<button data-action="tutorial-back">${L('Previous')}</button>`:''}<button class="primary" data-action="tutorial-next">${s.id==='month'?L('Settle One Month'):s.id==='finish'?L('Finish Tutorial'):L('Next')}</button><button data-action="tutorial-skip">${L('Skip Tutorial')}</button></div></section>`;}
 };
}
