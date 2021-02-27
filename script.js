// hydra

var canvas = document.createElement("CANVAS");
canvas.style.width = "100%";
canvas.style.height = "100%";
document.querySelector("#canvas-container").appendChild(canvas);

var container = document.querySelector("#editor-container");
var el = document.createElement("TEXTAREA");
//document.body.appendChild(container);
container.appendChild(el);

const cm = CodeMirror.fromTextArea(el, {
  theme: "paraiso-dark",
  value: "a",
  mode: { name: "javascript", globalVars: true },
  lineWrapping: true,
  styleSelectedText: true
});
cm.refresh();
cm.setValue(`osc(50,0.1,0).rotate(()=>mouse.y/100).modulate(noise(3),()=>mouse.x/window.innerWidth/4).out()

osc().out()`);

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

const getCurrentBlock = function () { // thanks to graham wakefield + gibber
  var editor = cm
  var pos = editor.getCursor()
  var startline = pos.line
  var endline = pos.line
  while (startline > 0 && getLine(startline) !== '') {
    console.log("up", startline, getLine(startline))
    startline--
  }
  while (endline < editor.lineCount() && getLine(endline) !== '') {
    console.log("down", endline, getLine(endline))
    endline++
  }
  var pos1 = {
    line: startline,
    ch: 0
  }
  var pos2 = {
    line: endline,
    ch: 0
  }
  var str = editor.getRange(pos1, pos2)
  console.log(str)

  flashCode(pos1, pos2)

  return str
}


var hydra = new Hydra({
  canvas,
  detectAudio: false,
  enableStreamCapture: false
});
{
  // init
  const code = cm.getValue();
  // hydra.eval(code);
}

window.onkeydown = e => {
  if (cm.hasFocus()) {
    if (e.keyCode === 13) {
      e.preventDefault();
      if (e.ctrlKey === true && e.shiftKey === true) {
        // ctrl - shift - enter: evalAll
        const code = cm.getValue();
        hydra.eval(code);
      } else if (e.ctrlKey === true && e.shiftKey === false) {
        // ctrl - enter: evalLine
        const code = getLine();
        hydra.eval(code);
      } else if (e.altKey === true) {
        // alt - enter: evalBlock
        const code = getCurrentBlock();
   console.log(code)
        hydra.eval(code);
      }
    }
  }
};
