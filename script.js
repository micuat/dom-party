const windowId = Math.floor(Math.random()*65536*65536).toString(16);

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
    s0.init({src: canvas.elt})
    
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
canvas.width = 1280;
canvas.height = 720;
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
cm.setValue(`src(s1).out()
`);

var hydra = new Hydra({
  canvas,
  detectAudio: false,
  enableStreamCapture: false,
  numSources: 8
});

const startTime = new Date;

const vid = document.querySelector("video")
vid.crossOrigin = 'anonymous'
vid.autoplay = false//true
vid.loop = false//true
vid.muted = true
s1.init({src: vid})
 // s1.initVideo("https://cdn.glitch.com/87742b90-e6be-4d23-97b2-ba7f62a3f685%2Flev-kln.mp4?v=1616182248443")

let myp5 = new p5(s);

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

window.onkeydown = e => {
  if (cm.hasFocus()) {
    const t = vid.currentTime;
    // const t = new Date - startTime;
    const command = {type: "hydra", windowId, cursor: cm.getCursor(), code: cm.getValue(), t};
    if (e.keyCode === 13) {
      e.preventDefault();
      if (e.ctrlKey === true && e.shiftKey === true) {
        // ctrl - shift - enter: evalAll
        const code = cm.getValue();
        flashCode();
        eval(code);
        command.exec = "ctrl-shift-enter";
        // hydra.eval(code);
      } else if (e.ctrlKey === true && e.shiftKey === false) {
        // ctrl - enter: evalLine
        const code = getLine();
        eval(code);
        command.exec = "ctrl-enter";
      } else if (e.altKey === true) {
        // alt - enter: evalBlock
        const code = getCurrentBlock();
        eval(code);
        command.exec = "alt-enter";
      }
    }
    socket.send(JSON.stringify(command));
  }
};
