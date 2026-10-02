import {L} from './i18n.js';

export const ELECTION_INTERVAL=48;
export const CAMPAIGN_DONATION=50000;
export const ELECTION_TAX_DISCOUNT=.2;
export const DONATION_TIERS=[{multiple:100,rate:.14},{multiple:500,rate:.13},{multiple:1000,rate:.12}];
const PARTIES=['conservative','progressive'];
export const partyName=party=>party==='conservative'?L('Conservative Party'):L('Progressive Party');

// The vote is seeded by the game, so reloading cannot change its result. Donations never affect the draw.
export function electionWinner(seed,term){let x=(seed^Math.imul(term+1,0x9e3779b1)^0x5bd1e995)>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return ((x^(x>>>16))>>>0)<0x80000000?PARTIES[0]:PARTIES[1];}
export function ensureElection(s){return s.election??={term:Math.floor(s.month/ELECTION_INTERVAL),winner:electionWinner(s.seed,Math.floor(s.month/ELECTION_INTERVAL)),funded:null,donation:0,benefit:false,taxRate:null};}
export function electionTaxRate(s,base){return s.election?.benefit?(s.election.taxRate??base*(1-ELECTION_TAX_DISCOUNT)):base;}

export function fundParty(s,party,amount){
 if(!PARTIES.includes(party))return{ok:false,msg:L('Choose a party to support.')};
 if(!DONATION_TIERS.some(t=>CAMPAIGN_DONATION*t.multiple===amount))return{ok:false,msg:L('Choose a campaign donation amount.')};
 const election=ensureElection(s);
 if(election.funded)return{ok:false,msg:L('You have already funded a party for this election.')};
 if(s.money<amount)return{ok:false,msg:L('Not enough cash for a campaign donation.')};
 s.money-=amount;election.funded=party;election.donation=amount;
 const msg=L`Supported the ${partyName(party)} with ₲${amount.toLocaleString('en-US')}`;
 s.log.unshift(msg);s.log=s.log.slice(0,25);
 return{ok:true,msg};
}

export function advanceElection(s){
 if(s.month===0||s.month%ELECTION_INTERVAL)return null;
 const previous=ensureElection(s),term=s.month/ELECTION_INTERVAL;
 if(previous.term>=term)return null;
 const winner=electionWinner(s.seed,term),funded=previous.funded,benefit=winner===funded;
 // Old saves already promised a 12% rate for a ₲50,000 donation.
 const taxRate=benefit?(DONATION_TIERS.find(t=>CAMPAIGN_DONATION*t.multiple===previous.donation)?.rate??.12):null;
 s.election={term,winner,funded:null,donation:0,benefit,taxRate};
 s.log.unshift(benefit?L`Election: ${partyName(winner)} wins · Property income tax reduced for four years`:L`Election: ${partyName(winner)} wins · No campaign benefit`);
 s.log=s.log.slice(0,25);
 return{winner,funded,benefit,taxRate};
}

export function validElection(s){
 const e=s?.election;if(e===undefined)return true;
 const validDonation=e&&(e.donation===undefined||(e.funded===null?e.donation===0:DONATION_TIERS.some(t=>e.donation===CAMPAIGN_DONATION*t.multiple)));
 return !!(e&&Number.isSafeInteger(e.term)&&e.term>=0&&e.term<=Math.floor(s.month/ELECTION_INTERVAL)&&PARTIES.includes(e.winner)&&(e.funded===null||PARTIES.includes(e.funded))&&typeof e.benefit==='boolean'&&validDonation&&(e.taxRate===undefined||e.taxRate===null||DONATION_TIERS.some(t=>e.taxRate===t.rate)));
}

const money=n=>'₲'+n.toLocaleString('en-US');
export function electionDialog(s,result=null){
 const e=ensureElection(s),remaining=ELECTION_INTERVAL-s.month%ELECTION_INTERVAL;
 const percent=rate=>Math.round(rate*100),pendingRate=DONATION_TIERS.find(t=>CAMPAIGN_DONATION*t.multiple===e.donation)?.rate??.12;
 return `<span class="eyebrow">${L('PRESIDENTIAL ELECTION')}</span><h2>${result?L('Election results'):L('The next election')}</h2>${result?`<p>${L`The ${partyName(result.winner)} won the election.`} ${result.funded?result.benefit?L`Your supported party won. Property income tax is ${percent(result.taxRate??.12)}% for this four-year term.`:L('Your supported party lost. Your campaign donation is gone.'):L('You did not fund either party.')}</p>`:''}<section class="owner-reputation"><h3>${L('Current administration')}: ${partyName(e.winner)}</h3><p>${L`Next election in ${remaining} months`}</p><p>${e.benefit?L`Your winning support: property income tax 15% → ${percent(electionTaxRate(s,.15))}% until the next election.`:L('Property income tax: 15%.')}</p></section><p>${L('Each election allows one campaign donation. Giving more raises the benefit if your party wins; it never changes the 50:50 result. Losing donations are not refunded.')}</p>${PARTIES.map(p=>`<h3>${partyName(p)}</h3><div class="button-row">${DONATION_TIERS.map(t=>{const amount=CAMPAIGN_DONATION*t.multiple;return `<button data-fund-party="${p}" data-fund-amount="${amount}" ${e.funded||s.money<amount?'disabled':''}>${money(amount)} (${t.multiple}×) · ${L`Tax ${percent(t.rate)}% if elected`}</button>`;}).join('')}</div>`).join('')}<p class="help">${e.funded?L`Supporting the ${partyName(e.funded)} with ${money(e.donation??CAMPAIGN_DONATION)} · Winning tax rate ${percent(pendingRate)}%`:L('No party supported for the next election.')}</p>`;
}
