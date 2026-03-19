// Game Frame Setup
class GameFrame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.isRunning = false;
    this.isPaused = false;
    this.score = 0;
    this.level = 1;
    this.animationId = null;

    // Assets
    this.platformImage = null;
    this.coinImage = null;
    this.marioImage = null;
    this.bombImage = null;

    // Game Objects
    this.platforms = [];
    this.coins = [];
    this.bomb = null;

    this.mario = {
      x: 0,
      y: 0,
      size: 0,
      speed: 4,
      velocityY: 0,
      isJumping: false,
      jumpPower: 12,
      superJumpPower: 20,
      gravity: 0.5,
      groundY: 0,
      facingRight: true
    };

    this.keys = { left: false, right: false, up: false };

    // Initialization
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initializeControls();
    
    // Load Images
    this.loadAssets();

    // Initial State
    this.generateLevel();
    this.updateUI();
  }

  loadAssets() {
    this.platformImage = new Image();
    this.platformImage.src = 'assets/platform_1-fotor-bg-remover-202507112236.png';
    this.platformImage.onload = () => this.render();

    this.coinImage = new Image();
    this.coinImage.src = 'assets/coin.png';
    this.coinImage.onload = () => this.render();

    this.marioImage = new Image();
    this.marioImage.src = 'assets/mario.png';
    this.marioImage.onload = () => {
      this.initializeMarioPosition();
      this.render();
    };

    this.bombImage = new Image();
    // Corrected to match your uploaded file name
    this.bombImage.src = 'assets/bomb-removebg-preview.png';
    this.bombImage.onload = () => this.render();
  }

  resize() {
    this.canvas.width = window.innerWidth * 0.9;
    this.canvas.height = window.innerHeight * 0.7;
    this.initializeMarioPosition();
    this.generateLevel();
    this.render();
  }

  generateLevel() {
    this.generateRandomPlatforms();
    this.generateRandomCoins();
    this.generateRandomBomb();
  }

  generateRandomBomb() {
    const bombSize = this.canvas.width * 0.06;
    // Condition: Random position from 0 to 50% height of canvas
    const maxY = this.canvas.height * 0.50;
    this.bomb = {
      x: Math.random() * (this.canvas.width - bombSize),
      y: Math.random() * maxY,
      size: bombSize
    };
  }

  generateRandomPlatforms() {
    this.platforms = [];
    const platformWidth = this.canvas.width * 0.15;
    const platformHeight = this.canvas.height * 0.05;
    const areas = [
      { min: 0.2, max: 0.3 },
      { min: 0.4, max: 0.5 },
      { min: 0.6, max: 0.7 },
      { min: 0.8, max: 0.85 }
    ];

    areas.forEach(area => {
      this.platforms.push({
        x: Math.random() * (this.canvas.width - platformWidth),
        y: this.canvas.height * (area.min + Math.random() * (area.max - area.min)),
        width: platformWidth,
        height: platformHeight
      });
    });
  }

  generateRandomCoins() {
    this.coins = [];
    const coinSize = this.canvas.width * 0.04;
    this.platforms.forEach(p => {
      this.coins.push({
        x: p.x + (p.width / 2) - (coinSize / 2),
        y: p.y - coinSize - 5,
        size: coinSize,
        collected: false
      });
    });
  }

  initializeMarioPosition() {
    this.mario.size = this.canvas.width * 0.08;
    const groundH = this.canvas.height * 0.1;
    this.mario.x = (this.canvas.width / 2) - (this.mario.size / 2);
    this.mario.groundY = this.canvas.height - groundH - this.mario.size;
    this.mario.y = this.mario.groundY;
    this.mario.velocityY = 0;
    this.mario.isJumping = false;
  }

  update() {
    if (this.keys.left) { this.mario.x -= this.mario.speed; this.mario.facingRight = false; }
    if (this.keys.right) { this.mario.x += this.mario.speed; this.mario.facingRight = true; }
    
    // Jump
    if (this.keys.up && !this.mario.isJumping) {
      this.mario.isJumping = true;
      this.mario.velocityY = -this.mario.jumpPower;
    }

    // Gravity
    this.mario.y += this.mario.velocityY;
    this.mario.velocityY += this.mario.gravity;

    // Ground Collision
    if (this.mario.y >= this.mario.groundY) {
      this.mario.y = this.mario.groundY;
      this.mario.velocityY = 0;
      this.mario.isJumping = false;
    }

    // Platform Collision
    this.platforms.forEach(p => {
      if (this.mario.velocityY > 0 && 
          this.mario.x + this.mario.size > p.x && 
          this.mario.x < p.x + p.width &&
          this.mario.y + this.mario.size > p.y && 
          this.mario.y + this.mario.size < p.y + 15) {
        this.mario.y = p.y - this.mario.size;
        this.mario.velocityY = 0;
        this.mario.isJumping = false;
      }
    });

    // Coin Collection
    this.coins.forEach(c => {
      if (!c.collected && 
          this.mario.x < c.x + c.size && this.mario.x + this.mario.size > c.x &&
          this.mario.y < c.y + c.size && this.mario.y + this.mario.size > c.y) {
        c.collected = true;
        this.score++;
        this.updateUI();
        if (this.coins.every(coin => coin.collected)) this.endRound();
      }
    });

    // Bomb Collision (Game Over)
    const b = this.bomb;
    if (this.mario.x < b.x + b.size && this.mario.x + this.mario.size > b.x &&
        this.mario.y < b.y + b.size && this.mario.y + this.mario.size > b.y) {
      this.gameOver();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Ground
    if (this.platformImage) {
      const h = this.canvas.height * 0.1;
      this.ctx.drawImage(this.platformImage, 0, this.canvas.height - h, this.canvas.width, h);
      this.platforms.forEach(p => this.ctx.drawImage(this.platformImage, p.x, p.y, p.width, p.height));
    }

    // Coins
    if (this.coinImage) {
      this.coins.forEach(c => {
        if (!c.collected) this.ctx.drawImage(this.coinImage, c.x, c.y, c.size, c.size);
      });
    }

    // Bomb
    if (this.bombImage && this.bomb) {
      this.ctx.drawImage(this.bombImage, this.bomb.x, this.bomb.y, this.bomb.size, this.bomb.size);
    }

    // Mario
    if (this.marioImage) {
      this.ctx.save();
      if (!this.mario.facingRight) {
        this.ctx.translate(this.mario.x + this.mario.size/2, 0);
        this.ctx.scale(-1, 1);
        this.ctx.translate(-(this.mario.x + this.mario.size/2), 0);
      }
      this.ctx.drawImage(this.marioImage, this.mario.x, this.mario.y, this.mario.size, this.mario.size);
      this.ctx.restore();
    }
  }

  gameOver() {
    this.isRunning = false;
    alert("BOOM! Game Over. Score: " + this.score);
    this.reset();
  }

  endRound() {
    this.isPaused = true;
    const popup = document.createElement('div');
    popup.style = "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:20px; border:2px solid black; text-align:center; z-index:1000;";
    popup.innerHTML = `<h3>Round ${this.level} Complete!</h3><p>Score: ${this.score}</p><button id="nextBtn">Next Round</button>`;
    document.body.appendChild(popup);
    document.getElementById('nextBtn').onclick = () => {
      document.body.removeChild(popup);
      this.level++;
      this.generateLevel();
      this.initializeMarioPosition();
      this.isPaused = false;
      this.updateUI();
      this.gameLoop();
    };
  }

  gameLoop() {
    if (!this.isRunning || this.isPaused) return;
    this.update();
    this.render();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  start() { if (!this.isRunning) { this.isRunning = true; this.gameLoop(); this.updateUI(); } }
  
  reset() {
    this.isRunning = false;
    this.score = 0;
    this.level = 1;
    cancelAnimationFrame(this.animationId);
    this.initializeMarioPosition();
    this.generateLevel();
    this.render();
    this.updateUI();
  }

  updateUI() {
    document.getElementById('score').textContent = this.score;
    const lv = document.getElementById('level');
    if (lv) lv.textContent = this.level;
    document.getElementById('status').textContent = this.isRunning ? "Running" : "Ready";
  }

  initializeControls() {
    document.getElementById('startBtn').onclick = () => this.start();
    document.getElementById('resetBtn').onclick = () => this.reset();
    document.addEventListener('keydown', (e) => {
      if (e.key === "ArrowLeft") this.keys.left = true;
      if (e.key === "ArrowRight") this.keys.right = true;
      if (e.key === "ArrowUp") this.keys.up = true;
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === "ArrowLeft") this.keys.left = false;
      if (e.key === "ArrowRight") this.keys.right = false;
      if (e.key === "ArrowUp") this.keys.up = false;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => new GameFrame());