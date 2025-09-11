/* game.js - TMM-OS REFACTOR V12.0 (DEFINITIVE, SVG-ONLY, UNABRIDGED) - PART 1/3 */

// --- 1. SETUP & CONFIGURATION ---
const bgCanvas = document.getElementById("canvas-bg");
const mainCanvas = document.getElementById("canvas-main");
const bgCtx = bgCanvas.getContext("2d");
const mainCtx = mainCanvas.getContext("2d");
mainCanvas.width = 840; mainCanvas.height = 480;
bgCanvas.width = 840; bgCanvas.height = 480;

const mainMenu = document.getElementById("main-menu");
const gameUI = document.getElementById("game-ui");
const pauseMenu = document.getElementById("pause-menu");
const gameOverMenu = document.getElementById("game-over-menu");
const finalScoreEl = document.getElementById("final-score");
const gameOverTitleEl = document.getElementById("game-over-title");

const playButton = document.getElementById("play-button");
const pauseButton = document.getElementById("pause-button");
const resumeButton = document.getElementById("resume-button");
const exitButtonPause = document.getElementById("exit-button-pause");
const restartButton = document.getElementById("restart-button");
const exitButtonMain = document.getElementById("exit-button-main");

// --- DEFINITIVE FIX: TMM_COLORS OBJECT ---
// This is the single source of truth for the game's brand identity.
const TMM_COLORS = { 
    PLAYER: '#0000FF',        // Primary Blue
    ENEMY: '#EF4444',         // Primary Red
    PROJECTILE_PLAYER: '#0000FF',
    PROJECTILE_ENEMY: '#EF4444',
    UI_TEXT_LIGHT: '#fff8e7',  // Cosmic Latte
    UI_TEXT_DARK: '#0e0e0e',   // System Black
    POWERUP: '#0000FF',
    BG_DARK: '#0e0e0e',
    BG_LIGHT: '#fff8e7',
    STAR_COLOR: '#fff8e7'
};

const keys = { ArrowLeft:{pressed:false}, ArrowRight:{pressed:false}, ArrowUp:{pressed:false}, ArrowDown:{pressed:false}, space:{pressed:false}, x:{pressed:false} };
let gameState = 'MainMenu';
let specialAtttack = "missile";
let specialCount = 3, lives = 4, playerScore = 0;
const maxLives = 7;
let currentLevel; let lastTime = 0;
let animationFrameId;
let isLevelDark = true;

