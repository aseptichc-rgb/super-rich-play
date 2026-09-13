// Compound accounts form a risk ladder: safe, cyclical, or aggressive with real shocks.
// Balances are units at normal prices; crash pricing discounts the valuation and the reinvestment price.
import {cycleFactor,marketFactor,marketPrice,incomeFactor,economyReport} from './economy.js';
import {awardAssetFame} from './reputation.js';
import {hashRoll} from './rng.js';
export const COMPOUND_ASSETS = {
 stocks: {name:'배당 주식',icon:'↗',cost:100000,rate:.012,cycle:false,risk:'안정형',description:'경기와 무관한 확정 배당. 느리지만 잃지 않아요.'},
 building: {name:'임대 빌딩',icon:'🏙',cost:300000,rate:.02,cycle:true,risk:'성장형',description:'월세는 경기를 타요. 호황엔 더, 불황엔 덜.'},
 resort: {name:'호텔 & 리조트',icon:'🏝',cost:600000,rate:.04,cycle:true,risk:'공격형',shock:{chance:.06,loss:.3,label:'태풍·관광객 급감'},description:'수익은 크지만 매월 6% 확률로 자산의 30%를 잃어요.'}
};
// Marginal tiers: the first ₲1M of each account earns the full rate, the next ₲4M 60%, beyond that 35%.
export const COMPOUND_TIERS=[{upTo:1000000,mult:1},{upTo:5000000,mult:.6},{upTo:Infinity,mult:.35}];
export function tieredIncome(value,rate){let income=0,prev=0;for(const t of COMPOUND_TIERS){const part=Math.max(0,Math.min(value,t.upTo)-prev);income+=part*rate*t.mult;prev=t.upTo;if(value<=t.upTo)break;}return income;}
// Business cycle applies to cyclical accounts; a crash cuts every account's income by 30%.
export function compoundRate(s,id,month=s.month){const d=COMPOUND_ASSETS[id];return d.rate*(d.cycle?cycleFactor(s,month):1)*incomeFactor(s);}
const money=n=>'₲'+Math.round(n).toLocaleString('ko-KR');
export function compoundSummary(s,month=s.month){
 const c=s.compound,market=marketFactor(s);let assets=0,income=0;const perAsset={};
 for(const id of Object.keys(COMPOUND_ASSETS)){const value=c?.balances?.[id]||0,gain=tieredIncome(value,compoundRate(s,id,month));perAsset[id]={value,income:gain};assets+=value*market;income+=gain;}
 return {assets,income,perAsset,auto:c?.auto??true,earned:c?.earned||0,last:c?.last||0,principal:c?.principal||0,lost:c?.lost||0,lastShock:c?.lastShock||null};
}
export function ensureCompound(s){return s.compound??={balances:{stocks:0,building:0,resort:0},auto:true,earned:0,last:0,principal:0};}
export function buyCompound(s,id){
 if(s.concept!=='rich-life'||!Object.hasOwn(COMPOUND_ASSETS,id))return {ok:false,msg:'투자할 자산을 골라주세요.'};
 const d=COMPOUND_ASSETS[id],price=marketPrice(s,d.cost);if(s.money<price)return {ok:false,msg:'현금을 조금 더 모아주세요.'};
 const c=ensureCompound(s);s.money-=price;c.balances[id]+=d.cost;c.principal+=price;
 if(id!=='stocks')awardAssetFame(s,`compound:${id}`,d.cost,d.name+' 취득');
 return {ok:true,msg:d.name+' 확장! 월 수익 +'+money(tieredIncome(d.cost,compoundRate(s,id)))};
}
// Called before the month counter advances; income uses the closing month, reinvestment buys units at the current price.
export function settleCompound(s){
 if(!s.compound)return;
 const c=s.compound,market=marketFactor(s);c.last=0;c.lastShock=null;
 for(const [id,d] of Object.entries(COMPOUND_ASSETS)){
  const profit=tieredIncome(c.balances[id],compoundRate(s,id));c.last+=profit;if(c.auto)c.balances[id]+=profit/market;
  if(d.shock&&c.balances[id]>0&&hashRoll(s.seed,s.month+1,'compound-shock-'+id)<d.shock.chance){const loss=Math.round(c.balances[id]*d.shock.loss);c.balances[id]-=loss;c.lost=(c.lost||0)+loss;c.lastShock={month:s.month,id,loss,label:d.shock.label};s.log.unshift(`⚠ ${d.shock.label} · ${d.name} 자산 −${money(loss)}`);}
 }
 c.earned+=c.last;
}
export function validCompound(s){
 const c=s.compound;if(c===undefined)return true;
 if(c?.lost!==undefined&&(!Number.isFinite(c.lost)||c.lost<0))return false;
 if(c?.lastShock!==undefined&&c.lastShock!==null&&!(c.lastShock&&Object.hasOwn(COMPOUND_ASSETS,c.lastShock.id)&&Number.isInteger(c.lastShock.month)&&c.lastShock.month>=0&&c.lastShock.month<=s.month&&Number.isFinite(c.lastShock.loss)&&c.lastShock.loss>=0))return false;
 return !!(c&&typeof c.auto==='boolean'&&['earned','last','principal'].every(k=>Number.isFinite(c[k])&&c[k]>=0)&&c.balances&&Object.keys(c.balances).length===3&&Object.keys(COMPOUND_ASSETS).every(k=>Number.isFinite(c.balances[k])&&c.balances[k]>=0));
}
export function compoundCard(s){
 const c=compoundSummary(s),gain=c.principal?c.assets/c.principal:1,e=economyReport(s);
 return `<section class="compound-card"><span class="eyebrow">MONEY GROWS MONEY · 경기 ${e.label}</span><div class="compound-heading"><h3>돈이 돈을 벌어요</h3><b>${gain.toFixed(2)}×</b></div><strong class="compound-income">+${money(c.income)}<small> / 다음 달</small></strong><p>${c.assets?`누적 수익 +${money(c.earned)}${c.lost?` · 누적 손실 −${money(c.lost)}`:''} · ${c.auto?'수익 전액 자동 재투자 중':'수익은 현금으로 받는 중'}`:'안정형·성장형·공격형 중 나의 리스크를 고르세요.'}</p><button class="primary full" data-action="compound">${c.assets?'내 자산 더 키우기 ↗':'첫 투자 시작하기 ↗'}</button></section>`;
}
export function compoundDialog(s){
 const c=compoundSummary(s),e=economyReport(s),market=marketFactor(s);
 return `<span class="eyebrow">COMPOUND PLAY · RISK LADDER</span><h2>얼마나 벌지보다, 얼마나 잃어도 되는지.</h2><p>세 계좌는 리스크가 다릅니다. 경기가 ${e.label}${e.percent?` (${e.percent>0?'+':''}${e.percent}%)`:''}이면 성장형·공격형 수익이 함께 움직이고, 공격형은 가끔 자산을 잃습니다.${market<1?` 폭락장이라 평가액은 시세 −${Math.round((1-market)*100)}%이고 재투자는 할인가로 매수합니다.`:''}</p><div class="compound-totals"><div><small>내 복리 자산</small><strong>${money(c.assets)}</strong></div><div><small>다음 달 수익</small><strong class="positive">+${money(c.income)}</strong></div></div>${c.lastShock?`<p class="compound-receipt" role="alert">⚠ ${c.lastShock.label} · ${COMPOUND_ASSETS[c.lastShock.id].name} −${money(c.lastShock.loss)}</p>`:''}<button class="compound-toggle" data-action="compound-auto" aria-pressed="${c.auto}"><b>자동 재투자 ${c.auto?'ON ✦':'OFF'}</b><span>${c.auto?'번 돈을 전부 다시 굴려요':'번 돈을 현금으로 받아요'}</span></button><div class="compound-grid">${Object.entries(COMPOUND_ASSETS).map(([id,d])=>{const value=s.compound?.balances[id]||0,level=value?1+Math.floor(Math.log2(Math.max(1,value/d.cost))):0,progress=value?(value/(d.cost*2**level))*100:0,rate=compoundRate(s,id),price=marketPrice(s,d.cost);return `<section class="compound-asset"><span class="compound-icon">${d.icon}</span><h3>${d.name} <small>${d.risk}${level?' · Lv.'+level:''}</small></h3><p>${d.description}</p><strong>+${money(c.perAsset[id].income)} / 월</strong><div class="meter"><i style="width:${progress}%"></i></div><small>${value?`자산 ${money(value*market)} · 이번 달 ${(rate*100).toFixed(1)}%`:`첫 월 수익 +${money(tieredIncome(d.cost,rate))} · 월 ${(rate*100).toFixed(1)}%`}</small><button data-compound-buy="${id}" ${s.money<price?'disabled':''}>${value?'더 키우기':'투자 시작'} · ${money(price)}</button></section>`;}).join('')}</div><button class="primary full" data-action="compound-month">한 달 보내고 수익 받기 ✨</button>${c.last?`<p class="compound-receipt" role="status">이번 달 +${money(c.last)} ${c.auto?'재투자 완료! 다음 달에는 더 많이 벌어요.':'현금으로 받았어요!'}</p>`:''}<p class="help">보유 현금 ${money(s.money)} · 자동 재투자를 끄면 쇼핑할 현금이 쌓여요.<br>게임 전용 기준 월 수익률: 안정형 1.2% · 성장형 2% × 경기 · 공격형 4% × 경기. 계좌별 첫 ₲1,000,000까지 100%, 다음 ₲4,000,000은 60%, 그 이상은 35%의 수익률이 적용됩니다. 폭락장·회복 중 수입은 30% 감소합니다. 기존 주식 거래와 별개입니다.</p>`;
}
