import {L} from './i18n.js';
// Public activities share the existing owner fame balance.
export const DONATION_AMOUNTS=[1000,10000,100000,1000000];
export const INTERVIEW_FAME=20;
export const PROPERTY_PARTIES={golf:{name:L('Golf Club Party'),cost:5000,stress:25,fame:20},resort:{name:L('Resort Party'),cost:10000,stress:40,fame:30}};
export const ASSET_FAME=[{cost:100000000,fame:200},{cost:10000000,fame:100},{cost:1000000,fame:50},{cost:100000,fame:20}];
const money=n=>'₲'+n.toLocaleString('en-US');
const ensure=s=>s.reputation??={donated:0,lastInterview:-1,assets:{}};
function gainFame(s,gain,label){
 s.empire??={owned:[]};s.empire.earnedFame=(s.empire.earnedFame||0)+gain;
 const msg=L`${label} · Reputation +${gain}`;s.log.unshift(msg);s.log=s.log.slice(0,25);return{ok:true,msg};
}
export function assetFame(cost){return ASSET_FAME.find(t=>cost>=t.cost)?.fame||0;}
export function awardAssetFame(s,key,cost,label,minimum=0){
 const points=Math.max(minimum,assetFame(cost)),previous=s.reputation?.assets?.[key]||0;
 if(points<=previous)return 0;
 ensure(s).assets[key]=points;gainFame(s,points-previous,label);return points-previous;
}
export function donate(s,amount){
 if(!Number.isSafeInteger(amount)||amount<1000)return{ok:false,msg:L('Enter a whole-number donation of ₲1,000 or more.')};
 if(s.money<amount)return{ok:false,msg:L('Not enough cash to donate.')};
 const total=(s.reputation?.donated||0)+amount;
 if(!Number.isSafeInteger(total))return{ok:false,msg:L('Cumulative donation limit exceeded.')};
 const r=ensure(s),gain=Math.floor(total/1000)-Math.floor(r.donated/1000);
 s.money-=amount;r.donated=total;return gainFame(s,gain,L`Community donation ${money(amount)}`);
}
export function mediaInterview(s){
 if(s.reputation?.lastInterview===s.month)return{ok:false,msg:L('You already did an interview this month.')};
 ensure(s).lastInterview=s.month;return gainFame(s,INTERVIEW_FAME,L('Press interview · My story of investing and giving'));
}
export function hostPropertyParty(s,i){
 const t=Number.isInteger(i)&&s.tiles[i],party=t&&Object.hasOwn(PROPERTY_PARTIES,t.type)&&PROPERTY_PARTIES[t.type];
 if(!party||t.owner!=='player'||t.tenure!=='buy')return{ok:false,msg:L('Parties can only be hosted at a golf club or resort you own.')};
 if(s.reputation?.lastParties?.[t.type]===s.month)return{ok:false,msg:L('You already hosted a party at this type of venue this month.')};
 if(s.money<party.cost)return{ok:false,msg:L('Not enough cash to host the party.')};
 const r=ensure(s);r.lastParties??={};r.lastParties[t.type]=s.month;
 const relief=Math.min(s.stress,party.stress);s.money-=party.cost;s.stress=Math.max(0,s.stress-party.stress);
 return gainFame(s,party.fame,L`${party.name} hosted · ${money(party.cost)} · Stress −${relief}`);
}
export function propertyPartyPanel(s,i){
 const t=s.tiles[i],party=t&&Object.hasOwn(PROPERTY_PARTIES,t.type)&&PROPERTY_PARTIES[t.type];
 if(!party||t.owner!=='player'||t.tenure!=='buy')return '';
 const done=s.reputation?.lastParties?.[t.type]===s.month,poor=s.money<party.cost;
 return L`<section class="owner-reputation"><h3>🥂 ${party.name}</h3><p>Invite guests to unwind and mingle.</p><p>Hosting cost ${money(party.cost)} · Stress up to −${party.stress} · Reputation +${party.fame}</p><button class="primary full" data-property-party="${i}" ${done||poor?'disabled':''}>${done?L("This month's party held"):poor?L('Not enough cash to host'):L('Host a Party')}</button><p class="help">Once a month per venue type (golf club / resort). Owning several venues of the same type still shares one hosting slot.</p></section>`;
}
export function validReputation(s){
 const r=s.reputation;if(r===undefined)return true;
 if(r?.lastParties!==undefined&&(!r.lastParties||typeof r.lastParties!=='object'||Array.isArray(r.lastParties)||!Object.entries(r.lastParties).every(([key,n])=>['golf','resort'].includes(key)&&Number.isSafeInteger(n)&&n>=0&&n<=s.month)))return false;
 return !!r&&Number.isSafeInteger(r.donated)&&r.donated>=0&&Number.isSafeInteger(r.lastInterview)&&r.lastInterview>=-1&&r.lastInterview<=s.month&&!!r.assets&&typeof r.assets==='object'&&!Array.isArray(r.assets)&&Object.entries(r.assets).every(([key,n])=>/^(parcel:\d+|vehicle:(sportscar|yacht):[a-z]+|art:[a-z_]+|company:[a-z]+|compound:[a-z]+|mansion)$/.test(key)&&[10,20,50,100,200].includes(n));
}
export function publicActivitiesPanel(s){
 const r=s.reputation,done=r?.lastInterview===s.month;
 return L`<section class="owner-reputation public-activities"><h3>Giving & Public Life</h3><p>Total donated <b>${money(r?.donated||0)}</b> · Cash on hand ${money(Math.round(s.money))}</p><p>Donations fund community education and healthcare. Every cumulative ₲1,000 earns 1 reputation point, and the amount donated reduces your cash and net worth.</p><div class="button-row">${DONATION_AMOUNTS.map(n=>L`<button data-donate="${n}" ${s.money<n?'disabled':''}>Donate ${money(n)} · +${n/1000} pts</button>`).join('')}</div><label class="field-label" for="donation-amount">Custom donation amount (₲)<input id="donation-amount" type="number" min="1000" step="1" value="1000"></label><button data-action="donate-custom" class="primary full">Donate Entered Amount</button><h3>Press Interview</h3><p>Share your story of investing and giving. Free, once a month · Reputation +${INTERVIEW_FAME}</p><button data-action="media-interview" class="full" ${done?'disabled':''}>${done?L('Interview done this month'):L('Give a Press Interview')}</button></section><p class="help">Big-ticket property, mansion, vehicle, yacht and art purchases: ${[...ASSET_FAME].reverse().map(t=>L`${money(t.cost)} or more: +${t.fame} pts`).join(' / ')}. Small business acquisitions earn at least +10 pts. The same asset only counts reputation gained above its previous best, and stock trades do not qualify. Existing collections are not credited retroactively.</p>`;
}
