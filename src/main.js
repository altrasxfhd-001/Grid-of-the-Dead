import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 600,
  backgroundColor: '#111a11',
  parent: 'game-container',
  scene: [BootScene, GameScene],
  pixelArt: true,
  antialias: false,
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  }
};

const game = new Phaser.Game(config);
