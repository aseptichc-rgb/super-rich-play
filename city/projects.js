// Creative income outside property and retail. Quotes are fixed at project start.
import {reputationSummary} from './empire.js';
export const PATHS={
 film:{name:'독립 영화 제작',icon:'▣',tag:'총괄 제작 → 프리미어 → 판권',cost:100000,hours:80,sale:30000,royalty:4000,richOnly:true,desc:'제작진과 함께 나만의 독립 영화를 완성합니다. 창작 시간은 기획·편집 검토에 쓰이며, 완성 보수와 24개월 판권 수익을 받습니다.'},
 couture:{name:'디자이너 컬렉션',icon:'✧',tag:'아트 디렉팅 → 전시 → 라이선스',cost:50000,hours:60,sale:15000,royalty:2000,richOnly:true,desc:'전문 공방과 한정판 디자인 컬렉션을 만듭니다. 창작 시간을 아트 디렉팅에 배분하고 완성 보수와 24개월 라이선스 수익을 받습니다.'},
 flip:{name:'중고품 리메이크',icon:'♻',tag:'발견 → 수리 → 되팔기',cost:350,hours:20,sale:600,royalty:0,desc:'버려진 가구와 중고 기기를 손봐 되팝니다. 완성 시 한 번 판매 수익을 받습니다.'},
 newsletter:{name:'독립 콘텐츠',icon:'✎',tag:'내 관심사 → 유료 구독',cost:0,hours:50,sale:0,royalty:130,desc:'취미·경험·노하우를 콘텐츠로 만듭니다. 완성 후 24개월 동안 구독 수익이 들어옵니다.'},
 tool:{name:'작은 디지털 도구',icon:'⌘',tag:'문제 발견 → 제작 → 라이선스',cost:250,hours:80,sale:200,royalty:250,desc:'템플릿이나 작은 앱을 만듭니다. 완성 보수와 24개월의 라이선스 수익을 받습니다.'},
 music:{name:'음악 & 일러스트',icon:'♫',tag:'창작 → 공개 → 저작권',cost:120,hours:45,sale:100,royalty:160,desc:'음원·삽화·소재 팩을 제작합니다. 완성 보수와 24개월의 저작권 수익을 받습니다.'},
 bounty:{name:'문제 해결 챌린지',icon:'⚡',tag:'의뢰 발견 → 해결 → 보상',cost:0,hours:30,sale:520,royalty:0,desc:'데이터 정리, 번역, 아이디어 공모 등 문제를 해결하고 완성 보수를 받습니다.'},
};
export function projectQuote(s,type,style='balanced'){
 const p=PATHS[type];if(!p)return null;const factor=style==='quick'?.7:style==='craft'?1.4:1,yieldFactor=style==='quick'?.65:style==='craft'?1.35:1,skill=1+s.skill*.012;
 return{hours:Math.round(p.hours*factor),cost:p.cost,sale:Math.round(p.sale*skill*yieldFactor),royalty:Math.round(p.royalty*skill*yieldFactor)};
}
export function startProject(s,type,style,name){
 if(!Object.hasOwn(PATHS,type)||!['quick','balanced','craft'].includes(style))return{ok:false,msg:'만들고 싶은 활동과 제작 방식을 골라주세요.'};
 s.projects||=[];if(s.projects.filter(p=>p.status==='working').length>=3)return{ok:false,msg:'진행 중인 프로젝트는 최대 3개입니다. 기존 작업을 먼저 완성하세요.'};
 if(s.projects.filter(p=>p.status!=='archived').length>=8)return{ok:false,msg:'프로젝트 8개를 보유하고 있습니다. 완성한 프로젝트를 정리하면 새로 시작할 수 있습니다.'};
 const q=projectQuote(s,type,style);if(s.money<q.cost)return{ok:false,msg:'준비 자금이 부족합니다. 초기 비용 없는 콘텐츠나 챌린지도 있습니다.'};
 s.money-=q.cost;s.projects.push({id:(s.projectSerial||0)+1,type,style,name:String(name||PATHS[type].name).trim().slice(0,30)||PATHS[type].name,status:'working',progress:0,...q,monthsLeft:0});s.projectSerial=(s.projectSerial||0)+1;
 return{ok:true,msg:'프로젝트 시작! 시간 & 생활에서 창작·제작 시간을 배분하세요.'};
}
export function projectReport(s){const projects=s.projects||[],working=projects.filter(p=>p.status==='working'),hours=(s.plan.create||0)*reputationSummary(s).creativeMultiplier*(s.tiles?.[s.journey?.workroom]?.owner==='player'&&s.tiles?.[s.journey?.workroom]?.type==='atelier'?1.15:1)/Math.max(1,working.length);let income=0;const completions=[];
 for(const p of projects){if(p.status==='working'&&p.progress+hours>=p.hours){income+=p.sale;completions.push(p.id);}if(p.status==='earning'&&p.monthsLeft>0)income+=p.royalty;}
 return{income,completions,hours,working:working.length,royalties:projects.filter(p=>p.status==='earning').reduce((n,p)=>n+p.royalty,0)};
}
export function advanceProjects(s){const report=projectReport(s);for(const p of s.projects||[]){if(p.status==='working'){p.progress=Math.min(p.hours,p.progress+report.hours);if(p.progress>=p.hours){p.status=p.royalty?'earning':'complete';p.monthsLeft=p.royalty?24:0;s.log.unshift(`✦ ${p.name} 완성! ${p.royalty?'다음 달부터 월 '+p.royalty+'G 수익':'판매·납품 보수 '+p.sale+'G'}`);}}else if(p.status==='earning'){p.monthsLeft--;if(p.monthsLeft<=0)p.status='complete';}}return report;}
export function archiveProject(s,id){const p=s.projects?.find(p=>p.id===id);if(!p||p.status==='working'||p.status==='archived')return{ok:false,msg:'완성한 프로젝트만 정리할 수 있습니다.'};p.status='archived';p.monthsLeft=0;return{ok:true,msg:'프로젝트를 보관했습니다. 이후 수익은 종료됩니다.'};}
export function validProjects(s){
 if(s.projects===undefined)return true;if(!Array.isArray(s.projects)||s.projects.length>1000||!Number.isInteger(s.projectSerial)||s.projectSerial<0)return false;
 const ids=new Set();return s.projects.every(p=>{if(!p||ids.has(p.id)||!Number.isInteger(p.id)||p.id<1||p.id>s.projectSerial||!Object.hasOwn(PATHS,p.type)||!['quick','balanced','craft'].includes(p.style)||typeof p.name!=='string'||p.name.length>30||!['working','earning','complete','archived'].includes(p.status))return false;ids.add(p.id);return ['hours','cost','sale','royalty','progress','monthsLeft'].every(k=>Number.isFinite(p[k])&&p[k]>=0)&&p.hours>0&&p.progress<=p.hours&&p.monthsLeft<=24;});
}
