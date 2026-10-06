import {createRichGame} from './rich-life.js';
import {analyze,validSave} from './engine.js';
import {playerNickname} from './rankings.js';
import {L} from './i18n.js';
export const TRIAL_SEED=20261006,TRIAL_MONTHS=12,TRIAL_KEY='super-rich-development-trial-v1';
export function createTrial(){const s=createRichGame('standard',TRIAL_SEED,'heir');s.trial={version:1,seed:TRIAL_SEED,months:TRIAL_MONTHS};return s;}
export function trialScore(s){if(!validSave(s)||s.mode!=='standard'||s.scenario!=='heir'||s.trial?.seed!==TRIAL_SEED||s.trial?.months!==TRIAL_MONTHS||s.month!==TRIAL_MONTHS)return null;return Math.round(analyze(s).wealth-2000000);}
export function validTrial(s){const t=s?.trial;return t===undefined||!!(t&&t.version===1&&t.seed===TRIAL_SEED&&t.months===TRIAL_MONTHS&&s.month<=TRIAL_MONTHS&&s.mode==='standard'&&s.scenario==='heir');}
export async function trialClient({projectId,user,fetch:request=globalThis.fetch},save=null){
 const root=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
 const token=await user.getIdToken(),headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
 if(save){const score=trialScore(save);if(score===null)throw Error('invalid');const nickname=await playerNickname(user.uid);
  const existing=await request(root+'/trialScores/'+encodeURIComponent(user.uid),{headers,signal:AbortSignal.timeout(10000)});let previous=null;if(existing.ok)previous=await existing.json();else if(existing.status!==404)throw Error('network');
  const best=Number(previous?.fields?.score?.doubleValue??previous?.fields?.score?.integerValue??-Infinity);
  if(score>best){const r=await request(root+'/trialScores/'+encodeURIComponent(user.uid)+(previous?.updateTime?'?currentDocument.updateTime='+encodeURIComponent(previous.updateTime):'?currentDocument.exists=false'),{method:'PATCH',headers,body:JSON.stringify({fields:{nickname:{stringValue:nickname},score:{doubleValue:score},seed:{integerValue:String(TRIAL_SEED)},months:{integerValue:String(TRIAL_MONTHS)}}}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('network');}
 }
 const r=await request(root+':runQuery',{method:'POST',headers,body:JSON.stringify({structuredQuery:{from:[{collectionId:'trialScores'}],orderBy:[{field:{fieldPath:'score'},direction:'DESCENDING'}],limit:50}}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('network');
 return (await r.json()).map(x=>x.document?.fields).filter(f=>f&&Number(f.seed?.integerValue)===TRIAL_SEED&&/^[A-Za-z]+-[0-9A-F]{12}$/.test(f.nickname?.stringValue||'')).map(f=>({nickname:f.nickname.stringValue,score:Number(f.score.doubleValue??f.score.integerValue)})).filter(x=>Number.isFinite(x.score));
}
const money=n=>'₲'+Math.round(n).toLocaleString('en-US'),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function trialDialog(s,rows=[],status=''){
 const score=trialScore(s);return `<h2>${L('Twelve-month development challenge')}</h2><p>${L('Everyone starts with the same map, assets and seed. Grow net worth in twelve game months. Your main city is preserved in its own save; this challenge uses a separate device save.')}</p><p>${L`Challenge progress ${s.month} / ${TRIAL_MONTHS} months`}</p>${score!==null?`<strong>${L('Net worth gained')}: ${money(score)}</strong>`:''}<p role="status">${esc(status)}</p><div class="button-row">${score!==null?`<button data-action="trial-publish">${L('Publish my best challenge record')}</button>`:''}<button data-action="trial-board">${L('Compare equal-start challenge records')}</button><button data-action="trial-return">${L('Return to my main city')}</button><button data-action="trial-restart">${L('Restart this challenge only')}</button></div><p>${L('Client-reported records. No cash or permanent income bonuses are granted. Google sign-in is only needed to publish or view rankings.')}</p>${rows.map((r,i)=>`<p>${i+1}. ${esc(r.nickname)} · ${money(r.score)}</p>`).join('')}`;
}
