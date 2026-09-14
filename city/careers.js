import {L} from './i18n.js';
export const CAREERS={
 flexible:{name:L('Gig Work'),icon:'↗',hourly:17,skill:0,desc:L('Delivery and short gigs. Work as much as you need alongside other activities.')},
 office:{name:L('Office Job'),icon:'▤',hourly:21,skill:20,desc:L('Skill 20+. Steady wages from paperwork and operations.')},
 specialist:{name:L('Pro Freelancer'),icon:'✧',hourly:29,skill:45,desc:L('Skill 45+. Sell your expertise by the hour.')},
 engineer:{name:L('Senior Specialist'),icon:'⌘',hourly:38,skill:70,desc:L('Skill 70+. Turn top-tier expertise into a top hourly rate.')},
};
export function wageQuote(s){const job=CAREERS[s.career]||CAREERS.flexible;const hourly=job.hourly+s.skill*.09,efficiency=1-Math.max(0,s.stress-65)*.007;return{job,hourly,wage:Math.round(s.plan.work*hourly*efficiency)};}
export function chooseCareer(s,id){const job=CAREERS[id];if(!Object.hasOwn(CAREERS,id))return{ok:false,msg:L('Pick a career.')};if(s.skill<job.skill)return{ok:false,msg:L`Requires Skill ${job.skill} to apply.`};s.career=id;return{ok:true,msg:L`${job.name} selected · Allocate work hours and it shows in next month's pay.`};}
export function validCareer(s){return s.career===undefined||Object.hasOwn(CAREERS,s.career);}
