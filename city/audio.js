// Tiny synthesized UI sound. Opt-in only; no downloads or background autoplay.
export function createAudio(){let context=null,enabled=false;
 function play(kind='coin'){if(!enabled)return;try{context||=new (window.AudioContext||window.webkitAudioContext)();context.resume();const notes=kind==='build'?[330,440,660]:kind==='win'?[440,554,659,880]:[740,990];notes.forEach((hz,i)=>{const o=context.createOscillator(),g=context.createGain(),start=context.currentTime+i*.07;o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(.045,start+.01);g.gain.exponentialRampToValueAtTime(.001,start+.16);o.connect(g);g.connect(context.destination);o.start(start);o.stop(start+.18);});}catch{enabled=false;}}
 return{play,toggle(){enabled=!enabled;if(enabled)play();return enabled;}};
}
