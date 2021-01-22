const volume = -2;

let synth;

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

class Synthesizer {
  constructor(outlet, source) {
    this.outlet = outlet;
    if(source == undefined) {
      this.source = outlet;
    }
    else {
      this.source = source;
    }
  }
  out() {
    synth = this.source;
    this.outlet.connect(Tone.Master);
    // this.synth.triggerAttackRelease(this.freq, "8n");
  }
  volume(v) {
    this.synth.volume.value = v;
    return this;
  }
  feedback(delayTime, amount) {
    const effect = new Tone.FeedbackDelay(delayTime, amount);
    this.outlet.connect(effect);
    return new Synthesizer(effect, this.source);
  }
}

class Sine extends Synthesizer {
  constructor(freq) {
    const s = new Tone.Synth({});
    super(s);
    this.freq = freq;
  }
  play() {
  }
}

const sine = (freq) => {
  return new Sine(freq);
}

sine(880).feedback(0.02, 0.85).out();