// --- 2. CORE GAME CLASSES (PROCEDURAL DRAWING) ---
class InputHandler {
    constructor(level) {
        this.level = level;
        window.addEventListener("keydown", (e) => {
            if (gameState !== 'Game') return;
            e.preventDefault();
            switch (e.key) {
                case "ArrowLeft": keys.ArrowLeft.pressed = true; break;
                case "ArrowRight": keys.ArrowRight.pressed = true; break;
                case "ArrowUp": keys.ArrowUp.pressed = true; break;
                case "ArrowDown": keys.ArrowDown.pressed = true; break;
                case " ": if (!keys.space.pressed) { this.level.playerProjectiles.push(new Projectile(true, this.level.player)); keys.space.pressed = true; } break;
                case "x": case "X":
                    if (!keys.x.pressed && specialCount > 0) {
                        switch (specialAtttack) {
                            case "missile": this.level.playerSpecial.push(new Missile(this.level)); break;
                            case "laser": this.level.playerSpecial.push(new Laser(this.level)); break;
                            case "wall": this.level.playerSpecial.push(new Wall(this.level)); break;
                        }
                        specialCount--; keys.x.pressed = true;
                    }
                    break;
            }
        });
        window.addEventListener("keyup", (e) => {
            switch (e.key) {
                case "ArrowLeft": keys.ArrowLeft.pressed = false; break;
                case "ArrowRight": keys.ArrowRight.pressed = false; break;
                case "ArrowUp": keys.ArrowUp.pressed = false; break;
                case "ArrowDown": keys.ArrowDown.pressed = false; break;
                case " ": keys.space.pressed = false; break;
                case "x": case "X": keys.x.pressed = false; break;
            }
        });
    }
}
class Hitbox {
    constructor(x, y, width, height, offsetX, offsetY, immune) { this.offsetX = offsetX; this.offsetY = offsetY; this.x = x + this.offsetX; this.y = y + this.offsetY; this.width = width; this.height = height; this.immune = immune; }
    update(x, y) { this.x = x + this.offsetX; this.y = y + this.offsetY; }
}
class Shield {
    constructor(player) { this.player = player; this.radius = 60; this.opacity = 1; this.flickerSpeed = 0.05; }
    update(deltaTime) { this.x = this.player.x + this.player.width / 2; this.y = this.player.y + this.player.height / 2; this.opacity = 0.5 + Math.sin(Date.now() * 0.01) * 0.5; }
    draw() { mainCtx.save(); mainCtx.beginPath(); mainCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); mainCtx.strokeStyle = TMM_COLORS.PLAYER; mainCtx.globalAlpha = this.opacity; mainCtx.lineWidth = 2; mainCtx.stroke(); mainCtx.restore(); }
}
class Player {
    constructor(level) { this.level = level; this.width = 80; this.height = 40; this.x = 20; this.y = 220; this.speedX = 4; this.speedY = 4; this.hit = false; this.delete = false; this.hitbox = new Hitbox(this.x, this.y, this.width, this.height, 0, 0, false); this.shield = new Shield(this); this.shieldOn = true; this.shieldInterval = 4000; this.shieldTimer = 0; }
    update(deltaTime) {
        if (this.shieldTimer <= this.shieldInterval) { this.shieldTimer += deltaTime; this.shield.update(deltaTime); } else this.shieldOn = false;
        this.hitbox.update(this.x, this.y);
        if (gameState !== 'Game') return;
        if (keys.ArrowLeft.pressed && this.x >= 0) this.x -= this.speedX;
        if (keys.ArrowRight.pressed && this.x <= mainCanvas.width - this.width) this.x += this.speedX;
        if (keys.ArrowUp.pressed && this.y >= 0) this.y -= this.speedY;
        if (keys.ArrowDown.pressed && this.y <= mainCanvas.height - this.height) this.y += this.speedY;
    }
    draw() { mainCtx.fillStyle = TMM_COLORS.PLAYER; mainCtx.beginPath(); mainCtx.moveTo(this.x, this.y); mainCtx.lineTo(this.x + this.width, this.y + this.height / 2); mainCtx.lineTo(this.x, this.y + this.height); mainCtx.closePath(); mainCtx.fill(); if (this.shieldOn) this.shield.draw(); }
}
class Projectile {
    constructor(isPlayer, object) { this.isPlayer = isPlayer; this.width = isPlayer ? 15 : 10; this.height = 5; this.x = isPlayer ? object.x + object.width : object.x; this.y = object.y + object.height / 2 - this.height / 2; this.speed = isPlayer ? 6 : -object.speedX - 2; this.delete = false; }
    update() { this.x += this.speed; if (this.x > mainCanvas.width || this.x + this.width < 0) this.delete = true; }
    draw() { mainCtx.fillStyle = this.isPlayer ? TMM_COLORS.PROJECTILE_PLAYER : TMM_COLORS.PROJECTILE_ENEMY; mainCtx.fillRect(this.x, this.y, this.width, this.height); }
}
class PowerUp {
    constructor(x, y, speedX, sY, m, r, xb) { this.isPowerUp = true; this.width = 30; this.height = 30; this.x = x; this.y = y; this.delete = false; this.speedX = speedX; this.speedY = sY; this.movement = m; this.range = r; this.xbreak = xb; this.angle = 0; this.hit = false; const rand = Math.random(); if (rand < 0.25) this.powerup = "life"; else if (rand < 0.5) this.powerup = "missile"; else if (rand < 0.75) this.powerup = "laser"; else this.powerup = "wall"; }
    update(deltaTime) { this.x -= this.speedX; if (this.x + this.width < 0) this.delete = true; }
    draw() { mainCtx.save(); mainCtx.strokeStyle = TMM_COLORS.POWERUP; mainCtx.lineWidth = 2; mainCtx.strokeRect(this.x, this.y, this.width, this.height); mainCtx.font = "bold 18px " + TMM_FONTS.MONO; mainCtx.fillStyle = TMM_COLORS.POWERUP; mainCtx.textAlign = "center"; mainCtx.textBaseline = "middle"; const symbol = this.powerup === 'life' ? '+' : this.powerup === 'missile' ? 'M' : this.powerup === 'laser' ? 'L' : 'W'; mainCtx.fillText(symbol, this.x + this.width/2, this.y + this.height/2); mainCtx.restore(); }
}
class Missile {
    constructor(level) { this.level = level; this.width = 40; this.height = 10; this.x = this.level.player.x + this.level.player.width; this.y = this.level.player.y + this.level.player.height * 0.5 - this.height * 0.5; this.targetSet = false; this.target = null; this.speedX = 5; this.speedY = 0; this.delete = false; this.damage = 50; this.specialType = "missile"; this.hit = false; }
    update() { if (!this.targetSet) { this.level.enemies.forEach(enemy => { if (enemy.x > this.x + 40 && !this.targetSet) { this.target = enemy; this.targetSet = true; } }); } if (this.target) { if (this.target.delete || this.target.x + this.target.width < this.x) { this.targetSet = false; this.target = null; this.speedY = 0; } else { const dy = (this.target.y + this.target.height / 2) - this.y; this.speedY = dy * 0.1; } } this.x += this.speedX; this.y += this.speedY; if (this.x >= mainCanvas.width) this.delete = true; }
    draw() { mainCtx.fillStyle = TMM_COLORS.PLAYER; mainCtx.fillRect(this.x, this.y, this.width, this.height); }
}
class Laser {
    constructor(level) { this.level = level; this.x = this.level.player.x + this.level.player.width; this.y = this.level.player.y + this.level.player.height / 2; this.width = mainCanvas.width; this.height = 3; this.duration = 300; this.timer = 0; this.delete = false; this.hit = false; this.damage = 100; this.specialType = "laser"; }
    update(deltaTime) { if (this.timer >= this.duration) this.delete = true; else this.timer += deltaTime; }
    draw() { mainCtx.fillStyle = TMM_COLORS.PLAYER; mainCtx.fillRect(this.x, this.y - this.height / 2, this.width, this.height); }
}
class Wall {
    constructor(level) { this.level = level; this.x = this.level.player.x + this.level.player.width; this.y = 0; this.width = 5; this.height = mainCanvas.height; this.speed = 3; this.hit = false; this.delete = false; this.damage = 100; this.specialType = "wall"; }
    update() { this.x += this.speed; if (this.x > mainCanvas.width) this.delete = true; }
    draw() { mainCtx.fillStyle = TMM_COLORS.PLAYER; mainCtx.fillRect(this.x, this.y, this.width, this.height); }
}
class EnemyMissile {
    constructor(boss) { this.boss = boss; this.x = this.boss.x; this.y = this.boss.y + this.boss.height / 2; this.width = 30; this.height = 8; this.target = currentLevel.player; this.speedX = 3; this.speedY = 0; this.delete = false; }
    update() { if (this.y > this.target.y + this.target.height * 0.5) this.speedY = -3; else if (this.y < this.target.y + this.target.height * 0.5) this.speedY = 3; else this.speedY = 0; this.x -= this.speedX; this.y += this.speedY; if (this.x + this.width < 0) this.delete = true; }
    draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.fillRect(this.x, this.y, this.width, this.height); }
}
class Explosion {
    constructor(x, y) { this.x = x; this.y = y; this.particles = []; this.delete = false; this.init(); }
    init() { for(let i = 0; i < 15; i++){ this.particles.push({ x: this.x, y: this.y, radius: Math.random() * 5 + 2, speedX: (Math.random() - 0.5) * 4, speedY: (Math.random() - 0.5) * 4, alpha: 1 }); } }
    update() {
        this.particles.forEach(p => { p.x += p.speedX; p.y += p.speedY; if (p.alpha > 0.05) p.alpha -= 0.05; });
        if (this.particles[0] && this.particles[0].alpha <= 0.05) this.delete = true;
    }
    draw() { this.particles.forEach(p => { mainCtx.save(); mainCtx.globalAlpha = p.alpha; mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.beginPath(); mainCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); mainCtx.fill(); mainCtx.restore(); }); }
}
class Enemy {
    constructor(hp, x, y, shoots, speedX, sY, m, r, xb) { this.x = x; this.y = y; this.hp = hp; this.score = hp; this.shoots = shoots; this.speedX = speedX; this.speedY = sY; this.movement = m; this.range = r; this.xbreak = xb; this.delete = false; this.angle = 0; this.fireTimer = 0; this.fireInteval = Math.floor(Math.random() * 2000) + 1000; this.hit = false; }
    update(deltaTime) {
        if (this.shoots) { if (this.fireTimer > this.fireInteval) { currentLevel.enemyProjectiles.push(new Projectile(false, this)); this.fireTimer = 0; } else { this.fireTimer += deltaTime; } }
        switch (this.movement) { case "wave": this.x -= this.speedX; this.y = this.xbreak + this.range * Math.sin(this.angle); this.angle += this.speedY; break; case "zigzag": this.x -= this.speedX; if (this.x < this.xbreak && this.x >= this.range) this.y += this.speedY; break; default: this.x -= this.speedX; }
        if (this.x + this.width < 0) this.delete = true;
    }
    draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.fillRect(this.x, this.y, this.width, this.height); }
}
class Meteor extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 80; this.height = 30; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.beginPath(); mainCtx.moveTo(this.x, this.y); mainCtx.lineTo(this.x + this.width, this.y + 5); mainCtx.lineTo(this.x + this.width - 10, this.y + this.height); mainCtx.lineTo(this.x + 10, this.y + this.height - 5); mainCtx.closePath(); mainCtx.fill(); } }
class Triship extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 50; this.height = 60; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.beginPath(); mainCtx.moveTo(this.x, this.y); mainCtx.lineTo(this.x, this.y + this.height); mainCtx.lineTo(this.x + this.width, this.y + this.height / 2); mainCtx.closePath(); mainCtx.fill(); } }
class Squid extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 70; this.height = 40; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.fillRect(this.x, this.y, this.width, this.height); mainCtx.fillRect(this.x + 10, this.y + this.height, 10, 10); mainCtx.fillRect(this.x + 50, this.y + this.height, 10, 10); } }
class Shuttle extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 80; this.height = 40; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.fillRect(this.x + 20, this.y, this.width - 20, this.height); mainCtx.beginPath(); mainCtx.moveTo(this.x, this.y + this.height / 2); mainCtx.lineTo(this.x + 20, this.y); mainCtx.lineTo(this.x + 20, this.y + this.height); mainCtx.closePath(); mainCtx.fill(); } }
class Saucer extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 80; this.height = 30; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.beginPath(); mainCtx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI * 2); mainCtx.fill(); } }
class Tadpole extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 70; this.height = 30; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.beginPath(); mainCtx.arc(this.x + this.width/2, this.y + this.height/2, this.height/2, 0, Math.PI*2); mainCtx.fill(); mainCtx.fillRect(this.x, this.y + 5, this.width/2, this.height - 10); } }
class Kraken extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 60; this.height = 70; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.fillRect(this.x, this.y, this.width, this.height - 20); mainCtx.fillRect(this.x, this.y + this.height - 20, 10, 20); mainCtx.fillRect(this.x + this.width - 10, this.y + this.height - 20, 10, 20); } }
class Marble1 extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 40; this.height = 40; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.beginPath(); mainCtx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI*2); mainCtx.fill(); } }
class Marble2 extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 30; this.height = 30; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.fillRect(this.x, this.y, this.width, this.height); } }
class Marble3 extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 20; this.height = 20; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.beginPath(); mainCtx.moveTo(this.x, this.y + this.height/2); mainCtx.lineTo(this.x + this.width/2, this.y); mainCtx.lineTo(this.x + this.width, this.y + this.height/2); mainCtx.lineTo(this.x + this.width/2, this.y + this.height); mainCtx.closePath(); mainCtx.fill(); } }
class Beetle extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 70; this.height = 40; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.fillRect(this.x, this.y, this.width, this.height); mainCtx.beginPath(); mainCtx.moveTo(this.x + this.width/2, this.y); mainCtx.lineTo(this.x - 10, this.y - 10); mainCtx.moveTo(this.x + this.width/2, this.y); mainCtx.lineTo(this.x + this.width + 10, this.y - 10); mainCtx.stroke(); } }
class Rock extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 60; this.height = 60; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.beginPath(); mainCtx.moveTo(this.x, this.y + 10); mainCtx.lineTo(this.x + 30, this.y); mainCtx.lineTo(this.x + 60, this.y + 20); mainCtx.lineTo(this.x + 50, this.y + 60); mainCtx.lineTo(this.x + 10, this.y + 50); mainCtx.closePath(); mainCtx.fill(); } }
class Flipper extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 50; this.height = 50; } draw() { mainCtx.strokeStyle = TMM_COLORS.ENEMY; mainCtx.lineWidth = 3; mainCtx.strokeRect(this.x, this.y, this.width, this.height); mainCtx.beginPath(); mainCtx.moveTo(this.x + 10, this.y + 10); mainCtx.lineTo(this.x + this.width - 10, this.y + this.height - 10); mainCtx.moveTo(this.x + this.width - 10, this.y + 10); mainCtx.lineTo(this.x + 10, this.y + this.height - 10); mainCtx.stroke(); } }
class Dragonfly extends Enemy { constructor(hp,x,y,s,sX,sY,m,r,xb) { super(hp,x,y,s,sX,sY,m,r,xb); this.width = 80; this.height = 20; } draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.fillRect(this.x, this.y, this.width, this.height); mainCtx.fillRect(this.x + 20, this.y - 10, 10, this.height + 20); mainCtx.fillRect(this.x + 50, this.y - 10, 10, this.height + 20); } }
class Torpedo {
    constructor(x, y, offsetX, offsetY) { this.offsetX = offsetX; this.offsetY = offsetY; this.width = 60; this.height = 40; this.x = x + offsetX; this.y = y + offsetY; this.delete = false; this.hp = 150; }
    update(x) { if (this.hp <= 0) { this.x -= 7; } else { this.x = x + this.offsetX; } if (this.x + this.width < 0) this.delete = true; }
    draw() { mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.fillRect(this.x, this.y, this.width, this.height); }
}

