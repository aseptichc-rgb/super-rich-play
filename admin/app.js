import {dashboardView,reasonLabels} from './insights.js';
import {loadFirebase} from '../city/auth.js';
import {FIREBASE_CONFIG} from '../city/firebase-config.js';
import {loadDashboard} from './data.js';
const $=id=>document.getElementById(id),num=n=>Math.round(n).toLocaleString('ko-KR'),money=n=>'₲'+num(n);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v?new Date(v).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',year:'numeric'}):'—';
const duration=s=>s===null?'미측정':s<60?`${Math.floor(s)}초`:`${num(Math.floor(s/3600))}시간 ${Math.floor(s/60)%60}분`;
let sdk,auth,token='',data=null,page=0,excludedUids=new Set(),view=null,controller=null,epoch=0;
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function clear(){epoch++;controller?.abort();controller=null;token='';data=null;page=0;$('dashboard').hidden=true;$('metrics').replaceChildren();$('players').replaceChildren();$('assets').replaceChildren();$('signups').replaceChildren();$('feedback-list').replaceChildren();$('feedback-count').textContent='';for(const id of ['stages','funnel','segments','exclusions','event-coverage'])$(id).replaceChildren();excludedUids.clear();view=null;$('coverage').textContent='';$('identity').textContent='';$('login-panel').hidden=false;$('refresh').hidden=true;$('logout').hidden=true;}
const errors={permission:'관리 권한이 없습니다. 프로젝트의 Firebase Authentication 조회 권한과 Cloud Datastore Viewer 권한을 확인하세요. Google 동의 화면에서 요청한 권한을 모두 허용해야 합니다.',expired:'관리자 인증이 만료되었습니다. 다시 로그인하세요.',network:'데이터를 불러오지 못했습니다. 네트워크 연결을 확인하고 다시 시도하세요.',invalid:'서버 응답을 확인할 수 없습니다. 잠시 후 다시 시도하세요.'};
async function refresh(){
 controller?.abort();controller=new AbortController();const current=++epoch,requestController=controller;
 const timeout=setTimeout(()=>requestController.abort(),60000);
 $('refresh').disabled=true;status('가입자와 클라우드 저장을 집계하고 있습니다…');
 try{
  const result=await loadDashboard({projectId:FIREBASE_CONFIG.projectId,token,signal:requestController.signal});
  if(current!==epoch)return;
  data=result;page=0;render();$('dashboard').hidden=false;$('login-panel').hidden=true;
  status(`마지막 조회 ${date(data.updatedAt)} · 새로고침 시 최신 서버 저장으로 갱신합니다.`);
 }catch(e){
  if(current!==epoch)return;
  if(e.code==='expired'||e.code==='permission'){clear();await sdk.signOut(auth);}
  status((errors[e.code]||errors.network)+(data?' 표시된 수치는 이전 조회 결과입니다.':''),true);
 }finally{clearTimeout(timeout);$('refresh').disabled=false;}
}
function render(){
 view=dashboardView(data,{includeExcluded:$('include-excluded').checked,excludedUids});const s=view.summary;
 $('exclusions').textContent=`전체 계정 ${data.rows.length}개 중 ${view.excludedAccounts}개 제외 · 현재 분석 ${s.registered}개`;
 const metric=(label,value,detail)=>`<article class="metric"><small>${label}</small><strong>${value}</strong><p>${detail}</p></article>`;
 $('metrics').innerHTML=metric('분석 계정',`${num(s.registered)}명`,`최근 7일 신규 ${num(s.new7)}명 · 인증 로그인 ${num(s.login7)}명`)+metric('플레이 시간 중앙값',s.medianSeconds===null?'미측정':duration(s.medianSeconds),`측정 ${s.measured}개 · 평균 ${duration(s.averageSeconds)}`)+metric('순자산 중앙값',s.medianWealth===null?'—':money(s.medianWealth),`유효 저장 ${s.saved}개 · 평균 ${s.averageWealth===null?'—':money(s.averageWealth)}`)+metric('보유 현금',s.saved?money(s.cash):'—',`전체 부채 ${money(s.debt)}`);
 const pct=(n,total)=>total?`${(n/total*100).toFixed(1)}%`:'분모 없음';
 $('stages').innerHTML=metric('0개월 저장',`${s.month0} / ${s.saved}`,pct(s.month0,s.saved))+metric('1개월 이상 진행',`${s.month1} / ${s.saved}`,pct(s.month1,s.saved))+metric('측정 시간 2분 미만',`${s.under120} / ${s.measured}`,pct(s.under120,s.measured))+metric('미션 달성 계정',`${s.missionPlayers}명`,'이번 개편 이후 저장에 기록된 업적');
 const events=view.events,labels={visit:'방문',ready:'조작 가능',first_action:'첫 게임 행동',first_build:'첫 건축',first_settlement:'첫 정산',extra_action:'정산 후 추가 행동'};
 $('funnel').innerHTML=Object.entries(labels).map(([key,label])=>metric(label,`${events.counts[key]||0}회`,pct(events.counts[key]||0,events.sessions))).join('');
 $('event-coverage').textContent=`${events.visitors}개 익명 기기 · ${events.sessions}개 방문 세션 · 첫 정산 시간 중앙값 ${events.medianSettlementMs===null?'미측정':duration(events.medianSettlementMs/1000)} · 첫 관측 방문 후 24~48시간 재방문 ${events.d1Returned}/${events.d1Eligible}개 기기. 관측 후 48시간이 지난 기기만 분모에 포함합니다. 새로고침은 별도 세션이며 인증 로그인은 재방문 지표가 아닙니다.`+(data.eventTruncated?' 조회 한도 10,000건에 도달해 일부 지표가 누락될 수 있습니다.':'')+(events.sessions?'':' 새 이벤트가 아직 없거나 전송 대기 중입니다. 과거 가입자로 전환율을 추정하지 않습니다.');
 $('segments').innerHTML=Object.entries({source:'유입 경로',device:'기기',browser:'브라우저'}).map(([key,title])=>`<h3>${title}</h3><div class="table-wrap"><table><thead><tr><th>구분</th><th>방문</th><th>첫 행동</th><th>첫 정산</th></tr></thead><tbody>${events.groups[key].map(g=>`<tr><td>${esc(g.value)}</td><td>${g.visits}</td><td>${g.actions}</td><td>${g.settlements}</td></tr>`).join('')||'<tr><td colspan="4">측정 자료 없음</td></tr>'}</tbody></table></div>`).join('');

 const max=Math.max(1,...view.signups.map(d=>d.count));
 $('signups').innerHTML=view.signups.map(d=>`<div class="bar" title="${d.date}: ${d.count}명"><b>${d.count}</b><i style="height:${Math.max(1,d.count/max*125)}px"></i><span>${d.date.slice(5).replace('-','/')}</span></div>`).join('');
 const assets=[['현금',s.cash],['부동산·사업장',s.property],['주식',s.stocks],['복리 계좌',s.compound],['기타 자산¹',s.other],['부채',s.debt]],total=assets.reduce((n,[,v])=>n+Math.max(0,v),0);
 $('assets').innerHTML=s.saved?assets.map(([label,value])=>`<div class="asset-row"><span>${label}</span><div class="track"><i style="width:${total?Math.max(0,value)/total*100:0}%"></i></div><strong>${money(value)}</strong></div>`).join('')+'<small class="muted">¹ 컬렉션·기업 지분 등, 공매도 평가액 포함</small>':'<p class="muted">집계할 수 있는 게임 저장이 없습니다.</p>';
 $('coverage').textContent=`저장 없음 ${s.registered-s.saved-s.invalid}명 · 저장 확인 필요 ${s.invalid}명 · 삭제된 계정 등의 연결 없는 저장 ${s.orphanSaves}개. 자산·시간은 클라이언트 저장 기반으로, 조작 방지 통계가 아닙니다.`;
 $('feedback-count').textContent=`${num(view.feedback.length)}건`;
 $('feedback-list').innerHTML=view.feedback.map(f=>`<article class="feedback-entry"><div class="feedback-head"><time>${date(f.createdAt)}</time><span>${esc(f.version||'버전 미상')}</span></div><pre>${esc(f.body)}</pre></article>`).join('')||'<p class="muted">아직 받은 피드백이 없습니다.</p>';
 renderRows();
}
function renderRows(){
 if(!data)return;
 const query=$('search').value.trim().toLowerCase(),filter=$('filter').value,sort=$('sort').value;
 const rows=view.rows.filter(r=>(filter==='all'||r.status===filter)&&[r.name,r.email,r.uid,r.game?.name].some(v=>v?.toLowerCase().includes(query)));
 const value=r=>sort==='updatedAt'?(Date.parse(r.updatedAt)||0):sort==='createdAt'?(r.createdAt||0):(r.game?.[sort]??-Infinity);
 rows.sort((a,b)=>value(b)-value(a)||a.uid.localeCompare(b.uid));
 page=Math.max(0,Math.min(page,Math.ceil(rows.length/25)-1));
 $('row-count').textContent=`${num(rows.length)}명`;
 $('players').innerHTML=rows.slice(page*25,(page+1)*25).map(r=>{
  const g=r.game;
  return `<tr><td><input type="checkbox" data-exclude-user="${esc(r.uid)}" aria-label="${esc(r.name||r.email||r.uid)} 테스트 계정 제외" ${r.excluded||excludedUids.has(r.uid)?'checked':''} ${r.excluded?'disabled':''}></td><td title="${esc(r.uid)}"><b>${esc(r.name||r.email||r.uid)}</b>${r.disabled?' <span class="badge">사용 중지</span>':''}<small>${esc(r.email)}</small><small>${esc(r.uid)}</small></td><td>${date(r.createdAt)}<small>로그인 ${date(r.lastLoginAt)}</small></td><td>${duration(g?.seconds??null)}<small>${g?.measuredSince?'측정 시작 '+date(g.measuredSince):'기록 없음'}</small></td><td>${g?money(g.wealth):'—'}</td><td>${g?money(g.cash):'—'}<small>부채 ${g?money(g.debt):'—'}</small></td><td>${g?`${num(g.month)}개월 진행<small>${g.properties}개 부동산·사업장 · ${esc(g.name)}<br>미션 ${g.missions}개 · 프로젝트 ${g.projects}회 · 랜드마크 ${g.landmarks}개 · 최고 ${g.skyscraper}층</small>`:r.status==='invalid'?'저장 확인 필요 · '+esc(reasonLabels[r.reason]||r.reason||'원인 미상'):'저장 없음'}</td><td>${date(r.updatedAt)}</td></tr>`;
 }).join('')||'<tr><td colspan="8" class="empty">조건에 맞는 플레이어가 없습니다.</td></tr>';
 $('page').textContent=`${page+1} / ${Math.max(1,Math.ceil(rows.length/25))}`;$('prev').disabled=page===0;$('next').disabled=(page+1)*25>=rows.length;
}
$('include-excluded').addEventListener('change',()=>{page=0;render();});
$('players').addEventListener('change',e=>{const uid=e.target.dataset.excludeUser;if(!uid)return;if(e.target.checked)excludedUids.add(uid);else excludedUids.delete(uid);page=0;render();});
for(const id of ['search','filter','sort'])$(id).addEventListener(id==='search'?'input':'change',()=>{page=0;renderRows();});
$('prev').onclick=()=>{page--;renderRows();};$('next').onclick=()=>{page++;renderRows();};$('refresh').onclick=refresh;
$('logout').onclick=async()=>{clear();await sdk.signOut(auth);status('로그아웃했습니다.');};
$('login').onclick=async()=>{
 $('login').disabled=true;
 try{
  const provider=new sdk.GoogleAuthProvider();provider.addScope('https://www.googleapis.com/auth/cloud-platform');provider.setCustomParameters({prompt:'select_account',login_hint:'kjykjj04@gmail.com'});
  const result=await sdk.signInWithPopup(auth,provider);
  if(result.user?.email?.toLowerCase()!=='kjykjj04@gmail.com'||result.user.emailVerified!==true||!result.user.providerData?.some(p=>p.providerId==='google.com')){
   clear();await sdk.signOut(auth);status('지정된 관리자 계정으로만 접속할 수 있습니다. 관리자 Google 계정으로 다시 로그인하세요.',true);return;
  }
  token=sdk.GoogleAuthProvider.credentialFromResult(result)?.accessToken||'';
  if(!token)throw new Error('missing token');
  $('identity').textContent=result.user.email||'관리자';$('logout').hidden=false;$('refresh').hidden=false;
  await refresh();
 }catch(e){status(e.code==='auth/popup-closed-by-user'?'로그인을 취소했습니다.':e.code==='auth/unauthorized-domain'?'Firebase Authentication 승인 도메인에 현재 호스트를 등록해야 합니다.':'로그인하지 못했습니다. 팝업 허용과 Google Cloud 권한 동의를 확인하고 다시 시도하세요.',true);}
 finally{$('login').disabled=false;}
};
try{
 sdk=await loadFirebase();
 const app=sdk.getApps().find(a=>a.name==='super-rich-admin')||sdk.initializeApp(FIREBASE_CONFIG,'super-rich-admin');
 auth=sdk.getAuth(app);auth.languageCode='ko';await sdk.setPersistence(auth,sdk.inMemoryPersistence);
 $('login').disabled=false;status('관리자 로그인 후 실제 운영 데이터를 확인할 수 있습니다.');
}catch{status('로그인 모듈을 불러오지 못했습니다. 네트워크 연결을 확인한 후 페이지를 새로고침하세요.',true);}
