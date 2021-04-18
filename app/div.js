const easing = require('./easing-functions.js');

function allArgumentStatic() {
  for (let i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] == "function" || Array.isArray(arguments[i])) {
      return false;
    }
  }
  return true;
}

// https://github.com/ojack/hydra-synth/blob/3a4691a16aee2c08d672d3d1893d920c597462cf/src/lib/array-utils.js
const arrayUtils = {};
arrayUtils.getValue = (arr = []) => ({ time, bpm }) => {
  let speed = arr._speed ? arr._speed : 1
  let smooth = arr._smooth ? arr._smooth : 0
  let index = time * speed * (bpm / 60) + (arr._offset || 0)

  if (smooth !== 0) {
    let ease = arr._ease ? arr._ease : easing['linear']
    let _index = index - (smooth / 2)
    let currValue = arr[Math.floor(_index % (arr.length))]
    let nextValue = arr[Math.floor((_index + 1) % (arr.length))]
    let t = Math.min((_index % 1) / smooth, 1)
    return ease(t) * (nextValue - currValue) + currValue
  }
  else {
    return arr[Math.floor(index % (arr.length))]
  }
}

function functionize(a) {
  if (typeof a == "function") {
    return a;
  }
  if (Array.isArray(a)) {
    return arrayUtils.getValue(a);
  } else return () => a;
}