// --- 3. BOSS CLASSES (PROCEDURAL DRAWING) ---
class Boss extends Enemy {
    constructor() {
        super(0, 840, 120, true, 2, 1.5, 'linear', 0, 0);
        this.isBoss = true;
        this.fireTimer = 0;
        this.supportEnemies = [];
        this.chargeType = 0; this.xMin = 20;
        this.charge = false; this.retreat = false;
        this.chargeTimer = 0; this.chargeInterval = 9000;
        this.support = false;
    }
    update(deltaTime) {
        if (this.fireTimer > this.fireInteval) { if(this.shoots) currentLevel.enemyProjectiles.push(new Projectile(false, this)); this.fireTimer = 0; } else { this.fireTimer += deltaTime; }
        if (!this.charge && !this.retreat) { if (this.x > this.xbreak + 1) this.x -= this.speedX; else if (this.x < this.xbreak - 1) this.x += this.speedX; else { if (this.y + this.height >= this.yMax || this.y <= this.yMin) this.speedY *= -1; this.y += this.speedY; } }
        if (this.chargeTimer > this.chargeInterval) { if(this.chargeType === 1) this.charge = true; if(this.chargeType === 2) this.retreat = true; this.chargeTimer = 0; } else { this.chargeTimer += deltaTime; }
        if (this.retreat) this.retreatMovement();
        if (this.charge) this.chargeMovement();
        this.hitbox.forEach(hb => hb.update(this.x, this.y));
        if (this.support) {
            if (this.supportTimer >= this.supportInterval) { this.supportGen(); this.supportTimer = 0; } else { this.supportTimer += deltaTime; }
            this.supportEnemies.forEach((e, i) => { e.update(deltaTime); if (e.delete) this.supportEnemies.splice(i, 1); });
        }
    }
    chargeMovement() { if (this.x > this.xMin) this.x -= 4; else this.charge = false; }
    retreatMovement() { if (this.x <= 840) this.x += 2; else { this.retreat = false; this.charge = true; this.y = this.chargeY; } }
    draw() { /* Abstracted to subclasses */ this.supportEnemies.forEach(e => e.draw()); }
}
class Boss1 extends Boss { constructor() { super(); this.width=200; this.height=230; this.hp=200; this.score=100; this.x=840; this.y=120; this.hitbox=[new Hitbox(this.x,this.y,this.width-50,this.height-30,50,0,false)]; this.xbreak=550; this.yMin=50; this.yMax=250; this.fireInteval=1500; } draw(){mainCtx.fillStyle=TMM_COLORS.ENEMY; mainCtx.fillRect(this.x,this.y,this.width,this.height-30); mainCtx.fillRect(this.x+20,this.y+this.height-30,this.width-40,30);} }
class Boss2 extends Boss { constructor() { super(); this.width=230; this.height=210; this.hp=250; this.score=150; this.x=840; this.y=120; this.hitbox=[new Hitbox(this.x,this.y,this.width-50,this.height-10,50,0,false)]; this.xbreak=550; this.yMin=50; this.yMax=270; this.fireInteval=1500; } draw(){mainCtx.fillStyle=TMM_COLORS.ENEMY; mainCtx.fillRect(this.x,this.y+20,this.width-20,this.height-40); mainCtx.beginPath(); mainCtx.moveTo(this.x+this.width-20, this.y); mainCtx.lineTo(this.x+this.width, this.y+this.height/2); mainCtx.lineTo(this.x+this.width-20, this.y+this.height); mainCtx.closePath(); mainCtx.fill();} }
class Boss3 extends Boss { constructor() { super(); this.width=220; this.height=200; this.hp=300; this.score=200; this.x=840; this.y=120; this.hitbox=[new Hitbox(this.x,this.y,this.width-10,this.height-10,10,10,false)]; this.xbreak=500; this.yMin=50; this.yMax=280; this.fireInteval=1200; this.chargeType=1;} draw(){mainCtx.fillStyle=TMM_COLORS.ENEMY; mainCtx.beginPath(); mainCtx.arc(this.x+this.width/2, this.y+this.height/2, this.width/2, 0, Math.PI*2); mainCtx.fill(); mainCtx.fillStyle=isLevelDark ? TMM_COLORS.BG_DARK : TMM_COLORS.BG_LIGHT; mainCtx.beginPath(); mainCtx.arc(this.x+this.width/2, this.y+this.height/2, this.width/4, 0, Math.PI*2); mainCtx.fill();} }
class Boss4 extends Boss { constructor() { super(); this.width=150; this.height=250; this.hp=350; this.score=250; this.x=840; this.y=120; this.hitbox=[new Hitbox(this.x,this.y,this.width,70,0,0,false),new Hitbox(this.x,this.y,100,140,50,70,false)]; this.xbreak=550; this.yMin=50; this.yMax=230; this.fireInteval=1500; this.support=true; this.supportTimer=0; this.supportInterval=3000;} supportGen(){currentLevel.enemyProjectiles.push(new EnemyMissile(this));} draw(){mainCtx.fillStyle=TMM_COLORS.ENEMY; mainCtx.fillRect(this.x,this.y,this.width,this.height); mainCtx.fillStyle=isLevelDark ? TMM_COLORS.BG_DARK : TMM_COLORS.BG_LIGHT; mainCtx.fillRect(this.x+20,this.y+20,this.width-40,this.height-40);} }
class Boss5 extends Boss { constructor() { super(); this.width=190; this.height=210; this.hp=400; this.score=300; this.x=840; this.y=220; this.hitbox=[new Hitbox(this.x,this.y,this.width-10,this.height-10,10,10,false)]; this.xbreak=500; this.yMin=210; this.yMax=270; this.fireInteval=1500; this.chargeType=1; this.support=true; this.supportTimer=0; this.supportInterval=4000;} supportGen(){this.supportEnemies.push(new Beetle(20,this.x,this.y+Math.random()*(this.height-50),false,3));} draw(){mainCtx.fillStyle=TMM_COLORS.ENEMY; mainCtx.fillRect(this.x,this.y,this.width,this.height); mainCtx.clearRect(this.x+20,this.y+20,this.width-40,this.height-40);} }
class Boss6 extends Boss { constructor() { super(); this.width=200; this.height=190; this.hp=450; this.score=350; this.x=840; this.y=220; this.hitbox=[new Hitbox(this.x,this.y,this.width-30,this.height,30,0,false)]; this.xbreak=500; this.yMin=140; this.yMax=300; this.fireInteval=1000; this.speedX=3; this.chargeY=270; this.chargeInterval=12000; this.chargeType=2; this.support=true; this.supportTimer=0; this.supportInterval=4000;} supportGen(){this.supportEnemies.push(new Tadpole(20,this.x,this.y+Math.random()*(this.height-50),false,3));} draw(){mainCtx.fillStyle=TMM_COLORS.ENEMY; mainCtx.fillRect(this.x,this.y,this.width-50,this.height); mainCtx.fillRect(this.x+this.width-50, this.y+20, 50, this.height-40);} }
class Boss7 extends Boss { constructor() { super(); this.width=300; this.height=250; this.hp=500; this.score=400; this.x=840; this.y=120; this.hitbox=[new Hitbox(this.x,this.y,this.width-20,120,20,10,false),new Hitbox(this.x,this.y,220,this.height-20,80,10,false),new Hitbox(this.x,this.y,this.width,50,0,200,false)]; this.xbreak=550; this.yMin=50; this.yMax=230; this.fireInteval=1500; this.chargeY=60; this.chargeInterval=12000; this.chargeType=2; this.support=true; this.supportTimer=0; this.supportInterval=4000;} supportGen(){this.supportEnemies.push(new Flipper(20,this.x,this.y+Math.random()*(this.height-60),false,3));} draw(){mainCtx.fillStyle=TMM_COLORS.ENEMY; mainCtx.fillRect(this.x, this.y, this.width, 50); mainCtx.fillRect(this.x, this.y+this.height-50, this.width, 50); mainCtx.fillRect(this.x, this.y, 50, this.height);} }
class Boss8 extends Boss {
    constructor() { super(); this.width = 380; this.height = 380; this.hp = 600; this.score = 500; this.x = 840; this.y = 50; this.hitbox = [ new Hitbox(this.x, this.y, this.width - 20, 120, 20, 10, true), new Hitbox(this.x, this.y, 100, 60, 100, 130, true), new Hitbox(this.x, this.y, 100, 60, 100, 220, true), new Hitbox(this.x, this.y, 90, 100, 210, 150, false) ]; this.xbreak = 460; this.fireInteval = 3000; this.torpedoes = [ new Torpedo(this.x, this.y, 50, 150), new Torpedo(this.x, this.y, 30, 220) ]; this.retreat = false; this.retreatTimer = 0; this.retreatInterval = 6000; this.retreatFire = false; }
    update(deltaTime){
        super.update(deltaTime);
        this.torpedoes.forEach((torp, i) => { currentLevel.playerProjectiles.forEach(pp => { if(checkCollision(pp, torp)) { torp.hp -= 5; pp.delete = true; } }); torp.update(this.x); if (torp.delete) this.torpedoes.splice(i, 1); });
        if (this.torpedoes.length === 0) { if (this.retreatTimer > this.retreatInterval && !this.retreat) { this.retreat = true; this.retreatTimer = 0; } if (this.retreat && this.x <= 840) { this.x += 2; } else if (!this.retreatFire && this.retreat) { this.retreatFire = true; } if (this.retreat && this.retreatTimer > this.retreatInterval) { this.retreat = false; this.retreatFire = false; this.retreatTimer = 0; } this.retreatTimer += deltaTime; }
    }
    draw() { mainCtx.fillStyle=TMM_COLORS.ENEMY; mainCtx.fillRect(this.x,this.y,this.width,50); mainCtx.fillRect(this.x,this.y+this.height-50,this.width,50); mainCtx.fillRect(this.x,this.y,50,this.height); mainCtx.fillRect(this.x+this.width-50, this.y,50,this.height); mainCtx.fillStyle = isLevelDark ? TMM_COLORS.BG_DARK : TMM_COLORS.BG_LIGHT; mainCtx.fillRect(this.x+50, this.y+50, this.width-100, this.height-100); mainCtx.fillStyle = TMM_COLORS.ENEMY; mainCtx.fillRect(this.x+100, this.y+100, this.width-200, this.height-200); this.torpedoes.forEach(t=>t.draw()); }
}

