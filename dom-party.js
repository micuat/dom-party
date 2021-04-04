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

// hydra

const hydraCanvas = document.createElement("CANVAS");
let hydra;

if(typeof Hydra !== "undefined") {
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

const dommers = [];

const updaters = [];
{
  const startTime = new Date() / 1000;
  const updater = () => {
    time = new Date() / 1000 - startTime;
    for (const f of dommers) {
      if(f !== undefined)
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

function runCode(code) {
  updaters.length = 0;
  eval(code);
}

class Dommer {
  constructor() {
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
    this.queue.reverse();

    const lastDom = dommers[index];
    dommers[index] = this;

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

    const keys = Object.keys(this.styles);
    for (const key of keys) {
      elt.style[key] = this.styles[key];
    }

    return elt;
  }
  update() {
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
}

class Iframer extends Dommer {
  constructor(url) {
    super();
    this.type = "iframe";
    this.url = url;
    if (url.startsWith("http") == false) {
      this.url = "https://" + url;
    }
  }
  out(index = 0) {
    const lastIframe = dommers[index];
    let lastUrl = "";
    if (lastIframe) lastUrl = lastIframe.url;
    console.log(lastUrl == this.url);

    const elt = super.out(index);
    if (lastUrl != this.url) {
      elt.src = this.url;
    }
    elt.allow = "camera; microphone";
  }
  shadow(r = 0, g = 0, b = 0, s = 10, x = 0, y = 0) {
    this.styles.boxShadow = `${x}px ${y}px ${s}px rgb(${r * 255},${g *
      255},${b * 255})`;
    return this;
  }
}

const iframe = url => new Iframer(url);

class Per extends Dommer {
  constructor(text) {
    super();
    this.type = "paragraph";
    this.text = text;

    this.styles.fontSize = "32pt";
    this.styles.display = "inline-block";
    this.styles.pointerEvents = "none";
    this.childStyles = {};
  }
  color(r = 0, g = 0, b = 0, a = 1) {
    this.styles.color = `rgba(${r * 255},${g * 255},${b * 255},${a})`;
    return this;
  }
  bg(r = 0, g = 0, b = 0, a = 1) {
    this.childStyles.backgroundColor = `rgba(${r * 255},${g * 255},${b *
      255},${a})`;
    return this;
  }
  center() {
    this.styles.textAlign = "center";
    return this;
  }
  size(s = 32) {
    this.styles.fontSize = `${s}pt`;
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

    pelt.innerHTML = this.text;

    const keys = Object.keys(this.childStyles);
    for (const key of keys) {
      pelt.style[key] = this.childStyles[key];
    }
  }
}

const p = text => new Per(text);

class LoadText extends Per {
  constructor(url) {
    super("");

    fetch(url).then((response) => {
      response.text().then((text) => {
        this.loadedText = text.split("\n");
      });
    });
    this.lineIndex = 0;
    this.lastTime = 0;
  }
  update() {
    super.update();
    
    if(this.loadedText !== undefined && Math.floor(time) - Math.floor(this.lastTime) > 0) {
      this.elt.firstChild.innerText = this.loadedText[this.lineIndex];
      this.lineIndex = (this.lineIndex + 1) % this.loadedText.length;
    }
    this.lastTime = time;
  }
}

const loadText = url => new LoadText(url);

class Canvaser extends Dommer {
  constructor() {
    super();
    this.type = "hydra";
  }
  out(index = 0) {
    const elt = super.out(index);
    elt.appendChild(hydraCanvas);
  }
}

const canvas = () => new Canvaser();

class Imager extends Dommer {
  constructor(url) {
    super();
    this.type = "img";
    this.url = url;
  }
  out(index = 0) {
    const elt = super.out(index);
    elt.src = this.url;
  }
}

const img = (url) => new Imager(url);