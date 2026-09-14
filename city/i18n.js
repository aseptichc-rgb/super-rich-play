// Interface language. English source text is the translation key; Korean comes from city/i18n-ko.js.
// The language is fixed for a page load (?lang=ko|en, then the saved choice, then the browser language),
// so data tables built at import time are translated too. Switching saves the choice and reloads.
export const LANGS=['en','ko'];
export const LANG_KEY='super-rich-lang';
function detect(){
 if(typeof document==='undefined')return'en';
 try{
  const asked=new URLSearchParams(window.location.search).get('lang');
  if(LANGS.includes(asked)){localStorage.setItem(LANG_KEY,asked);return asked;}
  const saved=localStorage.getItem(LANG_KEY);
  if(LANGS.includes(saved))return saved;
 }catch{}
 return /^ko\b/i.test(navigator.language||'')?'ko':'en';
}
export const lang=detect();
// Loaded in both languages: English pages still need it to show names a save wrote in Korean.
const korean=(await import('./i18n-ko.js')).default;
const dictionary=lang==='ko'?korean:null;

export function createTranslator(dict){
 const keys=new WeakMap(),missing=new Set();
 const miss=key=>{if(dict&&!missing.has(key)){missing.add(key);console.warn('[i18n] missing ko:',key);}};
 // L('Study','room') picks a wording by context when the same English word needs different Korean.
 return function L(strings,...values){
  if(typeof strings==='string'){const key=values[0]?`${values[0]}::${strings}`:strings,t=dict?.[key];if(t===undefined)miss(key);return t??strings;}
  let key=keys.get(strings);
  if(key===undefined){key=strings.map((s,i)=>(i?`{${i-1}}`:'')+s).join('');keys.set(strings,key);}
  const t=dict?.[key];
  if(t!==undefined)return t.replace(/\{(\d+)\}/g,(_,n)=>`${values[n]}`);
  miss(key);
  let out=strings[0];for(let i=0;i<values.length;i++)out+=`${values[i]}`+strings[i+1];
  return out;
 };
}
export const L=createTranslator(dictionary);

// Saves keep text in the language it was written in. localized() shows a known phrase in the current
// language; samePhrase() tells whether two texts are one phrase in different languages (word by word
// for composed names such as "Nova Energy 3").
export function createPhrases(dict,translate){
 const english=new Map(Object.entries(dict||{}).map(([en,ko])=>[ko,en]));
 const englishOf=text=>english.get(text)??text.split(' ').map(w=>english.get(w)??w).join(' ');
 return{
  localized:text=>typeof text==='string'?translate(english.get(text)??text):text,
  samePhrase:(a,b)=>a===b||englishOf(a)===englishOf(b)
 };
}
export const {localized,samePhrase}=createPhrases(korean,L);

export function switchLanguage(next){
 try{localStorage.setItem(LANG_KEY,next);}catch{}
 const url=new URL(window.location.href);url.searchParams.delete('lang');
 window.location.replace(url.href);
}
