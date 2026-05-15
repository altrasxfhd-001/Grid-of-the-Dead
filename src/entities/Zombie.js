import { toIso, GRID } from '../utils/IsoUtils.js';

export default class Zombie {
  constructor(scene, gx, gy, level) {
    this.scene = scene;
    this.gx = gx;
    this.gy = gy;
    this.level = level;
    this.hp = 60 + (level * 10);
    this.maxHp = this.hp;
    this.speed = 1.2 + Math.random();
    this.state = 'wander';
    this.detectionRange = 8;
    this.alive = true;

    const iso = toIso(this.gx, this.gy);
    this.sprite = scene.add.sprite(iso.x, iso.y, 'zombie').setDepth(10).setOrigin(0.5, 0.8);
    
    this.hpBg = scene.add.graphics().setDepth(20);
    this.hpBar = scene.add.graphics().setDepth(21);
    
    this.sprite.play('zombie_walk', true);
  }

  update(dt, player) {
    if (!this.alive) return;

    const dist = Math.hypot(this.gx - player.gx, this.gy - player.gy);
    if (dist < this.detectionRange) this.state = 'chase';

    if (this.state === 'chase') {
      const len = dist || 1;
      this.gx += ((player.gx - this.gx) / len) * this.speed * dt;
      this.gy += ((player.gy - this.gy) / len) * this.speed * dt;
      
      if (dist < 0.8) {
        player.hp -= 15 * dt;
      }
    }

    this.gx = Phaser.Math.Clamp(this.gx, 0, GRID - 1);
    this.gy = Phaser.Math.Clamp(this.gy, 0, GRID - 1);

    const iso = toIso(this.gx, this.gy);
    this.sprite.setPosition(iso.x, iso.y).setDepth(this.gx + this.gy + 1);
    
    this.updateHealthBar(iso);
  }

  updateHealthBar(iso) {
    this.hpBg.clear().fillStyle(0x440000).fillRect(iso.x - 18, iso.y - 30, 36, 4);
    this.hpBar.clear().fillStyle(0xff3333).fillRect(iso.x - 18, iso.y - 30, 36 * (this.hp / this.maxHp), 4);
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