class DynamicMatrix {
  constructor() { }
  get() {
    const m = new DOMMatrix();
    const values = [];

    for (const v of this.values) {
      if (typeof v === "function") {
        values.push(v());
      } else if (Array.isArray(v)) {
        values.push(arrayUtils.getValue(v)({ time, bpm }));
      } else {
        values.push(v);
      }
      if (this.timed) {
        values[values.length - 1] *= time;
      }
      if (this.func == "rotateSelf") {
        values[values.length - 1] *= 180 / Math.PI;
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

class Dommer {
  constructor(dommers) {
    this.dommers = dommers;
    this.type = "div";
    this.queue = [];
    this.s = 1;
    this.sx = 1;
    this.sy = 1;
    this.m = new DOMMatrix();
    this.styles = {};
    this.styles.position = "absolute";
    this.styles.width = "100%";
    this.styles.height = "100%";
    this.styles.margin = "0";
  }
  out(index = 0) {
    this.queue.reverse(); // to make the order hydra style!

    const lastDom = this.dommers[index];
    this.dommers[index] = this;

    let elt;

    if (lastDom) {
      if (lastDom.elt.tagName == this.type.toUpperCase()) {
        elt = lastDom.elt;
        elt.style = {};
      } else {
        lastDom.elt.remove();
      }
    }

    if (elt === undefined) {
      elt = document.createElement(this.type);
      document.body.appendChild(elt);
    }
    this.elt = elt;

    elt.style.zIndex = -index;

    this.updateStyles(true);

    return elt;
  }
  updateTransform() {
    this.m = new DOMMatrix();
    for (const m of this.queue) {
      this.m.multiplySelf(m.get());
    }
    if (this.m.m41 > 0) {
      this.m.m41 = ((this.m.m41 + 0.5) % 1) - 0.5;
    } else {
      this.m.m41 = -(((-this.m.m41 + 0.5) % 1) - 0.5);
    }
    if (this.m.m42 > 0) {
      this.m.m42 = ((this.m.m42 + 0.5) % 1) - 0.5;
    } else {
      this.m.m42 = -(((-this.m.m42 + 0.5) % 1) - 0.5);
    }
    this.m.m41 *= window.innerWidth;
    this.m.m42 *= window.innerHeight;
    this.elt.style.transform = this.m;
  }
  updateStyles(force = false) {
    const keys = Object.keys(this.styles);
    for (const key of keys) {
      if (typeof this.styles[key] == "function") {
        this.elt.style[key] = this.styles[key]();
      } else if (force) {
        this.elt.style[key] = this.styles[key];
      }
    }
  }
  update() {
    this.updateTransform();
    this.updateStyles(false);
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
  noSelect() {
    this.styles.userSelect = "none";
    return this;
  }
  shadow(r = 0, g = 0, b = 0, s = 10, x = 0, y = 0) {
    this.styles.boxShadow = `${x}px ${y}px ${s}px rgb(${r * 255},${g *
      255},${b * 255})`;
    return this;
  }
}

class Iframer extends Dommer {
  constructor(dommers, url) {
    super(dommers);
    this.type = "iframe";
    this.url = url;
    if (url.startsWith("http") == false) {
      this.url = "https://" + url;
    }
  }
  out(index = 0) {
    const lastIframe = this.dommers[index];
    let lastUrl = "";
    if (lastIframe) lastUrl = lastIframe.url;
    console.log(lastUrl == this.url);

    const elt = super.out(index);
    if (lastUrl != this.url) {
      elt.src = this.url;
    }
    elt.allow = "camera; microphone";
  }
}

// var tag = document.createElement("script");
// tag.id = "iframe-demo";
// tag.src = "https://www.youtube.com/iframe_api";
// var firstScriptTag = document.getElementsByTagName("script")[0];
// firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// let isYoutubeLoaded = false;
// function onYouTubeIframeAPIReady() {
//   console.log("youtube loaded");
//   isYoutubeLoaded = true;
// }

// class Youtuber extends Dommer {
//   constructor(dommers, url) {
//     super(dommers);
//     this.type = "iframe";
//     this.styles.height = (100*9/16)+"vw";
//     this.url = url;
//     if (/youtube/.test(url) == false) {
//       // THIS IS WILD
//       this.url = `https://www.youtube.com/embed/${url}?enablejsapi=1&rel=0`;
//     } else if (url.startsWith("http") == false) {
//       this.url = "https://" + url;
//     }
//   }
//   out(index = 0) {
//     const lastIframe = this.dommers[index];
//     let lastUrl = "";
//     if (lastIframe) lastUrl = lastIframe.url;
//     console.log(lastUrl == this.url);

//     const elt = super.out(index);
//     if (lastUrl != this.url) {
//       elt.src = this.url;
//     }
//     const id = Math.floor(Math.random() * 65536 * 65536).toString(16);
//     elt.id = id;
//     this.isPlaying = false;
//   }
//   update() {
//     super.update();
//     if (this.isPlaying == false) {
//       if (isYoutubeLoaded) {
//         const player = new YT.Player(this.elt.id, {
//           events: {
//             onReady: () => {window.onclick=()=>player.playVideo()}
//           }
//         });
//         this.isPlaying = true;
//       }
//     }
//   }
// }

class Per extends Dommer {
  constructor(dommers, text) {
    super(dommers);
    this.type = "paragraph";
    this.text = text;

    this.styles.fontSize = "32pt";
    this.styles.display = "inline-block";
    this.styles.pointerEvents = "none";
    this.childStyles = {};
  }
  color(r = 0, g = 0, b = 0, a = 1) {
    if (allArgumentStatic(...arguments)) {
      this.styles.color = `rgba(${r * 255},${g * 255},${b * 255},${a})`;
    } else {
      r = functionize(r);
      g = functionize(g);
      b = functionize(b);
      a = functionize(a);
      this.styles.color = () => {
        let args = { time, bpm };
        return `rgba(${r(args) * 255},${g(args) * 255},${b(args) * 255},${a(args)})`
      };
    }
    return this;
  }
  bg(r = 0, g = 0, b = 0, a = 1) {
    if (allArgumentStatic(...arguments)) {
      this.childStyles.backgroundColor = `rgba(${r * 255},${g * 255},${b *
        255},${a})`;
    } else {
      r = functionize(r);
      g = functionize(g);
      b = functionize(b);
      a = functionize(a);
      this.childStyles.backgroundColor = () => {
        let args = { time, bpm };
        return `rgba(${r(args) * 255},${g(args) * 255},${b(args) * 255},${a(args)})`
      };
    }
    return this;
  }
  center() {
    this.styles.textAlign = "center";
    return this;
  }
  size(s = 32) {
    if (typeof s == "function") {
      this.styles.fontSize = () => `${s()}pt`;
    } else {
      this.styles.fontSize = `${s}pt`;
    }
    return this;
  }
  shadow(r = 0, g = 0, b = 0, s = 10, x = 0, y = 0) {
    this.styles.textShadow = `${x}px ${y}px ${s}px rgb(${r * 255},${g *
      255},${b * 255})`;
    return this;
  }
  out(index = 0) {
    const elt = super.out(index);
    while (elt.firstChild) {
      elt.removeChild(elt.lastChild);
    }
    const pelt = document.createElement("p");
    pelt.style.position = "absolute";
    pelt.style.margin = "0";
    pelt.style.top = "50%";
    pelt.style.left = "50%";
    pelt.style.pointerEvents = "auto";
    pelt.style.transform = "translate(-50%, -50%)";
    elt.appendChild(pelt);

    if (typeof this.text == "string") {
      pelt.innerHTML = this.text;
    }
    this.updateChildStyles(true);
  }
  updateChildStyles(force = false) {
    const keys = Object.keys(this.childStyles);
    for (const key of keys) {
      if (typeof this.childStyles[key] == "function") {
        this.elt.firstChild.style[key] = this.childStyles[key]();
      } else if (force) {
        this.elt.firstChild.style[key] = this.childStyles[key];
      }
    }
  }
  update() {
    super.update();
    if (Array.isArray(this.text)) {
      let s = arrayUtils.getValue(this.text)({ time, bpm });
      if (this.elt.firstChild.innerHTML != s)
        this.elt.firstChild.innerHTML = s;
    }
    this.updateChildStyles(false);
  }
}

class LoadText extends Per {
  constructor(dommers, url) {
    super(dommers, "");

    fetch(url).then(response => {
      response.text().then(text => {
        this.text = text.split("\n");
      });
    });
  }
}

// hydra

const hydraCanvas = document.createElement("CANVAS");
let hydra;

if (typeof Hydra !== "undefined") {
  hydraCanvas.width = window.innerWidth;
  hydraCanvas.height = window.innerHeight;
  hydraCanvas.style.width = "100%";
  hydraCanvas.style.height = "100%";

  hydra = new Hydra({
    canvas: hydraCanvas,
    detectAudio: false,
    enableStreamCapture: false
  });
}

class Canvaser extends Dommer {
  constructor(dommers) {
    super(dommers);
    this.type = "hydra";
  }
  out(index = 0) {
    const elt = super.out(index);
    elt.appendChild(hydraCanvas);
  }
}

class Imager extends Dommer {
  constructor(dommers, url) {
    super(dommers);
    this.type = "img";
    this.url = url;
  }
  out(index = 0) {
    const elt = super.out(index);
    elt.src = this.url;
  }
}

module.exports = { Dommer, Iframer, Per, LoadText, Canvaser, Imager };