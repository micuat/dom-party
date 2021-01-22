const volume = -20;

let synth;
synth = new Tone.FMSynth({
  modulation: {
    type: Tone.square
  }
});
synth.connect(Tone.Master);

let active = false;

// Make the volume quieter
Tone.Master.volume.value = volume;

document.querySelector(".main").onclick = () => {
  console.log("hi");

  if (!active) {
    active = true;
  } else {
    // active = false;
  }
  synth.triggerAttackRelease("A4", "8n");
};


class Synthsizer {
  constructor() {
    
  }
}

class Sine extends Synthesizer {
  
}

sine(880).out();
