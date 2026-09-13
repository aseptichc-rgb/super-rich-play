import {marketPrice} from './economy.js';
import {awardAssetFame} from './reputation.js';
export const VEHICLES={
 sportscar:[
 {id:'roadster',name:'루비 로드스터',price:80000,image:'car-roadster',color:'#a52d32',length:1,desc:'가벼운 2인승 오픈톱 · 레드 바디'},
 {id:'sunset',name:'선셋 스포츠 쿠페',price:250000,image:'sportscar',color:'#bca780',length:1.15,desc:'샴페인 골드 · 미드십 스포츠 쿠페'},
 {id:'gt',name:'미드나이트 GT',price:650000,image:'car-gt',color:'#1d3049',length:1.3,desc:'긴 보닛과 우아한 차체 · 네이비 GT'},
 {id:'super',name:'인페르노 슈퍼카',price:1800000,image:'car-super',color:'#df691e',length:1.2,desc:'오렌지 와이드 바디 · 공기역학 디자인'},
 {id:'hyper',name:'팬텀 하이퍼카',price:6000000,image:'car-hyper',color:'#b9c0c6',length:1.4,desc:'실버·카본 차체 · 대형 리어 윙'}],
 yacht:[
 {id:'small',name:'데이 크루저 8',price:90000,image:'yacht-small',color:'#f4ead8',length:8,desc:'8m · 소형 데이 크루저 · 1데크'},
 {id:'medium',name:'코스탈 15',price:450000,image:'yacht-medium',color:'#d7e9eb',length:15,desc:'15m · 주말 항해용 · 2데크'},
 {id:'riverside',name:'리버사이드 30',price:1800000,image:'yacht',color:'#fff0d6',length:30,desc:'30m · 프라이빗 모터 요트 · 3데크'},
 {id:'super',name:'오션 팰리스 60',price:12000000,image:'yacht-super',color:'#eef5f4',length:60,desc:'60m · 슈퍼요트 · 4데크·수영장'},
 {id:'mega',name:'소버린 100',price:65000000,image:'yacht-mega',color:'#bac8ce',length:100,desc:'100m · 메가요트 · 6데크·헬리패드'}]
};
const LEGACY={sportscar:'sunset',yacht:'riverside'};
export const VEHICLE_MAINTENANCE_RATE={sportscar:.005,yacht:.008};
export const vehicleMaintenance=(model,kind)=>Math.round((model?.price||0)*(VEHICLE_MAINTENANCE_RATE[kind]||0));
export function ownedModels(s,kind){return s.flex?.vehicles?.[kind]?.owned??(s.flex?.owned.includes(kind)?[LEGACY[kind]]:[]);}
export function selectedModel(s,kind){if(!Object.hasOwn(VEHICLES,kind))return null;const id=s.flex?.vehicles?.[kind]?.selected??LEGACY[kind];return VEHICLES[kind].find(v=>v.id===id)||VEHICLES[kind][0];}
export function validVehicles(s){const v=s.flex?.vehicles;if(v===undefined)return true;return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.entries(v).every(([kind,c])=>Object.hasOwn(VEHICLES,kind)&&s.flex.owned.includes(kind)&&c&&Array.isArray(c.owned)&&c.owned.length>0&&new Set(c.owned).size===c.owned.length&&c.owned.every(id=>VEHICLES[kind].some(m=>m.id===id))&&c.owned.includes(c.selected));}
export function chooseVehicle(s,kind,id){if(!Object.hasOwn(VEHICLES,kind))return{ok:false,msg:'컬렉션 종류를 확인하세요.'};const model=VEHICLES[kind].find(v=>v.id===id);if(!model)return{ok:false,msg:'모델을 확인하세요.'};const owns=ownedModels(s,kind);if(owns.includes(id)){s.flex.vehicles??={};s.flex.vehicles[kind]={owned:[...owns],selected:id};return{ok:true,msg:model.name+' 대표 모델로 선택'};}
 if(s.money<marketPrice(s,model.price))return{ok:false,msg:'구매할 현금이 부족합니다.'};s.flex??={owned:[],lastParty:-1};s.flex.vehicles??={};s.flex.vehicles[kind]={owned:[...owns,id],selected:id};if(!s.flex.owned.includes(kind))s.flex.owned.push(kind);s.money-=marketPrice(s,model.price);s.log.unshift(`✦ ${model.name} 소장 · ₲${marketPrice(s,model.price).toLocaleString('ko-KR')}`);s.log=s.log.slice(0,25);awardAssetFame(s,`vehicle:${kind}:${id}`,model.price,model.name+' 소장');return{ok:true,msg:model.name+' 구매 및 대표 모델 선택 완료'};
}
export function vehicleDialog(s,kind){const models=VEHICLES[kind];if(!models)return'';const own=ownedModels(s,kind),selected=selectedModel(s,kind),rate=VEHICLE_MAINTENANCE_RATE[kind]*100;return `<span class="eyebrow">${kind==='sportscar'?'PRIVATE GARAGE':'PRIVATE MARINA'}</span><h2>${kind==='sportscar'?'나의 스포츠카 컬렉션':'나의 요트 컬렉션'}</h2><p>5가지 모델을 비교해 소장하세요. 이미 소장한 모델은 무료로 대표 모델을 바꿀 수 있습니다.</p><div class="vehicle-grid">${models.map(m=>`<section class="vehicle-card"><img src="city/assets/luxury/${m.image}.png" alt="${m.name}" loading="lazy" width="1536" height="1024"><div><small>${own.includes(m.id)?selected.id===m.id?'✦ 대표 모델':'소장 중':'새로운 컬렉션'}</small><h3>${m.name}</h3><p>${m.desc}</p><strong>₲${marketPrice(s,m.price).toLocaleString('ko-KR')}</strong><small>월 유지비 ₲${vehicleMaintenance(m,kind).toLocaleString('ko-KR')}</small><button data-vehicle-kind="${kind}" data-vehicle-id="${m.id}" ${own.includes(m.id)&&selected.id===m.id||!own.includes(m.id)&&s.money<marketPrice(s,m.price)?'disabled':''}>${own.includes(m.id)?selected.id===m.id?'선택됨':'대표 모델로 선택':s.money<marketPrice(s,m.price)?'현금 부족':'구매 · 대표 모델로 선택'}</button></div></section>`).join('')}</div><p class="help">구매 금액은 현금과 순자산에서 차감됩니다. 소장한 모든 모델에 정상 가격의 월 ${rate}%가 유지비로 청구됩니다. 재판매·차액 교환은 없으며 기존 모델은 컬렉션에 남습니다. 이전 버전의 소장품은 선셋 쿠페와 리버사이드 30으로 유지됩니다.</p><button data-action="flex" class="full">내 컬렉션으로 돌아가기</button>`;}
