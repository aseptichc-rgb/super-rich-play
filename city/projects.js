// Creative income outside property and retail. Quotes are fixed at project start.
import {L} from './i18n.js';
import {reputationSummary} from './empire.js';
export const PATHS={
 film:{name:L('Indie Film Production'),icon:'▣',tag:L('Executive produce → Premiere → Rights'),cost:100000,hours:80,sale:30000,royalty:4000,richOnly:true,desc:L('Finish your own indie film with a crew. Creative hours go to planning and edit reviews; you earn a completion fee plus 24 months of rights income.')},
 couture:{name:L('Designer Collection'),icon:'✧',tag:L('Art direction → Exhibition → License'),cost:50000,hours:60,sale:15000,royalty:2000,richOnly:true,desc:L('Create a limited-edition design collection with a master atelier. Creative hours go to art direction; you earn a completion fee plus 24 months of license income.')},
 flip:{name:L('Secondhand Remake'),icon:'♻',tag:L('Find → Repair → Resell'),cost:350,hours:20,sale:600,royalty:0,desc:L('Fix up discarded furniture and used gadgets and resell them. Pays a one-time sale on completion.')},
 newsletter:{name:L('Indie Content'),icon:'✎',tag:L('My interests → Paid subscriptions'),cost:0,hours:50,sale:0,royalty:130,desc:L('Turn hobbies, experience and know-how into content. Subscription income flows for 24 months after completion.')},
 tool:{name:L('Small Digital Tool'),icon:'⌘',tag:L('Spot a problem → Build → License'),cost:250,hours:80,sale:200,royalty:250,desc:L('Build a template or a small app. Earns a completion fee plus 24 months of license income.')},
 music:{name:L('Music & Illustration'),icon:'♫',tag:L('Create → Release → Royalties'),cost:120,hours:45,sale:100,royalty:160,desc:L('Produce tracks, illustrations and asset packs. Earns a completion fee plus 24 months of royalties.')},
 bounty:{name:L('Problem-Solving Challenge'),icon:'⚡',tag:L('Find a request → Solve → Reward'),cost:0,hours:30,sale:520,royalty:0,desc:L('Solve problems like data cleanup, translation and idea contests for a completion fee.')},
};
export function projectQuote(s,type,style='balanced'){
 const p=PATHS[type];if(!p)return null;const factor=style==='quick'?.7:style==='craft'?1.4:1,yieldFactor=style==='quick'?.65:style==='craft'?1.35:1,skill=1+s.skill*.012;
 return{hours:Math.round(p.hours*factor),cost:p.cost,sale:Math.round(p.sale*skill*yieldFactor),royalty:Math.round(p.royalty*skill*yieldFactor)};
}
export function startProject(s,type,style,name){
 if(!Object.hasOwn(PATHS,type)||!['quick','balanced','craft'].includes(style))return{ok:false,msg:L('Choose what to make and how to make it.')};
 s.projects||=[];if(s.projects.filter(p=>p.status==='working').length>=3)return{ok:false,msg:L('You can run up to 3 projects at once. Finish existing work first.')};
 if(s.projects.filter(p=>p.status!=='archived').length>=8)return{ok:false,msg:L('You already hold 8 projects. Archive finished ones to start a new one.')};
 const q=projectQuote(s,type,style);if(s.money<q.cost)return{ok:false,msg:L('Not enough startup cash. Content and challenges have no upfront cost.')};
 s.money-=q.cost;s.projects.push({id:(s.projectSerial||0)+1,type,style,name:String(name||PATHS[type].name).trim().slice(0,30)||PATHS[type].name,status:'working',progress:0,...q,monthsLeft:0});s.projectSerial=(s.projectSerial||0)+1;
 return{ok:true,msg:L('Project started! Allocate creative hours in Time & Life.')};
}
export function projectReport(s){const projects=s.projects||[],working=projects.filter(p=>p.status==='working'),hours=(s.plan.create||0)*reputationSummary(s).creativeMultiplier*(s.tiles?.[s.journey?.workroom]?.owner==='player'&&s.tiles?.[s.journey?.workroom]?.type==='atelier'?1.15:1)/Math.max(1,working.length);let income=0;const completions=[];
 for(const p of projects){if(p.status==='working'&&p.progress+hours>=p.hours){income+=p.sale;completions.push(p.id);}if(p.status==='earning'&&p.monthsLeft>0)income+=p.royalty;}
 return{income,completions,hours,working:working.length,royalties:projects.filter(p=>p.status==='earning').reduce((n,p)=>n+p.royalty,0)};
}
export function advanceProjects(s){const report=projectReport(s);for(const p of s.projects||[]){if(p.status==='working'){p.progress=Math.min(p.hours,p.progress+report.hours);if(p.progress>=p.hours){p.status=p.royalty?'earning':'complete';p.monthsLeft=p.royalty?24:0;s.log.unshift(L`✦ ${p.name} complete! ${p.royalty?L`${p.royalty}G per month from next month`:L`Sale/delivery fee ${p.sale}G`}`);}}else if(p.status==='earning'){p.monthsLeft--;if(p.monthsLeft<=0)p.status='complete';}}return report;}
export function archiveProject(s,id){const p=s.projects?.find(p=>p.id===id);if(!p||p.status==='working'||p.status==='archived')return{ok:false,msg:L('Only finished projects can be archived.')};p.status='archived';p.monthsLeft=0;return{ok:true,msg:L('Project archived. Its income has ended.')};}
export function validProjects(s){
 if(s.projects===undefined)return true;if(!Array.isArray(s.projects)||s.projects.length>1000||!Number.isInteger(s.projectSerial)||s.projectSerial<0)return false;
 const ids=new Set();return s.projects.every(p=>{if(!p||ids.has(p.id)||!Number.isInteger(p.id)||p.id<1||p.id>s.projectSerial||!Object.hasOwn(PATHS,p.type)||!['quick','balanced','craft'].includes(p.style)||typeof p.name!=='string'||p.name.length>30||!['working','earning','complete','archived'].includes(p.status))return false;ids.add(p.id);return ['hours','cost','sale','royalty','progress','monthsLeft'].every(k=>Number.isFinite(p[k])&&p[k]>=0)&&p.hours>0&&p.progress<=p.hours&&p.monthsLeft<=24;});
}
