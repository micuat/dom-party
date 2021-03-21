const windowId = Math.floor(Math.random() * 65536 * 65536).toString(16);

// Create WebSocket connection.
const socket = new WebSocket("ws://localhost:8080");

// Connection opened
socket.addEventListener("open", function(event) {
  socket.send({ type: "browserconnection", windowId });
});

// Listen for messages
socket.addEventListener("message", function(event) {
  console.log("Message from server ", event.data);
});

// hydra

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
cm.setValue(`//sine(440).out()
`);

const startTime = new Date();

const vid = document.querySelector("video");
vid.addEventListener(
  "play",
  function() {
    let frameCount = 0;
    let logFps = 10;
    let sendInterval = 10; // sec
    let sendEvery = logFps * sendInterval;
    let frames = [];
    let startedAt = vid.currentTime;
    let isChanged = false;
    let lastXY = { x: -1, y: -1 };

    setInterval(() => {
      let x = mouseX;
      let y = mouseY;
      frames.push({ x, y });
      if (lastXY.x != x || lastXY.y != y) {
        isChanged = true;
        lastXY = { x, y };
      }
      frameCount++;
      if (frameCount >= sendEvery) {
        let fps = logFps;
        if (isChanged == false) {
          frames = [{ x, y }];
          fps = 1 / sendInterval;
        }

        const command = {
          type: "browsermouse",
          windowId,
          startedAt,
          fps,
          values: frames
        };
        socket.send(JSON.stringify(command));
        startedAt = vid.currentTime;
        frames = [];
        frameCount = 0;
        isChanged = false;
      }
    }, 1000 / logFps);
  },
  true
);

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
    const command = {
      type: "synth",
      windowId,
      cursor: cm.getCursor(),
      code: cm.getValue(),
      t
    };
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
        command.eval = code;
        command.exec = "ctrl-shift-enter";
        // hydra.eval(code);
      } else if (e.ctrlKey === true && e.shiftKey === false) {
        // ctrl - enter: evalLine
        const code = getLine();
        try {
          eval(code);
        } catch (e) {
          console.log(e);
        }
        command.eval = code;
        command.exec = "ctrl-enter";
      } else if (e.altKey === true) {
        // alt - enter: evalBlock
        const code = getCurrentBlock();
        try {
          eval(code);
        } catch (e) {
          console.log(e);
        }
        command.eval = code;
        command.exec = "alt-enter";
      } else if (e.shiftKey === true) {
        // shift - enter: hush
        hushSound();
        command.eval = "hushSound()";
        command.exec = "shift-enter";
      }
    }
    socket.send(JSON.stringify(command));
  }
};

container.onclick = e => {
  const t = vid.currentTime;
  const command = {
    type: "synth",
    windowId,
    clicked: true,
    cursor: cm.getCursor(),
    code: cm.getValue(),
    t
  };
  socket.send(JSON.stringify(command));
};
