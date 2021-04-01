var mouseX = 0,
  mouseY = 0,
  time = 0,
  speed = 1;

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
    for (const f of iframers) {
      f.update();
    }
    setTimeout(updater, 5);
  };
  updater();
}

class DynamicMatrix {
  constructor() {}
  get() {
    const m = new DOMMatrix();
    const values = [];

    for (const v of this.values) {
      if (typeof v === "function") {
        values.push(v());
      } else if (Array.isArray(v)) {
        values.push(v[Math.floor(((time * speed) / 2) % v.length)]);
      } else {
        values.push(v);
      }
      if (this.timed) {
        values[values.length - 1] *= time;
      }
    }

    m[this.func](...values);
    return m;
  }
  setValues() {
    this.func = arguments[0];
    this.timed = arguments[1];
    this.values = [];
    for (let i = 2; i < arguments.length; i++) {
      this.values.push(arguments[i]);
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
    if(url.startsWith("http") == false) {
      this.url = "https://" + url;
    }
    this.queue = [];
    this.s = 1;
    this.sx = 1;
    this.sy = 1;
    this.m = new DOMMatrix();
  }
  out(index = 0) {
    const lastIframe = iframers[index];
    iframers[index] = this;

    let frame;

    if (lastIframe != null || lastIframe != undefined) {
      // prev one exist
      frame = lastIframe.frame;
      if (lastIframe.url != this.url) {
        frame.src = this.url;
      }
    } else {
      frame = document.createElement("iframe");
      // iframe.style.display = "none";
      document.body.appendChild(frame);
      frame.allow = "camera; microphone";
      frame.src = this.url;
    }
    this.frame = frame;

    frame.style.position = "absolute";
    frame.style.zIndex = -index;
    frame.style.width = `${this.s * this.sx * 100}%`;
    frame.style.height = `${this.s * this.sy * 100}%`;
  }
  update() {
    this.m = new DOMMatrix();
    for (const m of this.queue) {
      this.m.multiplySelf(m.get());
    }
    if(this.m.m41 > 0) {
      this.m.m41 = (this.m.m41 + 0.5) % 1 - 0.5;
    }
    else {
      this.m.m41 = -((-this.m.m41 + 0.5) % 1 - 0.5);
    }
    if(this.m.m42 > 0) {
      this.m.m42 = (this.m.m42 + 0.5) % 1 - 0.5;
    }
    else {
      this.m.m42 = -((-this.m.m42 + 0.5) % 1 - 0.5);
    }
    this.m.m41 *= window.innerWidth;
    this.m.m42 *= window.innerHeight;
    this.frame.style.transform = this.m;
  }
  scale(s = 1, sx = 1, sy = 1) {
    let m = new DynamicMatrix();
    m.setValues("scaleSelf", false, s);
    this.queue.push(m);

    m = new DynamicMatrix();
    m.setValues("scaleSelf", false, sx, sy);
    this.queue.push(m);
    return this;
  }
  rotate(d = 90, v = 0) {
    let m = new DynamicMatrix();
    m.setValues("rotateSelf", false, d);
    this.queue.push(m);

    m = new DynamicMatrix();
    m.setValues("rotateSelf", true, v);
    this.queue.push(m);
    return this;
  }
  scroll(dx = 0.5, dy = 0.5, vx = 0, vy = 0) {
    let m = new DynamicMatrix();
    m.setValues("translateSelf", false, dx, dy);
    this.queue.push(m);
    
    m = new DynamicMatrix();
    m.setValues("translateSelf", true, vx, vy);
    this.queue.push(m);
    return this;
  }
  scrollX(d = 0.5, v = 0) {
    return this.scroll(d, 0, v, 0);
  }
  scrollY(d = 0.5, v = 0) {
    return this.scroll(0, d, 0, v);
  }
}

const iframe = url => new Iframer(url);

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