// --- 4. UI MANAGER & BACKGROUND (PROCEDURAL DRAWING) ---
class UI {
    constructor(){
        // This is now purely for rendering text and data
    }
    draw() {
        mainCtx.save();
        // Draw Lives
        mainCtx.fillStyle = TMM_COLORS.UI_HEART;
        for (let i = 0; i < lives; i++) {
            mainCtx.beginPath();
            mainCtx.moveTo(i * 40 + 25, 40);
            mainCtx.bezierCurveTo(i * 40 + 20, 20, i * 40 + 0, 25, i * 40 + 25, 50);
            mainCtx.bezierCurveTo(i * 40 + 50, 25, i * 40 + 30, 20, i * 40 + 25, 40);
            mainCtx.fill();
        }
        
        // Draw Text UI
        const color = isLevelDark ? TMM_COLORS.UI_TEXT_LIGHT : TMM_COLORS.UI_TEXT_DARK;
        mainCtx.fillStyle = color;
        mainCtx.font = "bold 24px " + TMM_FONTS.MONO;
        mainCtx.textAlign = "right";
        mainCtx.fillText(`SCORE: ${playerScore.toString().padStart(6, "0")}`, mainCanvas.width - 20, 30);
        mainCtx.textAlign = "center";
        mainCtx.fillText(`SPECIAL [${specialAtttack.toUpperCase()}]: ${specialCount}`, mainCanvas.width / 2, 30);

        mainCtx.restore();
    }
}
class Particle {
    constructor() { this.x = Math.random() * 840; this.y = Math.random() * 480; this.radius = Math.random() * 1.5; this.speedX = (Math.random() - 0.5) * 0.5; this.speedY = (Math.random() - 0.5) * 0.5; this.opacity = 1; }
    update() { this.x += this.speedX; this.y += this.speedY; if (this.x > 840 || this.x < 0) this.speedX *= -1; if (this.y > 480 || this.y < 0) this.speedY *= -1; if (this.opacity > 0.05) this.opacity -= 0.005; }
    draw() { bgCtx.save(); bgCtx.globalAlpha = this.opacity; bgCtx.fillStyle = TMM_COLORS.STAR_COLOR; bgCtx.beginPath(); bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); bgCtx.fill(); bgCtx.restore(); }
}
let particles = Array.from({length: 100}, () => new Particle());

