const DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const ATLAS_JSON = './assets/standard/character.json';
const WALK_FRAMES = { start: 1, end: 8 };
const RUN_FRAMES = { start: 1, end: 8 };

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.spritesheet('tiles', './assets/tiles.png', {
      frameWidth: 512,
      frameHeight: 512,
    });

    this.load.atlas('walk', './assets/standard/walk.png', ATLAS_JSON);
    this.load.atlas('run', './assets/standard/run.png', ATLAS_JSON);
    this.load.json('playerMetadata', './assets/standard/metadata.json');

    this.load.image('zombie', './assets/zombie_spritesheet.png');

    const g = this.make.graphics({ add: false });
    g.clear(); g.fillStyle(0x8b5e3c); g.beginPath(); g.moveTo(16, 0); g.lineTo(28, 6); g.lineTo(28, 18); g.lineTo(16, 24); g.lineTo(4, 18); g.lineTo(4, 6); g.closePath(); g.fillPath();
    g.generateTexture('lootBox', 32, 28);
    g.clear(); g.lineStyle(3, 0xffff00, 0.8); g.strokeCircle(50, 50, 48);
    g.generateTexture('aura', 100, 100);
    g.clear(); g.fillStyle(0x00ffff); g.beginPath(); g.moveTo(8, 0); g.lineTo(16, 8); g.lineTo(8, 16); g.lineTo(0, 8); g.closePath(); g.fillPath();
    g.generateTexture('xpGem', 16, 16);
    g.clear(); g.fillStyle(0xcccccc); g.fillRect(0, 4, 12, 2); g.fillStyle(0x663300); g.fillRect(0, 4, 4, 2);
    g.generateTexture('knife', 12, 10);
    g.destroy();
  }

  create() {
    const metadata = this.cache.json.get('playerMetadata');
    this.registry.set('playerMetadata', metadata);

    DIRECTIONS.forEach((dir) => {
      this.anims.create({
        key: `player_walk_${dir}`,
        frames: this.anims.generateFrameNames('walk', {
          prefix: `${dir}_`,
          ...WALK_FRAMES,
        }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: `player_run_${dir}`,
        frames: this.anims.generateFrameNames('run', {
          prefix: `${dir}_`,
          ...RUN_FRAMES,
        }),
        frameRate: 14,
        repeat: -1,
      });
    });

    this.scene.start('Game');
  }
}
