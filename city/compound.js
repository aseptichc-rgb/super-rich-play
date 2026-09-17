// The compound account is the safe rung: a fixed dividend rate that ignores the business cycle.
// Bigger returns and real risk live on the market instead (index fund, Office REIT).
// Balances are units at normal prices; crash pricing discounts the valuation and the reinvestment price.
import {L} from './i18n.js';
import {cycleFactor,marketFactor,marketPrice,incomeFactor,economyReport} from './economy.js';
import {recordTrade} from './investment.js';
export const COMPOUND_ASSETS = {
 stocks: {name:L('Dividend stocks'),icon:'↗',cost:100000,rate:.012,cycle:false,risk:L('Safe'),description:L('Fixed dividends regardless of the economy. Slow, but you never lose.')}
};
// Older saves may still hold these accounts. They close on load and their value moves into Office REIT shares.
export const RETIRED_COMPOUND=['building','resort'],REIT_ID='officereit';
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
export function ensureCompound(s){return s.compound??={balances:{stocks:0},auto:true,earned:0,last:0,principal:0};}
export function buyCompound(s,id){
 if(s.concept!=='rich-life'||!Object.hasOwn(COMPOUND_ASSETS,id))return {ok:false,msg:L('Pick an asset to invest in.')};
 const d=COMPOUND_ASSETS[id],price=marketPrice(s,d.cost);if(s.money<price)return {ok:false,msg:L('Save up a little more cash.')};
 const c=ensureCompound(s);s.money-=price;c.balances[id]+=d.cost;c.principal+=price;
 return {ok:true,msg:d.name+L(' expanded! Monthly income +')+money(tieredIncome(d.cost,compoundRate(s,id)))};
}
// Withdrawals pay today's value in cash (a crash pays the discounted price). Principal shrinks in proportion; no fee.
export function withdrawCompound(s,id,amount){
 const c=s.compound;if(s.concept!=='rich-life'||!Object.hasOwn(COMPOUND_ASSETS,id)||!(c?.balances?.[id]>0))return {ok:false,msg:L('There is nothing to withdraw.')};
 const market=marketFactor(s),value=c.balances[id]*market,cash=amount==='all'?value:Math.min(value,Number(amount));
 if(!(cash>0))return {ok:false,msg:L('Check the withdrawal amount.')};
 const share=amount==='all'?1:cash/value;
 c.balances[id]=amount==='all'?0:c.balances[id]*(1-share);c.principal=Math.max(0,c.principal*(1-share));s.money+=cash;
 return {ok:true,msg:L`${COMPOUND_ASSETS[id].name} withdrawal · +${money(cash)} cash`};
}
// Called before the month counter advances; income uses the closing month, reinvestment buys units at the current price.
export function settleCompound(s){
 if(!s.compound)return;
 const c=s.compound,market=marketFactor(s);c.last=0;c.lastShock=null;
 for(const id of Object.keys(COMPOUND_ASSETS)){const profit=tieredIncome(c.balances[id],compoundRate(s,id));c.last+=profit;if(c.auto)c.balances[id]+=profit/market;}
 c.earned+=c.last;
}
export function retireCompoundAccounts(s){
 const b=s?.compound?.balances;if(!b||!RETIRED_COMPOUND.some(id=>Object.hasOwn(b,id)))return null;
 const c=s.compound,safe=Number.isFinite(b.stocks)&&b.stocks>0?b.stocks:0,retired=RETIRED_COMPOUND.reduce((n,id)=>n+(Number.isFinite(b[id])&&b[id]>0?b[id]:0),0);
 for(const id of RETIRED_COMPOUND)delete b[id];
 if(safe+retired>0&&Number.isFinite(c.principal))c.principal*=safe/(safe+retired);
 if(c.lastShock&&!Object.hasOwn(COMPOUND_ASSETS,c.lastShock.id))c.lastShock=null;
 const value=retired*marketFactor(s);if(!(value>0))return null;
 const price=s.prices?.[REIT_ID],qty=price>0&&s.market?.listed?.includes(REIT_ID)?Math.floor(value/price):0;
 if(qty){recordTrade(s,REIT_ID,qty,qty*price,0);s.holdings[REIT_ID]+=qty;}
 s.money+=value-qty*price;
 if(Array.isArray(s.log)){s.log.unshift(L`🏢 Rental building and Hotel & Resort accounts closed · ₲${Math.round(value).toLocaleString('en-US')} moved into ${qty.toLocaleString('en-US')} Office REIT shares`);s.log=s.log.slice(0,25);}
 return {value,qty};
}
export function validCompound(s){
 const c=s.compound;if(c===undefined)return true;
 if(c?.lost!==undefined&&(!Number.isFinite(c.lost)||c.lost<0))return false;
 if(c?.lastShock!==undefined&&c.lastShock!==null&&!(c.lastShock&&Object.hasOwn(COMPOUND_ASSETS,c.lastShock.id)&&Number.isInteger(c.lastShock.month)&&c.lastShock.month>=0&&c.lastShock.month<=s.month&&Number.isFinite(c.lastShock.loss)&&c.lastShock.loss>=0))return false;
 return !!(c&&typeof c.auto==='boolean'&&['earned','last','principal'].every(k=>Number.isFinite(c[k])&&c[k]>=0)&&c.balances&&Object.keys(c.balances).length===Object.keys(COMPOUND_ASSETS).length&&Object.keys(COMPOUND_ASSETS).every(k=>Number.isFinite(c.balances[k])&&c.balances[k]>=0));
}
export function compoundCard(s){
 const c=compoundSummary(s),gain=c.principal?c.assets/c.principal:1,e=economyReport(s);
 return L`<section class="compound-card"><span class="eyebrow">MONEY GROWS MONEY · Economy: ${e.label}</span><div class="compound-heading"><h3>Money makes money</h3><b>${gain.toFixed(2)}×</b></div><strong class="compound-income">+${money(c.income)}<small> / next month</small></strong><p>${c.assets?L`Total earned +${money(c.earned)}${c.lost?L` · Total lost −${money(c.lost)}`:''} · ${c.auto?L('Auto-reinvesting all returns'):L('Paying returns out as cash')}`:L('Start at a fixed 1.2% a month. Add the index fund or Office REIT for more.')}</p><button class="primary full" data-action="compound">${c.assets?L('Grow my assets ↗'):L('Make your first investment ↗')}</button></section>`;
}
// The safe account shown as one option inside the stocks dialog.
export function compoundOption(s){
 const c=compoundSummary(s);
 return L`<section class="index-fund"><h3>Compound Dividend Account <small>Safe · ${(compoundRate(s,'stocks')*100).toFixed(1)}% / month</small></h3><p class="help">Fixed dividends whatever the economy does, and the principal is never lost. Slower than the market.</p><div class="data-row"><span>Balance</span><b>${money(c.assets)}</b></div><div class="data-row"><span>Next month's income</span><b class="positive">+${money(c.income)}</b></div><div class="button-row"><button data-action="compound">${c.assets?L('Manage the safe account →'):L('Open a safe account →')}</button></div></section>`;
}
export function compoundDialog(s){
 const c=compoundSummary(s),market=marketFactor(s);
 return L`<span class="eyebrow">COMPOUND PLAY · SAFE ACCOUNT</span><h2>Dividends that buy more dividends.</h2><p>This account pays a fixed rate whatever the economy does and never loses money. For bigger returns, take on market risk with the index fund or the Office REIT.${market<1?L` In this market crash, valuations are −${Math.round((1-market)*100)}% off list price and reinvestment buys at the discount.`:''}</p><div class="compound-totals"><div><small>My compound assets</small><strong>${money(c.assets)}</strong></div><div><small>Next month's income</small><strong class="positive">+${money(c.income)}</strong></div></div><button class="compound-toggle" data-action="compound-auto" aria-pressed="${c.auto}"><b>Auto-reinvest ${c.auto?'ON ✦':'OFF'}</b><span>${c.auto?L('Everything you earn goes back in'):L('Everything you earn is paid out as cash')}</span></button><div class="compound-grid">${Object.entries(COMPOUND_ASSETS).map(([id,d])=>{const value=s.compound?.balances[id]||0,level=value?1+Math.floor(Math.log2(Math.max(1,value/d.cost))):0,progress=value?(value/(d.cost*2**level))*100:0,rate=compoundRate(s,id),price=marketPrice(s,d.cost);return L`<section class="compound-asset"><span class="compound-icon">${d.icon}</span><h3>${d.name} <small>${d.risk}${level?' · Lv.'+level:''}</small></h3><p>${d.description}</p><strong>+${money(c.perAsset[id].income)} / month</strong><div class="meter"><i style="width:${progress}%"></i></div><small>${value?L`Balance ${money(value*market)} · this month ${(rate*100).toFixed(1)}%`:L`First month +${money(tieredIncome(d.cost,rate))} · ${(rate*100).toFixed(1)}% / month`}</small><button data-compound-buy="${id}" ${s.money<price?'disabled':''}>${value?L('Grow'):L('Invest')} · ${money(price)}</button>${value?L`<div class="button-row"><button data-compound-withdraw="${id}" data-amount="100000">Withdraw ₲100,000</button><button data-compound-withdraw="${id}" data-amount="all">Withdraw all</button></div>`:''}</section>`;}).join('')}</div><button class="primary full" data-action="compound-month">Advance a month and collect ✨</button>${c.last?L`<p class="compound-receipt" role="status">This month +${money(c.last)} ${c.auto?L('reinvested! Next month earns even more.'):L('paid out in cash!')}</p>`:''}<p class="help">Cash on hand ${money(s.money)} · Turn off auto-reinvest to build up cash for shopping.<br>In-game monthly rate: 1.2%, fixed. The first ₲1,000,000 earns 100%, the next ₲4,000,000 earns 60%, and anything above earns 35%. Income drops 30% during a crash or recovery. Rental building and Hotel & Resort accounts from older saves were converted into Office REIT shares.</p>`+L`<div class="button-row"><button data-action="stocks">Index fund · Office REIT · Listed stocks →</button></div>`;
}
