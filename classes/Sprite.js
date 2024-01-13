import { ctx, W, H, scaleFactor } from "../main.js";

export class Sprite {
  constructor({ position, imageSrc, frameRate = 1, frameBuffer = 0 }) {
    this.position = position;
    this.image = new Image();
    this.image.onload = () => {
      this.width = (this.image.width * scaleFactor) / this.frameRate;
      this.height = this.image.height * scaleFactor;
    };
    this.image.src = imageSrc;
    this.frameRate = frameRate;
    this.currentFrame = 0;
    this.frameBuffer = frameBuffer;
    this.elapsedFrames = 0;
  }

  drawSprite(x, y) {
    // x, y
    if (!this.image) return;

    const cropBox = {
      position: {
        x: (this.currentFrame * this.image.width) / this.frameRate,
        y: 0,
      },
      width: this.image.width / this.frameRate,
      height: this.image.height,
    };

    ctx.drawImage(
      this.image,
      cropBox.position.x,
      cropBox.position.y,
      cropBox.width,
      cropBox.height,
      x,
      y,
      //this.position.x,
      //this.position.y,
      this.width,
      this.height
    );
  }

  updateFrames() {
    this.elapsedFrames++;

    if (this.elapsedFrames % this.frameBuffer === 0) {
      if (this.currentFrame < this.frameRate - 1) {
        this.currentFrame++;
      } else {
        this.currentFrame = 0;
      }
    }
  }
}
