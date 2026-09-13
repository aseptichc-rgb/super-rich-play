export const CAREERS={
 flexible:{name:'자유 근로',icon:'↗',hourly:17,skill:0,desc:'배달·단기 업무. 필요한 만큼 일하며 다른 활동과 병행합니다.'},
 office:{name:'사무직',icon:'▤',hourly:21,skill:20,desc:'전문성 20부터. 문서·운영 업무로 안정적인 근로소득을 만듭니다.'},
 specialist:{name:'전문 프리랜서',icon:'✧',hourly:29,skill:45,desc:'전문성 45부터. 숙련된 기술을 시간 단위로 제공합니다.'},
 engineer:{name:'시니어 전문가',icon:'⌘',hourly:38,skill:70,desc:'전문성 70부터. 높은 전문성을 높은 시급으로 전환합니다.'},
};
export function wageQuote(s){const job=CAREERS[s.career]||CAREERS.flexible;const hourly=job.hourly+s.skill*.09,efficiency=1-Math.max(0,s.stress-65)*.007;return{job,hourly,wage:Math.round(s.plan.work*hourly*efficiency)};}
export function chooseCareer(s,id){const job=CAREERS[id];if(!Object.hasOwn(CAREERS,id))return{ok:false,msg:'직업을 선택하세요.'};if(s.skill<job.skill)return{ok:false,msg:`전문성 ${job.skill}부터 지원할 수 있습니다.`};s.career=id;return{ok:true,msg:`${job.name} 선택 · 근로 시간을 배분하면 다음 월급에 반영됩니다.`};}
export function validCareer(s){return s.career===undefined||Object.hasOwn(CAREERS,s.career);}
