const data = rawData;

let lastI = 0;
let disp = {};
let curTime = 0;

const vid = document.querySelector("video");

setInterval(() => {
  const time = vid.currentTime;
  curTime = time;
  for (let i = lastI; i < data.length; i++) {
    const d = data[i];
    if (d.t < time) {
      let tag = d.type;
      let val = {};
      if (tag == "hydra") {
        val = { code: d.code, line: d.cursor.line, ch: d.cursor.ch };

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
