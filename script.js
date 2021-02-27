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
  // theme: "tomorrow-night-eighties",
  value: "a",
  mode: { name: "javascript", globalVars: true },
  lineWrapping: true,
  styleSelectedText: true
});
cm.refresh();
cm.setValue(`osc(50,0.1,0).rotate(()=>mouse.y/100).modulate(noise(3),()=>mouse.x/window.innerWidth/4).out()`);

var hydra = new Hydra({
  canvas,
  detectAudio: false,
  enableStreamCapture: false,
});
{
  const code = cm.getValue();
  eval(code);
}

window.onkeydown = e => {
  //  console.log(e)
  if (e.ctrlKey === true) {
    // ctrl - enter: evalAll
    if (e.keyCode === 13) {
      e.preventDefault();

      if (cm.hasFocus()) {
        const code = cm.getValue();
        hydra.eval(code);
      }
    }
  }
};

