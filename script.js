const volume = -2;

let active = false;

// Make the volume quieter
Tone.Master.volume.value = volume;

const codes = document.querySelectorAll(".code");
for (const c of codes) {
  c.onclick = () => {
    eval(c.innerText);
    console.log(c.innerText);

    if (!active) {
      active = true;
    } else {
      // active = false;
    }
  };
}

class Synthesizer {
  constructor({ toneSynth, objSynth }) {
    if (toneSynth !== undefined) {
      this.source = toneSynth;
      this.outlet = toneSynth;
    } else {
      // ???????
      this.outlet = objSynth.outlet;
      this.source = objSynth.source;
      this.play = objSynth.play;
    }
    // this.dur = "8n";
  }
  out() {
    this.outlet.connect(Tone.Master);
    this.play(this.source);
  }
  volume(v) {
    this.source.volume.value = v;
    return this;
  }
  duration(t) {
    this.dur = t;
    return this;
  }
  feedback(delayTime, amount) {
    const effect = new Tone.FeedbackDelay(delayTime, amount);
    this.outlet.connect(effect);
    this.outlet = effect;
    return this;
  }
  crush(bits) {
    const effect = new Tone.BitCrusher(bits);
    this.outlet.connect(effect);
    this.outlet = effect;
    return this;
  }
  play() {
    console.log("play function not implemented");
  }
}

class Sine extends Synthesizer {
  constructor(f) {
    const s = new Tone.Synth({});
    super({ toneSynth: s });
    this.freq = f;
  }
  play() {
    if (typeof this.freq === "function") {
      this.source.triggerAttackRelease(this.freq, this.dur);
    } else {
      this.source.triggerAttackRelease(this.freq, this.dur);
    }
  }
}

const sine = freq => {
  return new Sine(freq);
};

class AM extends Synthesizer {
  constructor(f, fm = 2) {
    const s = new Tone.AMSynth({
      modulation: {
        type: Tone.square
      }
    });
    super({ toneSynth: s });
    this.freq = f;
    s.harmonicity.value = fm / f;
  }
  play() {
    this.source.triggerAttackRelease(this.freq, this.dur);
  }
}

const am = (f, fm) => {
  return new AM(f, fm);
};

class FM extends Synthesizer {
  constructor(f, fm = 2) {
    const s = new Tone.FMSynth({});
    super({ toneSynth: s });
    this.freq = f;
    s.harmonicity.value = fm / f;
  }
  play() {
    this.source.triggerAttackRelease(this.freq, this.dur);
  }
}

const fm = (f, fm) => {
  return new FM(f, fm);
};

class WNoise extends Synthesizer {
  constructor() {
    const s = new Tone.NoiseSynth({});
    super({ toneSynth: s });
  }
  play() {
    this.source.triggerAttackRelease(this.dur);
  }
}

const wnoise = () => {
  return new WNoise();
};