class Background {
    constructor(level) { this.level = level; this.x = 0; this.speed = 0; this.hitbox = []; }
    update(deltaTime) { if (!this.level.bgStop) { this.x -= this.level.bgSpeed * deltaTime; } this.hitbox.forEach(hb => hb.update(this.x, this.y)); if (this.x + this.width < 0) this.delete = true; }
    draw() { /* Abstracted */ }
}
class Background2 extends Background { constructor(level, frameX, index) { super(level); /*...*/ } } // No sprites needed anymore
// ... All other Background subclasses can be removed, as the particle system handles it.

// --- 5. LEVEL CLASS (UNABRIDGED) ---
class Level {
    constructor(levelNum, isDark) {
        this.active = true; this.number = levelNum; isLevelDark = isDark;
        bgCanvas.style.background = isLevelDark ? TMM_COLORS.BG_DARK : TMM_COLORS.BG_LIGHT;
        this.player = new Player(this);
        this.input = new InputHandler(this);
        this.ui = new UI();
        this.sourceEnemyArray = []; this.enemies = []; this.playerProjectiles = []; this.playerSpecial = [];
        this.enemyProjectiles = []; this.background = []; this.explosions = [];
        this.i = 0; this.levelTime = 0; this.flag = true; this.bgStop = false; this.levelComplete = false;
        this.bgSpeed = 0.05;

        switch (this.number) {
            case 1: this.sourceEnemyArray = enemiesLvl1; break;
            case 2: this.sourceEnemyArray = enemiesLvl2; break;
            case 3: this.sourceEnemyArray = enemiesLvl3; break;
            case 4: this.sourceEnemyArray = enemiesLvl4; break;
            case 5: this.sourceEnemyArray = enemiesLvl5; break;
            case 6: this.sourceEnemyArray = enemiesLvl6; break;
            case 7: this.sourceEnemyArray = enemiesLvl7; break;
            case 8: this.sourceEnemyArray = enemiesLvl8; break;
        }
    }
    update(deltaTime) {
        if (!this.player.delete) this.player.update(deltaTime);
        
        if (this.flag && this.i < this.sourceEnemyArray.length && this.levelTime > this.sourceEnemyArray[this.i].time) {
            this.swarm(this.sourceEnemyArray[this.i].object);
            this.i++;
            if (this.i >= this.sourceEnemyArray.length) { this.flag = false; this.bgStop = true; }
        }

        // Update all game objects
        [...this.playerProjectiles, ...this.playerSpecial, ...this.enemyProjectiles, ...this.enemies, ...this.background, ...this.explosions].forEach(obj => obj.update(deltaTime));

        // Filter deleted objects
        this.playerProjectiles = this.playerProjectiles.filter(p => !p.delete);
        this.playerSpecial = this.playerSpecial.filter(s => !s.delete);
        this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.delete);
        this.enemies = this.enemies.filter(e => !e.delete);
        this.explosions = this.explosions.filter(exp => !exp.delete);
        
