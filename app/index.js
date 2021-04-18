// currently the lib works as an extension of hydra
// with global mode, using vars such as time, speed, mouse

const Div = require("./div.js");

const dommers = [];

const updaters = [];
{
  const updater = () => {
    for (const f of dommers) {
      if (f !== undefined) f.update();
    }
    setTimeout(updater, 5);
  };
  updater();
}

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
