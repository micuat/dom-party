// for legacy browsers
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

// not working
// audio lines
var q0 = 0,
  q1 = 1,
  q2 = 2,
  q3 = 3;
const offlineContexts = [];
for (let i = 0; i < 4; i++) {
  offlineContexts[i] = new OfflineAudioContext(2, 44100 * 40, 44100);
}

var analyser = audioContext.createAnalyser();
analyser.fftSize = 1024;
var bufferLength = analyser.frequencyBinCount;
var a = new Uint8Array(bufferLength);

var analyserWave = audioContext.createAnalyser();
analyserWave.fftSize = 1024;
var bufferLength2 = analyserWave.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength2);

const WIDTH = 1200;
const HEIGHT = 400;
var waveFormCanvas = document.createElement('canvas');
var canvasCtx = waveFormCanvas.getContext('2d');
canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

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
{
  const startTime = new Date() / 1000;
  const updater = () => {
    time = new Date() / 1000 - startTime;
    analyser.getByteFrequencyData(a);
    analyserWave.getByteTimeDomainData(dataArray);
    for (const u of updaters) {
      u();
    }

    var sliceWidth = (WIDTH * 1.0) / bufferLength;
    var x = 0;
    for (var i = 0; i < bufferLength; i++) {
      var v = dataArray[i] / 128.0;
      var y = (v * 255) / 2;

    canvasCtx.fillStyle = `rgb(${y}, ${y}, ${y})`;
    canvasCtx.fillRect(x, 0, sliceWidth, HEIGHT);

      x += sliceWidth;
    }

    setTimeout(updater, 5);
  };
  updater();
}

// register to the updater if needed
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
    if (synths[i] !== undefined) {
      for (const s of synths[i]) {
        s.stop();
      }
    }
    synths.pop();
  }
  active = false;
}

function runCode(code) {
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
  out(index = q0) {
    this.outlet.connect(audioContext.destination);
    this.outlet.connect(analyser);
    this.outlet.connect(analyserWave);
    // // BAD!!!
    // and this needs whole structural change to work
    // if (index == q0) {
    //   this.outlet.connect(audioContext.destination);
    //   // this.outlet.connect(offlineContexts[index].destination);
    // } else {
    //   this.outlet.connect(offlineContexts[index].destination);
    // }
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

// needed???
class WaveSynthesizer extends Synthesizer {
  constructor({ toneSynth: s }) {
    super({ toneSynth: s });
  }
}

const keyTable = {
  C: 24,
  "C#": 25,
  D: 26,
  "D#": 27,
  E: 28,
  F: 29,
  "F#": 30,
  G: 31,
  "G#": 32,
  A: 33,
  "A#": 34,
  B: 35
};
const keyOrder = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B"
];
const midiToNote = _keyNum => {
  const keyNum = _keyNum.toUpperCase();
  const k = /[A-Z]#?/.exec(keyNum)[0];
  const n = /\d+/.exec(keyNum)[0];
  return keyTable[k] + 12 * n;
};

function noteToFreq(m) {
  let tuning = 440;
  if (isNaN(m) || m > 120 || m <= 0) return Math.random() * midiToFreq(100);
  return Math.pow(2, (m - 69) / 12) * tuning;
}

class Oscillator extends WaveSynthesizer {
  constructor(_f, type = "sine") {
    const s = audioContext.createOscillator();
    // const s = offlineContexts[1].createOscillator();

    s.type = type;
    super({ toneSynth: s });
    let f = _f;
    if (typeof _f == "string") {
      f = noteToFreq(midiToNote(_f));
    } else if (Array.isArray(_f)) {
      f = [];
      for (const el of _f) {
        if (typeof el == "string") {
          f.push(noteToFreq(midiToNote(el)));
        } else {
          f.push(el);
        }
      }
    }
    this.freq = f;
    addValue(s.frequency, "value", f);
  }
}

const sine = freq => {
  return new Oscillator(freq);
};

const tri = freq => {
  return new Oscillator(freq, "triangle");
};

const square = freq => {
  return new Oscillator(freq, "square");
};

class WhiteNoise extends Synthesizer {
  constructor() {
    // https://noisehack.com/generate-noise-web-audio-api/
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(
      1,
      bufferSize,
      audioContext.sampleRate
    );
    const output = noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    var whiteNoise = audioContext.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    super({ toneSynth: whiteNoise });
  }
}

const wnoise = () => {
  return new WhiteNoise();
};

// class Bus extends Synthesizer {
//   constructor(index) {
//     const s = audioContext.createBufferSource();
//     setTimeout(()=>{
//     offlineContexts[index]
//       .startRendering()
//       .then(function(renderedBuffer) {
//         console.log("Rendering completed successfully");
//         s.buffer = renderedBuffer;
//         // s.start();
//       })
//       .catch(function(err) {
//         console.log("Rendering failed: " + err);
//         // Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
//       });
//     }, 20);

//     super({ toneSynth: s });
//   }
// }

// const bus = (index = q0) => {
//   return new Bus(index);
// }
