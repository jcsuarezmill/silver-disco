// ===================================
// START OF UPDATED game.js
// ===================================
(function() {
    // Game Elements
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const allUI = document.querySelectorAll('.game-ui');
    const startScreenOverlay = document.getElementById('start-screen-overlay');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const gameOverMessage = document.getElementById('game-over-message');
    const gameWinOverlay = document.getElementById('game-win-overlay');
    const gameWinMessage = document.getElementById('game-win-message');
    const playButton = document.getElementById('play-button');
    const soundToggleButton = document.getElementById('sound-toggle-button');
    const restartButtonGameOver = document.getElementById('restartButtonGameOver');
    const restartButtonWin = document.getElementById('restartButtonWin');
    // We no longer need the touchControlsContainer

    // Constants
    const GAME_CONSTANTS = {
      WIDTH: 800, HEIGHT: 450, GROUND_LEVEL: 450 - 50,
      LEVEL_WIDTH: 800 * 5, GRAVITY: 0.5, PLAYER_SPEED: 4, PLAYER_JUMP_POWER: 12,
      PLAYER_MAX_LIFE: 10, PLAYER_INVULNERABLE_DURATION: 60, GAME_TIMER_DURATION: 120,
      SHOOT_COOLDOWN: 250, ZOMBIE_SPAWN_INTERVAL: 75, ROCKET_COST: 15,
      SHOTGUN_COOLDOWN: 600, LASER_COOLDOWN: 400, GRENADE_COOLDOWN: 800, CHAINGUN_COOLDOWN: 80, RAILGUN_MAX_CHARGE_TIME: 120,
      AMMO_DROP_CHANCE: 0.5, AMMO_DROP_AMOUNT: 5, HELICOPTER_DURATION: 600, HELICOPTER_FIRE_RATE: 10,
      HELICOPTER_BOMB_COOLDOWN: 150, HELICOPTER_ROCKET_COOLDOWN: 200,
    };

    const MESSAGES = {
        timeOut: ["The rocket couldn't wait forever, Harold. You're now part of the city's permanent collection.","Too slow, Harold. The city's clock has officially run out on you.","You hesitated for a second too long, Harold. The rocket didn't.","Your escape window has closed, Harold. Their feeding window has just opened.","That one detour cost you everything, Harold. The rocket left without you.","The countdown reached zero, Harold, and so did your chances.","You spent too much time looking back, Harold. The future left without you.","You missed the launch, Harold. The monsters send their regards.","Time's up, Harold. The escape route is now a buffet line, and you're first.","You'll never be late again, Harold. You'll also never be... not a zombie.","The rocket is gone, Harold. And so is your hope."],
        monsterDeath: ["Your escape plan ended abruptly, Harold. And bloodily.","You zigged when you should have zagged, Harold. The horde was waiting.","Your will was strong, Harold, but their hunger was stronger.","They got you, Harold. Overwhelmed, outsmarted, and overeaten.","Your screams became their dinner bell, Harold.","A grisly end. You fought well, Harold, but they were relentless.","You're one of them now, Harold. Shambling and groaning with the rest.","Turns out their claws were sharper than your wits, Harold.","Your great escape just turned into their great feast, Harold.","That's a wrap for you, Harold. A monster-food wrap.","You've been decommissioned, Harold. Violently.","You gambled and lost, Harold. The house always wins. And bites."],
        win: ["Victory, Harold! You can watch the city of monsters shrink into a bad memory.","Blast off! You're trading nightmares for starry skies, Harold.","A perfect escape. The city is in your rearview mirror, and you are free, Harold.","Success! You can finally catch your breath, Harold.","You did it, Harold. The Great Escape was a success.","One small step for you, Harold, one giant leap from a city of hungry jaws.","You're a legend, Harold! The one that got away.","Enjoy it, Harold. Freedom smells like rocket fuel and sweet, sweet relief.","The city is a shrinking dot, Harold, and your future is a blank page.","Launch successful! You left the apocalypse in your dust, Harold.","You beat the odds and lived to tell the tale. Good work, Harold.","Safe at last, Harold. The screams of the city can't reach you up here."]
    };

    ctx.imageSmoothingEnabled = false;
    canvas.width = GAME_CONSTANTS.WIDTH;
    canvas.height = GAME_CONSTANTS.HEIGHT;

    // Game State
    let isTouchDevice = false;
    let gameState = 'START_MENU';
    let isSoundEnabled = true;
    let keys = { left: false, right: false, up: false, shoot: false };
    let canShoot = true, haroldCoins = 0, monstersKilled = 0, cameraX = 0, cameraY = 0;
    let winSequenceTimer = 0, particles = [], uiMessage = { text: '', timer: 0 }, callIconEffect = { timer: 0 };
    let gameTimer = GAME_CONSTANTS.GAME_TIMER_DURATION;
    let timerInterval = null;
    let cameraShake = { intensity: 0, duration: 0 };

    // --- NEW: On-screen touch control state ---
    const touchControls = {
        left:  { x: 80,  y: 420, radius: 35, key: 'left',  label: 'L', pressed: false },
        right: { x: 170, y: 420, radius: 35, key: 'right', label: 'R', pressed: false },
        jump:  { x: 720, y: 420, radius: 35, key: 'up',    label: 'B', pressed: false },
        shoot: { x: 630, y: 420, radius: 35, key: 'shoot', label: 'A', pressed: false }
    };

    const audioManager = {
        sounds: {},
        isBgmPlaying: false,
        init() {
            this.sounds.shoot = new Audio('sounds/shoot.wav'); this.sounds.zombieHit = new Audio('sounds/zombie_hit.wav'); this.sounds.carPass = new Audio('sounds/chaingun_fire.wav'); this.sounds.rocketLaunch = new Audio('sounds/rocket_launch.wav'); this.sounds.coinGet = new Audio('sounds/coin_get.wav'); this.sounds.doorOpen = new Audio('sounds/ammo_get.wav'); this.sounds.spit = new Audio('sounds/grenade_launch.wav'); this.sounds.shotgunFire = new Audio('sounds/shotgun_fire.wav'); this.sounds.ammoGet = new Audio('sounds/ammo_get.wav'); this.sounds.laserFire = new Audio('sounds/laser_fire.wav'); this.sounds.grenadeLaunch = new Audio('sounds/grenade_launch.wav'); this.sounds.explosion = new Audio('sounds/explosion.wav'); this.sounds.chaingunFire = new Audio('sounds/chaingun_fire.wav'); this.sounds.railgunCharge = new Audio('sounds/railgun_charge.wav'); this.sounds.railgunFire = new Audio('sounds/railgun_fire.wav'); this.sounds.bulletHit = new Audio('sounds/zombie_hit.wav'); this.sounds.radioActivate = new Audio('sounds/railgun_charge.wav'); this.sounds.helicopterFire = new Audio('sounds/chaingun_fire.wav'); this.sounds.helicopterLoop = new Audio('sounds/helicopter.wav'); this.sounds.bgm = new Audio('sounds/bgm.mp3');
            this.sounds.shotgunFire.volume = 0.7; this.sounds.explosion.volume = 0.8; this.sounds.rocketLaunch.volume = 0.9; this.sounds.railgunFire.volume = 0.8; this.sounds.shoot.volume = 0.4; this.sounds.laserFire.volume = 0.4; this.sounds.grenadeLaunch.volume = 0.6; this.sounds.chaingunFire.volume = 0.2; this.sounds.coinGet.volume = 0.5; this.sounds.ammoGet.volume = 0.6; this.sounds.doorOpen.volume = 0.7; this.sounds.railgunCharge.volume = 0.5; this.sounds.radioActivate.volume = 0.8; this.sounds.zombieHit.volume = 0.5; this.sounds.bulletHit.volume = 0.5; this.sounds.spit.volume = 0.4; this.sounds.carPass.volume = 0.1; this.sounds.helicopterLoop.volume = 0.4; this.sounds.bgm.volume = 0.2; this.sounds.bgm.loop = true; this.sounds.helicopterLoop.loop = true;
        },
        play(soundName) { if (isSoundEnabled && this.sounds[soundName]) { this.sounds[soundName].currentTime = 0; this.sounds[soundName].play().catch(e => { console.error(`Could not play sound: ${soundName}`, e); }); } },
        stop(soundName) { if (this.sounds[soundName]) { this.sounds[soundName].pause(); this.sounds[soundName].currentTime = 0; } },
        startBgm() { if (isSoundEnabled && !this.isBgmPlaying) { this.play('bgm'); this.isBgmPlaying = true; } },
        stopAll() { for (const key in this.sounds) { this.stop(key); } this.isBgmPlaying = false; }
    };
    
    // Core game entities
    let enemies = [], projectiles = [], coins = [], spitProjectiles = [], ammoDrops = [], laserBeams = [], grenades = [], explosions = [], bombs = [], rocketProjectiles = [];
    let fogParticles = [];
    const harold = { x: 50, y: GAME_CONSTANTS.GROUND_LEVEL - 64, width: 32, height: 64, velocityX: 0, velocityY: 0, speed: GAME_CONSTANTS.PLAYER_SPEED, jumpPower: GAME_CONSTANTS.PLAYER_JUMP_POWER, onGround: false, isJumping: false, direction: 'right', life: GAME_CONSTANTS.PLAYER_MAX_LIFE, maxLife: GAME_CONSTANTS.PLAYER_MAX_LIFE, shotgunAmmo: 0, laserAmmo: 0, grenadeAmmo: 0, chaingunAmmo: 0, railgunAmmo: 0, isChargingRailgun: false, railgunCharge: 0, invulnerableTimer: 0, spriteSheet: null, active: true, frames: { idle_right: [{ x: 0, y: 0, w: 32, h: 64 }], idle_left: [{ x: 32, y: 0, w: 32, h: 64 }], walk_right: [{ x: 0, y: 64, w: 32, h: 64 }, { x: 32, y: 64, w: 32, h: 64 }, { x: 64, y: 64, w: 32, h: 64 }, { x: 96, y: 64, w: 32, h: 64 }], walk_left: [{ x: 0, y: 128, w: 32, h: 64 }, { x: 32, y: 128, w: 32, h: 64 }, { x: 64, y: 128, w: 32, h: 64 }, { x: 96, y: 128, w: 32, h: 64 }], jump_right: [{ x: 64, y: 0, w: 32, h: 64 }], jump_left: [{ x: 96, y: 0, w: 32, h: 64 }] }, currentFrameSet: 'idle_right', currentFrameIndex: 0, animationTimer: 0, animationSpeed: 8, draw() { if (!this.spriteSheet || !this.active) { return; } const frameData = this.frames[this.currentFrameSet][this.currentFrameIndex]; if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 5) % 2 === 0) { ctx.globalAlpha = 0.4; } ctx.drawImage(this.spriteSheet, frameData.x, frameData.y, frameData.w, frameData.h, this.x, this.y, this.width, this.height); ctx.globalAlpha = 1; this.drawWeapon(); this.drawChargeMeter(); }, drawWeapon() { const gunX = this.direction === 'right' ? this.x + this.width - 12 : this.x - 4; const gunY = this.y + this.height / 2 + 2; if (this.grenadeAmmo > 0) { ctx.fillStyle = '#445544'; ctx.fillRect(gunX - 2, gunY - 4, 28, 12); ctx.fillStyle = '#223322'; ctx.fillRect(gunX + 18, gunY - 2, 8, 8); } else if (this.railgunAmmo > 0) { ctx.fillStyle = '#333'; ctx.fillRect(gunX, gunY, 30, 5); ctx.fillStyle = '#f055ff'; for (let i = 0; i < 3; i++) { ctx.fillRect(gunX + 5 + i * 8, gunY - 2, 4, 9); } } else if (this.laserAmmo > 0) { ctx.fillStyle = '#999'; ctx.fillRect(gunX, gunY, 20, 4); ctx.fillStyle = '#00ffff'; ctx.fillRect(gunX + 10, gunY - 2, 6, 8); } else if (this.shotgunAmmo > 0) { ctx.fillStyle = '#654321'; ctx.fillRect(gunX, gunY, 24, 6); ctx.fillStyle = '#444'; ctx.fillRect(gunX + 2, gunY-2, 4, 2); } else if (this.chaingunAmmo > 0) { ctx.fillStyle = '#555'; ctx.fillRect(gunX, gunY, 22, 10); ctx.fillStyle = '#333'; for(let i=0; i<4; i++) ctx.fillRect(gunX+i*5, gunY, 3, 3); } else { ctx.fillStyle = '#444'; ctx.fillRect(gunX, gunY, 16, 8); ctx.fillStyle = '#666'; ctx.fillRect(gunX + 4, gunY - 3, 4, 3); } }, drawChargeMeter() { if (this.isChargingRailgun) { const meterWidth = 30; const meterHeight = 5; const meterX = this.x + (this.width - meterWidth) / 2; const meterY = this.y - 10; ctx.fillStyle = '#333'; ctx.fillRect(meterX, meterY, meterWidth, meterHeight); const chargeWidth = (this.railgunCharge / GAME_CONSTANTS.RAILGUN_MAX_CHARGE_TIME) * meterWidth; ctx.fillStyle = `hsl(${120 * (chargeWidth/meterWidth)}, 100%, 50%)`; ctx.fillRect(meterX, meterY, chargeWidth, meterHeight); } }, updateAnimation() { this.animationTimer++; if (this.animationTimer >= this.animationSpeed) { this.animationTimer = 0; this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frames[this.currentFrameSet].length; } }, setAnimation(name) { if (this.currentFrameSet !== name) { this.currentFrameSet = name; this.currentFrameIndex = 0; this.animationTimer = 0; } }, takeDamage() { if (this.invulnerableTimer > 0) return; this.life--; this.invulnerableTimer = GAME_CONSTANTS.PLAYER_INVULNERABLE_DURATION; updateUI(); if (this.life <= 0) endGame(false, "monsterDeath"); }, getRect() { return {x: this.x, y: this.y, width: this.width, height: this.height }; } };
    const helicopter = { x: 0, y: 50, width: 170, height: 60, active: false, lifespan: 0, shootTimer: 0, bombTimer: 0, rocketTimer: 0, animationTimer: 0, direction: 'right', targetX: 0, speed: 3 };
    function createHaroldSpriteSheet() { const spriteCanvas = document.createElement('canvas'); spriteCanvas.width = 128; spriteCanvas.height = 192; const sCtx = spriteCanvas.getContext('2d'); sCtx.imageSmoothingEnabled = false; const skin = '#f0c0a0', shirt = '#007bff', pants = '#333333', hair = '#a9a9a9', eye = '#000000'; function drawPixelHarold(ctx, x_offset, y_offset, pose, frameNum = 0) { ctx.fillStyle = skin; ctx.fillRect(x_offset + 8, y_offset, 16, 16); ctx.fillStyle = hair; ctx.fillRect(x_offset + 6, y_offset - 2, 20, 4); ctx.fillRect(x_offset + 8, y_offset + 2, 16, 2); ctx.fillStyle = eye; ctx.fillRect(x_offset + 12, y_offset + 6, 2, 2); ctx.fillRect(x_offset + 18, y_offset + 6, 2, 2); ctx.fillStyle = '#000'; ctx.fillRect(x_offset + 12, y_offset + 12, 8, 1); ctx.fillStyle = shirt; ctx.fillRect(x_offset + 4, y_offset + 16, 24, 24); ctx.fillStyle = pants; ctx.fillRect(x_offset + 4, y_offset + 40, 24, 12); const leg_y = y_offset + 52; if (pose.startsWith('walk')) { if (frameNum % 2 === 0) { ctx.fillRect(x_offset + 6, leg_y, 8, 12); ctx.fillRect(x_offset + 18, leg_y, 8, 10); } else { ctx.fillRect(x_offset + 6, leg_y, 8, 10); ctx.fillRect(x_offset + 18, leg_y, 8, 12); } } else if (pose.startsWith('jump')) { ctx.fillRect(x_offset + 6, leg_y, 8, 10); ctx.fillRect(x_offset + 18, leg_y, 8, 10); } else { ctx.fillRect(x_offset + 6, leg_y, 8, 12); ctx.fillRect(x_offset + 18, leg_y, 8, 12); } } drawPixelHarold(sCtx, 0, 2, 'idle_right'); drawPixelHarold(sCtx, 32, 2, 'idle_left'); drawPixelHarold(sCtx, 64, 2, 'jump_right'); drawPixelHarold(sCtx, 96, 2, 'jump_left'); for (let i = 0; i < 4; i++) { drawPixelHarold(sCtx, i * 32, 64 + 2, 'walk_right', i); } for (let i = 0; i < 4; i++) { drawPixelHarold(sCtx, i * 32, 128 + 2, 'walk_left', i); } const image = new Image(); image.src = spriteCanvas.toDataURL(); image.onload = () => { harold.spriteSheet = image; }; }
    const rocket = { x: GAME_CONSTANTS.LEVEL_WIDTH - 150, y: GAME_CONSTANTS.GROUND_LEVEL - 200, width: 100, height: 200, doorOpenRatio: 0, velocityY: 0 };
    function drawRocket() { ctx.fillStyle = '#c0c0c0'; ctx.beginPath(); ctx.moveTo(rocket.x + rocket.width / 2, rocket.y); ctx.lineTo(rocket.x, rocket.y + rocket.height * 0.2); ctx.lineTo(rocket.x, rocket.y + rocket.height); ctx.lineTo(rocket.x + rocket.width, rocket.y + rocket.height); ctx.lineTo(rocket.x + rocket.width, rocket.y + rocket.height * 0.2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#70c5ce'; ctx.beginPath(); ctx.arc(rocket.x + rocket.width / 2, rocket.y + 60, 20, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = '#ff4d4d'; ctx.fillRect(rocket.x - 20, rocket.y + rocket.height - 50, 20, 50); ctx.fillRect(rocket.x + rocket.width, rocket.y + rocket.height - 50, 20, 50); const doorWidth = 30; const doorHeight = 60; const doorX = rocket.x + (rocket.width - doorWidth) / 2; const doorY = rocket.y + rocket.height - doorHeight - 10; if (rocket.doorOpenRatio > 0) { ctx.fillStyle = '#000'; ctx.fillRect(doorX, doorY, doorWidth, doorHeight); } ctx.fillStyle = '#999'; ctx.fillRect(doorX, doorY, doorWidth, doorHeight * (1 - rocket.doorOpenRatio)); }
    class Projectile { constructor(x, y, {vx = 0, vy = 0, color = '#ffff00', width=10, height=4, piercing=false, damage=1}={}) { this.x = x; this.y = y; this.width = width; this.height = height; this.color = color; this.active = true; this.vx = vx; this.vy = vy; this.piercing = piercing; this.damage = damage; } update() { this.x += this.vx; this.y += this.vy; if (this.x < cameraX - 20 || this.x > cameraX + GAME_CONSTANTS.WIDTH + 20) this.active = false; return null; } draw() { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.width, this.height); } getRect() { return { x: this.x, y: this.y, width: this.width, height: this.height }; } }
    class Enemy { constructor(x, y, direction) { this.x = x; this.y = y; this.direction = direction; this.active = true; this.isCollidingWithPlayer = false; this.animationTimer = 0; }
        getRect() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
        hit(damage) {
            this.health -= damage; audioManager.play('zombieHit');
            if (this.health <= 0) {
                monstersKilled++; this.active = false;
                if (Math.random() < 0.3) { coins.push(new Coin(this.x + this.width / 2, this.y + this.height / 2)); }
                if (Math.random() < GAME_CONSTANTS.AMMO_DROP_CHANCE) {
                    const dropRand = Math.random(); let dropType;
                    if (dropRand < 0.22) dropType = 'shotgun'; else if (dropRand < 0.44) dropType = 'laser'; else if (dropRand < 0.66) dropType = 'chaingun'; else if (dropRand < 0.88) dropType = 'grenade'; else dropType = 'radio';
                    ammoDrops.push(new AmmoDrop(this.x + this.width / 2, this.y + this.height / 2, dropType, dropType === 'radio' ? 1 : GAME_CONSTANTS.AMMO_DROP_AMOUNT));
                }
            }
        }
        update() { const moveDirection = this.direction === 'left' ? -1 : 1; if (!this.isCollidingWithPlayer) this.x += this.speed * moveDirection; this.animationTimer++; if (this.animationTimer >= this.animationSpeed) { this.animationTimer = 0; this.frameIndex = (this.frameIndex + 1) % this.frames; } if (this.x > cameraX + GAME_CONSTANTS.WIDTH + 100 || this.x < cameraX - 100) this.active = false; this.isCollidingWithPlayer = false; return null; }
        draw() { if (!this.spriteSheet) { return; } const frameX = this.frameIndex * this.width; ctx.save(); ctx.translate(this.x, this.y); if (this.direction === 'right') { ctx.scale(-1, 1); ctx.translate(-this.width, 0); } ctx.drawImage(this.spriteSheet, frameX, 0, this.width, this.height, 0, 0, this.width, this.height); ctx.restore(); if (this.isCollidingWithPlayer) { ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 2; ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4); } }
    }
    class Walker extends Enemy { constructor(x, y, direction) { super(x, y, direction); this.width = 32; this.height = 64; this.speed = 1.2 + Math.random() * 0.8; this.health = 2; this.animationSpeed = 12; this.frames = 2; this.frameIndex = 0; this.spriteSheet = walkerSpriteSheet; } }
    class Runner extends Enemy { constructor(x, y, direction) { super(x, y, direction); this.width = 28; this.height = 56; this.speed = 3.5 + Math.random(); this.health = 1; this.animationSpeed = 6; this.frames = 2; this.frameIndex = 0; this.spriteSheet = runnerSpriteSheet; } }
    class Brute extends Enemy {
        constructor(x, y, direction) {
            super(x, y, direction); this.width = 48; this.height = 72;
            this.speed = 0.8 + Math.random() * 0.2; this.health = 8;
            this.animationSpeed = 20; this.frames = 2; this.frameIndex = 0;
            this.spriteSheet = bruteSpriteSheet;
        }
        hit(damage) {
            this.health -= damage; audioManager.play('zombieHit');
            if (this.health <= 0) {
                monstersKilled++; this.active = false;
                if (Math.random() < 0.3) { const numCoins = Math.floor(Math.random() * 5) + 1; for (let i = 0; i < numCoins; i++) { coins.push(new Coin(this.x + this.width / 2 + (Math.random() - 0.5) * 30, this.y + this.height / 2 + (Math.random() - 0.5) * 20)); } }
                if (Math.random() < GAME_CONSTANTS.AMMO_DROP_CHANCE * 1.5) { 
                    const dropRand = Math.random(); let dropType;
                    if (dropRand < 0.22) dropType = 'shotgun'; else if (dropRand < 0.44) dropType = 'laser'; else if (dropRand < 0.66) dropType = 'chaingun'; else if (dropRand < 0.88) dropType = 'grenade'; else dropType = 'radio';
                    ammoDrops.push(new AmmoDrop(this.x + this.width / 2, this.y + this.height / 2, dropType, dropType === 'radio' ? 1 : GAME_CONSTANTS.AMMO_DROP_AMOUNT + 2));
                }
            }
        }
    }
    class Spitter extends Enemy { constructor(x, y, direction) { super(x, y, direction); this.width = 32; this.height = 60; this.speed = 0; this.health = 3; this.animationSpeed = 20; this.frames = 2; this.frameIndex = 0; this.spriteSheet = spitterSpriteSheet; this.shootCooldown = 180; this.shootTimer = Math.random() * 180; }
        update() { super.update(); this.shootTimer++; if (this.shootTimer >= this.shootCooldown) { const dx = harold.x - this.x; const dy = harold.y - this.y; const dist = Math.sqrt(dx*dx + dy*dy); if (dist < 400) { this.shootTimer = 0; spitProjectiles.push(new Spit(this.x, this.y + 20, dx / dist, dy / dist)); audioManager.play('spit'); } } return null; }
    }
    class Screecher extends Enemy { constructor(x, y, direction) { super(x, y, direction); this.baseY = y; this.width = 40; this.height = 24; this.speed = 2.5 + Math.random(); this.health = 1; this.animationSpeed = 10; this.frames = 2; this.frameIndex = 0; this.spriteSheet = screecherSpriteSheet; }
        update() { super.update(); this.y = this.baseY + Math.sin(this.animationTimer * 0.1) * 20; return null; }
    }
    class Mutant extends Enemy { constructor(x, y, direction, generation = 0) { super(x, y, direction); this.generation = generation; this.maxGeneration = 1; this.width = 40 - generation * 10; this.height = 40 - generation * 10; this.speed = 1 + generation * 0.5; this.health = 4 - generation * 2; this.animationSpeed = 15; this.frames = 2; this.frameIndex = 0; this.spriteSheet = mutantSpriteSheet; this.isReviving = false; this.reviveTimer = 0; this.reviveDuration = 180; }
        hit(damage) { if (this.isReviving) return; this.health -= damage; audioManager.play('zombieHit'); if (this.health <= 0) { if (this.generation < this.maxGeneration) { this.isReviving = true; this.reviveTimer = this.reviveDuration; } else { monstersKilled++; this.active = false; if (Math.random() < 0.5) { coins.push(new Coin(this.x + this.width / 2, this.y + this.height / 2)); } if (Math.random() < GAME_CONSTANTS.AMMO_DROP_CHANCE) { const dropType = Math.random() < 0.5 ? 'shotgun' : 'laser'; ammoDrops.push(new AmmoDrop(this.x + this.width / 2, this.y + this.height / 2, dropType, GAME_CONSTANTS.AMMO_DROP_AMOUNT)); } } } }
        update() { if (this.isReviving) { this.reviveTimer--; if (this.reviveTimer <= 0) { this.active = false; const childGeneration = this.generation + 1; const childHeight = 40 - childGeneration * 10; const childY = GAME_CONSTANTS.GROUND_LEVEL - childHeight; const child1 = new Mutant(this.x - 10, childY, 'left', childGeneration); const child2 = new Mutant(this.x + 10, childY, 'right', childGeneration); return [child1, child2]; } return null; } else { return super.update(); } }
        draw() { if (this.isReviving) { ctx.save(); ctx.globalAlpha = Math.abs(Math.sin(this.reviveTimer * 0.1)); ctx.fillStyle = '#5a6a35'; const size = this.width * (this.reviveTimer / this.reviveDuration); ctx.fillRect(this.x + (this.width - size)/2, this.y + this.height - size, size, size); ctx.restore(); } else { super.draw(); } }
    }
    let walkerSpriteSheet, runnerSpriteSheet, bruteSpriteSheet, spitterSpriteSheet, screecherSpriteSheet, mutantSpriteSheet;
    function createAllEnemySpriteSheets() {
        walkerSpriteSheet = document.createElement('canvas'); walkerSpriteSheet.width = 64; walkerSpriteSheet.height = 64; const wCtx = walkerSpriteSheet.getContext('2d');
        for(let frame=0; frame<2; frame++) { const xOffset = frame * 32; wCtx.fillStyle = '#346a44'; wCtx.fillRect(xOffset + 4, 0, 24, 64); wCtx.fillStyle = '#24432f'; wCtx.fillRect(xOffset + 8, 0, 16, 24); wCtx.fillStyle = '#9ccc65'; wCtx.fillRect(xOffset + 10, 10, 4, 4); wCtx.fillRect(xOffset + 18, 10, 4, 4); if(frame === 0) { wCtx.fillRect(xOffset + 0, 20, 6, 14); wCtx.fillRect(xOffset + 26, 30, 6, 14); } else { wCtx.fillRect(xOffset + 0, 30, 6, 14); wCtx.fillRect(xOffset + 26, 20, 6, 14); } }
        runnerSpriteSheet = document.createElement('canvas'); runnerSpriteSheet.width = 56; runnerSpriteSheet.height = 56; const rCtx = runnerSpriteSheet.getContext('2d');
        for(let frame=0; frame<2; frame++) { const xOffset = frame * 28; rCtx.fillStyle = '#8f9779'; rCtx.fillRect(xOffset + 4, 0, 20, 56); rCtx.fillStyle = '#5c614f'; rCtx.fillRect(xOffset + 6, 0, 16, 20); rCtx.fillStyle = '#ffdfba'; rCtx.fillRect(xOffset + 8, 8, 3, 3); rCtx.fillRect(xOffset + 17, 8, 3, 3); if(frame === 0) { rCtx.fillRect(xOffset + 0, 18, 5, 12); rCtx.fillRect(xOffset + 22, 28, 5, 12); } else { rCtx.fillRect(xOffset + 0, 28, 5, 12); rCtx.fillRect(xOffset + 22, 18, 5, 12); } }
        bruteSpriteSheet = document.createElement('canvas'); bruteSpriteSheet.width = 96; bruteSpriteSheet.height = 72; const bCtx = bruteSpriteSheet.getContext('2d');
        for(let frame=0; frame<2; frame++) { const xOffset = frame * 48; bCtx.fillStyle = '#6a5e8c'; bCtx.fillRect(xOffset + 4, 0, 40, 72); bCtx.fillStyle = '#493f61'; bCtx.fillRect(xOffset + 8, 0, 32, 28); bCtx.fillStyle = '#c73e3a'; bCtx.fillRect(xOffset + 14, 12, 6, 6); bCtx.fillRect(xOffset + 28, 12, 6, 6); if(frame === 0) { bCtx.fillRect(xOffset - 4, 26, 12, 20); bCtx.fillRect(xOffset + 40, 36, 12, 20); } else { bCtx.fillRect(xOffset - 4, 36, 12, 20); bCtx.fillRect(xOffset + 40, 26, 12, 20); } }
        spitterSpriteSheet = document.createElement('canvas'); spitterSpriteSheet.width = 64; spitterSpriteSheet.height = 60; const sCtx = spitterSpriteSheet.getContext('2d');
        for(let frame=0; frame<2; frame++) { const xOffset = frame * 32; sCtx.fillStyle = '#7a978f'; sCtx.fillRect(xOffset + 2, 0, 28, 60); sCtx.fillStyle = '#536862'; sCtx.fillRect(xOffset + 4, 0, 24, 30); sCtx.fillStyle = '#81e2ff'; sCtx.fillRect(xOffset + 8, 10, 4, 4); sCtx.fillRect(xOffset + 20, 10, 4, 4); if (frame === 1) { sCtx.fillStyle='#39c769'; sCtx.fillRect(xOffset + 12, 22, 8, 8); } }
        screecherSpriteSheet = document.createElement('canvas'); screecherSpriteSheet.width = 80; screecherSpriteSheet.height = 24; const scCtx = screecherSpriteSheet.getContext('2d');
        for(let frame=0; frame<2; frame++) { const xOffset = frame * 40; const bodyColor = '#5c3a5e'; const wingColor = '#4a2c4a'; const eyeColor = '#ff0000'; scCtx.fillStyle = bodyColor; scCtx.fillRect(xOffset+15, 2, 10, 20); scCtx.fillStyle = eyeColor; scCtx.fillRect(xOffset+18, 10, 4, 4); scCtx.fillStyle = wingColor; if(frame === 0) { scCtx.beginPath(); scCtx.moveTo(xOffset+15, 2); scCtx.lineTo(xOffset, 12); scCtx.lineTo(xOffset+15, 18); scCtx.fill(); scCtx.beginPath(); scCtx.moveTo(xOffset+25, 2); scCtx.lineTo(xOffset+40, 12); scCtx.lineTo(xOffset+25, 18); scCtx.fill(); } else { scCtx.beginPath(); scCtx.moveTo(xOffset+15, 8); scCtx.lineTo(xOffset, 0); scCtx.lineTo(xOffset+15, 2); scCtx.fill(); scCtx.beginPath(); scCtx.moveTo(xOffset+25, 8); scCtx.lineTo(xOffset+40, 0); scCtx.lineTo(xOffset+25, 2); scCtx.fill(); } }
        mutantSpriteSheet = document.createElement('canvas'); mutantSpriteSheet.width = 80; mutantSpriteSheet.height = 40; const mCtx = mutantSpriteSheet.getContext('2d');
        for(let frame=0; frame<2; frame++) { const xOffset = frame * 40; const bodyColor = '#6b7d3f'; const shadowColor = '#5a6a35'; const eyeColor = '#ffff99'; mCtx.fillStyle = shadowColor; mCtx.fillRect(xOffset+2, 20, 36, 20); mCtx.fillStyle = bodyColor; mCtx.beginPath(); mCtx.arc(xOffset+20, 20, 18, Math.PI, Math.PI*2); mCtx.fill(); mCtx.fillStyle = eyeColor; if (frame === 0) { mCtx.fillRect(xOffset+12, 15, 4, 4); mCtx.fillRect(xOffset+24, 18, 4, 4); mCtx.fillStyle = shadowColor; mCtx.fillRect(xOffset+5, 38, 10, 2); mCtx.fillRect(xOffset+25, 36, 10, 4); } else { mCtx.fillRect(xOffset+12, 18, 4, 4); mCtx.fillRect(xOffset+24, 15, 4, 4); mCtx.fillStyle = shadowColor; mCtx.fillRect(xOffset+5, 36, 10, 4); mCtx.fillRect(xOffset+25, 38, 10, 2); } }
    }
    class Spit { constructor(x, y, vx, vy) { this.x = x; this.y = y; this.vx = vx * 4; this.vy = vy * 4; this.radius = 6; this.active = true; } update() { this.x += this.vx; this.y += this.vy; if (this.y > GAME_CONSTANTS.GROUND_LEVEL) this.active = false; } draw() { ctx.fillStyle = '#39c769'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); } getRect() { return { x: this.x - this.radius, y: this.y - this.radius, width: this.radius*2, height: this.radius*2 }; } }
    class Vehicle { constructor() { this.width = 60 + Math.random() * 40; this.height = 30 + Math.random() * 10; this.speed = (2 + Math.random() * 2) * (Math.random() < 0.5 ? 1 : -1); this.y = GAME_CONSTANTS.GROUND_LEVEL - 50 - this.height + Math.random() * 20; this.color = `hsl(${Math.random() * 60}, 60%, 50%)`; this.x = this.speed > 0 ? -this.width : GAME_CONSTANTS.LEVEL_WIDTH; } update() { this.x += this.speed; if ((this.speed > 0 && this.x > GAME_CONSTANTS.LEVEL_WIDTH) || (this.speed < 0 && this.x < -this.width)) { this.x = this.speed > 0 ? -this.width : GAME_CONSTANTS.LEVEL_WIDTH; } if (Math.random() < 0.005) { audioManager.play('carPass'); } } draw() { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.width, this.height); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 10); } }
    let vehicles = Array.from({length: 10}, () => new Vehicle());
    class Coin { constructor(x, y) { this.x = x; this.y = y; this.width = 16; this.height = 16; this.velocityY = -3; this.active = true; } update() { this.velocityY += GAME_CONSTANTS.GRAVITY * 0.5; this.y += this.velocityY; if (this.y + this.height > GAME_CONSTANTS.GROUND_LEVEL) { this.y = GAME_CONSTANTS.GROUND_LEVEL - this.height; this.velocityY = 0; } } draw() { ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(this.x, this.y + this.height/2, this.width / 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#1a1a2d'; ctx.font = 'bold 10px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', this.x, this.y + this.height/2 + 1); } getRect() { return { x: this.x - this.width/2, y: this.y, width: this.width, height: this.height }; } }
    class AmmoDrop { constructor(x, y, type, amount) { this.x = x; this.y = y; this.width = 24; this.height = 16; this.type = type; this.amount = amount; this.velocityY = -3; this.active = true; } update() { this.velocityY += GAME_CONSTANTS.GRAVITY * 0.5; this.y += this.velocityY; if (this.y + this.height > GAME_CONSTANTS.GROUND_LEVEL) { this.y = GAME_CONSTANTS.GROUND_LEVEL - this.height; this.velocityY = 0; } } draw() { const colors = {'shotgun': '#D2691E', 'laser': '#3b82f6', 'grenade': '#22c55e', 'chaingun': '#a8a29e', 'railgun': '#a855f7', 'radio': '#f59e0b'}; const letters = {'shotgun': 'S', 'laser': 'L', 'grenade': 'G', 'chaingun': 'C', 'railgun': 'R', 'radio':'★'}; const baseColors = {'shotgun': '#8B4513', 'laser': '#222255', 'grenade': '#15803d', 'chaingun': '#44403c', 'railgun': '#6b21a8', 'radio': '#b45309'}; ctx.fillStyle = baseColors[this.type]; ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height); ctx.fillStyle = colors[this.type]; ctx.fillRect(this.x - this.width / 2 + 2, this.y + 2, this.width - 4, this.height - 4); ctx.fillStyle = 'white'; ctx.font = 'bold 10px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(letters[this.type], this.x, this.y + this.height / 2 + 1); } getRect() { return { x: this.x - this.width/2, y: this.y, width: this.width, height: this.height }; } }
    class Grenade { constructor(x, y, { vx = null, vy = null, direction = 'right' }) { this.x = x; this.y = y; this.width = 8; this.height = 8; this.vx = vx !== null ? vx : 4 * (direction === 'right' ? 1 : -1); this.vy = vy !== null ? vy : -6; this.active = true; this.fuse = 90; this.rotation = 0; } update() { this.vy += GAME_CONSTANTS.GRAVITY * 0.8; this.x += this.vx; this.y += this.vy; this.rotation += this.vx * 0.1; if (this.y + this.height > GAME_CONSTANTS.GROUND_LEVEL) { this.y = GAME_CONSTANTS.GROUND_LEVEL - this.height; this.vx *= 0.8; this.vy *= -0.4; } this.fuse--; if(this.fuse <= 0) { this.active = false; explosions.push(new Explosion(this.x, this.y)); } } draw() { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation); ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(0, 0, this.width, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#15803d'; ctx.fillRect(-1, -5, 2, 3); if(Math.floor(this.fuse / 10) % 2 === 0) { ctx.fillStyle = 'red'; ctx.fillRect(-1, -1, 2, 2); } ctx.restore(); } getRect() { return { x: this.x - this.width, y: this.y - this.height, width: this.width*2, height: this.height*2 }; } }
    class Bomb { constructor(x, y) { this.x = x; this.y = y; this.width = 8; this.height = 12; this.vx = 0; this.vy = 2; this.active = true; this.fuse = 120; } update() { this.vy += GAME_CONSTANTS.GRAVITY * 0.5; this.y += this.vy; if (this.y + this.height > GAME_CONSTANTS.GROUND_LEVEL) { this.y = GAME_CONSTANTS.GROUND_LEVEL - this.height; this.vy = 0; this.vx = 0; } this.fuse--; if (this.fuse <= 0) { this.active = false; explosions.push(new Explosion(this.x, this.y + this.height, 100)); } } draw() { ctx.fillStyle = '#1a202c'; ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height); ctx.fillStyle = 'red'; ctx.fillRect(this.x - this.width/2, this.y, this.width, 2); if(Math.floor(this.fuse / 10) % 2 === 0) { ctx.fillStyle = '#ffcc00'; ctx.fillRect(this.x-2, this.y-2, 4, 4); } } }
    class RocketProjectile extends Projectile { constructor(x, y, options) { super(x, y, options); this.trail = []; this.trailLength = 15; } update() { super.update(); this.trail.push({x: this.x, y: this.y}); if (this.trail.length > this.trailLength) { this.trail.shift(); } } draw() { for(let i = 0; i < this.trail.length; i++) { const p = this.trail[i]; const alpha = (i / this.trail.length) * 0.5; ctx.fillStyle = `rgba(160, 160, 160, ${alpha})`; ctx.beginPath(); ctx.arc(p.x, p.y, i/3, 0, Math.PI * 2); ctx.fill(); } super.draw(); } }
    class FogParticle {
        constructor(x, y) { this.x = x; this.y = y; this.baseY = y; this.radius = 20 + Math.random() * 40; this.speed = 0.15 + Math.random() * 0.2; this.opacity = 0.05 + Math.random() * 0.15; this.animationTimer = Math.random() * Math.PI * 2; }
        update() { this.x -= this.speed; this.animationTimer += 0.01; this.y = this.baseY + Math.sin(this.animationTimer) * 15; if (this.x + this.radius < cameraX - GAME_CONSTANTS.WIDTH * 0.2) { this.x += GAME_CONSTANTS.LEVEL_WIDTH * 0.7; } }
        draw(parallaxX, overallOpacity) { ctx.globalAlpha = this.opacity * overallOpacity; ctx.fillStyle = '#808993'; ctx.beginPath(); ctx.arc(parallaxX, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0; }
    }
    function triggerCameraShake(intensity, duration) { cameraShake.intensity = Math.max(cameraShake.intensity, intensity); cameraShake.duration = Math.max(cameraShake.duration, duration); }
    class Explosion { constructor(x, y, maxRadius = 80) { this.x = x; this.y = y; this.radius = 0; this.maxRadius = maxRadius; this.life = 20; this.active = true; audioManager.play('explosion'); triggerCameraShake(4, 15); enemies.forEach(e => { if(!e.active) return; const dx = e.x + e.width/2 - this.x; const dy = e.y + e.height/2 - this.y; if(Math.sqrt(dx*dx + dy*dy) < this.maxRadius) e.hit(10); }); } update() { this.life--; if(this.life <= 0) this.active = false; this.radius = this.maxRadius * (1 - this.life / 20); } draw() { ctx.globalAlpha = this.life / 20; ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#ff4d4d'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; } }
    class Cloud { constructor() { this.x = Math.random() * GAME_CONSTANTS.LEVEL_WIDTH * 0.7; this.y = Math.random() * 150 + 20; this.speed = 0.1 + Math.random() * 0.2; this.parts = []; for(let i = 0; i < 5 + Math.random() * 5; i++) { this.parts.push({ x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 20, r: Math.random() * 20 + 20 }); } } update() { this.x += this.speed; if (this.x - 100 > cameraX + GAME_CONSTANTS.WIDTH) { this.x = cameraX - 100; } } draw() { ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; this.parts.forEach(part => { ctx.beginPath(); ctx.arc(this.x + part.x, this.y + part.y, part.r, 0, Math.PI * 2); ctx.fill(); }); } }
    let clouds = [];
    const backgroundLayers = [ { speed: 0.3, elements: [] }, { speed: 0.6, elements: [] } ];
    let stars = [], moon = {};
    function generateScenery() {
        for (let i = 0; i < 40; i++) { backgroundLayers[0].elements.push({ x: i * (GAME_CONSTANTS.LEVEL_WIDTH / 40), width: Math.random() * 80 + 60, height: Math.random() * 120 + 100, color: `hsl(220, 10%, ${50 + Math.random() * 10}%)` }); backgroundLayers[1].elements.push({ x: i * (GAME_CONSTANTS.LEVEL_WIDTH / 30) + Math.random()*50, width: Math.random() * 100 + 70, height: Math.random() * 150 + 120, color: `hsl(220, 10%, ${40 + Math.random() * 10}%)` }); }
        clouds = Array.from({length: 15}, () => new Cloud());
        for (let i = 0; i < 200; i++) { stars.push({ x: Math.random() * GAME_CONSTANTS.LEVEL_WIDTH, y: Math.random() * GAME_CONSTANTS.HEIGHT * 0.8, r: Math.random() * 1.5, opacity: Math.random() * 0.5 + 0.5 }); }
        moon = { x: GAME_CONSTANTS.LEVEL_WIDTH - 400, y: 120, radius: 50, parallaxSpeed: 0.1 };
        fogParticles = [];
        for (let i = 0; i < 50; i++) {
            const x = GAME_CONSTANTS.LEVEL_WIDTH * 0.4 + Math.random() * (GAME_CONSTANTS.LEVEL_WIDTH * 0.6);
            const y = GAME_CONSTANTS.GROUND_LEVEL - 60 + Math.random() * 70;
            fogParticles.push(new FogParticle(x, y));
        }
    }
    
    // --- NEW: Draw the on-screen touch controls ---
    function drawTouchControls() {
        if (!isTouchDevice || gameState !== 'PLAYING') return;

        for (const buttonName in touchControls) {
            const button = touchControls[buttonName];
            
            // Set opacity and color based on pressed state
            const alpha = button.pressed ? 0.9 : 0.5;
            ctx.fillStyle = `rgba(255, 204, 0, ${alpha})`;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha + 0.1})`;
            ctx.lineWidth = 2;

            // Draw the button circle
            ctx.beginPath();
            ctx.arc(button.x, button.y, button.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw the button label
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha + 0.2})`;
            ctx.font = 'bold 24px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(button.label, button.x, button.y + 2);
        }
    }

    function masterUpdate() { 
        if (cameraShake.duration > 0) {
            cameraShake.duration--;
            if (cameraShake.duration <= 0) {
                cameraShake.intensity = 0;
            }
        }
        if (helicopter.active) updateHelicopter(); 
        switch (gameState) { 
            case 'START_MENU': case 'GAME_OVER': case 'WIN_SCREEN': break; 
            case 'PLAYING': updatePlaying(); break; 
            case 'DOOR_OPEN': updateDoorOpen(); break; 
            case 'LAUNCH_SEQUENCE': updateLaunchSequence(); break; 
        } 
    }
    let spawnTimer = 0;
    function updatePlaying() {
        if (uiMessage.timer > 0) uiMessage.timer--;
        if (callIconEffect.timer > 0) callIconEffect.timer--;
        if (gameTimer <= 0) { endGame(false, "timeOut"); return; }
        harold.velocityX = 0; let isMoving = false; if (keys.left) { harold.velocityX = -harold.speed; harold.direction = 'left'; isMoving = true; } if (keys.right) { harold.velocityX = harold.speed; harold.direction = 'right'; isMoving = true; } harold.x += harold.velocityX; if (harold.x < 0) harold.x = 0; if (harold.x + harold.width > GAME_CONSTANTS.LEVEL_WIDTH) harold.x = GAME_CONSTANTS.LEVEL_WIDTH - harold.width; harold.velocityY += GAME_CONSTANTS.GRAVITY; harold.y += harold.velocityY; if (harold.y + harold.height > GAME_CONSTANTS.GROUND_LEVEL) { harold.y = GAME_CONSTANTS.GROUND_LEVEL - harold.height; harold.velocityY = 0; harold.onGround = true; harold.isJumping = false; } else { harold.onGround = false; } if (keys.up && harold.onGround && !harold.isJumping) { harold.velocityY = -harold.jumpPower; harold.isJumping = true; }
        if(harold.isChargingRailgun){ harold.railgunCharge = Math.min(harold.railgunCharge + 1, GAME_CONSTANTS.RAILGUN_MAX_CHARGE_TIME); }
        const distToRocket = Math.abs((harold.x + harold.width / 2) - (rocket.x + rocket.width / 2));
        if (keys.shoot && canShoot && distToRocket > 100) {
            let cooldown = 0;
            if (harold.grenadeAmmo > 0) { fireGrenade(); cooldown = GAME_CONSTANTS.GRENADE_COOLDOWN; } 
            else if (harold.railgunAmmo > 0) { /* Handled on key up/release */ } 
            else if (harold.laserAmmo > 0) { harold.laserAmmo--; audioManager.play('laserFire'); const laserY = harold.y + harold.height / 2 + 4; const startX = harold.x + (harold.direction === 'right' ? harold.width : 0); const endX = harold.direction === 'right' ? startX + GAME_CONSTANTS.WIDTH : startX - GAME_CONSTANTS.WIDTH; laserBeams.push({ x1: startX, y1: laserY, x2: endX, y2: laserY, life: 10 }); enemies.forEach(e => { if (e.active && e.y < laserY && e.y + e.height > laserY) { const isInPath = harold.direction === 'right' ? e.x > harold.x : e.x < harold.x; if (isInPath) { e.hit(4); } } }); cooldown = GAME_CONSTANTS.LASER_COOLDOWN; } 
            else if (harold.shotgunAmmo > 0) { harold.shotgunAmmo--; audioManager.play('shotgunFire'); const projY = harold.y + harold.height / 2; for (let i=0; i < 4; i++) { let projX = harold.x + (harold.direction === 'right' ? harold.width : -10); projectiles.push(new Projectile(projX, projY, {vx: (harold.direction === 'right' ? 1 : -1) * 12, vy:(Math.random() - 0.5) * 4, color: '#ff9d00', width: 5, height: 5, damage: 2})); } cooldown = GAME_CONSTANTS.SHOTGUN_COOLDOWN; } 
            else if (harold.chaingunAmmo > 0) { harold.chaingunAmmo--; audioManager.play('chaingunFire'); const projY = harold.y + harold.height / 2; let projX = harold.x + (harold.direction === 'right' ? harold.width : -10); projectiles.push(new Projectile(projX, projY, {vx: (harold.direction === 'right' ? 1 : -1) * 15 + (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3, color: '#cccccc', width: 6, height:3, damage: 1})); cooldown = GAME_CONSTANTS.CHAINGUN_COOLDOWN; } 
            else { let projX = harold.x + (harold.direction === 'right' ? harold.width : -10); let projY = harold.y + harold.height / 2; projectiles.push(new Projectile(projX, projY, {vx: (harold.direction === 'right' ? 1 : -1) * 12, damage: 1})); audioManager.play('shoot'); cooldown = GAME_CONSTANTS.SHOOT_COOLDOWN; }
            if (cooldown > 0) { canShoot = false; setTimeout(() => canShoot = true, cooldown); }
        } else if(keys.shoot && canShoot && distToRocket < 100) { if (haroldCoins >= GAME_CONSTANTS.ROCKET_COST) { endGame(true); } else { uiMessage = { text: `Need ${GAME_CONSTANTS.ROCKET_COST - haroldCoins} more H-Coins!`, timer: 120 }; } canShoot = false; setTimeout(() => canShoot = true, 500); }
        if (!harold.onGround) harold.setAnimation(harold.direction === 'right' ? 'jump_right' : 'jump_left'); else if (isMoving) harold.setAnimation(harold.direction === 'right' ? 'walk_right' : 'walk_left'); else harold.setAnimation(harold.direction === 'right' ? 'idle_right' : 'idle_left'); harold.updateAnimation(); if (harold.invulnerableTimer > 0) harold.invulnerableTimer--; 
        const targetCameraX = Math.max(0, Math.min(harold.x - GAME_CONSTANTS.WIDTH / 3, GAME_CONSTANTS.LEVEL_WIDTH - GAME_CONSTANTS.WIDTH)); cameraX += (targetCameraX - cameraX) * 0.1;
        projectiles.forEach(p => p.update()); let newEnemies = []; enemies.forEach(e => { const children = e.update(); if (children) newEnemies.push(...children); }); if (newEnemies.length > 0) enemies.push(...newEnemies);
        vehicles.forEach(v => v.update()); clouds.forEach(c => c.update()); coins.forEach(c => c.update()); spitProjectiles.forEach(s => s.update()); ammoDrops.forEach(d => d.update()); grenades.forEach(g => g.update()); explosions.forEach(e => e.update()); laserBeams.forEach(b => b.life--); bombs.forEach(b => b.update()); rocketProjectiles.forEach(r => r.update()); fogParticles.forEach(f => f.update());
        projectiles = projectiles.filter(p => p.active); enemies = enemies.filter(e => e.active); coins = coins.filter(c => c.active); spitProjectiles = spitProjectiles.filter(s => s.active); ammoDrops = ammoDrops.filter(d => d.active); grenades = grenades.filter(g => g.active); explosions = explosions.filter(e => e.active); laserBeams = laserBeams.filter(b => b.life > 0); bombs = bombs.filter(b => b.active); rocketProjectiles = rocketProjectiles.filter(r => r.active);
        const haroldRect = harold.getRect(); 
        [...projectiles, ...rocketProjectiles].forEach(p => { enemies.forEach(e => { if (p.active && e.active && rectIntersect(p.getRect(), e.getRect())) { if (!p.piercing) p.active = false; audioManager.play('bulletHit'); e.hit(p.damage); } }); }); 
        enemies.forEach(e => { if (e.active && !e.isReviving && rectIntersect(e.getRect(), haroldRect)) { e.isCollidingWithPlayer = true; harold.takeDamage(); } });
        coins.forEach(c => { if(c.active && rectIntersect(haroldRect, c.getRect())) { c.active = false; haroldCoins++; audioManager.play('coinGet'); }});
        spitProjectiles.forEach(s => { if(s.active && rectIntersect(haroldRect, s.getRect())) { s.active = false; harold.takeDamage(); }});
        ammoDrops.forEach(d => { if(d.active && rectIntersect(haroldRect, d.getRect())) { d.active = false; if(d.type === 'shotgun') harold.shotgunAmmo += d.amount; else if (d.type === 'laser') harold.laserAmmo += d.amount; else if (d.type === 'grenade') harold.grenadeAmmo += d.amount; else if (d.type === 'chaingun') harold.chaingunAmmo += d.amount; else if (d.type === 'railgun') harold.railgunAmmo += d.amount; else if (d.type === 'radio') { callIconEffect.timer = 60; audioManager.play('radioActivate'); if(helicopter.active) { helicopter.lifespan += GAME_CONSTANTS.HELICOPTER_DURATION; } else { helicopter.active = true; helicopter.lifespan = GAME_CONSTANTS.HELICOPTER_DURATION; helicopter.x = harold.x; helicopter.y = -50; helicopter.targetX = (cameraX + helicopter.width / 2) + Math.random() * (GAME_CONSTANTS.WIDTH - helicopter.width); } } audioManager.play('ammoGet'); }});
        spawnTimer++; if (spawnTimer >= GAME_CONSTANTS.ZOMBIE_SPAWN_INTERVAL) { spawnTimer = 0; spawnEnemy(); }
        updateUI();
    }
    function fireGrenade() {
        harold.grenadeAmmo--; audioManager.play('grenadeLaunch'); let nearestEnemy = null; let minDistance = Infinity;
        const screenLeft = cameraX; const screenRight = cameraX + GAME_CONSTANTS.WIDTH;
        enemies.forEach(enemy => { if (enemy.active && enemy.x > screenLeft && enemy.x < screenRight) { const distance = Math.hypot(enemy.x - harold.x, enemy.y - harold.y); if (distance < minDistance) { minDistance = distance; nearestEnemy = enemy; } } });
        const startX = harold.x + harold.width / 2; const startY = harold.y + harold.height / 2;
        if (nearestEnemy) { const targetX = nearestEnemy.x + nearestEnemy.width / 2; const targetY = nearestEnemy.y + nearestEnemy.height / 2; const travelTime = 60; const dx = targetX - startX; const dy = targetY - startY; const vx = dx / travelTime; const vy = dy / travelTime - 0.5 * (GAME_CONSTANTS.GRAVITY * 0.8) * travelTime; grenades.push(new Grenade(startX, startY, { vx, vy })); }
        else { grenades.push(new Grenade(startX, startY, { direction: harold.direction })); }
    }
    function updateHelicopter() {
        helicopter.lifespan--; helicopter.animationTimer++;
        if (helicopter.lifespan <= 0) { helicopter.active = false; audioManager.stop('helicopterLoop'); return; }
        if (isSoundEnabled && audioManager.sounds.helicopterLoop && audioManager.sounds.helicopterLoop.paused) { audioManager.play('helicopterLoop'); }
        if (Math.abs(helicopter.x - helicopter.targetX) < 20) { helicopter.targetX = (cameraX + helicopter.width / 2) + Math.random() * (GAME_CONSTANTS.WIDTH - helicopter.width); }
        if (helicopter.x < helicopter.targetX) { helicopter.x += helicopter.speed; helicopter.direction = 'right'; } else { helicopter.x -= helicopter.speed; helicopter.direction = 'left'; }
        helicopter.y = 50 + Math.sin(helicopter.animationTimer * 0.05) * 10;
        helicopter.shootTimer--; helicopter.bombTimer--; helicopter.rocketTimer--;
        let nearestEnemy = null; let minDistance = Infinity;
        enemies.forEach(enemy => { if (enemy.active) { const distance = Math.hypot(enemy.x - helicopter.x, enemy.y - helicopter.y); if (distance < minDistance) { minDistance = distance; nearestEnemy = enemy; } } });
        if (helicopter.shootTimer <= 0 && nearestEnemy) { const angle = Math.atan2((nearestEnemy.y + nearestEnemy.height/2) - (helicopter.y + 35), (nearestEnemy.x + nearestEnemy.width/2) - helicopter.x); const speed = 15; const vx = Math.cos(angle) * speed; const vy = Math.sin(angle) * speed; projectiles.push(new Projectile(helicopter.x, helicopter.y + 35, { vx, vy, color: '#f97316', width: 8, height: 4, damage: 2 })); audioManager.play('helicopterFire'); helicopter.shootTimer = GAME_CONSTANTS.HELICOPTER_FIRE_RATE; }
        if (helicopter.bombTimer <= 0) { bombs.push(new Bomb(helicopter.x, helicopter.y + helicopter.height / 2)); helicopter.bombTimer = GAME_CONSTANTS.HELICOPTER_BOMB_COOLDOWN; }
        if (helicopter.rocketTimer <= 0 && nearestEnemy) { const angle = Math.atan2((nearestEnemy.y + nearestEnemy.height/2) - (helicopter.y + 35), (nearestEnemy.x + nearestEnemy.width/2) - helicopter.x); const speed = 10; const vx = Math.cos(angle) * speed; const vy = Math.sin(angle) * speed; rocketProjectiles.push(new RocketProjectile(helicopter.x, helicopter.y + 35, { vx, vy, color: '#cccccc', width: 12, height: 5, damage: 8, piercing: true })); audioManager.play('shotgunFire'); helicopter.rocketTimer = GAME_CONSTANTS.HELICOPTER_ROCKET_COOLDOWN; }
    }
    function updateDoorOpen() { winSequenceTimer++; rocket.doorOpenRatio = Math.min(1, winSequenceTimer / 60); const doorCenterX = rocket.x + rocket.width / 2; if (harold.x < doorCenterX - harold.width/2 - 2) { harold.x += 1; harold.setAnimation('walk_right'); } else if (harold.x > doorCenterX - harold.width/2 + 2) { harold.x -= 1; harold.setAnimation('walk_left'); } else { harold.active = false; } harold.updateAnimation(); if (winSequenceTimer > 120) { winSequenceTimer = 0; gameState = 'LAUNCH_SEQUENCE'; audioManager.play('rocketLaunch'); } }
    function updateLaunchSequence() { winSequenceTimer++; if (winSequenceTimer < 120) { cameraX += (Math.random() - 0.5) * 8; cameraY += (Math.random() - 0.5) * 8; } else { cameraY = 0; rocket.velocityY -= 0.1; rocket.y += rocket.velocityY; const targetCameraY = rocket.y - GAME_CONSTANTS.HEIGHT / 2; cameraY += (targetCameraY - cameraY) * 0.1; } for(let i = 0; i < 5; i++) { particles.push({ x: rocket.x + rocket.width / 2 + (Math.random() - 0.5) * 20, y: rocket.y + rocket.height, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 5 + 2, size: Math.random() * 10 + 5, life: 30, color: ['#ffcc00', '#ff9900', '#ff6600'][Math.floor(Math.random()*3)] }); } particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; }); particles = particles.filter(p => p.life > 0); if (rocket.y < cameraY - rocket.height) { gameState = 'WIN_SCREEN'; audioManager.stop('rocketLaunch'); gameWinOverlay.style.display = 'flex'; gameWinOverlay.focus(); document.querySelector('h1').style.display = 'block'; } }
    function spawnEnemy() { const spawnSide = Math.random() < 0.5 ? 'left' : 'right'; let spawnX, direction; if (spawnSide === 'left') { spawnX = cameraX - 60; direction = 'right'; } else { spawnX = cameraX + GAME_CONSTANTS.WIDTH + 60; direction = 'left'; } const rand = Math.random(); if (rand < 0.50) enemies.push(new Walker(spawnX, GAME_CONSTANTS.GROUND_LEVEL - 64, direction)); else if (rand < 0.70) enemies.push(new Runner(spawnX, GAME_CONSTANTS.GROUND_LEVEL - 56, direction)); else if (rand < 0.80) enemies.push(new Spitter(spawnX, GAME_CONSTANTS.GROUND_LEVEL - 60, direction)); else if (rand < 0.90) enemies.push(new Screecher(spawnX, 100 + Math.random() * 150, direction)); else if (rand < 0.95) enemies.push(new Mutant(spawnX, GAME_CONSTANTS.GROUND_LEVEL - 40, direction)); else enemies.push(new Brute(spawnX, GAME_CONSTANTS.GROUND_LEVEL - 72, direction)); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    
    function draw() {
        const levelProgress = Math.min(1, cameraX / (GAME_CONSTANTS.LEVEL_WIDTH - GAME_CONSTANTS.WIDTH)); const dayTop = [112, 197, 206], nightTop = [11, 15, 42]; const dayBot = [161, 216, 224], nightBot = [40, 56, 104]; const rTop = lerp(dayTop[0], nightTop[0], levelProgress); const gTop = lerp(dayTop[1], nightTop[1], levelProgress); const bTop = lerp(dayTop[2], nightTop[2], levelProgress); const rBot = lerp(dayBot[0], nightBot[0], levelProgress); const gBot = lerp(dayBot[1], nightBot[1], levelProgress); const bBot = lerp(dayBot[2], nightBot[2], levelProgress); const skyGradient = ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.HEIGHT); skyGradient.addColorStop(0, `rgb(${rTop}, ${gTop}, ${bTop})`); skyGradient.addColorStop(1, `rgb(${rBot}, ${gBot}, ${bBot})`); ctx.fillStyle = skyGradient; ctx.fillRect(0, 0, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT);
        let shakeX = 0; let shakeY = 0;
        if (cameraShake.duration > 0) { shakeX = (Math.random() - 0.5) * cameraShake.intensity; shakeY = (Math.random() - 0.5) * cameraShake.intensity; }
        ctx.save();
        ctx.translate(-cameraX + shakeX, -cameraY + shakeY);
        if (levelProgress > 0.2) { stars.forEach(star => { const starParallaxX = star.x - cameraX * 0.05; if(starParallaxX > cameraX && starParallaxX < cameraX + GAME_CONSTANTS.WIDTH) { ctx.globalAlpha = (levelProgress - 0.2) * star.opacity; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(starParallaxX, star.y, star.r, 0, Math.PI * 2); ctx.fill(); } }); ctx.globalAlpha = 1; const moonParallaxX = moon.x - cameraX * moon.parallaxSpeed; ctx.fillStyle = '#f0f0c0'; ctx.beginPath(); ctx.arc(moonParallaxX, moon.y, moon.radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.arc(moonParallaxX - 15, moon.y - 15, 8, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(moonParallaxX + 20, moon.y + 10, 12, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(moonParallaxX + 5, moon.y + 22, 5, 0, Math.PI*2); ctx.fill(); }
        clouds.forEach(cloud => cloud.draw());
        backgroundLayers.forEach(layer => { layer.elements.forEach(element => { const elementParallaxX = element.x - cameraX * (1 - layer.speed); if (elementParallaxX + element.width > cameraX && elementParallaxX < cameraX + GAME_CONSTANTS.WIDTH) { ctx.fillStyle = element.color; ctx.fillRect(elementParallaxX, GAME_CONSTANTS.GROUND_LEVEL - element.height, element.width, element.height); } }); });
        if (levelProgress > 0.5) { const overallFogOpacity = Math.min(1, (levelProgress - 0.5) / 0.4); fogParticles.forEach(fog => { const parallaxX = fog.x - cameraX * 0.85; fog.draw(parallaxX, overallFogOpacity); }); }
        ctx.fillStyle = '#444'; ctx.fillRect(0, GAME_CONSTANTS.GROUND_LEVEL - 70, GAME_CONSTANTS.LEVEL_WIDTH, 70); ctx.fillStyle = '#ffff00'; for(let i = 0; i < GAME_CONSTANTS.LEVEL_WIDTH; i += 40) { ctx.fillRect(i, GAME_CONSTANTS.GROUND_LEVEL - 35, 20, 4); }
        vehicles.forEach(v => v.draw());
        ctx.fillStyle = '#506050'; ctx.fillRect(0, GAME_CONSTANTS.GROUND_LEVEL, GAME_CONSTANTS.LEVEL_WIDTH, GAME_CONSTANTS.HEIGHT - GAME_CONSTANTS.GROUND_LEVEL);
        drawRocket(); enemies.forEach(e => e.draw()); coins.forEach(c => c.draw()); ammoDrops.forEach(d => d.draw()); spitProjectiles.forEach(s => s.draw()); projectiles.forEach(p => p.draw()); grenades.forEach(g => g.draw()); bombs.forEach(b => b.draw()); rocketProjectiles.forEach(r => r.draw());
        if (helicopter.active) drawHelicopter();
        harold.draw();
        laserBeams.forEach(b => { ctx.globalAlpha = b.life / 10.0; ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke(); ctx.globalAlpha = 1; });
        explosions.forEach(e => e.draw()); 
        if (gameState === 'LAUNCH_SEQUENCE') { particles.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size/2, p.y, p.size, p.size); }); }
        
        ctx.restore(); // Restore from camera transform
        
        // --- NEW: Draw touch controls on top of everything, not affected by camera ---
        drawTouchControls();
        
        if (callIconEffect.timer > 0) { if(Math.floor(callIconEffect.timer / 5) % 2 === 0) { ctx.fillStyle = '#f59e0b'; ctx.font = '32px "Press Start 2P"'; ctx.textAlign='center'; ctx.fillText('★', GAME_CONSTANTS.WIDTH / 2, 60); }}
        if (uiMessage.timer > 0) { ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.font = '16px "Press Start 2P"'; const textWidth = ctx.measureText(uiMessage.text).width; ctx.fillRect(GAME_CONSTANTS.WIDTH / 2 - textWidth / 2 - 10, GAME_CONSTANTS.HEIGHT / 2 - 20, textWidth + 20, 30); ctx.fillStyle = "#ffcc00"; ctx.textAlign = 'center'; ctx.fillText(uiMessage.text, GAME_CONSTANTS.WIDTH / 2, GAME_CONSTANTS.HEIGHT / 2); }
    }
    function drawHelicopter() { const x = helicopter.x; const y = helicopter.y; const frame = helicopter.animationTimer; ctx.save(); ctx.translate(x, y); if (helicopter.direction === 'right') { ctx.scale(-1, 1); } const bodyColor = '#2d3748'; const detailColor = '#4a5568'; const darkColor = '#1a202c'; const cockpitColor = 'rgba(28, 100, 141, 0.7)'; ctx.fillStyle = detailColor; ctx.fillRect(-100, 10, 50, 15); ctx.fillStyle = bodyColor; ctx.beginPath(); ctx.moveTo(-90, 10); ctx.lineTo(-105, -5); ctx.lineTo(-105, 25); ctx.closePath(); ctx.fill(); ctx.fillStyle = bodyColor; ctx.beginPath(); ctx.moveTo(60, 25); ctx.lineTo(50, 0); ctx.lineTo(-55, 0); ctx.lineTo(-60, 25); ctx.closePath(); ctx.fill(); ctx.fillStyle = cockpitColor; ctx.beginPath(); ctx.arc(40, 12, 22, Math.PI * 0.5, Math.PI * 1.5, false); ctx.fill(); ctx.fillStyle = detailColor; ctx.fillRect(-10, -15, 20, 15); ctx.fillStyle = darkColor; ctx.fillRect(-40, 25, 60, 10); ctx.fillStyle = '#555'; for(let i=0; i<4; i++) { ctx.fillRect(-35 + i*15, 28, 8, 12); } ctx.fillStyle = darkColor; ctx.fillRect(30, 40, 5, 10); ctx.fillRect(-30, 40, 5, 10); ctx.fillRect(-40, 50, 80, 5); ctx.fillStyle = darkColor; ctx.fillRect(-5, -23, 10, 8); const rotorLength = 80; ctx.globalAlpha = 0.7; if (frame % 2 === 0) { ctx.fillRect(-rotorLength, -20, rotorLength * 2, 4); } else { ctx.fillRect(-4, -20 - rotorLength, 8, rotorLength * 2); } ctx.globalAlpha = 1; ctx.fillStyle = darkColor; ctx.globalAlpha = 0.6; if (frame % 4 < 2) { ctx.fillRect(-103, 2, 4, 30); } else { ctx.fillRect(-110, 10, 20, 4); } ctx.globalAlpha = 1; ctx.restore(); }
    function getRandomMessage(messageArray) { const randomIndex = Math.floor(Math.random() * messageArray.length); return messageArray[randomIndex]; }
    function endGame(isWin, failureType = null) {
        if (gameState === 'GAME_OVER' || gameState === 'WIN_SCREEN') return;
        clearInterval(timerInterval); timerInterval = null;
        if (isWin) { audioManager.stopAll(); audioManager.play('doorOpen'); allUI.forEach(el => el.style.display = 'none'); gameState = 'DOOR_OPEN'; winSequenceTimer = 0; gameWinMessage.innerHTML = getRandomMessage(MESSAGES.win); } 
        else { gameState = 'GAME_OVER'; audioManager.stopAll(); let message = "Harold's escape has failed."; if (failureType === 'timeOut') { message = getRandomMessage(MESSAGES.timeOut); } else if (failureType === 'monsterDeath') { message = getRandomMessage(MESSAGES.monsterDeath); } gameOverMessage.innerHTML = message; gameOverOverlay.style.display = 'flex'; gameOverOverlay.focus(); document.querySelector('h1').style.display = 'block'; }
    }
    function rectIntersect(r1, r2) { return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y); }
    function updateUI() { document.getElementById('coin-counter').textContent = `H-Coins: ${haroldCoins}`; document.getElementById('kill-counter').textContent = `Kills: ${monstersKilled}`; document.getElementById('lifebar-inner').style.width = `${Math.max(0, (harold.life / harold.maxLife) * 100)}%`; const shotgunCounter = document.getElementById('shotgun-ammo-counter'); shotgunCounter.style.display = harold.shotgunAmmo > 0 ? 'block' : 'none'; shotgunCounter.textContent = `SHELLS: ${harold.shotgunAmmo}`; const laserCounter = document.getElementById('laser-ammo-counter'); laserCounter.style.display = harold.laserAmmo > 0 ? 'block' : 'none'; laserCounter.textContent = `CELLS: ${harold.laserAmmo}`; const grenadeCounter = document.getElementById('grenade-ammo-counter'); grenadeCounter.style.display = harold.grenadeAmmo > 0 ? 'block' : 'none'; grenadeCounter.textContent = `NADES: ${harold.grenadeAmmo}`; const chaingunCounter = document.getElementById('chaingun-ammo-counter'); chaingunCounter.style.display = harold.chaingunAmmo > 0 ? 'block' : 'none'; chaingunCounter.textContent = `ROUNDS: ${harold.chaingunAmmo}`; const railgunCounter = document.getElementById('railgun-ammo-counter'); railgunCounter.style.display = harold.railgunAmmo > 0 ? 'block' : 'none'; railgunCounter.textContent = `SLUGS: ${harold.railgunAmmo}`; if(gameTimer >= 0) { const minutes = Math.floor(gameTimer / 60); const seconds = gameTimer % 60; document.getElementById('timer-container').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; } }
    
    // --- NEW: Touch handling logic for on-canvas buttons ---
    function handleTouchStart(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        for (const touch of e.changedTouches) {
            // Scale touch coordinates to canvas coordinates
            const touchX = (touch.clientX - rect.left) * (canvas.width / rect.width);
            const touchY = (touch.clientY - rect.top) * (canvas.height / rect.height);
            
            for (const buttonName in touchControls) {
                const button = touchControls[buttonName];
                const dx = touchX - button.x;
                const dy = touchY - button.y;
                if (dx * dx + dy * dy < button.radius * button.radius) {
                    button.pressed = true;
                    keys[button.key] = true;
                    if(button.key === 'shoot') handleShootPress(e);
                }
            }
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        for (const buttonName in touchControls) {
            touchControls[buttonName].pressed = false;
            keys[touchControls[buttonName].key] = false;
            if(touchControls[buttonName].key === 'shoot') handleShootRelease(e);
        }
    }

    function setupTouchControls() {
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            isTouchDevice = true;
            canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
            canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        }
    }
    
    window.addEventListener('resize', () => { const container = document.getElementById('game-container'); canvas.style.width = container.clientWidth + 'px'; canvas.style.height = container.clientHeight + 'px'; });
    function startGame() { 
        if (window.Telegram && window.Telegram.WebApp) { window.Telegram.WebApp.expand(); }
        document.querySelector('h1').style.display = 'none'; startScreenOverlay.style.display = 'none'; allUI.forEach(el => el.style.display = 'flex'); gameState = 'PLAYING'; audioManager.startBgm(); gameTimer = GAME_CONSTANTS.GAME_TIMER_DURATION; if(timerInterval) clearInterval(timerInterval); timerInterval = setInterval(() => { if (gameState === 'PLAYING') gameTimer--; }, 1000); 
    }
    function resetGame() { if(timerInterval) clearInterval(timerInterval); audioManager.stopAll(); harold.x = 50; harold.y = GAME_CONSTANTS.GROUND_LEVEL - 64; harold.velocityX = 0; harold.velocityY = 0; harold.life = GAME_CONSTANTS.PLAYER_MAX_LIFE; harold.invulnerableTimer = 0; harold.active = true; harold.direction = 'right'; harold.setAnimation('idle_right'); harold.shotgunAmmo = 0; harold.laserAmmo = 0; harold.grenadeAmmo = 0; harold.chaingunAmmo = 0; harold.railgunAmmo = 0; harold.isChargingRailgun = false; harold.railgunCharge = 0; haroldCoins = 0; monstersKilled = 0; cameraX = 0; cameraY = 0; winSequenceTimer = 0; spawnTimer = 0; uiMessage.timer = 0; canShoot = true; enemies.length = 0; projectiles.length = 0; coins.length = 0; spitProjectiles.length = 0; particles.length = 0; ammoDrops.length = 0; laserBeams.length = 0; grenades.length = 0; explosions.length = 0; bombs.length = 0; rocketProjectiles.length = 0; helicopter.active = false; helicopter.lifespan = 0; rocket.y = GAME_CONSTANTS.GROUND_LEVEL - 200; rocket.doorOpenRatio = 0; rocket.velocityY = 0; gameOverOverlay.style.display = 'none'; gameWinOverlay.style.display = 'none'; updateUI(); startGame(); }
    function handleShootPress(e) { e.preventDefault(); if (gameState !== 'PLAYING') return; keys.shoot = true; if(harold.grenadeAmmo <= 0 && harold.railgunAmmo > 0 && canShoot) { harold.isChargingRailgun = true; audioManager.play('railgunCharge'); } }
    function handleShootRelease(e) { e.preventDefault(); if (gameState !== 'PLAYING') return; keys.shoot = false; if(harold.isChargingRailgun) { harold.isChargingRailgun = false; audioManager.stop('railgunCharge'); if(canShoot) { audioManager.play('railgunFire'); harold.railgunAmmo--; const damage = 1 + Math.floor(15 * (harold.railgunCharge / GAME_CONSTANTS.RAILGUN_MAX_CHARGE_TIME)); const slug = new Projectile(harold.x + harold.width/2, harold.y + harold.height/2, {vx: (harold.direction === 'right' ? 1 : -1) * 25, piercing: true, color: '#f055ff', width: 20, height: 6, damage: damage}); projectiles.push(slug); canShoot = false; setTimeout(() => canShoot = true, 800); } harold.railgunCharge = 0; } }
    function initializeGame() {
        audioManager.init(); createHaroldSpriteSheet(); createAllEnemySpriteSheets(); generateScenery(); setupTouchControls(); updateUI(); document.dispatchEvent(new Event('resize'));
        allUI.forEach(el => el.style.display = 'none');
        playButton.addEventListener('click', startGame);
        soundToggleButton.addEventListener('click', () => { isSoundEnabled = !isSoundEnabled; soundToggleButton.textContent = `Sound: ${isSoundEnabled ? 'ON' : 'OFF'}`; if (!isSoundEnabled) { audioManager.stopAll(); } else if (gameState === 'PLAYING') { audioManager.startBgm(); } });
        restartButtonGameOver.addEventListener('click', resetGame); restartButtonWin.addEventListener('click', resetGame);
        window.addEventListener('keydown', e => { if (e.repeat || gameState !== 'PLAYING') return; if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = true; if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = true; if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keys.up = true; if (e.key === ' ') handleShootPress(e); });
        window.addEventListener('keyup', e => { if (gameState !== 'PLAYING') return; if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = false; if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = false; if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keys.up = false; if (e.key === ' ') handleShootRelease(e); });
        gameLoop();
    }
    function gameLoop() { masterUpdate(); draw(); requestAnimationFrame(gameLoop); }
    initializeGame();
})();
// ===================================
// END OF UPDATED game.js
// ===================================