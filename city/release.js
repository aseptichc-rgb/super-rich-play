// Public release settings. The GitHub Pages copy ("play" channel) hides features that need the private
// server or other game modes, so first-time players see one game and one clear way to send feedback.
import {L} from './i18n.js';
import {reputationSummary} from './empire.js';
import {chapterOf,SCENARIOS} from './legacy.js';
export const VERSION='v2.0';
export const PLAY_REPO='aseptichc-rgb/super-rich-play';
// Paste a survey link (for example a Google Form) to add an "Open Survey" button. Empty keeps copy and GitHub issue.
export const FEEDBACK_URL='';
export function releaseChannel(hostname=''){return /\.github\.io$/i.test(String(hostname))?'play':'full';}
// The landmark studio ships three built-in designs, so it works everywhere. AI drafts and uploads need the
// private design server and are switched off until that server is wired up again.
export function releaseFeatures(hostname='',cloud=false){const play=releaseChannel(hostname)==='play';return{channel:play?'play':'full',landmarkStudio:true,aiLandmarks:false,legacyModes:!play,cloudSave:!!cloud};}
export const FEEDBACK_QUESTIONS=[
 {id:'bored',label:L('Where did it get boring?'),placeholder:L('e.g. Nothing new to do after year 2')},
 {id:'stuck',label:L('Where were you stuck or confused?'),placeholder:L('e.g. I could not tell what the Owner Time sliders do')},
 {id:'note',label:L('Anything else? (best moment, wishes)'),placeholder:L('e.g. Grabbing a lot before the rival felt great')}
];
export const REPLAY_SCALE=[L('1 · Probably not'),'2',L('3 · Maybe'),'4',L('5 · Definitely')];
const money=n=>'₲'+Math.round(n).toLocaleString('en-US');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').replace(/\r/g,'').trim().slice(0,1000);
// Automatic, anonymous play facts. The neighborhood name and save contents are never included.
export function playSummary(s,a,extra={}){
 const r=reputationSummary(s),c=s.concept==='rich-life'?chapterOf(s):null,rival=s.rival;
 return[
  [L('Version'),VERSION],
  [L('Start','summary'),SCENARIOS[s.scenario||'heir']?.name||'-'],
  [L('Progress'),L`Year ${Math.floor(s.month/12)+1}, month ${s.month%12+1} (${s.month} mo)`],
  [L('Net worth'),money(a.wealth)],
  [L('Peak net worth'),money(Math.max(s.highestWealth||0,a.wealth))],
  [L('Chapter'),c?`CH.${c.n} ${c.name}`:'-'],
  [L('Reputation'),`${Math.round(r.fame).toLocaleString('en-US')} · ${r.tier.name}`],
  [L('Rival'),rival?(a.wealth>=rival.wealth?L('Ahead'):L('Behind')):'-'],
  [L('Fire sales'),String(s.fireSales||0)],
  [L('Ending'),s.ending?L`Grade ${s.ending.grade} · ${s.ending.score.toLocaleString('en-US')} pts`:L('Not yet')],
  [L('Screen'),extra.viewport||'-']
 ];
}
export function feedbackText(s,a,answers={},extra={}){
 const replay=Number(answers.replay),lines=[L('[Super Rich playtest feedback]')];
 for(const q of FEEDBACK_QUESTIONS)lines.push('',`■ ${q.label}`,clean(answers[q.id])||L('(empty)'));
 lines.push('',L`■ Would play again: ${replay>=1&&replay<=5?replay+' / 5':L('(empty)')}`);
 lines.push('',L('■ Play record (automatic)'),...playSummary(s,a,extra).map(([k,v])=>`- ${k}: ${v}`));
 return lines.join('\n');
}
// Prefilled GitHub issue. Non-Latin answers grow when encoded, so the body is trimmed to stay under URL limits.
export function issueURL(text,limit=6000){
 let n=text.length,body=text;
 while(encodeURIComponent(body).length>limit){n=Math.floor(n*.85);body=text.slice(0,n)+L('\n…(trimmed)');}
 return`https://github.com/${PLAY_REPO}/issues/new?title=${encodeURIComponent(L('Playtest feedback ')+VERSION)}&body=${encodeURIComponent(body)}`;
}
export function feedbackDialog(s,a,extra={}){
 return L`<span class="eyebrow">PLAYTEST FEEDBACK · ${VERSION}</span><h2>Got five minutes?</h2><p>Where it was fun and where you quit decides the next update. Leave any box empty if you like.</p><div class="feedback-form">${FEEDBACK_QUESTIONS.map(q=>`<label for="feedback-${q.id}">${q.label}<textarea id="feedback-${q.id}" rows="2" maxlength="1000" placeholder="${esc(q.placeholder)}"></textarea></label>`).join('')}<label for="feedback-replay">Would you play again?<select id="feedback-replay"><option value="">No answer</option>${REPLAY_SCALE.map((t,i)=>`<option value="${i+1}">${esc(t)}</option>`).join('')}</select></label></div><details class="feedback-summary"><summary>Play record sent along (automatic · no personal data)</summary><dl>${playSummary(s,a,extra).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>${extra.cloud&&extra.linked?L('<p class="help">Linked to your cloud save so we can group your notes.</p>'):''}<div class="button-row">${extra.cloud?L('<button class="primary" data-action="feedback-send">Send to Developer</button>'):''}<button ${extra.cloud?'':'class="primary" '}data-action="feedback-copy">Copy Feedback</button><button data-action="feedback-issue">Send as GitHub Issue</button>${FEEDBACK_URL?L('<button data-action="feedback-form">Open Survey</button>'):''}</div><textarea id="feedback-output" readonly hidden aria-label="Feedback to copy"></textarea><p class="help">Paste the copied text as a comment or message wherever you found the game. GitHub issues need a GitHub account. Your neighborhood name and save file are never included. To share your save as well, download it from Settings → Export.</p>`;
}
