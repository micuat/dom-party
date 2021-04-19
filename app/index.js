const Hydra = require("hydra-synth");

const Div = require("./div.js");

class DomParty {
  constructor(args) {
    this.parent;
    if(args !== undefined) {
      this.parent = args.parent;
    }
    this.dommers = [];

    {
      const updater = () => {
        for (const f of this.dommers) {
          if (f !== undefined) f.update();
        }
        setTimeout(updater, 5);
      };
      updater();
    }

    // hydra

    this.hydraCanvas = document.createElement("CANVAS");
    let hydra;

    if (typeof Hydra !== "undefined") {
      this.hydraCanvas.width = window.innerWidth;
      this.hydraCanvas.height = window.innerHeight;
      this.hydraCanvas.style.width = "100%";
      this.hydraCanvas.style.height = "100%";

      hydra = new Hydra({
        canvas: this.hydraCanvas,
        detectAudio: false,
        enableStreamCapture: false
      });
    }

    window.empty = () => new Div.Dommer(this);
    window.iframe = (url) => new Div.Iframer(this, url);
    // window.youtube = (url) => new Div.Youtuber(this, url);
    window.p = (text) => new Div.Per(this, text);
    window.loadText = (url) => new Div.LoadText(this, url);
    window.canvas = () => new Div.Canvaser(this);
    window.img = (url) => new Div.Imager(this, url);
  }
}

module.exports = DomParty;
