import Player from '../entities/Player.js';
import Zombie from '../entities/Zombie.js';
import HUD from '../ui/HUD.js';
import { toIso, GRID, TILE_W, TILE_H } from '../utils/IsoUtils.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.worldContainer = this.add.container(0, 0);
    
    // --- Tilemap Implementation ---
    this.setupTilemap();

    this.lootBoxes = [];
    for (let i = 0; i < 10; i++) this.spawnLootBox();

    this.player = new Player(this, GRID / 2, GRID / 2);
    this.worldContainer.add(this.player.sprite);

    this.zombies = [];
    for (let i = 0; i < 8; i++) this.spawnZombie();

    this.gems = [];

    // --- Weapon Logic (Aura Attack - Commented out for now) ---
    /*
    this.auraSprite = this.add.image(this.player.iso.x, this.player.iso.y, 'aura').setAlpha(0).setDepth(9).setOrigin(0.5, 0.5);
    this.worldContainer.add(this.auraSprite);
    this.autoAttackRadius = 80;
    this.autoAttackDamage = 30;
    this.time.addEvent({ delay: 2000, loop: true, callback: this.triggerAutoAttack, callbackScope: this });
    */

    // --- New Weapon: Throwing Knife ---
    this.knives = this.physics.add.group();
    this.time.addEvent({ delay: 1000, loop: true, callback: this.throwKnife, callbackScope: this });

    // Events (Narrative events removed as requested)
    // this.time.addEvent({ delay: 25000, loop: true, callback: this.triggerNarrativeEvent, callbackScope: this });
    this.time.addEvent({ delay: 3000, loop: true, callback: this.spawnZombie, callbackScope: this });

    this.hud = new HUD(this);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D', loot: 'E' });
    
    this.isGamePaused = false;
    this.dead = false;

    // Listen for events from entities
    this.events.on('player_died', this.triggerDeath, this);
    this.events.on('player_level_up', this.triggerLevelUp, this);
    this.events.on('zombie_killed', (zombie) => {
      this.player.killCount++;
      this.spawnXPGem(zombie.gx, zombie.gy);
    }, this);

    this.camOffset = { x: 0, y: 0 };
    
    this.overlayUI = this.add.container(0, 0).setScrollFactor(0).setDepth(300).setVisible(false);

    this.input.on('wheel', (ptr, objs, dx, dy) => {
      const zoom = Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.001, 0.5, 2);
      this.cameras.main.setZoom(zoom);
    });

    // Space to Pause
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey.on('down', this.togglePause, this);

    this.pausedText = this.add.text(450, 300, 'PAUSED', { fontSize: '64px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setVisible(false);
  }

  togglePause() {
    if (this.dead) return;
    this.isGamePaused = !this.isGamePaused;
    this.pausedText.setVisible(this.isGamePaused);
    
    if (this.isGamePaused) {
      this.physics.world.pause();
      this.time.paused = true;
    } else {
      this.physics.world.resume();
      this.time.paused = false;
    }
  }

  setupTilemap() {
    const data = [];
    for (let y = 0; y < GRID; y++) {
      const row = [];
      for (let x = 0; x < GRID; x++) {
        row.push(Math.random() < 0.15 ? 1 : 0);
      }
      data.push(row);
    }

    const map = this.make.tilemap({
      data: data,
      tileWidth: TILE_W,
      tileHeight: TILE_H
    });

    const tileset = map.addTilesetImage('tiles', 'tiles', 64, 32);
    
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const { x, y } = toIso(gx, gy);
        const type = data[gy][gx];
        const frameIndex = type === 0 ? 0 : 2; 
        const tileSprite = this.add.image(x, y, 'tiles', frameIndex).setDepth(gx + gy).setOrigin(0.5, 0.5).setScale(0.125);
        this.worldContainer.add(tileSprite);
      }
    }
  }

  spawnLootBox() {
    const gx = Phaser.Math.Between(2, GRID - 3), gy = Phaser.Math.Between(2, GRID - 3);
    const { x, y } = toIso(gx, gy);
    const sprite = this.add.image(x, y, 'lootBox').setDepth(gx + gy + 1).setOrigin(0.5, 0.9);
    this.worldContainer.add(sprite);
    this.lootBoxes.push({ gx, gy, sprite, looted: false });
  }

  spawnZombie() {
    if (this.zombies.filter(z => z.alive).length > 30) return;
    let gx, gy;
    do {
      gx = Phaser.Math.Between(1, GRID - 2); gy = Phaser.Math.Between(1, GRID - 2);
    } while (Math.hypot(gx - this.player.gx, gy - this.player.gy) < 8);
    
    const zombie = new Zombie(this, gx, gy, this.player.level);
    this.worldContainer.add([zombie.sprite, zombie.hpBg, zombie.hpBar]);
    this.zombies.push(zombie);
  }

  spawnXPGem(gx, gy) {
    const { x, y } = toIso(gx, gy);
    const sprite = this.add.image(x, y, 'xpGem').setDepth(gx + gy).setOrigin(0.5, 0.5);
    this.worldContainer.add(sprite);
    this.gems.push({ gx, gy, sprite, value: 30 });
  }

  // --- New Attack: Knife Throw ---
  throwKnife() {
    if (this.dead || this.isGamePaused) return;

    // Find nearest alive zombie
    const aliveZombies = this.zombies.filter(z => z.alive);
    if (aliveZombies.length === 0) return;

    let nearestZombie = null;
    let minDist = Infinity;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y - 40;

    aliveZombies.forEach(z => {
      const dist = Phaser.Math.Distance.Between(px, py, z.sprite.x, z.sprite.y);
      if (dist < minDist) {
        minDist = dist;
        nearestZombie = z;
      }
    });

    if (!nearestZombie) return;

    const knife = this.knives.create(px, py, 'knife');
    knife.setDepth(100);
    
    const speed = 500;
    const angle = Phaser.Math.Angle.Between(px, py, nearestZombie.sprite.x, nearestZombie.sprite.y);

    knife.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    knife.setRotation(angle);
    
    this.time.addEvent({ delay: 2000, callback: () => knife.destroy() });

    this.physics.add.overlap(knife, this.zombies.map(z => z.sprite), (k, zSprite) => {
      const zombie = this.zombies.find(z => z.sprite === zSprite);
      if (zombie && zombie.alive) {
        zombie.takeDamage(6);
        k.destroy();
      }
    });
  }

  /*
  triggerAutoAttack() {
    if (this.dead || this.isGamePaused) return;
    const px = this.player.iso.x, py = this.player.iso.y;
    this.auraSprite.setPosition(px, py).setAlpha(0.9);
    this.tweens.add({ targets: this.auraSprite, alpha: 0, scaleX: 1 + (this.autoAttackRadius / 80), scaleY: 1 + (this.autoAttackRadius / 80), duration: 400 });

    this.zombies.forEach(z => {
      if (!z.alive) return;
      if (Math.hypot(z.sprite.x - px, z.sprite.y - py) < this.autoAttackRadius) {
        z.takeDamage(this.autoAttackDamage);
      }
    });
  }
  */

  update(time, delta) {
    if (this.dead) return;
    const dt = delta / 1000;

    this.updateCamera();
    this.hud.update(this.player);

    if (this.isGamePaused) return;

    this.player.update(dt, this.cursors, this.wasd);
    this.updateLooting(dt);
    this.zombies.forEach(z => z.update(dt, this.player));
    this.updateGems();
  }

  updateLooting(dt) {
    let nearBox = null;
    this.lootBoxes.forEach(box => {
      if (!box.looted && Math.hypot(box.gx - this.player.gx, box.gy - this.player.gy) < 2) nearBox = box;
    });
    
    this.hud.showLootPrompt(!!nearBox);
    
    if (nearBox && this.wasd.loot.isDown) {
      if (!this.lootTimer) this.lootTimer = 0;
      this.lootTimer += dt;
      nearBox.sprite.setTint(0xaaffaa);
      if (this.lootTimer >= 1.5) {
        this.player.hunger = Math.min(100, this.player.hunger + 40);
        this.player.thirst = Math.min(100, this.player.thirst + 40);
        nearBox.looted = true; nearBox.sprite.setAlpha(0.3).clearTint();
        this.lootTimer = 0;
      }
    } else {
      this.lootTimer = 0; nearBox?.sprite.clearTint();
    }
  }

  updateGems() {
    this.gems = this.gems.filter(gem => {
      if (Math.hypot(gem.gx - this.player.gx, gem.gy - this.player.gy) < 1.5) {
        this.player.addXP(gem.value);
        gem.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  updateCamera() {
    this.camOffset.x = Phaser.Math.Linear(this.camOffset.x, this.scale.width / 2 - this.player.iso.x, 0.1);
    this.camOffset.y = Phaser.Math.Linear(this.camOffset.y, this.scale.height / 2 - this.player.iso.y, 0.1);
    this.worldContainer.setPosition(this.camOffset.x, this.camOffset.y);
  }

  // --- UI Overlays (Narrative events removed) ---
  /*
  triggerNarrativeEvent() {
    if (this.dead || this.isGamePaused) return;
    this.isGamePaused = true;
    this.overlayUI.removeAll(true).setVisible(true);

    const bg = this.add.rectangle(450, 300, 900, 600, 0x000000, 0.8);
    const title = this.add.text(450, 150, 'موقف مصيري', { fontSize: '24px', color: '#ffaaaa', fontStyle: 'bold' }).setOrigin(0.5);
    const desc = this.add.text(450, 220, 'لقيت شخص مصاب بيطلب المساعدة وبيحاول ياخد أكلك.', { fontSize: '18px', color: '#fff', rtl: true }).setOrigin(0.5);

    const btn1 = this.createButton(450, 320, 'ساعده (تخسر أكل - تكسب صحة)', () => {
      this.player.hunger -= 30; this.player.hp = this.player.maxHp; this.closeOverlay();
    });
    const btn2 = this.createButton(450, 380, 'اتركه (تحتفظ بالأكل - تخسر صحة)', () => {
      this.player.hp -= 20; this.closeOverlay();
    });

    this.overlayUI.add([bg, title, desc, btn1, btn2]);
  }
  */

  triggerLevelUp() {
    this.isGamePaused = true;
    this.overlayUI.removeAll(true).setVisible(true);

    const bg = this.add.rectangle(450, 300, 900, 600, 0x002244, 0.9);
    const title = this.add.text(450, 150, 'LEVEL UP!', { fontSize: '32px', color: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5);

    const btn1 = this.createButton(450, 250, '🔥 زيادة الضرر', () => { /* Attack power up logic */ this.closeOverlay(); });
    const btn2 = this.createButton(450, 320, '🏃 زيادة السرعة', () => { this.player.speed += 1; this.closeOverlay(); });
    const btn3 = this.createButton(450, 390, '🛑 نطاق ضرب أوسع', () => { /* Scope logic */ this.closeOverlay(); });

    this.overlayUI.add([bg, title, btn1, btn2, btn3]);
  }

  createButton(x, y, text, callback) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 300, 50, 0x333333).setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, text, { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
    bg.on('pointerdown', callback);
    bg.on('pointerover', () => bg.setFillStyle(0x555555));
    bg.on('pointerout', () => bg.setFillStyle(0x333333));
    container.add([bg, txt]);
    return container;
  }

  closeOverlay() {
    this.overlayUI.setVisible(false);
    this.isGamePaused = false;
  }

  triggerDeath() {
    this.dead = true;
    this.hud.container.setVisible(false);
    this.add.rectangle(450, 300, 900, 600, 0x550000, 0.8).setScrollFactor(0).setDepth(400);
    this.add.text(450, 280, 'YOU DIED', { fontSize: '48px', color: '#ff2222', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(401);
    this.add.text(450, 330, `Level: ${this.player.level} | Kills: ${this.player.killCount}`, { fontSize: '22px', color: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(401);
    this.add.text(450, 380, 'Press R to Restart', { fontSize: '16px', color: '#aaa' }).setOrigin(0.5).setScrollFactor(0).setDepth(401);
    this.input.keyboard.once('keydown-R', () => { this.scene.restart(); });
  }
}
