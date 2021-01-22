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

var mouseX = 0,
  mouseY = 0;

document.onmousemove = function(event) {
  var eventDoc, doc, body;

  event = event || window.event; // IE-ism

  // If pageX/Y aren't available and clientX/Y are,
  // calculate pageX/Y - logic taken from jQuery.
  // (This is to support old IE)
  if (event.pageX == null && event.clientX != null) {
    eventDoc = (event.target && event.target.ownerDocument) || document;
    doc = eventDoc.documentElement;
    body = eventDoc.body;

    event.pageX =
      event.clientX +
      ((doc && doc.scrollLeft) || (body && body.scrollLeft) || 0) -
      ((doc && doc.clientLeft) || (body && body.clientLeft) || 0);
    event.pageY =
      event.clientY +
      ((doc && doc.scrollTop) || (body && body.scrollTop) || 0) -
      ((doc && doc.clientTop) || (body && body.clientTop) || 0);
  }

  mouseX = event.pageX;
  mouseY = event.pageY;
  // Use event.pageX / event.pageY here
};

const updaters = [];
const updater = () => {
  for (const u of updaters) {
    u();
  }
  setTimeout(updater, 30);
};
updater();

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
    this.dur = "8n";
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

class WaveSynthesizer extends Synthesizer {
  constructor(s) {
    super({ toneSynth: s });
  }
  play() {
    if (typeof this.freq === "function") {
      this.source.triggerAttackRelease(this.freq(), this.dur);
      updaters[0] = () => {
        this.source.setNote(this.freq());
      };
    } else {
      this.source.triggerAttackRelease(this.freq, this.dur);
    }
  }
}

class Sine extends WaveSynthesizer {
  constructor(f) {
    const s = new Tone.Synth({});
    super(s);
    this.freq = f;
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
