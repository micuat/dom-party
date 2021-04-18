var mouseX = 0,
  mouseY = 0,
  time = 0,
  speed = 1;

document.onmousemove = function (event) {
  var eventDoc, doc, body;

  event = event || window.event; // IE-ism

  // If pageX/Y aren't available and clientX/Y are,
  // calculate pageX/Y - logic taken from jQuery.
  // (This is to support old IE)
  if (event.pageX == null && event.clientX != null) {
    eventDoc = (event.target && event.target.ownerDocument) || document;
    doc = eventDoc.documentElement;
    body = eventDoc.body;

    event.pageX =
      event.clientX +
      ((doc && doc.scrollLeft) || (body && body.scrollLeft) || 0) -
      ((doc && doc.clientLeft) || (body && body.clientLeft) || 0);
    event.pageY =
      event.clientY +
      ((doc && doc.scrollTop) || (body && body.scrollTop) || 0) -
      ((doc && doc.clientTop) || (body && body.clientTop) || 0);
  }

  mouseX = Math.max(0, Math.min(100000, event.pageX));
  mouseY = Math.max(0, Math.min(100000, event.pageY));
  // Use event.pageX / event.pageY here
};

const Div = require("./div.js");

const dommers = [];

const updaters = [];
{
  const startTime = new Date() / 1000;
  const updater = () => {
    time = new Date() / 1000 - startTime;
    for (const f of dommers) {
      if (f !== undefined) f.update();
    }
    setTimeout(updater, 5);
  };
  updater();
}

Array.prototype.extract = function (time) {
  return this[Math.floor(((time * speed) / 2) % this.length)];
};

function runCode(code) {
  updaters.length = 0;
  eval(code);
}

window.empty = () => new Div.Dommer(dommers);
window.iframe = (url) => new Div.Iframer(dommers, url);
// window.youtube = (url) => new Div.Youtuber(dommers, url);
window.p = (text) => new Div.Per(dommers, text);
window.loadText = (url) => new Div.LoadText(dommers, url);
window.canvas = () => new Div.Canvaser(dommers);
window.img = (url) => new Div.Imager(dommers, url);
