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

const getLine = function () {
  var c = cm.getCursor()
  var s = cm.getLine(c.line)
//  this.cm.markText({line: c.line, ch:0}, {line: c.line+1, ch:0}, {className: 'styled-background'})
  this.flashCode({line: c.line, ch:0}, {line: c.line+1, ch:0})
  return s
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
  //  console.log(e)
  if (cm.hasFocus()) {
    if (e.ctrlKey === true) {
      if (e.keyCode === 13) {
        e.preventDefault();

        // ctrl - shift - enter: evalAll
        if (e.shiftKey === true) {
          const code = cm.getValue();
          console.log(code)
          hydra.eval(code);
        } else {
          // ctrl - enter: evalLine
          const code = cm.getLine();
          console.log(code)
          hydra.eval(code);
        }
      }
    }
  }
};
