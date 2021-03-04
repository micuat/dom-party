var i = 0;
var noButton = false;
{
  // where are we
  const url_string = window.location.href;
  const url = new URL(url_string);
  noButton = url.searchParams.get("noButton");
  i = url.searchParams.get("i");
  if (i == )
}

// p5

var p5;
const s = ( sketch ) => {

  p5 = sketch;
  sketch.setup = () => {
    sketch.createCanvas(1280,720);
    s0.init({src: sketch.elt})
  };
};

// hydra

var canvas = document.createElement("CANVAS");
canvas.style.width = "100%";
canvas.style.height = "100%";
document.querySelector("#canvas-container").appendChild(canvas);

var container = document.querySelector("#editor-container");
var el = document.createElement("TEXTAREA");
//document.body.appendChild(container);
container.appendChild(el);

var cm = CodeMirror.fromTextArea(el, {
  theme: "paraiso-dark",
  value: "a",
  mode: { name: "javascript", globalVars: true },
  lineWrapping: true,
  styleSelectedText: true
});
cm.refresh();
cm.setValue(noButton?`s1.initCam(i)
p5.background(["crimson", "aliceblue", "plum"][i%3])
p5.textSize(200);p5.text(i+1, 100, 250)
src(s0).layer(
  src(s1).hue(-.1).chroma()
  ).out()
`:`solid().out()
` + 
`

setResolution(1280,720)

update=()=>{
  windowStuff()
}
`);

var hydra = new Hydra({
  canvas,
  detectAudio: false,
  enableStreamCapture: false
});

let myp5 = new p5(s);

var windowStuff = () => {
  cc[1]=Math.max(0.01,cc[1])-0.01
  f+=cc[17]*0.1
  xoff=50;yoff=5
  x0=600*i;y0=0
  x1=600*(2-i);y1=500
  x2=Math.sin(th=f+i*3.14/3)*200+300
  y2=Math.cos(th)*200+300
moveTo(lerp(lerp(x0,x1,cc[0]),x2,cc[1])+xoff,lerp(lerp(y0,y1,cc[0]),y2,cc[1])+yoff)
  resizeTo(lerp(600,1450,cc[2]),lerp(500,810,cc[2]))
}

// https://github.com/ojack/hydra/blob/3dcbf85c22b9f30c45b29ac63066e4bbb00cf225/hydra-server/app/src/editor.js
const flashCode = function(start, end) {
  if (!start) start = { line: cm.firstLine(), ch: 0 };
  if (!end) end = { line: cm.lastLine() + 1, ch: 0 };
  var marker = cm.markText(start, end, { className: "styled-background" });
  setTimeout(() => marker.clear(), 300);
};

const getLine = function() {
  var c = cm.getCursor();
  var s = cm.getLine(c.line);
  flashCode({ line: c.line, ch: 0 }, { line: c.line + 1, ch: 0 });
  return s;
};

const getCurrentBlock = function() {
  // thanks to graham wakefield + gibber
  var editor = cm;
  var pos = editor.getCursor();
  var startline = pos.line;
  var endline = pos.line;
  while (startline > 0 && cm.getLine(startline) !== "") {
    startline--;
  }
  while (endline < editor.lineCount() && cm.getLine(endline) !== "") {
    endline++;
  }
  var pos1 = {
    line: startline,
    ch: 0
  };
  var pos2 = {
    line: endline,
    ch: 0
  };
  var str = editor.getRange(pos1, pos2);

  flashCode(pos1, pos2);

  return str;
};

var cc = Array(128).fill(0.5);

{
  if (noButton == "true") {
    // child window
    console.log(noButton);
    document.querySelector("#openWindow").remove();
    document.querySelector("#closeAll").remove();
    // setResolution(1280, 720);
    // resizeTo(600, 500);
  }
  
  {
    // main window
    // register WebMIDI
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

    function onMIDISuccess(midiAccess) {
      console.log(midiAccess);
      var inputs = midiAccess.inputs;
      var outputs = midiAccess.outputs;
      for (var input of midiAccess.inputs.values()) {
        input.onmidimessage = getMIDIMessage;
      }
    }

    function onMIDIFailure() {
      console.log("Could not access your MIDI devices.");
    }

    //create an array to hold our cc values and init to a normalized value

    getMIDIMessage = function(midiMessage) {
      var arr = midiMessage.data;
      var index = arr[1];
      //console.log('Midi received on cc#' + index + ' value:' + arr[2])    // uncomment to monitor incoming Midi
      var val = (arr[2] + 1) / 128.0; // normalize CC values to 0.0 - 1.0
      cc[index] = val;
    };
  }
}

//http://hydra-book.naotohieda.com/#/glsl?id=custom-glsl
setFunction({
  name: "chroma",
  type: "color",
  inputs: [],
  glsl: `
   float maxrb = max( _c0.r, _c0.b );
   float k = clamp( (_c0.g-maxrb)*5.0, 0.0, 1.0 );
   float dg = _c0.g; 
   _c0.g = min( _c0.g, maxrb*0.8 ); 
   _c0 += vec4(dg - _c0.g);
   return vec4(_c0.rgb, 1.0 - k);
`
});

{
  // init
  const code = cm.getValue();
  hydra.eval(code);
}

var w = [];
function openWindow() {
  const url_string = window.location.href;

  const ww = window.open(
    url_string + `?noButton=true&i=${w.length}`,
    "",
    "menubar=no,location=no,resizable=yes,scrollbars=no,status=no"
  );

  ww.moveTo(w.length * 50 + 100, 0);
  w.push(ww);
}

function closeAll() {
  for (let i = w.length - 1; i >= 0; i--) {
    if (w[i].closed == false) {
      w[i].close();
    }
  }
}

window.onkeydown = e => {
  for (let i = w.length - 1; i >= 0; i--) {
    if (w[i].closed) {
      w.splice(i, 1);
    }
  }
  if (cm.hasFocus()) {
    if (e.keyCode === 13) {
      e.preventDefault();
      if (e.ctrlKey === true && e.shiftKey === true) {
        // ctrl - shift - enter: evalAll
        const code = cm.getValue();
        flashCode();
        for (let i = 0; i < w.length; i++) {
          w[i].eval(`i=this.i=${i};${code}`);
          w[i].cm.setValue(`i=${i};${code}`);
        }
        // hydra.eval(code);
      } else if (e.ctrlKey === true && e.shiftKey === false) {
        // ctrl - enter: evalLine
        const code = getLine();
        for (let i = 0; i < w.length; i++) {
          w[i].eval(`i=${i};${code}`);
          w[i].cm.setValue(`i=${i};${code}`);
        }
      } else if (e.altKey === true) {
        // alt - enter: evalBlock
        const code = getCurrentBlock();
        for (let i = 0; i < w.length; i++) {
          w[i].eval(`i=${i};${code}`);
          w[i].cm.setValue(`i=${i};${code}`);
        }
      }
    }
  }
};