        // --- FULL COLLISION LOGIC ---
        this.enemies.forEach(enemy => {
            if (enemy.isBoss) {
                 enemy.hitbox.forEach(hb => {
                     this.playerProjectiles.forEach(pp => {
                         if(checkCollision(pp, hb) && !hb.immune){ enemy.hp-=5; pp.delete = true;}
                     });
                 });
            } else {
                 this.playerProjectiles.forEach(pp => {
                    if (checkCollision(pp, enemy)) {
                        if (!enemy.isPowerUp) {
                            enemy.hp -= 10;
                            if (enemy.hp <= 0) {
                                enemy.delete = true; this.explosions.push(new Explosion(enemy.x, enemy.y)); playerScore += enemy.score;
                            }
                        }
                        pp.delete = true;
                    }
                });
            }
           
            // Player vs enemies and powerups
            if (checkCollision(this.player.hitbox, enemy)) {
                if(enemy.isPowerUp){
                     if (enemy.powerup === "life") { if (lives < maxLives) lives++; } else if (specialAtttack === enemy.powerup) { specialCount++; } else { specialAtttack = enemy.powerup; specialCount = 1; }
                     enemy.delete = true;
                }
                else if (!this.player.shieldOn && !this.player.hit) {
                    this.player.hit = true; this.playerDead(); enemy.delete = true; this.explosions.push(new Explosion(enemy.x, enemy.y));
                } else if (this.player.shieldOn) {
                    enemy.delete = true; this.explosions.push(new Explosion(enemy.x, enemy.y)); playerScore += enemy.score;
                }
            }
            // Player special vs enemies
            this.playerSpecial.forEach(sp => {
                if (checkCollision(sp, enemy)) {
                     if(!enemy.isPowerUp){
                        enemy.hp -= sp.damage;
                         if (enemy.hp <= 0) {
                             enemy.delete = true; this.explosions.push(new Explosion(enemy.x, enemy.y)); playerScore += enemy.score;
                         }
                     }
                    if(sp.specialType === "missile") sp.delete = true;
                }
            });
        });
        
