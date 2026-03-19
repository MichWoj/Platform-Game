// Mario object with direction tracking
this.mario = {
  x: 0,
  y: 0,
  size: 0,
  speed: 5,
  velocityY: 0,
  isJumping: false,
  jumpPower: 15,
  superJumpPower: 30,
  gravity: 0.8,
  groundY: 0,
  facingRight: true // Track which direction Mario is facing
};

// In the update() method - Mario movement with direction tracking
update() {
  // Update Mario movement
  if (this.keys.left && this.mario) {
    this.mario.x -= this.mario.speed;
    this.mario.facingRight = false; // Mario faces left when moving left
  }
  if (this.keys.right && this.mario) {
    this.mario.x += this.mario.speed;
    this.mario.facingRight = true; // Mario faces right when moving right
  }
  
  // Handle screen wrapping (mirror edge)
  if (this.mario) {
    // If Mario goes off the left edge, wrap to right side
    if (this.mario.x + this.mario.size < 0) {
      this.mario.x = this.canvas.width;
    }
    // If Mario goes off the right edge, wrap to left side
    else if (this.mario.x > this.canvas.width) {
      this.mario.x = -this.mario.size;
    }
  }
  
  // ... rest of update logic
}

// In the render() method - Mario sprite flipping based on direction
render() {
  // ... platform and coin rendering code ...
  
  // Display Mario if loaded - with direction-based sprite flipping
  if (this.marioImage && this.marioImage.complete && this.marioImage.naturalWidth > 0 && this.mario) {
    // Ensure Mario position is initialized
    if (this.mario.size === 0) {
      this.initializeMarioPosition();
    }
    
    // Save the current canvas state
    this.ctx.save();
    
    // If Mario is facing left, flip the sprite horizontally
    if (!this.mario.facingRight) {
      // Move to Mario's center, flip horizontally, then move back
      this.ctx.translate(this.mario.x + this.mario.size / 2, 0);
      this.ctx.scale(-1, 1);
      this.ctx.translate(-(this.mario.x + this.mario.size / 2), 0);
    }
    
    this.ctx.drawImage(
      this.marioImage,
      this.mario.x,
      this.mario.y,
      this.mario.size,
      this.mario.size
    );
    
    // Restore the canvas state
    this.ctx.restore();
  }
}