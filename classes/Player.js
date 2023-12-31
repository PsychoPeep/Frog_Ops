import {
  ctx,
  W,
  H,
  scaleFactor,
  ActiveInits,
  currentMode,
  Modes,
} from "../main.js";
import { collision } from "../utils.js";
import { cardio } from "../gameModes/cardio.js";
import { overlay, applyCanvasOpacity } from "../utils.js";

let gravity = 0.1;

export class Player {
  constructor({ position, allPlatforms, allBirds, getStats }) {
    this.position = position;
    this.velocity = {
      x: 0,
      y: 1,
    };
    this.height = 30 * scaleFactor;
    this.width = 25 * scaleFactor;

    // rotating
    this.isRotating = false;
    this.rotationDirection = -1;
    this.rotation = 0;

    this.isInAir = true;

    // for collision
    this.allPlatforms = allPlatforms; // platforms
    this.allBirds = allBirds; // birds
    this.getGameOverStats = getStats;

    // for points
    this.score = 0;
    this.hasScored = false;
  }

  draw() {
    ctx.save(); // Save state

    // set pivot point
    ctx.translate(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    );

    // apply rotation
    if (this.isRotating) {
      ctx.rotate((this.rotation * Math.PI) / 180);
    }

    // move on x axis when jumping
    this.position.x += this.velocity.x;

    // Draw the rectangle around the new origin
    ctx.fillStyle = "purple";
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    ctx.restore(); // Restore original state
  }

  update() {
    this.draw();
    if (this.isRotating) {
      this.rotatePlayer();
    }
    this.screenWrapAroundCanvas();
    this.checkForHorizontalPlatformCollisions();
    this.gravityAndHitGround();
    this.checkForBirdCollisions();
    this.checkForVerticalPlatformCollisions();
  }

  //

  rotatePlayer() {
    let step = 0.5;
    if (this.rotation < -45 || this.rotation > 45) {
      this.rotationDirection *= -1;
    }
    this.rotation += step * this.rotationDirection;
  }

  /* Enables an object to reappear on the opposite
  side of the canvas when it moves off one side. */

  screenWrapAroundCanvas() {
    if (this.position.x <= 0) {
      this.position.x = W - this.width;
    } else if (this.position.x >= W - this.width) {
      this.position.x = 0;
    }
  }

  /* Checks for horizontal collisions between the player and each platform.
   - On leftward collision: stops leftward motion, positions player to the right of the platform.
   - On rightward collision: stops rightward motion, positions player to the left of the platform. */

  checkForHorizontalPlatformCollisions() {
    const bounceBack = 1 * scaleFactor;

    for (let i = 0; i < this.allPlatforms.length; i++) {
      const platform = this.allPlatforms[i];

      if (
        collision({
          object1: this,
          object2: platform,
        })
      ) {
        if (this.velocity.x > 0) {
          // hit left
          this.velocity.x = 0;
          this.position.x = platform.position.x - this.width - bounceBack;
          break;
        }
        if (this.velocity.x < 0) {
          // hit right
          this.velocity.x = 0;
          this.position.x = platform.position.x + platform.width + bounceBack;
          break;
        }
      }
    }
  }

  gravityAndHitGround() {
    this.position.y += this.velocity.y;
    if (this.position.y + this.height + this.velocity.y < H - 6 * scaleFactor) {
      this.velocity.y += gravity;
    } else {
      // hit ground
      this.isInAir = false;
      this.velocity.y = 0;
      this.velocity.x = 0;
    }
  }

  /* Checks for vertical collisions between the player and each platform.
   - On top collision: stops downward and horizontal motion, places player on platform & increments score.
   - On bottom collision: stops upward motion, positions player below the platform so he can go back down. */

  checkForVerticalPlatformCollisions() {
    for (let i = 0; i < this.allPlatforms.length; i++) {
      const platform = this.allPlatforms[i];

      if (
        collision({
          object1: this,
          object2: platform,
        })
      ) {
        if (this.velocity.y > 0) {
          // hit top
          this.isInAir = false;
          this.velocity.y = 0;
          this.velocity.x = 0;
          this.position.y =
            platform.position.y - this.height - 0.01 * scaleFactor;
          if (!this.hasScored) {
            // Increment score only if not already landed
            this.score++;
            this.hasScored = true; // Set the flag to true
          }
          break;
        }
        if (this.velocity.y < 0) {
          // hit bottom
          this.velocity.y = 0;
          this.position.y =
            platform.position.y + platform.height + 1 * scaleFactor; // avoid overlapping
          break;
        }
      }
    }
  }

  checkForBirdCollisions() {
    for (let i = 0; i < this.allBirds.length; i++) {
      const bird = this.allBirds[i];

      if (
        collision({
          object1: this,
          object2: bird,
        })
      ) {
        gsap.to(overlay, {
          opacity: 1,
          duration: 0.5,
          onUpdate: applyCanvasOpacity,
          onComplete: () => {
            currentMode.mode = Modes.RESTART;
            ActiveInits.isCardioActive = false;
            ActiveInits.isRestartActive = true;
            overlay.opacity = 0;
          },
        });
        this.getGameOverStats();
      }
    }
  }

  jump(speed) {
    this.hasScored = false; // used for scoring
    this.isRotating = false;
    this.isInAir = true;
    this.velocity.y = speed; /* scaleFactor */
    this.velocity.x = this.rotation / 10; // divide so it moves slower
    this.rotation = 0;
    cardio.setMovingRectWidthToHalf();
  }
}
