import { toIso, GRID } from '../utils/IsoUtils.js';

const DEFAULT_DIR = 's';
const RUN_SPEED_MULT = 1.6;

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
    this.lastDir = DEFAULT_DIR;
    this.moveState = 'idle';

    this.metadata = scene.registry.get('playerMetadata') || { anchor: { x: 0.5, y: 0.875 }, directions: {} };
    this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    const iso = toIso(this.gx, this.gy);
    this.sprite = scene.add
      .sprite(iso.x, iso.y, 'walk', this.getIdleFrameName(this.lastDir))
      .setDepth(10)
      .setScale(1.0);
    this.applyFootAnchor(this.lastDir);
    this.iso = iso;
  }

  getIdleFrameName(dir) {
    const dirMeta = this.metadata.directions?.[dir];
    return dirMeta?.idleFrame ?? `${dir}_0`;
  }

  applyFootAnchor(dir) {
    const dirMeta = this.metadata.directions?.[dir];
    const anchor = dirMeta?.footAnchor ?? this.metadata.anchor ?? { x: 0.5, y: 0.875 };
    this.sprite.setOrigin(anchor.x, anchor.y);
  }

  update(dt, cursors, wasd) {
    if (this.dead) return;

    let dx = 0;
    let dy = 0;
    if (cursors.left.isDown || wasd.left.isDown) { dx -= 1; dy += 1; }
    if (cursors.right.isDown || wasd.right.isDown) { dx += 1; dy -= 1; }
    if (cursors.up.isDown || wasd.up.isDown) { dx -= 1; dy -= 1; }
    if (cursors.down.isDown || wasd.down.isDown) { dx += 1; dy += 1; }

    const moving = dx !== 0 || dy !== 0;

    if (moving) {
      const len = Math.hypot(dx, dy);
      const ndx = dx / len;
      const ndy = dy / len;
      const speedMult = this.shiftKey.isDown ? RUN_SPEED_MULT : 1;

      this.gx = Phaser.Math.Clamp(this.gx + ndx * this.speed * speedMult * dt, 0, GRID - 1);
      this.gy = Phaser.Math.Clamp(this.gy + ndy * this.speed * speedMult * dt, 0, GRID - 1);

      this.updateDirection(dx, dy);
      this.applyFootAnchor(this.lastDir);

      const running = this.shiftKey.isDown;
      const nextState = running ? 'run' : 'walk';
      const animKey = `player_${nextState}_${this.lastDir}`;

      if (this.moveState !== nextState || this.sprite.texture.key !== nextState) {
        this.sprite.setTexture(nextState);
        this.moveState = nextState;
      }

      if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key !== animKey) {
        this.sprite.play(animKey, true);
      }
    } else {
      this.setIdlePose();
    }

    const iso = toIso(this.gx, this.gy);
    this.iso = iso;
    this.sprite.setPosition(iso.x, iso.y).setDepth(this.gx + this.gy + 1);

    this.hunger = Math.max(0, this.hunger - 0.8 * dt);
    this.thirst = Math.max(0, this.thirst - 1.2 * dt);
    if (this.hunger <= 0) this.hp -= 2 * dt;
    if (this.thirst <= 0) this.hp -= 3 * dt;

    if (this.hp <= 0 && !this.dead) this.die();
  }

  setIdlePose() {
    this.moveState = 'idle';

    if (this.sprite.anims.isPlaying) {
      this.sprite.anims.stop();
    }

    if (this.sprite.texture.key !== 'walk') {
      this.sprite.setTexture('walk');
    }

    this.sprite.setFrame(this.getIdleFrameName(this.lastDir));
  }

  updateDirection(dx, dy) {
    if (dx > 0 && dy > 0) this.lastDir = 's';
    else if (dx < 0 && dy < 0) this.lastDir = 'n';
    else if (dx > 0 && dy < 0) this.lastDir = 'e';
    else if (dx < 0 && dy > 0) this.lastDir = 'w';
    else if (dx > 0 && dy === 0) this.lastDir = 'se';
    else if (dx < 0 && dy === 0) this.lastDir = 'nw';
    else if (dx === 0 && dy > 0) this.lastDir = 'sw';
    else if (dx === 0 && dy < 0) this.lastDir = 'ne';
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
