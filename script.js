var container = document.createElement("div");
container.setAttribute("id", "editor-container");
var el = document.createElement("TEXTAREA");
document.body.appendChild(container);
container.appendChild(el);

const cm = CodeMirror.fromTextArea(el, {
  // theme: "tomorrow-night-eighties",
  value: "a",
  mode: { name: "javascript", globalVars: true },
  lineWrapping: true,
  styleSelectedText: true
});
cm.refresh();

window.onkeydown = e => {
  //  console.log(e)
  if (e.ctrlKey === true) {
    // ctrl - enter: evalAll
    if (e.keyCode === 13) {
      e.preventDefault();
      // repl.eval(editor.getValue(), (string, err) => {
      //   console.log('eval', err)
      //   if(!err) gallery.saveLocally(editor.getValue())
      // })
      const code = cm.getValue();
      console.log(code);
      updaters.length = 0;
      eval(code);

      console.log(updaters);

      if (!active) {
        active = true;
      } else {
        // active = false;
      }
    }
  }
};
// var myCodeMirror = CodeMirror(document.body, {
//   value: "function myScript(){return 100;}\n",
//   mode:  "javascript"
// });

const volume = -4;

let active = false;

// Make the volume quieter
Tone.Master.volume.value = volume;

const codes = document.querySelectorAll(".code");
const exampleCodes = [];
for (const c of codes) {
  const code = c.innerText;
  exampleCodes.push(code);
  c.onclick = () => {
    //     console.log(code);
    //     updaters.length = 0;
    //     eval(code);
    //     console.log(updaters);
    //     if (!active) {
    //       active = true;
    //     } else {
    //       // active = false;
    //     }
  };
}
function reloadExample() {
  cm.setValue(
    exampleCodes[Math.floor(Math.random() * exampleCodes.length)].trim()
  );
}
reloadExample();

var mouseX = 0,
  mouseY = 0,
  time = 0,
  speed = 2;

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

  mouseX = Math.max(0, Math.min(100000, event.pageX));
  mouseY = Math.max(0, Math.min(100000, event.pageY));
  // Use event.pageX / event.pageY here
};

const updaters = [];
const updater = () => {
  time += 10 / 1000;
  for (const u of updaters) {
    u();
  }
  setTimeout(updater, 10);
};
updater();

function addValue(obj, func, val) {
  if (typeof val === "function") {
    if (typeof obj[func] === "function") {
      updaters.push(() => {
        obj[func](val());
      });
    } else {
      updaters.push(() => {
        obj[func] = val();
      });
    }
  } else if (Array.isArray(val)) {
    if (typeof obj[func] === "function") {
      updaters.push(() => {
        obj[func](val[Math.floor((time * speed) % val.length)]);
      });
    } else {
      updaters.push(() => {
        obj[func] = val[Math.floor((time * speed) % val.length)];
      });
    }
  } else {
    if (typeof obj[func] === "function") {
    } else {
      obj[func] = val;
    }
  }
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
    this.dur = "8n";
  }
  out() {
    this.outlet.connect(Tone.Master);
    this.play(this.source);
  }
  volume(v) {
    // this.source.volume.value = v;
    addValue(this.source.volume, "value", v);
    return this;
  }
  duration(t) {
    this.dur = t;
    return this;
  }
  feedback(delayTime, amount) {
    const effect = new Tone.FeedbackDelay();
    this.outlet.connect(effect);
    this.outlet = effect;
    addValue(effect.delayTime, "value", delayTime);
    addValue(effect.feedback, "value", amount);
    return this;
  }
  crush(bits) {
    const effect = new Tone.BitCrusher();
    this.outlet.connect(effect);
    this.outlet = effect;
    addValue(effect, "bits", bits);
    return this;
  }
  mult(s) {
    const g = new Tone.Gain();
    this.outlet.connect(g.gain);
    s.outlet.connect(g);
    s.play(); // TODO
    this.outlet = g;
    return this;
  }
  play() {
    console.log("play function not implemented");
  }
}

class WaveSynthesizer extends Synthesizer {
  constructor({ toneSynth: s }) {
    super({ toneSynth: s });
  }
  play() {
    if (typeof this.freq !== "number") {
      this.source.triggerAttackRelease(0, this.dur);
    } else {
      this.source.triggerAttackRelease(this.freq, this.dur);
      if (this.source.harmonicity !== undefined) {
        this.source.harmonicity.value = this.freqm / this.freq;
      }
    }
  }
}

class Sine extends WaveSynthesizer {
  constructor(f, type = "sine") {
    const s = new Tone.Synth({
      oscillator: {
        type
      }
    });
    super({ toneSynth: s });
    this.freq = f;
    addValue(s, "setNote", f);
  }
}

const sine = freq => {
  return new Sine(freq);
};

const tri = freq => {
  return new Sine(freq, "triangle");
};

const square = freq => {
  return new Sine(freq, "square");
};

class AM extends WaveSynthesizer {
  constructor(f, fm = 2) {
    const s = new Tone.AMSynth({
      modulation: {
        type: Tone.square
      }
    });
    super({ toneSynth: s });
    this.freq = f;
    this.freqm = fm;
    if (typeof this.freq === "function") {
      updaters.push(() => {
        s.setNote(this.freq());
        if (s.harmonicity !== undefined) {
          s.harmonicity.value = this.freqm / this.freq();
        }
      });
    }
  }
}

const am = (f, fm) => {
  return new AM(f, fm);
};

class FM extends WaveSynthesizer {
  constructor(f, fm = 2) {
    const s = new Tone.FMSynth({});
    super({ toneSynth: s });
    this.freq = f;
    this.freqm = fm;
    if (typeof this.freq === "function") {
      updaters.push(() => {
        s.setNote(this.freq());
        if (s.harmonicity !== undefined) {
          s.harmonicity.value = this.freqm / this.freq();
        }
      });
    }
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
