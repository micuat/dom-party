const windowId = Math.floor(Math.random()*65536*65536).toString(16);
var i = 0;
var noButton = false;
{
  // where are we
  const url_string = window.location.href;
  const url = new URL(url_string);
  noButton = url.searchParams.get("noButton") != null;
  i = url.searchParams.get("i");
  if (i === undefined) i = 0;
  else i = parseInt(i)
}

// Create WebSocket connection.
const socket = new WebSocket('ws://localhost:8080');

// Connection opened
socket.addEventListener('open', function (event) {
    socket.send({type: "browserconnection", windowId});
});

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
});

// p5

var p5;
const s = ( sketch ) => {

  p5 = sketch;
  
  let canvas;
  sketch.setup = () => {
    canvas = sketch.createCanvas(1280,720);
    s0.init({src: sketch.elt})
    
    // init
    const code = cm.getValue();
    hydra.eval(code);

  };
  sketch.hide = () => {
    canvas.hide();
  }
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
cm.setValue((noButton?`s1.initCam(i)
p5.background(["crimson", "aliceblue", "plum"][i%3])
p5.textSize(200);p5.text(i+1, 100, 250);p5.hide()
src(s0).layer(
  src(s1).hue(-.1).chroma()
  ).out()
s4.initVideo("${["https://cdn.glitch.com/bc1a4c77-fc26-4223-b92e-c4a103cabc10%2FsmokingRoom.mp4?v=1615387265441",
"https://cdn.glitch.com/bc1a4c77-fc26-4223-b92e-c4a103cabc10%2Fkitchen_Trim.mp4?v=1615387424399",
"https://cdn.glitch.com/bc1a4c77-fc26-4223-b92e-c4a103cabc10%2Fkitchen_Trim2.mp4?v=1615387425998",
"https://cdn.glitch.com/bc1a4c77-fc26-4223-b92e-c4a103cabc10%2Fkitchen_Trim3.mp4?v=1615388115286"]
[i%4]}")`:`solid().out()

f=0
update=()=>{
  xs[3]=0
  ys[3]=0
  xs[4]=0
  ys[4]=0
  xs[5]=0
  ys[5]=0
  xs[6]=0
  ys[6]=0
  windowStuff()
}`) + 
`
`);

var hydra = new Hydra({
  canvas,
  detectAudio: false,
  enableStreamCapture: false,
  numSources: 8
});

//setResolution(1920,1080)
setResolution(1280,720)

let myp5 = new p5(s);

var lerp = (a,b,p)=>a*(1-p)+b*p

var xoff, yoff, x, y;
var xs = Array(7).fill(0);
var ys = Array(7).fill(0);
var f = 0;
xoff=50;yoff=5
var lastx=[], lasty=[]
var windowStuff = () => {
  x=0;y=0;
  // cc[1]=Math.max(0.01,cc[1])-0.01
  f+=(cc[17]-0.5)*0.2
  let th=f+i*3.14/3
  xs[0]=600*i
  ys[0]=0
  xs[1]=1000
  ys[1]=300*i
  xs[2]=Math.sin(th)*200+300
  ys[2]=Math.cos(th)*200+300
  for(let j=0;j<xs.length;j++) {
    x = lerp(x, xs[j], cc[j])
    y = lerp(y, ys[j], cc[j])
  }
  if(noButton){//} && (x!=lastx[i] || y != lasty[i])){//cc[7] > 0.5) {
    console.log(x + xoff, y+yoff)
    moveTo(x + xoff, y + yoff)
    lastx[i]=x;
    lasty[i]=y;
  }
  if(noButton) {
    resizeTo(lerp(400,1550,cc[16]),lerp(300,910,cc[16]))
  }
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

var cc = Array(128).fill(0);

{
  if (noButton == "true") {
    // child window
    console.log(noButton);
    document.querySelector("#openWindow").remove();
    document.querySelector("#closeAll").remove();
  }
  
  if(typeof navigator.requestMIDIAccess === "function") {
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
      midiUpdated = true;
      var arr = midiMessage.data;
      var index = arr[1];
      //console.log('Midi received on cc#' + index + ' value:' + arr[2])    // uncomment to monitor incoming Midi
      var val = (arr[2]) / 127.0; // normalize CC values to 0.0 - 1.0
      cc[index] = val;
      
      const command = {type: "midi", windowId, index, val}
      socket.send(JSON.stringify(command));
      
    };
    console.log("midi set up")
  }
  else {
    console.log("no midi")
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
  let frameCount = 0;
  let logFps = 10;
  let sendInterval = 10; // sec
  let sendEvery = logFps * sendInterval;
  let frames = [];
  let startedAt = Date.now() / 1000;
  let isChanged = false;
  let lastXY = {x: -1, y: -1}

  setInterval(()=>{
    let x = window.screenX
    let y = window.screenY
    frames.push({x, y});
    if(lastXY.x != x || lastXY.y != y) {
      isChanged = true;
      lastXY = {x, y};
    }
    frameCount++;
    if(frameCount >= sendEvery) {
      let fps = logFps;
      if(isChanged == false) {
        frames = [{x, y}];
        fps = 1 / sendInterval;
      }
      
      const command = {type: "browser", windowId, startedAt, fps, values: frames}
      socket.send(JSON.stringify(command));
      startedAt = Date.now() / 1000;
      frames = [];
      frameCount = 0;
      isChanged = false;
    }
  }, 1000 / logFps);
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
    const command = {type: "hydra", windowId, main: noButton == false, id: i, cursor: cm.getCursor(), code: cm.getValue()};
    if (e.keyCode === 13) {
      e.preventDefault();
      if (e.ctrlKey === true && e.shiftKey === true) {
        // ctrl - shift - enter: evalAll
        const code = cm.getValue();
        flashCode();
        for (let i = 0; i < w.length; i++) {
          w[i].eval(code);
          w[i].cm.setValue(code);
        }
        command.exec = "ctrl-shift-enter";
        // hydra.eval(code);
      } else if (e.ctrlKey === true && e.shiftKey === false) {
        // ctrl - enter: evalLine
        const code = getLine();
        for (let i = 0; i < w.length; i++) {
          w[i].eval(code);
          w[i].cm.setValue(code);
        }
        command.exec = "ctrl-enter";
      } else if (e.altKey === true) {
        // alt - enter: evalBlock
        const code = getCurrentBlock();
        for (let i = 0; i < w.length; i++) {
          w[i].eval(code);
          w[i].cm.setValue(code);
        }
        command.exec = "alt-enter";
      }
    }
    socket.send(JSON.stringify(command));
  }
};
