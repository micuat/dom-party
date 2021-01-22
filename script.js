const volume = -2;

let synth;
let freq, dur;
let active = false;

// Make the volume quieter
Tone.Master.volume.value = volume;

const codes = document.querySelectorAll(".code")
for(const c of codes) {
  c.onclick = () => {
  eval(c.innerText);
  console.log("hi");

  if (!active) {
    active = true;
  } else {
    // active = false;
  }
  synth.triggerAttackRelease(freq, dur);
};
}
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
    this.source.volume.value = v;
    return this;
  }
  duration(t) {
    dur = t;
    return this;
  }
  feedback(delayTime, amount) {
    const effect = new Tone.FeedbackDelay(delayTime, amount);
    this.outlet.connect(effect);
    return new Synthesizer(effect, this.source);
  }
}

class Sine extends Synthesizer {
  constructor(f) {
    const s = new Tone.Synth({});
    super(s);
    freq = f;
  }
  play() {
  }
}

const sine = (freq) => {
  return new Sine(freq);
}

class FM extends Synthesizer {
  constructor(f) {
    const s = new Tone.FMSynth({});
    super(s);
    freq = f;
  }
  play() {
  }
}

const fm = (freq) => {
  return new FM(freq);
}

