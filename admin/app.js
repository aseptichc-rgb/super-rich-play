import {loadFirebase} from '../city/auth.js';
import {FIREBASE_CONFIG} from '../city/firebase-config.js';
import {loadDashboard} from './data.js';
const $=id=>document.getElementById(id),num=n=>Math.round(n).toLocaleString('ko-KR'),money=n=>'₲'+num(n);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v?new Date(v).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',year:'numeric'}):'—';
const duration=s=>s===null?'미측정':s<60?`${Math.floor(s)}초`:`${num(Math.floor(s/3600))}시간 ${Math.floor(s/60)%60}분`;
let sdk,auth,token='',data=null,page=0,controller=null,epoch=0;
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function clear(){epoch++;controller?.abort();controller=null;token='';data=null;page=0;$('dashboard').hidden=true;$('metrics').replaceChildren();$('players').replaceChildren();$('assets').replaceChildren();$('signups').replaceChildren();$('coverage').textContent='';$('identity').textContent='';$('login-panel').hidden=false;$('refresh').hidden=true;$('logout').hidden=true;}
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
 const s=data.summary;
 $('metrics').innerHTML=[['전체 가입자',`${num(s.registered)}명`,`최근 7일 신규 ${num(s.new7)}명 · 로그인 ${num(s.login7)}명`],['측정 플레이 시간',s.measured?duration(s.seconds):'미측정',`측정된 저장 ${num(s.measured)}개 · 평균 ${duration(s.averageSeconds)}`],['전체 순자산',s.saved?money(s.wealth):'—',`저장 ${num(s.saved)}개 · 평균 ${s.averageWealth===null?'—':money(s.averageWealth)}`],['보유 현금',s.saved?money(s.cash):'—',`전체 부채 ${s.saved?money(s.debt):'—'}`]].map(([label,value,detail])=>`<article class="metric"><small>${label}</small><strong>${value}</strong><p>${detail}</p></article>`).join('');
 const max=Math.max(1,...data.signups.map(d=>d.count));
 $('signups').innerHTML=data.signups.map(d=>`<div class="bar" title="${d.date}: ${d.count}명"><b>${d.count}</b><i style="height:${Math.max(1,d.count/max*125)}px"></i><span>${d.date.slice(5).replace('-','/')}</span></div>`).join('');
 const assets=[['현금',s.cash],['부동산·사업장',s.property],['주식',s.stocks],['복리 계좌',s.compound],['기타 자산¹',s.other],['부채',s.debt]],total=assets.reduce((n,[,v])=>n+Math.max(0,v),0);
 $('assets').innerHTML=s.saved?assets.map(([label,value])=>`<div class="asset-row"><span>${label}</span><div class="track"><i style="width:${total?Math.max(0,value)/total*100:0}%"></i></div><strong>${money(value)}</strong></div>`).join('')+'<small class="muted">¹ 컬렉션·기업 지분 등, 공매도 평가액 포함</small>':'<p class="muted">집계할 수 있는 게임 저장이 없습니다.</p>';
 $('coverage').textContent=`저장 없음 ${s.registered-s.saved-s.invalid}명 · 저장 확인 필요 ${s.invalid}명 · 삭제된 계정 등의 연결 없는 저장 ${s.orphanSaves}개. 자산·시간은 클라이언트 저장 기반으로, 조작 방지 통계가 아닙니다.`;
 renderRows();
}
function renderRows(){
 if(!data)return;
 const query=$('search').value.trim().toLowerCase(),filter=$('filter').value,sort=$('sort').value;
 const rows=data.rows.filter(r=>(filter==='all'||r.status===filter)&&[r.name,r.email,r.uid,r.game?.name].some(v=>v?.toLowerCase().includes(query)));
 const value=r=>sort==='updatedAt'?(Date.parse(r.updatedAt)||0):sort==='createdAt'?(r.createdAt||0):(r.game?.[sort]??-Infinity);
 rows.sort((a,b)=>value(b)-value(a)||a.uid.localeCompare(b.uid));
 page=Math.max(0,Math.min(page,Math.ceil(rows.length/25)-1));
 $('row-count').textContent=`${num(rows.length)}명`;
 $('players').innerHTML=rows.slice(page*25,(page+1)*25).map(r=>{
  const g=r.game;
  return `<tr><td title="${esc(r.uid)}"><b>${esc(r.name||r.email||r.uid)}</b>${r.disabled?' <span class="badge">사용 중지</span>':''}<small>${esc(r.email)}</small><small>${esc(r.uid)}</small></td><td>${date(r.createdAt)}<small>로그인 ${date(r.lastLoginAt)}</small></td><td>${duration(g?.seconds??null)}<small>${g?.measuredSince?'측정 시작 '+date(g.measuredSince):'기록 없음'}</small></td><td>${g?money(g.wealth):'—'}</td><td>${g?money(g.cash):'—'}<small>부채 ${g?money(g.debt):'—'}</small></td><td>${g?`${num(g.month)}개월 진행<small>${g.properties}개 부동산·사업장 · ${esc(g.name)}</small>`:r.status==='invalid'?'저장 확인 필요':'저장 없음'}</td><td>${date(r.updatedAt)}</td></tr>`;
 }).join('')||'<tr><td colspan="7" class="empty">조건에 맞는 플레이어가 없습니다.</td></tr>';
 $('page').textContent=`${page+1} / ${Math.max(1,Math.ceil(rows.length/25))}`;$('prev').disabled=page===0;$('next').disabled=(page+1)*25>=rows.length;
}
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
