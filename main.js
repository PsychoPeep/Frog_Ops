import { startingMenu } from "./otherScreens/startingMenu.js";
import { cardio } from "./gameModes/cardio.js";
import { agility } from "./gameModes/agility.js";
import { strength } from "./gameModes/strength.js";
import { gems } from "./otherScreens/gems.js";
import { portrait } from "./otherScreens/portrait.js";
import { restart } from "./otherScreens/restart.js";

export const canvas = document.querySelector("canvas");
export const ctx = canvas.getContext("2d");

export let H, W;

/* Flags to disable or able 'pages' */

export const ActiveInits = {
  isStartingMenuActive: true,
  isGemsActive: false,
  isCardioActive: false,
  isAgilityActive: false,
  isStrengthActive: false,
  isRestartActive: false,
};

/* export function inverseVariable() {
  isStartingMenuActive = !isStartingMenuActive;
} */

/* Scale factor, things are written as for 320px wide
   screen and they have times scale factor for every size */

let baseWidth = 320;
export let scaleFactor = window.innerWidth / baseWidth;

/* Ensures the canvas is always
   with the correct Ratio of 16/9 */

function setCanvasSize() {
  if (currentMode.mode === 5) {
    // In portrait mode, occupy the full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    // For other modes, maintain a 16:9 aspect ratio
    const aspectRatioWidth = 16;
    const aspectRatioHeight = 9;

    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    if (windowHeight < windowWidth * (aspectRatioHeight / aspectRatioWidth)) {
      canvas.height = windowHeight;
      canvas.width = canvas.height * (aspectRatioWidth / aspectRatioHeight);
    } else {
      canvas.width = windowWidth;
      canvas.height = canvas.width * (aspectRatioHeight / aspectRatioWidth);
    }
  }

  H = canvas.height;
  W = canvas.width;

  // Scale factor update might be necessary if you rely on it elsewhere
  scaleFactor = W / baseWidth;

  render();
}

/* Delays the execution of a function until after a period of
   inactivity, reduces unnecessary function calls,
   improves performance, and enhances user experience */

function debounce(func, timeout = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

/* Checks if it is in portrait mode so it gives
   an alert to rotate into landscape mode*/

let storedMode; // store mode before changing

function checkOrientation() {
  if (
    window.innerWidth < window.innerHeight &&
    currentMode.mode !== Modes.PORTRAIT
  ) {
    storedMode = currentMode.mode; // Store current mode only when not already in portrait mode

    currentMode.mode = 5;
  } else if (
    window.innerWidth >= window.innerHeight &&
    currentMode.mode === 5
  ) {
    currentMode.mode = storedMode !== undefined ? storedMode : 0; // Return to the previous mode or default if not set
  }
}

export const Modes = {
  STARTING_MENU: 0,
  CARDIO: 1,
  AGILITY: 2,
  STRENGTH: 3,
  GEMS: 4,
  PORTRAIT: 5,
  RESTART: 6,
};

export let currentMode = {
  mode: Modes.STARTING_MENU, // Default
  modes: [],
  run: function () {
    this.modes[this.mode]();
  },
};

// Dynamically set the mode functions
function setModeFunctions() {
  currentMode.modes = [
    startingMenu.init,
    cardio.init,
    agility.init,
    strength.init,
    gems.init,
    portrait.init,
    restart.init,
  ];
}

window.onload = function () {
  setModeFunctions();
  setCanvasSize();
  checkOrientation();
  render();
};

function render() {
  window.requestAnimationFrame(render);
  currentMode.run();
}

const debouncedResize = debounce(() => {
  scaleFactor = window.innerWidth / baseWidth;
  checkOrientation();
  setCanvasSize();
  currentMode.run();
}, 200);

window.addEventListener("resize", debouncedResize);
