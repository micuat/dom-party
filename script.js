const data = rawData;

// hydra

var canvas = document.createElement("CANVAS");
canvas.width = 1280;
canvas.height = 700;
canvas.style.width = "100%";
canvas.style.height = "100%";
document.querySelector(".canvas-container").appendChild(canvas);

var hydra = new Hydra({
  canvas,
  detectAudio: false,
  enableStreamCapture: false,
  numSources: 8
});

const vid = document.querySelector("#video-kln");
const vidkey = document.querySelector("#video-key");

// vid.crossOrigin = 'anonymous'
// vid.autoplay = false//true
// vid.loop = false//true
// vid.muted = true
s1.init({src: vid})
src(s1).out()

let lastI = 0;
let disp = {};
let curTime = 0;

vid.addEventListener(
  "seeked",
  function() {
    vidkey.currentTime = vid.currentTime;
    lastI = 0;
    disp = {};
  },
  true
);

vid.addEventListener(
  "play",
  function() {
    vidkey.play();
  },
  true
);

vid.addEventListener(
  "pause",
  function() {
    vidkey.pause();
  },
  true
);

setInterval(() => {
  const time = vid.currentTime;
  curTime = time;
  for (let i = lastI; i < data.length; i++) {
    const d = data[i];
    if (d.t < time) {
      let tag = d.type;
      let val = {};
      if (tag == "hydra") {
        val = { code: d.code, evalCode: d.eval, line: d.cursor.line, ch: d.cursor.ch };
        
        if(val.evalCode !== undefined) {
          try{eval(val.evalCode)}catch(e){}
          const c = document.querySelector("code")
          c.style.backgroundColor = "hotpink"
          setTimeout(() => c.style.backgroundColor = "black", 300);
        }

        let inner = val.code;
        let curl = 0;
        let curc = 0;
        for (let i = 0; i < inner.length; i++) {
          if (val.line == curl && val.ch == curc) {
            let c = inner[i];
            if (c == "\n") c = "_\n";
            inner = `${inner.substring(
              0,
              i
            )}<span style="background-color:yellow;color:black;">${c}</span>${inner.substring(
              i + 1
            )}`;
            break;
          }
          if (inner[i] == "\n") {
            curl++;
            curc = 0;
          } else {
            curc++;
          }
        }
        inner = inner.replace(/\n/g, "<br />");

        document.querySelector("code").innerHTML = inner;
      }
      disp[tag] = val;
      lastI = i;
    } else {
      break;
    }
  }

  // document.querySelector("p").innerText = JSON.stringify(disp);
}, 100);
