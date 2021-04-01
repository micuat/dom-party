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
    for (const u of updaters) {
      u();
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

const frames = [];

function runCode(code) {
  updaters.length = 0;
  eval(code);
}

class Iframer {
  constructor(url) {
    this.url = url;
    this.queue = [];
    this.s = 1;
    this.sx = 1;
    this.sy = 1;
  }
  out(index = 0) {
    this.queue.push(this.source);
    if (frames[index] != null || frames[index] != undefined) {
      // prev one exist
    }
    else {
      const frame = document.createElement('iframe');
      // iframe.style.display = "none";
      document.body.appendChild(frame);
      frame.allow="camera; microphone"
      frames[index] = frame;
    }
    const frame = frames[index];
    if(frame.srcOrg != this.url) {
      frame.src = this.url;
      frame.srcOrg = this.url; // !!!
    }
    frame.style.position = "absolute";
    frame.style.zIndex = 0;
    frame.style.width = `${this.s * this.sx * 100}%`;
    frame.style.height = `${this.s * this.sy * 100}%`;
  }
  scale(s=1,sx=1,sy=1) {
    // addValue(g.gain, "value", v);
    this.s *= s;
    this.sx *= sx;
    this.sy *= sy;
    return this;
  }
  gain(v) {
    const g = audioContext.createGain();
    this.outlet.connect(g);
    addValue(g.gain, "value", v);
    this.outlet = g;
    return this;
  }
}

const iframe = (url) => new Iframer(url);

// class WhiteNoise extends Synthesizer {
//   constructor() {
//     // https://noisehack.com/generate-noise-web-audio-api/
//     const bufferSize = 2 * audioContext.sampleRate;
//     const noiseBuffer = audioContext.createBuffer(
//       1,
//       bufferSize,
//       audioContext.sampleRate
//     );
//     const output = noiseBuffer.getChannelData(0);
//     for (var i = 0; i < bufferSize; i++) {
//       output[i] = Math.random() * 2 - 1;
//     }

//     var whiteNoise = audioContext.createBufferSource();
//     whiteNoise.buffer = noiseBuffer;
//     whiteNoise.loop = true;
//     super({ toneSynth: whiteNoise });
//   }
// }

// const wnoise = () => {
//   return new WhiteNoise();
// };
