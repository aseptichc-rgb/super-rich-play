// Built-in example designs. Their images ship with the game, so no design server or AI is needed.
// The ids use the UUID shape that validLandmark and saved games already accept.
export const PRESET_LANDMARKS=[
 {id:'00000000-0000-4000-8000-000000000001',name:'Sky Garden Tower',type:'office',file:'sky-garden-tower.svg'},
 {id:'00000000-0000-4000-8000-000000000002',name:'Crescent Bay Hotel',type:'hotel',file:'crescent-bay-hotel.svg'},
 {id:'00000000-0000-4000-8000-000000000003',name:'Aurora Spire',type:'office',file:'aurora-spire.svg'}
];
export const presetLandmark=id=>PRESET_LANDMARKS.find(d=>d.id===id);
