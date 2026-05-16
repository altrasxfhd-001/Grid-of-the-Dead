import { toIso, GRID } from '../utils/IsoUtils.js';

export default class Zombie {
  constructor(scene, gx, gy, level) {
    this.scene = scene;
    this.gx = gx;
    this.gy = gy;
    this.level = level;
    this.hp = 10;
    this.maxHp = 10;
    this.speed = 1.2 + Math.random();
    this.state = 'wander';
    this.detectionRange = 8;
    this.alive = true;
    this.lastDir = 's';
    this.bobTimer = Math.random() * 1000; // Random offset for bobbing

    const iso = toIso(this.gx, this.gy);
    this.sprite = scene.add.sprite(iso.x, iso.y, 'zombie').setDepth(10).setOrigin(0.5, 0.8).setScale(1.0);
    
    this.hpBg = scene.add.graphics().setDepth(20);
    this.hpBar = scene.add.graphics().setDepth(21);
  }

  update(dt, player) {
    if (!this.alive) return;

    const dist = Math.hypot(this.gx - player.gx, this.gy - player.gy);
    if (dist < this.detectionRange) this.state = 'chase';

    let isMoving = false;
    if (this.state === 'chase') {
      const len = dist || 1;
      const dx = (player.gx - this.gx) / len;
      const dy = (player.gy - this.gy) / len;
      
      this.gx += dx * this.speed * dt;
      this.gy += dy * this.speed * dt;
      isMoving = true;

      if (dist < 0.8) {
        player.hp -= 15 * dt;
      }
    }

    this.gx = Phaser.Math.Clamp(this.gx, 0, GRID - 1);
    this.gy = Phaser.Math.Clamp(this.gy, 0, GRID - 1);

    const iso = toIso(this.gx, this.gy);
    
    // Apply Squash and Stretch / Bobbing effect if moving
    if (isMoving) {
      this.bobTimer += dt * 10;
      const bob = Math.sin(this.bobTimer);
      // Squash and stretch
      this.sprite.setScale(1 + bob * 0.05, 1 - bob * 0.05);
      // Slight vertical bob
      this.sprite.setPosition(iso.x, iso.y + bob * 2);
    } else {
      this.sprite.setPosition(iso.x, iso.y);
      this.sprite.setScale(1, 1);
    }

    this.sprite.setDepth(this.gx + this.gy + 1);
    this.updateHealthBar(iso);
  }

  updateHealthBar(iso) {
    const yOffset = this.sprite.displayHeight * 0.8;
    this.hpBg.clear().fillStyle(0x440000).fillRect(iso.x - 18, iso.y - yOffset, 36, 4);
    this.hpBar.clear().fillStyle(0xff3333).fillRect(iso.x - 18, iso.y - yOffset, 36 * (this.hp / this.maxHp), 4);
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0 && this.alive) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    this.sprite.setVisible(false);
    this.hpBg.clear();
    this.hpBar.clear();
    this.scene.events.emit('zombie_killed', this);
  }

  destroy() {
    this.sprite.destroy();
    this.hpBg.destroy();
    this.hpBar.destroy();
  }
}
