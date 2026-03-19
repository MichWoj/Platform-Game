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

    // Mario properties
    this.mario = {
      x: 0,
      y: 0,
      size: 0,
      speed: 4,
      velocityY: 0,
      isJumping: false,
      jumpPower: 12,
      superJumpPower: 22, // The "Double Tap" Reward
      gravity: 0.5,
      groundY: 0,
      facingRight: true
    };

    // Double-Tap/Click Configuration
    this.touchState = {
      lastTapTime: 0,
      doubleTapDelay: 500 // 500ms window for Super Jump
    };

    this.keys = { left: false, right: false };

    // Initialize
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initializeControls();
    this.loadAssets();
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
    const areas = [{min:0.2,max:0.3}, {min:0.4,max:0.5}, {min:0.6,max:0.7}, {min:0.8,max:0.85}];
    areas.forEach(area => {
      this.platforms.push({
        x: Math.random() * (this.canvas.width - platformWidth),
        y: this.canvas.height * (area.min + Math.random() * (area.max - area.min)),
        width: platformWidth, height: platformHeight
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
        size: coinSize, collected: false
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

  // --- CONTROLS LOGIC ---
  initializeControls() {
    // Menu Buttons
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (startBtn) startBtn.onclick = () => this.start();
    if (pauseBtn) pauseBtn.onclick = () => this.togglePause();
    if (resetBtn) resetBtn.onclick = () => this.reset();

    // Movement Buttons (UI)
    const dirs = ['left', 'right', 'up'];
    dirs.forEach(d => {
      const btn = document.getElementById(d + 'Btn');
      if (btn) {
        btn.onmousedown = () => this.handleDirectionPress(d);
        btn.onmouseup = () => this.handleDirectionRelease(d);
        btn.ontouchstart = (e) => { e.preventDefault(); this.handleDirectionPress(d); };
        btn.ontouchend = (e) => { e.preventDefault(); this.handleDirectionRelease(d); };
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Global Canvas Tap
    this.canvas.addEventListener('click', () => {
      if (this.isRunning && !this.isPaused) this.handleTap();
    });
  }

  handleKeyDown(e) {
    if (!this.isRunning || this.isPaused) return;
    if (e.key === "ArrowLeft") this.keys.left = true;
    if (e.key === "ArrowRight") this.keys.right = true;
    if (e.key === "ArrowUp") this.handleTap(); // Use unified jump logic
  }

  handleKeyUp(e) {
    if (e.key === "ArrowLeft") this.keys.left = false;
    if (e.key === "ArrowRight") this.keys.right = false;
  }

  handleDirectionPress(d) {
    if (!this.isRunning || this.isPaused) return;
    if (d === 'left') this.keys.left = true;
    if (d === 'right') this.keys.right = true;
    if (d === 'up') this.handleTap(); // Use unified jump logic
  }

  handleDirectionRelease(d) {
    if (d === 'left') this.keys.left = false;
    if (d === 'right') this.keys.right = false;
  }

  handleTap() {
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - this.touchState.lastTapTime;

    // Double Tap Detection
    if (this.touchState.lastTapTime > 0 && timeSinceLastTap < this.touchState.doubleTapDelay) {
      this.mario.isJumping = true;
      this.mario.velocityY = -this.mario.superJumpPower;
      this.touchState.lastTapTime = 0; // Reset
    } else {
      // Normal Jump (Only if on ground)
      if (!this.mario.isJumping) {
        this.mario.isJumping = true;
        this.mario.velocityY = -this.mario.jumpPower;
      }
      this.touchState.lastTapTime = currentTime;
    }
  }

  // --- GAME LOOP ---
  update() {
    // Horizontal Move
    if (this.keys.left) { this.mario.x -= this.mario.speed; this.mario.facingRight = false; }
    if (this.keys.right) { this.mario.x += this.mario.speed; this.mario.facingRight = true; }
    
    // 1. Screen Wrapping
    if (this.mario.x + this.mario.size < 0) this.mario.x = this.canvas.width;
    else if (this.mario.x > this.canvas.width) this.mario.x = -this.mario.size;

    // Vertical Move
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
          this.mario.x + this.mario.size > p.x && this.mario.x < p.x + p.width &&
          this.mario.y + this.mario.size > p.y && this.mario.y + this.mario.size < p.y + 15) {
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

    // Bomb Collision
    if (this.bomb) {
      const b = this.bomb;
      if (this.mario.x < b.x + b.size && this.mario.x + this.mario.size > b.x &&
          this.mario.y < b.y + b.size && this.mario.y + this.mario.size > b.y) {
        this.gameOver();
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.platformImage) {
      const h = this.canvas.height * 0.1;
      this.ctx.drawImage(this.platformImage, 0, this.canvas.height - h, this.canvas.width, h);
      this.platforms.forEach(p => this.ctx.drawImage(this.platformImage, p.x, p.y, p.width, p.height));
    }
    if (this.coinImage) {
      this.coins.forEach(c => { if (!c.collected) this.ctx.drawImage(this.coinImage, c.x, c.y, c.size, c.size); });
    }
    if (this.bombImage && this.bomb) {
      this.ctx.drawImage(this.bombImage, this.bomb.x, this.bomb.y, this.bomb.size, this.bomb.size);
    }
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

  // --- UI & STATE ---
  start() { if (!this.isRunning) { this.isRunning = true; this.isPaused = false; this.gameLoop(); this.updateUI(); } }
  
  togglePause() {
    if (this.isRunning) {
      this.isPaused = !this.isPaused;
      if (!this.isPaused) this.gameLoop();
      this.updateUI();
    }
  }

  reset() {
    this.isRunning = false;
    this.isPaused = false;
    this.score = 0;
    this.level = 1;
    cancelAnimationFrame(this.animationId);
    this.initializeMarioPosition();
    this.generateLevel();
    this.render();
    this.updateUI();
  }

  gameOver() {
    this.isRunning = false;
    alert("BOOM! Game Over. Score: " + this.score);
    this.reset();
  }

  endRound() {
    this.isPaused = true;
    const popup = document.createElement('div');
    popup.style = "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:20px; border:2px solid black; text-align:center; z-index:1000; font-family: Arial, sans-serif; box-shadow: 0 0 10px rgba(0,0,0,0.5);";
    popup.innerHTML = `<h3>Round ${this.level} Complete!</h3><p>Score: ${this.score}</p><button id="nextBtn" style="padding: 10px 20px; cursor: pointer; background: #4CAF50; color: white; border: none; border-radius: 4px;">Next Round</button>`;
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

  updateUI() {
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const statusEl = document.getElementById('status');
    const pauseBtn = document.getElementById('pauseBtn');
    const startBtn = document.getElementById('startBtn');

    if (scoreEl) scoreEl.textContent = this.score;
    if (levelEl) levelEl.textContent = this.level;
    if (statusEl) statusEl.textContent = this.isRunning ? (this.isPaused ? "Paused" : "Running") : "Ready";
    if (pauseBtn) pauseBtn.textContent = this.isPaused ? "Resume" : "Pause";
    if (startBtn) startBtn.disabled = this.isRunning;
  }
}

document.addEventListener('DOMContentLoaded', () => new GameFrame());