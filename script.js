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
cm.setValue(`solid().out()`);

{
  const url_string = window.location.href;
  const url = new URL(url_string);
  const noButton = url.searchParams.get("noButton");
  if (noButton == "true") {
    console.log(noButton);
    document.querySelector("#openWindow").remove();
    document.querySelector("#closeAll").remove();
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

var hydra = new Hydra({
  canvas,
  detectAudio: false,
  enableStreamCapture: false
});

//http://hydra-book.naotohieda.com/#/glsl?id=custom-glsl
setFunction({
  name: 'chroma',
  type: 'color',
  inputs: [
    ],
  glsl: `
   float maxrb = max( _c0.r, _c0.b );
   float k = clamp( (_c0.g-maxrb)*5.0, 0.0, 1.0 );
   float dg = _c0.g; 
   _c0.g = min( _c0.g, maxrb*0.8 ); 
   _c0 += vec4(dg - _c0.g);
   return vec4(_c0.rgb, 1.0 - k);
`})

{
  // init
  const code = cm.getValue();
  hydra.eval(code);
}

var w = [];
function openWindow() {
  const url_string = window.location.href;

  const ww = window.open(
    url_string + "?noButton=true",
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
          w[i].eval(`i=${i};${code}`);
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
