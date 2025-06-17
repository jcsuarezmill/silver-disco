// --- Harold's Great Escape - game.js ---
document.addEventListener('DOMContentLoaded', () => {
    // --- TELEGRAM WEB APP SETUP ---
    const TGA = window.Telegram.WebApp;
    TGA.ready();
    TGA.expand();

    // --- GAME SETUP ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // UI Elements from HTML
    const uiElements = {
        coinCounter: document.getElementById('coin-counter'),
        killCounter: document.getElementById('kill-counter'),
        timer: document.getElementById('timer-container'),
        lifebarInner: document.getElementById('lifebar-inner'),
        ammoCounters: {
            shotgun: document.getElementById('shotgun-ammo-counter'),
            laser: document.getElementById('laser-ammo-counter'),
            chaingun: document.getElementById('chaingun-ammo-counter'),
            railgun: document.getElementById('railgun-ammo-counter'),
            grenade: document.getElementById('grenade-ammo-counter'),
        },
        overlays: {
            start: document.getElementById('start-screen-overlay'),
            gameOver: document.getElementById('game-over-overlay'),
            gameWin: document.getElementById('game-win-overlay'),
        },
        buttons: {
            play: document.getElementById('play-button'),
            restartWin: document.getElementById('restartButtonWin'),
            restartGameOver: document.getElementById('restartButtonGameOver'),
            soundToggle: document.getElementById('sound-toggle-button'),
        },
        gameOverMessage: document.getElementById('game-over-message'),
        gameWinMessage: document.getElementById('game-win-message'),
    };
    
    let isSoundOn = true;

    // Game constants
    const GAME_DURATION = 120; // 2 minutes in seconds
    const WORLD_WIDTH = 3200;
    const WORLD_HEIGHT = 1800;

    // Game state
    let gameState = 'START'; // START, PLAYING, PAUSED, GAME_OVER, GAME_WIN
    let player, camera, rocket, gameTimer, gameInterval;
    let entities = []; // Bullets, enemies, pickups
    let keys = {};
    let touchControls = {
        joystick: { x: 0, y: 0, active: false, dx: 0, dy: 0, radius: 50 },
        fireButton: { x: 0, y: 0, active: false, radius: 40 }
    };
    
    // --- UTILITY CLASSES ---
    class Vector2 {
        constructor(x = 0, y = 0) { this.x = x; this.y = y; }
        magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y); }
        normalize() {
            const mag = this.magnitude();
            if (mag > 0) { this.x /= mag; this.y /= mag; }
            return this;
        }
    }

    // --- GAME ENTITY CLASSES ---
    class Entity {
        constructor(x, y, width, height, color) {
            this.pos = new Vector2(x, y);
            this.width = width;
            this.height = height;
            this.color = color;
            this.id = Math.random();
        }
        draw(ctx, camera) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y, this.width, this.height);
        }
        update(dt) {}
        getBounds() {
            return { x: this.pos.x, y: this.pos.y, width: this.width, height: this.height };
        }
    }

    class Player extends Entity {
        constructor(x, y) {
            super(x, y, 40, 40, '#ffcc00');
            this.maxHealth = 10;
            this.health = this.maxHealth;
            this.speed = 300; // pixels per second
            this.coins = 0;
            this.kills = 0;
            this.weapons = [
                { name: 'pistol', ammo: Infinity, fireRate: 0.3, damage: 1, bulletSpeed: 600, color: '#cccccc' },
                { name: 'shotgun', ammo: 0, fireRate: 0.8, damage: 0.8, bulletSpeed: 500, spread: 5, color: '#ff9d00' },
                { name: 'chaingun', ammo: 0, fireRate: 0.08, damage: 0.5, bulletSpeed: 700, color: '#aaaaaa' },
                { name: 'laser', ammo: 0, fireRate: 0.5, damage: 3, bulletSpeed: 1000, color: '#00ffff' },
            ];
            this.currentWeaponIndex = 0;
            this.fireCooldown = 0;
            this.lastHitTime = 0;
        }

        update(dt) {
            this.fireCooldown -= dt;

            let moveX = 0;
            let moveY = 0;

            if (touchControls.joystick.active) {
                moveX = touchControls.joystick.dx;
                moveY = touchControls.joystick.dy;
            } else {
                if (keys['w'] || keys['ArrowUp']) moveY = -1;
                if (keys['s'] || keys['ArrowDown']) moveY = 1;
                if (keys['a'] || keys['ArrowLeft']) moveX = -1;
                if (keys['d'] || keys['ArrowRight']) moveX = 1;
            }

            const moveVec = new Vector2(moveX, moveY).normalize();
            this.pos.x += moveVec.x * this.speed * dt;
            this.pos.y += moveVec.y * this.speed * dt;
            
            this.pos.x = Math.max(0, Math.min(WORLD_WIDTH - this.width, this.pos.x));
            this.pos.y = Math.max(0, Math.min(WORLD_HEIGHT - this.height, this.pos.y));

            if ((keys[' '] || touchControls.fireButton.active) && this.fireCooldown <= 0) {
                this.shoot();
            }
        }

        shoot() {
            const weapon = this.weapons[this.currentWeaponIndex];
            if (weapon.ammo <= 0 && weapon.name !== 'pistol') return;

            this.fireCooldown = weapon.fireRate;
            if (weapon.name !== 'pistol') weapon.ammo--;

            const aimDir = new Vector2( (camera.mouse.x + camera.pos.x) - (this.pos.x + this.width / 2), (camera.mouse.y + camera.pos.y) - (this.pos.y + this.height / 2)).normalize();

            if(weapon.name === 'shotgun') {
                for(let i = 0; i < weapon.spread; i++) {
                    const angle = Math.atan2(aimDir.y, aimDir.x) + (Math.random() - 0.5) * 0.4;
                    const vel = new Vector2(Math.cos(angle) * weapon.bulletSpeed, Math.sin(angle) * weapon.bulletSpeed);
                    entities.push(new Bullet(this.pos.x + this.width / 2, this.pos.y + this.height / 2, vel, weapon.damage, weapon.color));
                }
            } else {
                 const vel = new Vector2(aimDir.x * weapon.bulletSpeed, aimDir.y * weapon.bulletSpeed);
                 entities.push(new Bullet(this.pos.x + this.width / 2, this.pos.y + this.height / 2, vel, weapon.damage, weapon.color));
            }
        }
        
        takeDamage(amount) {
            if (Date.now() - this.lastHitTime > 200) { // 200ms invulnerability
                this.health -= amount;
                this.lastHitTime = Date.now();
                if (this.health <= 0) {
                    this.health = 0;
                    endGame(false);
                }
            }
        }
        
        draw(ctx, camera) {
            const screenX = this.pos.x - camera.pos.x;
            const screenY = this.pos.y - camera.pos.y;
            
            // Blink if recently hit
            if (Date.now() - this.lastHitTime < 200) {
                 ctx.fillStyle = (Math.floor(Date.now() / 50) % 2 === 0) ? '#ff4d4d' : this.color;
            } else {
                 ctx.fillStyle = this.color;
            }
            ctx.fillRect(screenX, screenY, this.width, this.height);
        }
        
        switchWeapon(index) {
            if(index >= 0 && index < this.weapons.length) {
                this.currentWeaponIndex = index;
            }
        }

        addAmmo(type, amount) {
            const weapon = this.weapons.find(w => w.name === type);
            if (weapon) {
                weapon.ammo += amount;
            }
        }
    }

    class Enemy extends Entity {
        constructor(x, y, target) {
            super(x, y, 35, 35, '#ff4d4d');
            this.target = target;
            this.speed = 100 + Math.random() * 50;
            this.health = 3;
            this.damage = 1;
        }

        update(dt) {
            const dir = new Vector2(this.target.pos.x - this.pos.x, this.target.pos.y - this.pos.y).normalize();
            this.pos.x += dir.x * this.speed * dt;
            this.pos.y += dir.y * this.speed * dt;
        }
        
        takeDamage(amount) {
            this.health -= amount;
            if (this.health <= 0) {
                this.isDead = true;
                player.kills++;
                if (Math.random() < 0.2) { // 20% chance to drop coins
                    entities.push(new Coin(this.pos.x, this.pos.y));
                }
                if (Math.random() < 0.1) { // 10% chance to drop pickup
                    entities.push(new Pickup(this.pos.x, this.pos.y));
                }
            }
        }
    }
    
    class Bullet extends Entity {
        constructor(x, y, velocity, damage, color) {
            super(x, y, 8, 8, color);
            this.velocity = velocity;
            this.damage = damage;
            this.life = 2; // 2 seconds
        }
        
        update(dt) {
            this.pos.x += this.velocity.x * dt;
            this.pos.y += this.velocity.y * dt;
            this.life -= dt;
            if(this.life <= 0) this.isDead = true;
        }
    }
    
    class Pickup extends Entity {
        constructor(x, y) {
            const types = ['shotgun', 'chaingun', 'laser', 'health'];
            const type = types[Math.floor(Math.random() * types.length)];
            const colors = { shotgun: '#ff9d00', chaingun: '#aaaaaa', laser: '#00ffff', health: '#4dff4d' };
            super(x, y, 20, 20, colors[type]);
            this.type = type;
            this.amount = { shotgun: 10, chaingun: 50, laser: 15, health: 3 }[type];
        }
    }

    class Coin extends Entity {
        constructor(x, y) {
            super(x, y, 15, 15, '#ffcc00');
            this.value = 1;
            this.type = 'coin';
        }
    }

    class Rocket extends Entity {
        constructor(x, y) {
            super(x, y, 80, 160, '#cccccc');
        }
        draw(ctx, camera) {
             const screenX = this.pos.x - camera.pos.x;
             const screenY = this.pos.y - camera.pos.y;
             // Body
             ctx.fillStyle = '#cccccc';
             ctx.fillRect(screenX, screenY + 20, this.width, this.height - 40);
             // Nose cone
             ctx.beginPath();
             ctx.moveTo(screenX, screenY + 20);
             ctx.lineTo(screenX + this.width, screenY + 20);
             ctx.lineTo(screenX + this.width / 2, screenY);
             ctx.closePath();
             ctx.fill();
             // Fin
             ctx.fillStyle = '#ff4d4d';
             ctx.fillRect(screenX - 20, screenY + this.height - 50, 20, 50);
             ctx.fillRect(screenX + this.width, screenY + this.height - 50, 20, 50);
        }
    }

    class Camera {
        constructor(width, height) {
            this.pos = new Vector2(0, 0);
            this.width = width;
            this.height = height;
            this.mouse = { x: 0, y: 0 };
        }
        
        update(target) {
            this.pos.x = target.pos.x - this.width / 2;
            this.pos.y = target.pos.y - this.height / 2;
            
            this.pos.x = Math.max(0, Math.min(WORLD_WIDTH - this.width, this.pos.x));
            this.pos.y = Math.max(0, Math.min(WORLD_HEIGHT - this.height, this.pos.y));
        }
    }

    // --- GAME LOGIC FUNCTIONS ---
    function init() {
        resizeCanvas();
        
        player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        camera = new Camera(canvas.width, canvas.height);
        rocket = new Rocket(WORLD_WIDTH - 200, WORLD_HEIGHT / 2 - 80);
        entities = [];
        gameTimer = GAME_DURATION;

        // Reset UI
        updateUI();

        if (TGA.initData) {
            // In a real game, you might fetch saved data here.
            // For this example, we start fresh each time.
            console.log("Telegram user data:", TGA.initDataUnsafe);
        }
        
        lastTime = performance.now();
        gameLoop();
    }
    
    function startGame() {
        hideOverlays();
        init();
        gameState = 'PLAYING';
        gameInterval = setInterval(updateTimer, 1000);
        spawnEnemies();
    }
    
    function endGame(didWin) {
        clearInterval(gameInterval);
        gameState = didWin ? 'GAME_WIN' : 'GAME_OVER';

        if (didWin) {
            uiElements.gameWinMessage.textContent = `Harold escaped with ${player.coins} H-Coins and ${player.kills} kills!`;
            uiElements.overlays.gameWin.style.display = 'flex';
        } else {
            uiElements.gameOverMessage.textContent = `Harold was eaten. He collected ${player.coins} H-Coins and got ${player.kills} kills.`;
            uiElements.overlays.gameOver.style.display = 'flex';
        }

        // Save data to backend
        saveData({ coins: player.coins, kills: player.kills });
    }
    
    function updateTimer() {
        gameTimer--;
        updateUI();
        if (gameTimer <= 0) {
            endGame(false);
        }
    }

    function spawnEnemies() {
        if (gameState !== 'PLAYING') return;
        
        const spawnCount = 1 + Math.floor((GAME_DURATION - gameTimer) / 10);
        for(let i = 0; i < spawnCount; i++) {
            // Spawn off-screen
            const edge = Math.floor(Math.random() * 4);
            let x, y;
            const buffer = 50;
            if (edge === 0) { // Top
                x = Math.random() * WORLD_WIDTH;
                y = player.pos.y - camera.height / 2 - buffer;
            } else if (edge === 1) { // Bottom
                x = Math.random() * WORLD_WIDTH;
                y = player.pos.y + camera.height / 2 + buffer;
            } else if (edge === 2) { // Left
                x = player.pos.x - camera.width / 2 - buffer;
                y = Math.random() * WORLD_HEIGHT;
            } else { // Right
                x = player.pos.x + camera.width / 2 + buffer;
                y = Math.random() * WORLD_HEIGHT;
            }
            entities.push(new Enemy(x, y, player));
        }
        
        setTimeout(spawnEnemies, 3000); // Spawn every 3 seconds
    }
    
    let lastTime = 0;
    function gameLoop(timestamp) {
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        if (gameState === 'PLAYING') {
            update(dt);
        }
        draw();
        
        requestAnimationFrame(gameLoop);
    }
    
    function update(dt) {
        player.update(dt);
        camera.update(player);
        
        entities.forEach(e => e.update(dt));
        checkCollisions();
        
        // Remove dead entities
        entities = entities.filter(e => !e.isDead);

        updateUI();
    }

    function checkCollisions() {
        const playerBounds = player.getBounds();

        // Check if player reaches rocket
        if (checkAABB(playerBounds, rocket.getBounds())) {
            endGame(true);
            return;
        }

        entities.forEach(entity => {
            if (entity.isDead) return;
            const entityBounds = entity.getBounds();

            // Player collision with non-bullets
            if (!(entity instanceof Bullet)) {
                 if (checkAABB(playerBounds, entityBounds)) {
                    if (entity instanceof Enemy) {
                        player.takeDamage(entity.damage);
                    } else if (entity instanceof Coin) {
                        player.coins += entity.value;
                        entity.isDead = true;
                    } else if (entity instanceof Pickup) {
                        if (entity.type === 'health') {
                            player.health = Math.min(player.maxHealth, player.health + entity.amount);
                        } else {
                            player.addAmmo(entity.type, entity.amount);
                        }
                        entity.isDead = true;
                    }
                }
            }
            
            // Bullet collisions
            if (entity instanceof Bullet) {
                entities.forEach(other => {
                    if (other instanceof Enemy && checkAABB(entityBounds, other.getBounds())) {
                        other.takeDamage(entity.damage);
                        entity.isDead = true;
                    }
                });
            }
        });
    }

    function checkAABB(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    function draw() {
        // Clear canvas with background color
        ctx.fillStyle = '#1a1a2d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#3a3a5d';
        ctx.lineWidth = 1;
        const gridSize = 100;
        const startX = - (camera.pos.x % gridSize);
        const startY = - (camera.pos.y % gridSize);

        for (let x = startX; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = startY; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Draw entities relative to camera
        rocket.draw(ctx, camera);
        if (player) player.draw(ctx, camera);
        entities.forEach(e => e.draw(ctx, camera));
        
        // Draw touch controls if on touch device
        if ('ontouchstart' in window) {
            drawTouchControls();
        }
    }
    
    function drawTouchControls() {
        const { joystick, fireButton } = touchControls;

        // Joystick
        ctx.beginPath();
        ctx.arc(joystick.x, joystick.y, joystick.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.beginPath();
        const stickX = joystick.x + joystick.dx * joystick.radius;
        const stickY = joystick.y + joystick.dy * joystick.radius;
        ctx.arc(stickX, stickY, joystick.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        // Fire button
        ctx.beginPath();
        ctx.arc(fireButton.x, fireButton.y, fireButton.radius, 0, Math.PI * 2);
        ctx.fillStyle = fireButton.active ? 'rgba(255, 80, 80, 0.6)' : 'rgba(255, 80, 80, 0.3)';
        ctx.fill();
    }
    
    function updateUI() {
        // Timer
        const minutes = Math.floor(gameTimer / 60);
        const seconds = gameTimer % 60;
        uiElements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (!player) return;

        // Player stats
        uiElements.coinCounter.textContent = `H-Coins: ${player.coins}`;
        uiElements.killCounter.textContent = `Kills: ${player.kills}`;
        uiElements.lifebarInner.style.width = `${(player.health / player.maxHealth) * 100}%`;
        
        // Ammo
        for (const weapon of player.weapons) {
            const counter = uiElements.ammoCounters[weapon.name];
            if (counter) {
                if (weapon.ammo > 0 || weapon.name === player.weapons[player.currentWeaponIndex].name) {
                     counter.style.display = 'block';
                     counter.textContent = `${counter.id.split('-')[0].toUpperCase()}: ${weapon.ammo === Infinity ? 'INF' : weapon.ammo}`;
                } else {
                    counter.style.display = 'none';
                }
            }
        }
    }
    
    // --- EVENT HANDLERS ---
    function resizeCanvas() {
        const container = document.getElementById('game-container');
        const aspectRatio = 16 / 9;
        const width = container.clientWidth;
        const height = width / aspectRatio;
        
        canvas.width = width;
        canvas.height = height;

        if(camera) {
            camera.width = width;
            camera.height = height;
        }

        // Reposition touch controls
        touchControls.joystick.x = canvas.width * 0.15;
        touchControls.joystick.y = canvas.height * 0.75;
        touchControls.joystick.radius = canvas.width * 0.08;
        
        touchControls.fireButton.x = canvas.width * 0.85;
        touchControls.fireButton.y = canvas.height * 0.75;
        touchControls.fireButton.radius = canvas.width * 0.06;
    }

    function setupEventListeners() {
        window.addEventListener('resize', resizeCanvas);
        
        // Keyboard
        window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; handleWeaponSwitch(e.key); });
        window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
        
        // Mouse for aiming
        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            camera.mouse.x = e.clientX - rect.left;
            camera.mouse.y = e.clientY - rect.top;
        });

        // Touch
        canvas.addEventListener('touchstart', handleTouch, { passive: false });
        canvas.addEventListener('touchmove', handleTouch, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // UI Buttons
        uiElements.buttons.play.addEventListener('click', startGame);
        uiElements.buttons.restartWin.addEventListener('click', startGame);
        uiElements.buttons.restartGameOver.addEventListener('click', startGame);
        uiElements.buttons.soundToggle.addEventListener('click', toggleSound);
    }
    
    function handleWeaponSwitch(key) {
        if (key >= '1' && key <= '4') {
            const index = parseInt(key) - 1;
            if (player) player.switchWeapon(index);
        }
    }
    
    function handleTouch(e) {
        e.preventDefault();
        touchControls.joystick.active = false;
        touchControls.fireButton.active = false;
        
        for (const touch of e.touches) {
            const x = touch.clientX - canvas.getBoundingClientRect().left;
            const y = touch.clientY - canvas.getBoundingClientRect().top;
            
            // Aiming is based on the first touch in the right half of the screen
            if (x > canvas.width / 2) {
                camera.mouse.x = x;
                camera.mouse.y = y;
            }

            // Joystick
            const joy = touchControls.joystick;
            const distToJoy = Math.sqrt((x - joy.x)**2 + (y - joy.y)**2);
            if (x < canvas.width / 2 && distToJoy < joy.radius * 2) {
                 joy.active = true;
                 const dx = x - joy.x;
                 const dy = y - joy.y;
                 const mag = Math.sqrt(dx*dx + dy*dy);
                 joy.dx = Math.min(1, mag/joy.radius) * (dx/mag || 0);
                 joy.dy = Math.min(1, mag/joy.radius) * (dy/mag || 0);
            }

            // Fire button
            const fire = touchControls.fireButton;
            const distToFire = Math.sqrt((x - fire.x)**2 + (y - fire.y)**2);
            if (distToFire < fire.radius) {
                fire.active = true;
            }
        }
    }
    
    function handleTouchEnd(e) {
        touchControls.joystick.active = false;
        touchControls.joystick.dx = 0;
        touchControls.joystick.dy = 0;
        touchControls.fireButton.active = false;
    }

    function hideOverlays() {
        Object.values(uiElements.overlays).forEach(o => o.style.display = 'none');
    }
    
    function toggleSound() {
        isSoundOn = !isSoundOn;
        uiElements.buttons.soundToggle.textContent = `Sound: ${isSoundOn ? 'ON' : 'OFF'}`;
        // Add sound muting logic here if you have audio
    }
    
    // --- BACKEND COMMUNICATION ---
    async function saveData(data) {
        if (!TGA.initData) {
            console.log("Not in Telegram, skipping save.");
            return;
        }
        try {
            const response = await fetch('/.netlify/functions/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    initData: TGA.initData,
                    ...data
                })
            });
            if (response.ok) {
                console.log("Data saved successfully.");
            } else {
                console.error("Failed to save data:", await response.text());
            }
        } catch(error) {
            console.error("Error saving data:", error);
        }
    }

    // --- INITIALIZATION ---
    setupEventListeners();
    init(); // Run once to set up initial screen
});