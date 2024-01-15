import {
  ctx,
  canvas,
  W,
  H,
  ActiveInits,
  currentMode,
  Modes,
  scaleFactor,
} from "../../main.js";
import {
  overlay,
  applyCanvasOpacity,
  drawPlaque,
  isClickWithinBounds,
  collision,
  NewGemAquired,
} from "../../utils/utils.js";
import { Player } from "../../classes/Player.js";
import { CollisionBlock } from "../../classes/CollisionBlock.js";
import { cState } from "./cardio_state.js";
import {
  generalUI,
  touchScreenUI,
  checkClicksTouch,
  initImages,
  drawBgImage,
  drawBackPlaque,
  initBounds,
  handlePlaqueClick,
} from "./cardio_ui.js";

export const cardio = (function () {
  ("use strict");

  /**
   * Initializes the game. Sets up the initial game state,
   * registers click event handlers, and starts the game loop.
   */
  function init() {
    if (!cState.isGameReseted) {
      initImages();
      initBounds();
      resetGame();
      canvas.addEventListener("click", handleClick);
      cState.isGameReseted = true;
    }
    updateGame();
  }

  /**
   * Main game loop. Called repeatedly to update the game state.
   * This includes drawing the background, player, platforms, birds,
   * and handling UI updates.
   */
  function updateGame() {
    ctx.clearRect(0, 0, W, H);
    drawBgImage();
    drawBackPlaque();
    // player
    cState.player.allPlayers[0]?.update();
    // platform
    createRandomPlatformsAndGem();
    updatePlatforms();
    // birds
    if (cState.player.allPlayers[0].score >= 15) {
      createRandomBirds();
      updateBirds();
    }
    // gem
    if (cState.gem.obj) cState.gem.obj.update();
    checkGemCollision();

    // U.I.
    generalUI();
    touchScreenUI();
  }

  /**
   * Resets the game to its initial state. Clears players, platforms, birds, gems,
   * and resets UI elements.
   */
  function resetGame() {
    cState.player.allPlayers = [];
    cState.platform.allPlatforms = [];
    cState.bird.allBirds = [];
    initPlayer();
    cState.platform.lastPlatformCreationTime = Date.now();
    cState.bird.lastBirdCreationTime = Date.now();
    cState.ui.movingRectWidth = 45 / 2;
    cState.ui.directionInc = -0.25;
    cState.gem.obj = null;
    cState.stats.gameOver = {}
    cState.stats.gameWon = {}
  }

  /**
   * Initializes the player object and adds it to the game state.
   */
  function initPlayer() {
    if (cState.player.allPlayers.length === 0) {
      const player = new Player({
        position: {
          x: 9 * scaleFactor,
          y: 0,
        },
        allPlatforms: cState.platform.allPlatforms,
        allBirds: cState.bird.allBirds,
        imageSrc: "../images/cardio/player.svg",
        frameRate: 7,
        frameBuffer: 24,
      });
      cState.player.allPlayers.push(player);
    }
  }

  /**
   * Generates a random X coordinate for a new platform block.
   * @return {number} The X coordinate.
   */
  function getRandomBlockX() {
    let block = new CollisionBlock({
      position: { x: 0, y: 0 },
      imageSrc: "../images/cardio/cloud.svg",
    });
    let xRange =
      Math.random() * (W - block.width - block.width * 2) + block.width;
    return Math.round(xRange);
  }

  /**
   * Creates new platforms and a gem at random positions at specified intervals.
   */
  function createRandomPlatformsAndGem() {
    let block = new CollisionBlock({
      position: { x: 0, y: 0 },
      imageSrc: "../images/cardio/cloud.svg",
    });
    const currentTime = Date.now();

    if (
      currentTime - cState.platform.lastPlatformCreationTime >
        cState.platform.PLATFORM_CREATION_INTERVAL &&
      !cState.platform.stopBuilding
    ) {
      let newX;

      if (cState.platform.allPlatforms.length > 0) {
        let lastPlatform =
          cState.platform.allPlatforms[cState.platform.allPlatforms.length - 1];
        let minRange = lastPlatform.position.x - block.width;
        let maxRange = lastPlatform.position.x + block.width;

        do {
          newX = getRandomBlockX();
        } while (newX >= minRange && newX <= maxRange);
      } else {
        newX = getRandomBlockX(); // For the first platform
      }

      cState.platform.allPlatforms.push(
        new CollisionBlock(
          {
            position: { x: newX, y: 0 - block.height },
            imageSrc: "../images/cardio/cloud.svg",
          },
          "platform"
        )
      );

      //
      if (cState.player.allPlayers[0].score === 5 && !cState.gem.obj) {
        // Position for the gem
        const gemX = newX;
        const gemY = 0 - block.height * 2 - 2 * scaleFactor;
        cState.gem.obj = new CollisionBlock(
          {
            position: { x: gemX, y: gemY },
            imageSrc: "../images/cardio/collectible_gem.svg",
          },
          "gem"
        );
      }
      if (cState.player.allPlayers[0].score === 5) {
        cState.platform.stopBuilding = true;
      }

      //
      cState.platform.lastPlatformCreationTime = currentTime;
    }
  }

  function updatePlatforms() {
    cState.platform.allPlatforms.forEach((platform, i) => {
      platform.update();

      if (platform.position.y > H) {
        cState.platform.allPlatforms.splice(i, 1);
      }
    });
  }

  function checkGemCollision() {
    if (cState.gem.obj && cState.player.allPlayers[0]) {
      if (
        cState.gem.obj &&
        collision({
          object1: cState.player.allPlayers[0],
          object2: cState.gem.obj,
        })
      ) {
        cState.gem.obj = null;
        NewGemAquired("cardioGem");
        gsap.to(overlay, {
          opacity: 1,
          duration: 0.5,
          onUpdate: applyCanvasOpacity,
          onComplete: () => {
            currentMode.mode = Modes.SUCCESS;
            ActiveInits.isCardioActive = false;
            ActiveInits.isSuccessActive = true;
            overlay.opacity = 0;
            // send stats
            cState.stats.gameWon = {
              gameMode: "cardioGem",
              score: 25,
            };
            cState.isGameReseted = false;
          },
        });
      }
    }
  }

  // BIRDS
  function getRandomBirdY() {
    let bird = new CollisionBlock({
      position: { x: 0, y: 0 },
      imageSrc: "../images/cardio/bird.svg",
    });
    let yRange =
      Math.random() * (H - bird.height - bird.height * 2) + bird.height;
    return Math.round(yRange);
  }

  function createRandomBirds() {
    const currentTime = Date.now();

    if (
      currentTime - cState.bird.lastBirdCreationTime >
      cState.bird.BIRD_CREATION_INTERVAL
    ) {
      let newY;

      if (cState.bird.allBirds.length > 0) {
        let lastBird = cState.bird.allBirds[cState.bird.allBirds.length - 1];
        let minRange = lastBird.position.y - lastBird.height;
        let maxRange = lastBird.position.y + lastBird.height;

        do {
          newY = getRandomBirdY();
        } while (newY >= minRange && newY <= maxRange);
      } else {
        newY = getRandomBirdY(); // For the first bird
      }

      cState.bird.allBirds.push(
        new CollisionBlock(
          {
            position: { x: W, y: newY },
            imageSrc: "../images/cardio/bird.svg",
            frameRate: 6,
            frameBuffer: 32,
          },
          "bird"
        )
      );
      cState.bird.lastBirdCreationTime = currentTime;
    }
  }

  function updateBirds() {
    cState.bird.allBirds.forEach((bird, i) => {
      bird.update();

      if (bird.position.x < 0) {
        cState.bird.allBirds.splice(i, 1);
      }
    });
  }

  //
  //
  //

  function handleClick(event) {
    let mouseX = event.clientX - canvas.getBoundingClientRect().left;
    let mouseY = event.clientY - canvas.getBoundingClientRect().top;

    handlePlaqueClick(mouseX, mouseY);
    checkClicksTouch(mouseX, mouseY, {
      rotateCb: activateRotation,
      oneCb: activateJump(1),
      twoCb: activateJump(2),
      threeCb: activateJump(3),
    });
  }

  function activateRotation() {
    cState.player.allPlayers[0].isRotating =
      !cState.player.allPlayers[0].isRotating;

    // Resets rotation, rotationDirection and rectangle width
    if (!cState.player.allPlayers[0].isRotating) {
      cState.player.allPlayers[0].rotation = 0;
      cState.player.allPlayers[0].rotationDirection = -1;
      cState.ui.movingRectWidth = 45 / 2;
    }
  }

  function activateJump(key) {
    return () => {
      if (cState.player.allPlayers[0]?.isInAir === false) {
        if (key === 1) {
          cState.player.allPlayers[0].jump(-5);
        } else if (key === 2) {
          cState.player.allPlayers[0].jump(-7);
        } else if (key === 3) {
          cState.player.allPlayers[0].jump(-9);
        }
      }
    };
  }

  window.addEventListener("keydown", (e) => {
    // rotate

    if (
      e.code === "KeyR" &&
      ActiveInits.isCardioActive &&
      cState.player.allPlayers[0]?.isInAir === false
    ) {
      activateRotation();
    }

    // jump
    if (cState.player.allPlayers[0]?.isInAir === false) {
      switch (e.code) {
        case "Digit1":
        case "Numpad1":
          cState.player.allPlayers[0].jump(-5);
          break;
        case "Digit2":
        case "Numpad2":
          cState.player.allPlayers[0].jump(-7);
          break;
        case "Digit3":
        case "Numpad3":
          cState.player.allPlayers[0].jump(-9);
          break;
      }
    }
  });

  return {
    init: init,
  };
})();
