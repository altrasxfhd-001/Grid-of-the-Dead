import { TILE_W, TILE_H } from '../utils/IsoUtils.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Load Spritesheets
    this.load.spritesheet('player', './assets/player_spritesheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('zombie', './assets/zombie_spritesheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('tiles', './assets/tiles.png', { frameWidth: 64, frameHeight: 32 });

    // Procedural Textures (for things we don't have images for yet)
    const g = this.make.graphics({ add: false });
    
    // Loot
    g.clear(); g.fillStyle(0x8b5e3c); g.beginPath(); g.moveTo(16, 0); g.lineTo(28, 6); g.lineTo(28, 18); g.lineTo(16, 24); g.lineTo(4, 18); g.lineTo(4, 6); g.closePath(); g.fillPath();
    g.generateTexture('lootBox', 32, 28);
    
    // Aura
    g.clear(); g.lineStyle(3, 0xffff00, 0.8); g.strokeCircle(50, 50, 48);
    g.generateTexture('aura', 100, 100);

    // XP Gem
    g.clear(); g.fillStyle(0x00ffff); g.beginPath(); g.moveTo(8,0); g.lineTo(16,8); g.lineTo(8,16); g.lineTo(0,8); g.closePath(); g.fillPath();
    g.generateTexture('xpGem', 16, 16);

    g.destroy();
  }

  create() {
    // Define Animations
    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'zombie_walk',
      frames: this.anims.generateFrameNumbers('zombie', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

    this.scene.start('Game');
  }
}
