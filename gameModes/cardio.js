import {
  ctx,
  canvas,
  W,
  H,
  ActiveInits,
  currentMode,
  scaleFactor,
} from "../main.js";
import { overlay, applyCanvasOpacity, drawPlaque } from "../utils.js";
import { Player } from "../classes/Player.js";
import { CollisionBlock } from "../classes/CollisionBlock.js";

export let cardio = (function () {
  ("use strict");

  // for player.update()
  let players = [];

  // for createRandomPlatforms()
  let allPlatforms = [];
  let lastPlatformCreationTime = Date.now();
  const PLATFORM_CREATION_INTERVAL = 1500;

  // for drawPlaque()
  let goBackPlaque = new Image();
  let backPlaqueBounds = {};

  // for drawBgImage()
  let isBgLoaded = false;
  let backgroundImage = null;

  function init() {
    ctx.clearRect(0, 0, W, H);
    // defining player here
    let player = new Player({ x: 0, y: 0 });
    players.push(
      new Player({
        position: {
          x: 24 * scaleFactor - player.width / 2,
          y: 0 + player.height,
        },
        allPlatforms,
      })
    );

    drawBgImage();
    drawPlaque(
      goBackPlaque,
      "../images/gems/plaque_back.svg",
      { x: 0, y: 0 },
      backPlaqueBounds,
      () => {
        backPlaqueBounds.x = backPlaqueBounds.width / 2;
        backPlaqueBounds.y = 0;
      }
    );
    // player
    players[0].update();
    // platforms
    createRandomPlatforms();
    updatePlatforms();
    renderUI();

    canvas.addEventListener("click", handleClick);
  }

  // U.I.
  let movingRectWidth = 45 / 2;
  let directionInc = -0.25;

  function renderUI() {
    ctx.save();
    ctx.fillStyle = "#2A2900";
    const FontSize = 7 * scaleFactor;
    ctx.font = `${FontSize}px RetroGaming`;
    ctx.textAlign = "right";

    //
    const padding = 8 * scaleFactor;
    const rectWidth = 45 * scaleFactor;
    const rectHeight = 6 * scaleFactor;

    // Calculate and draw Score
    const scoreText = "SCORE " + players[0].score;
    const scoreTextWidth = ctx.measureText(scoreText).width;
    ctx.fillText(
      scoreText,
      W - padding * 2,
      padding + rectHeight / 2 + FontSize
    );

    const rectangleXPosition = W - padding * 3 - scoreTextWidth - rectWidth;
    const rectangleyPosition = padding + FontSize / 2 + 1 * scaleFactor;

    // Draw lightColor Rect
    ctx.fillStyle = "#FFF8E0";
    ctx.fillRect(rectangleXPosition, rectangleyPosition, rectWidth, rectHeight);

    // Draw Moving Rectangle
    ctx.fillStyle = "#FFD43E";
    ctx.fillRect(
      rectangleXPosition,
      rectangleyPosition,
      movingRectWidth * scaleFactor,
      rectHeight
    );

    // Draw border of rectangle
    ctx.strokeStyle = "#2A2900";
    ctx.lineWidth = 1 * scaleFactor;
    ctx.strokeRect(
      rectangleXPosition,
      rectangleyPosition,
      rectWidth,
      rectHeight
    );

    // Calculate and draw Rotation
    ctx.fillStyle = "#2A2900";
    const rotationText = "ROT. " + Math.round(players[0].rotation);
    ctx.fillText(
      rotationText,
      W - scoreTextWidth - rectWidth - padding * 3 - padding / 2, // x
      padding + rectHeight / 2 + FontSize // y
    );

    if (players[0].isRotating) {
      movingRectWidth += directionInc;

      // Reverse the change direction at limits
      if (movingRectWidth <= 0 || movingRectWidth >= 45) {
        directionInc *= -1;
      }
    }
    ctx.restore();
  }

  //

  function getRandomBlockX() {
    let block = new CollisionBlock({ x: 0, y: 0 });
    return (
      Math.round(Math.random() * (W - block.width - block.width * 2)) +
      block.width
    );
  }

  function createRandomPlatforms() {
    let block = new CollisionBlock({ x: 0, y: 0 });
    const currentTime = Date.now();
    if (currentTime - lastPlatformCreationTime > PLATFORM_CREATION_INTERVAL) {
      allPlatforms.push(
        new CollisionBlock({
          x: getRandomBlockX(),
          y: 0 - block.height,
        })
      );
      lastPlatformCreationTime = currentTime;
    }
  }

  function updatePlatforms() {
    allPlatforms.forEach((platform, i) => {
      platform.update();

      if (platform.position.y > H) {
        allPlatforms.splice(i, 1);
      }
    });
  }

  function drawBgImage() {
    if (!isBgLoaded) {
      backgroundImage = new Image();
      backgroundImage.src = "../images/cardio/bg.svg";

      backgroundImage.onload = function () {
        ctx.drawImage(backgroundImage, 0, 0, W, H);
        isBgLoaded = true;
      };
    } else {
      ctx.drawImage(backgroundImage, 0, 0, W, H);
    }
  }

  function handleClick(event) {
    let mouseX = event.clientX - canvas.getBoundingClientRect().left;
    let mouseY = event.clientY - canvas.getBoundingClientRect().top;

    handlePlaqueClick(mouseX, mouseY);
  }

  function handlePlaqueClick(mouseX, mouseY) {
    if (!ActiveInits.isCardioActive) {
      return;
    }
    if (
      mouseX >= backPlaqueBounds.x &&
      mouseX <= backPlaqueBounds.x + backPlaqueBounds.width &&
      mouseY >= backPlaqueBounds.y &&
      mouseY <= backPlaqueBounds.y + backPlaqueBounds.height
    ) {
      gsap.to(overlay, {
        opacity: 1,
        duration: 1, // duration of the fade in seconds
        onUpdate: applyCanvasOpacity,
        onComplete: () => {
          currentMode.mode = 0;
          ActiveInits.isStartingMenuActive = true;
          ActiveInits.isCardioActive = false;
          overlay.opacity = 0;
        },
      });
    }
  }

  window.addEventListener("keydown", (e) => {
    // rotate

    if (e.code === "KeyR") {
      players[0].isRotating = !players[0].isRotating;
      if (!players[0].isRotating) {
        players[0].rotation = 0;
        players[0].rotationDirection = -1;
        movingRectWidth = 45 / 2;
      }
    }

    // jump
    if (players[0].isInAir === false) {
      switch (e.code) {
        case "Digit1":
        case "Numpad1":
          players[0].jump(-3);
          break;
        case "Digit2":
        case "Numpad2":
          players[0].jump(-5);
          break;
        case "Digit3":
        case "Numpad3":
          players[0].jump(-6);
          break;
        case "Digit4":
        case "Numpad4":
          players[0].jump(-7);
          break;
        case "Digit5":
        case "Numpad5":
          players[0].jump(-9);
          break;
        case "Digit6":
        case "Numpad6":
          players[0].jump(-10);
          break;
        case "Digit7":
        case "Numpad7":
          players[0].jump(-11);
          break;
        case "Digit8":
        case "Numpad8":
          players[0].jump(-12);
          break;
        case "Digit9":
        case "Numpad9":
          players[0].jump(-13);
          break;
        case "Digit0":
        case "Numpad0":
          players[0].jump(-14);
          break;
      }
    }
  });

  return {
    init: init,
  };
})();
