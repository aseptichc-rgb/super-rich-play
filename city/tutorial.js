import {L} from './i18n.js';

// Onboarding is a device preference, separate from game saves and account sync.
export const TUTORIAL_KEY='super-rich-tutorial-v2';
export function tutorialSteps(){return [
 {id:'build',title:L('Build the first place that is yours'),text:L('Choose a recommended hotel or housing site. Compare the real cost, projected profit and cash left over, then confirm your own build.')},
 {id:'month',title:L('Your building is ready. Collect its first month.'),text:L('Settle one real game month to collect income and pay costs. The result shows what your choice earned. You can explore freely or skip this guide.')},
 {id:'finish',title:L('You built it. Now choose your next achievement.'),text:L('Your first settlement is recorded. Keep reserves, build a street or choose a city project. This device saves your progress; connect Google to continue across devices.')}
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
  html(){const i=progress?.step??0,s=steps[i];return `<section id="tutorial-card" aria-labelledby="tutorial-title"><span class="eyebrow">${L`Play tutorial · ${i+1} / ${steps.length}`}</span><h2 id="tutorial-title" tabindex="-1">${s.title}</h2><p>${s.text}</p><div class="button-row"><button class="primary" data-action="tutorial-next"><svg class="tutorial-next-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16M14 6l6 6-6 6"/></svg>${s.id==='month'?L('Settle One Month'):s.id==='finish'?L('Finish Tutorial'):L('Choose my first building')}</button><button data-action="tutorial-skip">${L('Skip Tutorial')}</button></div></section>`;}
 };
}
