var lastCode = `// ctrl+shift+h to hide code for 3 sec
p("DOM PARTY!!!").center().shadow().font(["serif", "sans-serif"]).color(1,[0,1],()=>time%1).size(100).rotate(0,.1).out(3)
p("<b>DOM PARTY</b> is an experiment to live code with DOM elements inspired by Hydra video synth").bg(1,1,1,0.3).size(20).scrollY(0,0.1).scrollX(()=>Math.sin(time)*0.5).out(2)
iframe("time.is/just").shadow().rotate(0,0.5).scale(0.4).scroll([0.3,-0.3,0.3,-0.3],[0.3,0.3,-0.3,-0.3]).out(1)
canvas().out(0)

// hydra
osc(30,0.2,1.5).color(1,1,1,0.7).out()
`;
{
  const url = new URL(document.location.href);
  const c = url.searchParams.get("code");
  if (c !== null)
    lastCode = decodeURIComponent(atob(c));
}

const domParty = new DomParty({ parent: document.getElementById("party-venue") });

const windowId = Math.floor(Math.random() * 65536 * 65536).toString(16);

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
cm.setValue(lastCode);

eval(cm.getValue());

const startTime = new Date();

// https://github.com/ojack/hydra/blob/3dcbf85c22b9f30c45b29ac63066e4bbb00cf225/hydra-server/app/src/editor.js
const flashCode = function (start, end) {
  if (!start) start = { line: cm.firstLine(), ch: 0 };
  if (!end) end = { line: cm.lastLine() + 1, ch: 0 };
  var marker = cm.markText(start, end, { className: "styled-background" });
  setTimeout(() => marker.clear(), 300);
};

const getLine = function () {
  var c = cm.getCursor();
  var s = cm.getLine(c.line);
  flashCode({ line: c.line, ch: 0 }, { line: c.line + 1, ch: 0 });
  return s;
};

const getCurrentBlock = function () {
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
    if (e.keyCode === 13) {
      e.preventDefault();
      if (e.ctrlKey === true && e.shiftKey === true) {
        // ctrl - shift - enter: evalAll
        const code = cm.getValue();
        flashCode();
        try {
          eval(code);
        } catch (e) {
          console.log(e);
        }

        const enc = btoa(encodeURIComponent(code));
        console.log(enc);
        window.history.replaceState(
          {},
          "DOM PARTY!!!",
          document.location.search.split("?")[0] + "?code=" + enc
        );
      } else if (e.ctrlKey === true && e.shiftKey === false) {
        // ctrl - enter: evalLine
        const code = getLine();
        try {
          eval(code);
        } catch (e) {
          console.log(e);
        }
      } else if (e.altKey === true) {
        // alt - enter: evalBlock
        const code = getCurrentBlock();
        try {
          eval(code);
        } catch (e) {
          console.log(e);
        }
      }
    }
  }
  if (e.ctrlKey === true && e.shiftKey === true) {
    if (e.key == "H") {
      e.preventDefault();
      toggleCode();
      setTimeout(toggleCode, 3000);
    }
  }
};

function toggleCode() {
  const editor = document.getElementById("editors");
  if (editor.style.visibility == "hidden") {
    editor.style.visibility = "inherit";
  } else {
    editor.style.visibility = "hidden";
  }
}
