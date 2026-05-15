import { toIso, GRID } from '../utils/IsoUtils.js';

export default class Player {
  constructor(scene, gx, gy) {
    this.scene = scene;
    this.gx = gx;
    this.gy = gy;
    this.speed = 4;
    this.hp = 100;
    this.maxHp = 100;
    this.hunger = 100;
    this.thirst = 100;
    this.xp = 0;
    this.xpMax = 100;
    this.level = 1;
    this.killCount = 0;
    this.dead = false;

    const iso = toIso(this.gx, this.gy);
    this.sprite = scene.add.sprite(iso.x, iso.y, 'player').setDepth(10).setOrigin(0.5, 0.8);
    this.iso = iso;
  }

  update(dt, cursors, wasd) {
    if (this.dead) return;

    let dx = 0, dy = 0;
    if (cursors.left.isDown || wasd.left.isDown) { dx -= 1; dy += 1; }
    if (cursors.right.isDown || wasd.right.isDown) { dx += 1; dy -= 1; }
    if (cursors.up.isDown || wasd.up.isDown) { dx -= 1; dy -= 1; }
    if (cursors.down.isDown || wasd.down.isDown) { dx += 1; dy += 1; }

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      this.gx = Phaser.Math.Clamp(this.gx + (dx / len) * this.speed * dt, 0, GRID - 1);
      this.gy = Phaser.Math.Clamp(this.gy + (dy / len) * this.speed * dt, 0, GRID - 1);
      
      // Animation logic (placeholder for now, will play 'walk' if moving)
      if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key !== 'player_walk') {
        this.sprite.play('player_walk', true);
      }
    } else {
      this.sprite.stop();
    }

    const iso = toIso(this.gx, this.gy);
    this.iso = iso;
    this.sprite.setPosition(iso.x, iso.y).setDepth(this.gx + this.gy + 1);

    // Update survival stats
    this.hunger = Math.max(0, this.hunger - 0.8 * dt);
    this.thirst = Math.max(0, this.thirst - 1.2 * dt);
    if (this.hunger <= 0) this.hp -= 2 * dt;
    if (this.thirst <= 0) this.hp -= 3 * dt;

    if (this.hp <= 0 && !this.dead) {
      this.die();
    }
  }

  die() {
    this.dead = true;
    this.scene.events.emit('player_died');
  }

  addXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpMax) {
      this.xp -= this.xpMax;
      this.xpMax = Math.floor(this.xpMax * 1.5);
      this.level++;
      this.scene.events.emit('player_level_up');
    }
  }
}