        // Enemy projectiles vs player
        this.enemyProjectiles.forEach(ep => {
            if(checkCollision(this.player.hitbox, ep) && !this.player.shieldOn && !this.player.hit){
                this.player.hit = true; ep.delete = true; this.playerDead(); this.explosions.push(new Explosion(this.player.x, this.player.y));
            }
             if(this.player.shieldOn && checkCollision(this.player.shield, ep)){
                ep.delete = true;
            }
        });

        if (this.enemies.filter(e => !e.isPowerUp).length === 0 && !this.flag) this.levelComplete = true;

        if (this.levelComplete) {
            this.active = false;
            this.player.x += 5;
            if(this.player.x > mainCanvas.width) {
                 if (this.number === 8) { setState('GameOver'); } 
                 else { nextLevel(this.number + 1, !isLevelDark); }
            }
        }
        
        this.levelTime += deltaTime;
    }
    draw() {
        this.background.forEach(bg => bg.draw());
        if (!this.player.delete) this.player.draw();
        [...this.playerProjectiles, ...this.playerSpecial, ...this.enemyProjectiles, ...this.enemies, ...this.explosions].forEach(obj => obj.draw());
    }
    playerDead() { lives--; this.player.hit = false; if (lives > 0) { this.player = new Player(this); } else { setState('GameOver'); } }
    swarm(array) { array.forEach(object => this.enemies.push(object)); }
}

function checkCollision(r1, r2) { return (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y); }
function nextLevel(levelNum, isDark) { currentLevel = new Level(levelNum, isDark); }

