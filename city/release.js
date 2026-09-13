// Public release settings. The GitHub Pages copy ("play" channel) hides features that need the private
// server or other game modes, so first-time players see one game and one clear way to send feedback.
import {reputationSummary} from './empire.js';
import {chapterOf,SCENARIOS} from './legacy.js';
export const VERSION='v2.0';
export const PLAY_REPO='aseptichc-rgb/super-rich-play';
// Paste a survey link (for example a Google Form) to add a "설문 열기" button. Empty keeps copy and GitHub issue.
export const FEEDBACK_URL='';
export function releaseChannel(hostname=''){return /\.github\.io$/i.test(String(hostname))?'play':'full';}
export function releaseFeatures(hostname=''){const play=releaseChannel(hostname)==='play';return{channel:play?'play':'full',landmarkStudio:!play,legacyModes:!play};}
export const FEEDBACK_QUESTIONS=[
 {id:'bored',label:'어디서 지루해졌나요?',placeholder:'예: 2년차부터 할 게 없었어요'},
 {id:'stuck',label:'어디서 막히거나 헷갈렸나요?',placeholder:'예: 오너의 시간 슬라이더가 무슨 뜻인지 몰랐어요'},
 {id:'note',label:'한마디 더 (가장 재미있던 순간, 바라는 점)',placeholder:'예: 라이벌보다 먼저 땅을 샀을 때 짜릿했어요'}
];
export const REPLAY_SCALE=['1 · 다시 안 할 것 같아요','2','3 · 보통','4','5 · 꼭 다시 할래요'];
const money=n=>'₲'+Math.round(n).toLocaleString('ko-KR');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').replace(/\r/g,'').trim().slice(0,1000);
// Automatic, anonymous play facts. The city name and save contents are never included.
export function playSummary(s,a,extra={}){
 const r=reputationSummary(s),c=s.concept==='rich-life'?chapterOf(s):null,rival=s.rival;
 return[
  ['버전',VERSION],
  ['시작 조건',SCENARIOS[s.scenario||'heir']?.name||'-'],
  ['진행',`${Math.floor(s.month/12)+1}년 ${s.month%12+1}월 (${s.month}개월)`],
  ['순자산',money(a.wealth)],
  ['최고 순자산',money(Math.max(s.highestWealth||0,a.wealth))],
  ['챕터',c?`CH.${c.n} ${c.name}`:'-'],
  ['명성',`${Math.round(r.fame).toLocaleString('ko-KR')} · ${r.tier.name}`],
  ['라이벌',rival?(a.wealth>=rival.wealth?'앞섬':'뒤처짐'):'-'],
  ['급매 처분',`${s.fireSales||0}회`],
  ['엔딩',s.ending?`${s.ending.grade}등급 · ${s.ending.score.toLocaleString('ko-KR')}점`:'아직'],
  ['화면',extra.viewport||'-']
 ];
}
export function feedbackText(s,a,answers={},extra={}){
 const replay=Number(answers.replay),lines=['[수퍼 리치 플레이 피드백]'];
 for(const q of FEEDBACK_QUESTIONS)lines.push('',`■ ${q.label}`,clean(answers[q.id])||'(비움)');
 lines.push('',`■ 다시 할 의향: ${replay>=1&&replay<=5?replay+' / 5':'(비움)'}`);
 lines.push('','■ 플레이 기록 (자동)',...playSummary(s,a,extra).map(([k,v])=>`- ${k}: ${v}`));
 return lines.join('\n');
}
// Prefilled GitHub issue. Korean text triples in length when encoded, so the body is trimmed to stay under URL limits.
export function issueURL(text,limit=6000){
 let n=text.length,body=text;
 while(encodeURIComponent(body).length>limit){n=Math.floor(n*.85);body=text.slice(0,n)+'\n…(길어서 잘림)';}
 return`https://github.com/${PLAY_REPO}/issues/new?title=${encodeURIComponent('플레이 피드백 '+VERSION)}&body=${encodeURIComponent(body)}`;
}
export function feedbackDialog(s,a,extra={}){
 return`<span class="eyebrow">PLAYTEST FEEDBACK · ${VERSION}</span><h2>5분만 알려주세요.</h2><p>어디서 재미있었고 어디서 껐는지가 다음 업데이트를 정합니다. 비워 둔 칸은 그대로 두셔도 됩니다.</p><div class="feedback-form">${FEEDBACK_QUESTIONS.map(q=>`<label for="feedback-${q.id}">${q.label}<textarea id="feedback-${q.id}" rows="2" maxlength="1000" placeholder="${esc(q.placeholder)}"></textarea></label>`).join('')}<label for="feedback-replay">다시 할 의향<select id="feedback-replay"><option value="">선택 안 함</option>${REPLAY_SCALE.map((t,i)=>`<option value="${i+1}">${esc(t)}</option>`).join('')}</select></label></div><details class="feedback-summary"><summary>함께 보내는 플레이 기록 (자동 · 개인정보 없음)</summary><dl>${playSummary(s,a,extra).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details><div class="button-row"><button class="primary" data-action="feedback-copy">내용 복사하기</button><button data-action="feedback-issue">GitHub 이슈로 보내기</button>${FEEDBACK_URL?'<button data-action="feedback-form">설문 열기</button>':''}</div><textarea id="feedback-output" readonly hidden aria-label="복사할 피드백 내용"></textarea><p class="help">복사한 내용은 게임을 알게 된 게시글 댓글이나 메시지에 붙여넣어 주세요. GitHub 이슈는 GitHub 계정이 필요합니다. 동네 이름과 저장 파일은 보내지 않습니다. 저장 파일까지 공유하고 싶다면 설정 → 내보내기로 받을 수 있어요.</p>`;
}
