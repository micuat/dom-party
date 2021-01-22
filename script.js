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
  constructor(outlet, source) {
    this.outlet = outlet;
    if (source == undefined) {
      this.source = outlet;
    } else {
      this.source = source;
    }
  }
  out() {
    this.outlet.connect(Tone.Master);
    this.play();
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
    const s = new Synthesizer(effect, this.source);
    s.play = this.play;
    return s;
  }
  crush(bits) {
    const effect = new Tone.BitCrusher(bits);
    this.outlet.connect(effect);
    const s = new Synthesizer(effect, this.source);
    s.play = this.play;
    return s;
  }
  play() {
    console.log("play function not implemented")
  }
}

class Sine extends Synthesizer {
  constructor(f) {
    const s = new Tone.Synth({});
    super(s);
    freq = f;
    dur = "8n";
  }
  play() {
    this.source.triggerAttackRelease(freq, dur);
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
    super(s);
    freq = f;
    dur = "8n";
    s.harmonicity.value = fm / f;
  }
  play() {
    this.source.triggerAttackRelease(freq, dur);
  }
}

const am = (f, fm) => {
  return new AM(f, fm);
};

class FM extends Synthesizer {
  constructor(f, fm = 2) {
    const s = new Tone.FMSynth({});
    super(s);
    freq = f;
    dur = "8n";
    s.harmonicity.value = fm / f;
  }
  play() {
    this.source.triggerAttackRelease(freq, dur);
  }
}

const fm = (f, fm) => {
  return new FM(f, fm);
};

class WNoise extends Synthesizer {
  constructor() {
    const s = new Tone.NoiseSynth({});
    super(s);
    dur = "8n";
    freq = "noise"
  }
  play() {
    this.source.triggerAttackRelease(dur);
  }
}

const wnoise = () => {
  return new WNoise();
};
