// Compound accounts form a risk ladder: safe, cyclical, or aggressive with real shocks.
// Balances are units at normal prices; crash pricing discounts the valuation and the reinvestment price.
import {L} from './i18n.js';
import {cycleFactor,marketFactor,marketPrice,incomeFactor,economyReport} from './economy.js';
import {awardAssetFame} from './reputation.js';
import {hashRoll} from './rng.js';
export const COMPOUND_ASSETS = {
 stocks: {name:L('Dividend stocks'),icon:'↗',cost:100000,rate:.012,cycle:false,risk:L('Safe'),description:L('Fixed dividends regardless of the economy. Slow, but you never lose.')},
 building: {name:L('Rental building'),icon:'🏙',cost:300000,rate:.02,cycle:true,risk:L('Growth'),description:L('Rent follows the economy. More in a boom, less in a slump.')},
 resort: {name:L('Hotel & Resort'),icon:'🏝',cost:600000,rate:.04,cycle:true,risk:L('Aggressive'),shock:{chance:.06,loss:.3,label:L('Typhoon · tourist slump')},description:L('Big returns, but a 6% chance each month of losing 30% of the balance.')}
};
// Marginal tiers: the first ₲1M of each account earns the full rate, the next ₲4M 60%, beyond that 35%.
export const COMPOUND_TIERS=[{upTo:1000000,mult:1},{upTo:5000000,mult:.6},{upTo:Infinity,mult:.35}];
export function tieredIncome(value,rate){let income=0,prev=0;for(const t of COMPOUND_TIERS){const part=Math.max(0,Math.min(value,t.upTo)-prev);income+=part*rate*t.mult;prev=t.upTo;if(value<=t.upTo)break;}return income;}
// Business cycle applies to cyclical accounts; a crash cuts every account's income by 30%.
export function compoundRate(s,id,month=s.month){const d=COMPOUND_ASSETS[id];return d.rate*(d.cycle?cycleFactor(s,month):1)*incomeFactor(s);}
const money=n=>'₲'+Math.round(n).toLocaleString('en-US');
export function compoundSummary(s,month=s.month){
 const c=s.compound,market=marketFactor(s);let assets=0,income=0;const perAsset={};
 for(const id of Object.keys(COMPOUND_ASSETS)){const value=c?.balances?.[id]||0,gain=tieredIncome(value,compoundRate(s,id,month));perAsset[id]={value,income:gain};assets+=value*market;income+=gain;}
 return {assets,income,perAsset,auto:c?.auto??true,earned:c?.earned||0,last:c?.last||0,principal:c?.principal||0,lost:c?.lost||0,lastShock:c?.lastShock||null};
}
export function ensureCompound(s){return s.compound??={balances:{stocks:0,building:0,resort:0},auto:true,earned:0,last:0,principal:0};}
export function buyCompound(s,id){
 if(s.concept!=='rich-life'||!Object.hasOwn(COMPOUND_ASSETS,id))return {ok:false,msg:L('Pick an asset to invest in.')};
 const d=COMPOUND_ASSETS[id],price=marketPrice(s,d.cost);if(s.money<price)return {ok:false,msg:L('Save up a little more cash.')};
 const c=ensureCompound(s);s.money-=price;c.balances[id]+=d.cost;c.principal+=price;
 if(id!=='stocks')awardAssetFame(s,`compound:${id}`,d.cost,d.name+L(' acquired'));
 return {ok:true,msg:d.name+L(' expanded! Monthly income +')+money(tieredIncome(d.cost,compoundRate(s,id)))};
}
// Called before the month counter advances; income uses the closing month, reinvestment buys units at the current price.
export function settleCompound(s){
 if(!s.compound)return;
 const c=s.compound,market=marketFactor(s);c.last=0;c.lastShock=null;
 for(const [id,d] of Object.entries(COMPOUND_ASSETS)){
  const profit=tieredIncome(c.balances[id],compoundRate(s,id));c.last+=profit;if(c.auto)c.balances[id]+=profit/market;
  if(d.shock&&c.balances[id]>0&&hashRoll(s.seed,s.month+1,'compound-shock-'+id)<d.shock.chance){const loss=Math.round(c.balances[id]*d.shock.loss);c.balances[id]-=loss;c.lost=(c.lost||0)+loss;c.lastShock={month:s.month,id,loss,label:d.shock.label};s.log.unshift(L`⚠ ${d.shock.label} · ${d.name} balance −${money(loss)}`);}
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
 return L`<section class="compound-card"><span class="eyebrow">MONEY GROWS MONEY · Economy: ${e.label}</span><div class="compound-heading"><h3>Money makes money</h3><b>${gain.toFixed(2)}×</b></div><strong class="compound-income">+${money(c.income)}<small> / next month</small></strong><p>${c.assets?L`Total earned +${money(c.earned)}${c.lost?L` · Total lost −${money(c.lost)}`:''} · ${c.auto?L('Auto-reinvesting all returns'):L('Paying returns out as cash')}`:L('Pick your risk: Safe, Growth or Aggressive.')}</p><button class="primary full" data-action="compound">${c.assets?L('Grow my assets ↗'):L('Make your first investment ↗')}</button></section>`;
}
export function compoundDialog(s){
 const c=compoundSummary(s),e=economyReport(s),market=marketFactor(s);
 return L`<span class="eyebrow">COMPOUND PLAY · RISK LADDER</span><h2>Not how much you can make. How much you can afford to lose.</h2><p>Three accounts, three risk levels. While the economy is ${e.label}${e.percent?` (${e.percent>0?'+':''}${e.percent}%)`:''}, Growth and Aggressive returns move with it, and Aggressive occasionally loses money.${market<1?L` In this market crash, valuations are −${Math.round((1-market)*100)}% off list price and reinvestment buys at the discount.`:''}</p><div class="compound-totals"><div><small>My compound assets</small><strong>${money(c.assets)}</strong></div><div><small>Next month's income</small><strong class="positive">+${money(c.income)}</strong></div></div>${c.lastShock?`<p class="compound-receipt" role="alert">⚠ ${c.lastShock.label} · ${COMPOUND_ASSETS[c.lastShock.id].name} −${money(c.lastShock.loss)}</p>`:''}<button class="compound-toggle" data-action="compound-auto" aria-pressed="${c.auto}"><b>Auto-reinvest ${c.auto?'ON ✦':'OFF'}</b><span>${c.auto?L('Everything you earn goes back in'):L('Everything you earn is paid out as cash')}</span></button><div class="compound-grid">${Object.entries(COMPOUND_ASSETS).map(([id,d])=>{const value=s.compound?.balances[id]||0,level=value?1+Math.floor(Math.log2(Math.max(1,value/d.cost))):0,progress=value?(value/(d.cost*2**level))*100:0,rate=compoundRate(s,id),price=marketPrice(s,d.cost);return L`<section class="compound-asset"><span class="compound-icon">${d.icon}</span><h3>${d.name} <small>${d.risk}${level?' · Lv.'+level:''}</small></h3><p>${d.description}</p><strong>+${money(c.perAsset[id].income)} / month</strong><div class="meter"><i style="width:${progress}%"></i></div><small>${value?L`Balance ${money(value*market)} · this month ${(rate*100).toFixed(1)}%`:L`First month +${money(tieredIncome(d.cost,rate))} · ${(rate*100).toFixed(1)}% / month`}</small><button data-compound-buy="${id}" ${s.money<price?'disabled':''}>${value?L('Grow'):L('Invest')} · ${money(price)}</button></section>`;}).join('')}</div><button class="primary full" data-action="compound-month">Advance a month and collect ✨</button>${c.last?L`<p class="compound-receipt" role="status">This month +${money(c.last)} ${c.auto?L('reinvested! Next month earns even more.'):L('paid out in cash!')}</p>`:''}<p class="help">Cash on hand ${money(s.money)} · Turn off auto-reinvest to build up cash for shopping.<br>In-game monthly rates: Safe 1.2% · Growth 2% × economy · Aggressive 4% × economy. Per account, the first ₲1,000,000 earns 100%, the next ₲4,000,000 earns 60%, and anything above earns 35%. Income drops 30% during a crash or recovery. Separate from regular stock trading.</p>`;
}
