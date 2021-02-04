// var bitcrusher = require('bitcrusher');

// audio

var container = document.querySelector("#editor-container");
var el = document.createElement("TEXTAREA");
//document.body.appendChild(container);
container.appendChild(el);

const cm = CodeMirror.fromTextArea(el, {
  // theme: "tomorrow-night-eighties",
  value: "a",
  mode: { name: "javascript", globalVars: true },
  lineWrapping: true,
  styleSelectedText: true
});
cm.refresh();

// hydra

var canvas = document.createElement("CANVAS");
canvas.style.width = "100%";
document.querySelector("#canvas-container").appendChild(canvas);

var container = document.querySelector("#hydra-container");
var el = document.createElement("TEXTAREA");
//document.body.appendChild(container);
container.appendChild(el);

const cmH = CodeMirror.fromTextArea(el, {
  // theme: "tomorrow-night-eighties",
  value: "a",
  mode: { name: "javascript", globalVars: true },
  lineWrapping: true,
  styleSelectedText: true
});
cmH.refresh();
cmH.setValue(`osc(50,0.1,()=>active?2:0).rotate(()=>mouseY/100).modulate(noise(3),()=>mouseX/window.innerWidth/4).out()`);

var hydra = new Hydra({
  canvas,
  detectAudio: false,
  enableStreamCapture: false,
});
{
  const code = cmH.getValue();
  eval(code);
}

window.onkeydown = e => {
  //  console.log(e)
  if (e.ctrlKey === true) {
    // ctrl - enter: evalAll
    if (e.keyCode === 13) {
      e.preventDefault();

      if (cm.hasFocus()) {
        evaluateCode();
      }
      if (cmH.hasFocus()) {
        const code = cmH.getValue();
        eval(code);
      }
      // repl.eval(editor.getValue(), (string, err) => {
      //   console.log('eval', err)
      //   if(!err) gallery.saveLocally(editor.getValue())
      // })
    }
  }
};

// for legacy browsers
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

let active = false;

const codes = document.querySelectorAll(".code");
const exampleCodes = [];
for (const c of codes) {
  const code = c.innerText;
  exampleCodes.push(code);
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

const synths = [];

function hushSound() {
  for (let i = synths.length - 1; i >= 0; i--) {
    for (const s of synths[i]) {
      s.stop();
    }
    synths.pop();
  }
  active = false;
}

function evaluateCode() {
  const code = cm.getValue();
  console.log(code);
  updaters.length = 0;
  eval(code);

  if (!active) {
    active = true;
  } else {
    // active = false;
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
    this.queue = [];
  }
  out(index = 0) {
    this.outlet.connect(audioContext.destination);
    this.queue.push(this.source);
    if (synths[index] != null || synths[index] != undefined) {
      for (const s of synths[index]) {
        s.stop();
      }
    }
    synths[index] = this.queue;
    this.play();
  }
  gain(v) {
    const g = audioContext.createGain();
    this.outlet.connect(g);
    addValue(g.gain, "value", v);
    this.outlet = g;
    return this;
  }
  // feedback(delayTime, amount) {
  //   const effect = new Tone.FeedbackDelay();
  //   this.outlet.connect(effect);
  //   this.outlet = effect;
  //   addValue(effect.delayTime, "value", delayTime);
  //   addValue(effect.feedback, "value", amount);
  //   return this;
  // }
  crush(bits) {
    const effect = bitcrusher(audioContext, {
      bitDepth: 32,
      frequency: 1
    });
    this.outlet.connect(effect);
    this.outlet = effect;
    addValue(effect, "bitDepth", bits);
    return this;
  }
  mult(s) {
    this.queue.push(s.outlet);
    const g = audioContext.createGain();
    this.outlet.connect(g.gain);
    s.outlet.connect(g);
    this.outlet = g;
    return this;
  }
  modulate(s, v = 100) {
    this.queue.push(s.outlet);
    this.modulator = s;

    const g = audioContext.createGain();
    s.outlet.connect(g);
    addValue(g.gain, "value", v);
    g.connect(this.source.detune);

    return this;
  }
  play() {
    for (const s of this.queue) {
      s.start();
    }
  }
}

class WaveSynthesizer extends Synthesizer {
  constructor({ toneSynth: s }) {
    super({ toneSynth: s });
  }
}

class Sine extends WaveSynthesizer {
  constructor(f, type = "sine") {
    const s = audioContext.createOscillator();

    s.type = type;
    super({ toneSynth: s });
    this.freq = f;
    addValue(s.frequency, "value", f);
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