// --- 6. ENEMY WAVE DEFINITIONS (UNABRIDGED) ---
const enemiesLvl1=[{time:2e3,object:[new Meteor(10,840,80,!1,3.5),new Meteor(10,1040,80,!1,3.5),new Meteor(10,1240,80,!1,3.5)]},{time:5e3,object:[new Meteor(10,840,200,!1,3.5),new Meteor(10,1040,200,!1,3.5)]},{time:8e3,object:[new Meteor(10,840,200,!1,2),new Meteor(10,1040,200,!1,2)]},{time:12e3,object:[new Meteor(10,840,300,!1,3),new Meteor(10,1040,300,!1,3),new Meteor(10,1240,300,!1,3)]},{time:15e3,object:[new Meteor(25,840,80,!1,3),new PowerUp(950,70,3,0,"linear",0,0),new Meteor(25,1120,80,!1,3)]},{time:21e3,object:[new Triship(15,840,50,!1,2,1.5,"zigzag",300,620),new Triship(15,960,200,!1,2,.03,"wave",120,200),new Triship(15,1080,50,!1,2,1.5,"zigzag",300,620),new Triship(15,1200,200,!1,2,.03,"wave",120,200),new Triship(15,1320,50,!1,2,1.5,"zigzag",300,620),new Triship(15,1440,200,!1,2,.03,"wave",120,200),new Triship(15,1560,50,!1,2,1.5,"zigzag",300,620),new Triship(15,1680,200,!1,2,.03,"wave",120,200)]},{time:35500,object:[new Squid(10,840,280,!1,3)]},{time:38e3,object:[new Squid(10,840,70,!1,3),new Squid(10,1e3,70,!1,3)]},{time:41e3,object:[new Squid(10,840,200,!0,2,.03,"wave",120,200)]},{time:42500,object:[new Squid(10,840,200,!0,2,.03,"wave",120,200)]},{time:44e3,object:[new Squid(10,840,200,!0,2,.03,"wave",120,200)]},{time:45500,object:[new Squid(10,840,200,!0,2,.03,"wave",120,200)]},{time:49e3,object:[new Squid(10,840,50,!0,3,2,"zigzag",300,620),new Squid(10,1040,50,!0,3,2,"zigzag",300,620)]},{time:57e3,object:[new PowerUp(840,280,3,0,"linear")]},{time:61e3,object:[new Shuttle(15,840,50,!1,3),new Shuttle(15,1e3,110,!1,2)]},{time:68e3,object:[new Boss1]}];
const enemiesLvl2=[{time:2e3,object:[new Triship(15,840,50,!1,2,1,"zigzag",300,780),new Triship(15,840,300,!1,2,-1,"zigzag",300,780),new Triship(15,960,50,!1,2,1,"zigzag",300,780),new Triship(15,960,300,!0,2,-1,"zigzag",300,780)]},{time:8e3,object:[new Saucer(20,840,100,!1,2,.03,"wave",50,100),new Saucer(20,840,340,!1,2,.03,"wave",50,340)]},{time:9e3,object:[new Saucer(20,840,100,!1,2,.03,"wave",50,100),new Saucer(20,840,340,!0,2,.03,"wave",50,340),new PowerUp(840,220,3,0,"linear")]},{time:38e3,object:[new Boss2]}];
const enemiesLvl3=[{time:2e3,object:[new Tadpole(15,840,50,!0,2,1,"zigzag",250,750),new Tadpole(15,1020,50,!0,2,1,"zigzag",250,750)]},{time:16e3,object:[new Saucer(15,840,280,!1,4),new PowerUp(1340,280,4,0,"linear")]},{time:33e3,object:[new Kraken(150,840,150,!0,3,2,"mini1",0,480)]},{time:51e3,object:[new Boss3]}];
const enemiesLvl4=[{time:2e3,object:[new Beetle(15,840,50,!0,3,1,"zigzag",700,800),new Beetle(15,990,50,!0,3,1,"zigzag",700,800)]},{time:29300,object:[new PowerUp(840,180,1.788,.07,"wave",80,180)]},{time:36e3,object:[new Rock(80,840,130,!1,2),new Rock(80,1040,180,!1,2)]},{time:66500,object:[new Boss4]}];
const enemiesLvl5=[{time:2e3,object:[new Marble3(15,840,440,!0,2.8,-2,"zigzag",300,600),new Marble3(15,1e3,440,!0,2.8,-2,"zigzag",300,600)]},{time:9500,object:[new Kraken(100,840,390,!0,2,-3,"zigzag",500,600)]},{time:75200,object:[new Boss5]}];
const enemiesLvl6=[{time:2e3,object:[new Triship(15,840,350,!1,6),new Triship(15,980,300,!1,6)]},{time:1e4,object:[new PowerUp(840,240,4,0,"linear")]},{time:61e3,object:[new Boss6]}];
const enemiesLvl7=[{time:2e3,object:[new Kraken(25,840,100,!0,3,.05,"wave",40,100),new Kraken(25,840,320,!0,5,.06,"wave",40,320)]},{time:52e3,object:[new Boss7]}];
const enemiesLvl8=[{time:2e3,object:[new Squid(70,840,70,!1,3),new Squid(70,840,170,!1,3)]},{time:12050,object:[new Boss8]}];

// --- 7. GAME STATE MACHINE & ANIMATION LOOP ---
function setState(newState) { gameState = newState; mainMenu.hidden = newState !== 'MainMenu'; gameUI.hidden = newState !== 'Game' && newState !== 'Paused'; pauseMenu.hidden = newState !== 'Paused'; gameOverMenu.hidden = newState !== 'GameOver'; }
function gameStart() { lives = 4; playerScore = 0; specialCount = 3; currentLevel = new Level(1, true); setState('Game'); if (!animationFrameId) animate(0); }
function handleGameOver() { finalScoreEl.textContent = `FINAL SCORE: ${playerScore.toString().padStart(6, "0")}`; gameOverTitleEl.textContent = lives > 0 ? "VICTORY" : "GAME OVER"; setState('GameOver'); }
function animate(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    bgCtx.fillStyle = isLevelDark ? TMM_COLORS.BG_DARK : TMM_COLORS.BG_LIGHT;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    particles.forEach(p=>p.update());
    particles.forEach(p=>p.draw());

    if (gameState === 'Game') {
        currentLevel.update(deltaTime);
        currentLevel.draw();
        currentLevel.ui.draw();
    }
    
    animationFrameId = requestAnimationFrame(animate);
}

// --- 8. EVENT LISTENERS & INITIALIZATION ---
playButton.addEventListener('click', gameStart);
restartButton.addEventListener('click', gameStart);
pauseButton.addEventListener('click', () => { if (gameState === 'Game') setState('Paused'); });
resumeButton.addEventListener('click', () => { if (gameState === 'Paused') setState('Game'); });
exitButtonPause.addEventListener('click', () => { setState('MainMenu'); });
exitButtonMain.addEventListener('click', () => { window.close(); }); // Or a more appropriate exit action

const TMM_FONTS = { SANS: 'Helvetica Neue, sans-serif', MONO: 'Menlo, monospace' };

setState('MainMenu');
animate(0);