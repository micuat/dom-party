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

const iframers = [];

const updaters = [];
{
  const startTime = new Date() / 1000;
  const updater = () => {
    time = new Date() / 1000 - startTime;
    for (const u of updaters) {
      u();
    }
    for(const f of iframers) {
      f.update();
    }
    setTimeout(updater, 5);
  };
  updater();
}

class DynamicMatrix {
  constructor() {
  }
  get() {
    const m = new DOMMatrix();
    m[this.func](...this.values)
    return m;
  }
  setValues() {
    this.func = arguments[0]
    this.values = [];
    for(let i = 1; i < arguments.length; i++) {
      this.values.push(arguments[i]);
    }
  }
}
// register to the updater if needed
function addValue(func, val) {
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
        obj[func](val[Math.floor((time * speed / 2) % val.length)]);
      });
    } else {
      updaters.push(() => {
        obj[func] = val[Math.floor((time * speed / 2) % val.length)];
      });
    }
  } else {
    if (typeof obj[func] === "function") {
    } else {
      obj[func] = val;
    }
  }
}

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
    this.m = new DOMMatrix()
  }
  out(index = 0) {
    const lastIframe = iframers[index];
    iframers[index] = this;
    
    let frame;
    
    if (lastIframe != null || lastIframe != undefined) {
      // prev one exist
      frame = lastIframe.frame;
      if(lastIframe.url != this.url) {
        frame.src = this.url;
      }
    }
    else {
      frame = document.createElement('iframe');
      // iframe.style.display = "none";
      document.body.appendChild(frame);
      frame.allow="camera; microphone"
      frame.src = this.url;
    }
    this.frame = frame;
    
    frame.style.position = "absolute";
    frame.style.zIndex = 0;
    frame.style.width = `${this.s * this.sx * 100}%`;
    frame.style.height = `${this.s * this.sy * 100}%`;
  }
  update() {
    this.m = new DOMMatrix();
    for(const m of this.queue) {
      this.m.multiplySelf(m);
    }
    this.frame.style.transform = this.m;
  }
  scale(s=1,sx=1,sy=1) {
    const m = new DOMMatrix();
    m.scaleSelf(s)
    this.queue.push(m)
    // addValue(g.gain, "value", v);
    // this.s *= s;
    // this.sx *= sx;
    // this.sy *= sy;
    return this;
  }
  rotate(d,v) {
    const m = new DOMMatrix();
    m.rotateSelf(d)
    this.queue.push(m)
    return this;
  }
  scrollX(d,v) {
    const m = new DOMMatrix();
    m.translateSelf(d, 0)
    this.queue.push(m)
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
