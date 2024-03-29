// Imports
import { appState as app } from "../app_state.js";
import { ctx, scaleFactor } from "../main.js";
import { colors, texts } from "../utils/style.js";
import { overlay } from "../utils/utils.js";

// Module
export const loading = (function () {
  ("use strict");

  // Initializes the gems module
  function init() {
    ctx.clearRect(0, 0, app.canvas.W, app.canvas.H);
    ctx.fillStyle = colors.bg_light;
    ctx.fillRect(0, 0, app.canvas.W, app.canvas.H);
    writeLogoName();
    //loadingAnimation();
  }

  function writeLogoName() {
    ctx.save();
    texts.logoSplashStyle.applyStyle(ctx, scaleFactor);
    //
    const textFrog = "Frog";
    const textOps = "Ops";
    const textHeight = texts.logoSplashStyle.fontSize * scaleFactor;
    const padding = 2 * scaleFactor;
    //
    ctx.strokeText(
      textFrog,
      app.canvas.W / 2,
      app.canvas.H / 2 - textHeight / 2 - padding - overlay.y
    );
    ctx.fillText(
      textFrog,
      app.canvas.W / 2,
      app.canvas.H / 2 - textHeight / 2 - padding - overlay.y
    );
    //
    ctx.strokeText(
      textOps,
      app.canvas.W / 2,
      app.canvas.H / 2 + textHeight / 2 + padding - overlay.y
    );
    ctx.fillText(
      textOps,
      app.canvas.W / 2,
      app.canvas.H / 2 + textHeight / 2 + padding - overlay.y
    );
    ctx.restore();
  }

  /* const square = {
    size: 4,
    color: colors.green,
  };

  function loadingAnimation() {
    const xOfsset = [-12 * scaleFactor, 0, 12 * scaleFactor];

    for (let i = 0; i < xOfsset.length; i++) {
      ctx.fillStyle = square.color;
      ctx.fillRect(
        W / 2 + xOfsset[i],
        H / 2 + 24 * scaleFactor,
        square.size * scaleFactor,
        square.size * scaleFactor
      );
    }
  } */

  return {
    init: init,
  };
})();
