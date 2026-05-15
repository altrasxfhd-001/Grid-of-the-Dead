export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.barW = 160;
    this.barH = 14;
    this.pad = 14;
    this.create();
  }

  create() {
    this.container = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(100);

    this.hudHungerBg = this.scene.add.graphics();
    this.hudHungerFill = this.scene.add.graphics();
    this.hudThirstBg = this.scene.add.graphics();
    this.hudThirstFill = this.scene.add.graphics();
    this.hudHPBg = this.scene.add.graphics();
    this.hudHPFill = this.scene.add.graphics();
    this.hudXPBg = this.scene.add.graphics();
    this.hudXPFill = this.scene.add.graphics();

    this.container.add([
      this.hudHungerBg, this.hudHungerFill,
      this.hudThirstBg, this.hudThirstFill,
      this.hudHPBg, this.hudHPFill,
      this.hudXPBg, this.hudXPFill
    ]);

    this.container.add(this.scene.add.text(this.pad, this.pad - 14, '🍖 HUNGER', { fontSize: '11px', color: '#ffcc66' }));
    this.container.add(this.scene.add.text(this.pad, this.pad + 20, '💧 THIRST', { fontSize: '11px', color: '#66ccff' }));
    this.container.add(this.scene.add.text(this.pad, this.pad + 54, '❤️ HEALTH', { fontSize: '11px', color: '#ff6666' }));

    this.lvlText = this.scene.add.text(this.pad, this.pad + 88, '⭐ LVL: 1', { fontSize: '12px', color: '#00ffff', fontStyle: 'bold' });
    this.container.add(this.lvlText);

    this.killText = this.scene.add.text(this.scene.scale.width - 10, 14, 'Kills: 0', { fontSize: '13px', color: '#ff6644', fontStyle: 'bold' }).setOrigin(1, 0);
    this.container.add(this.killText);

    this.lootPrompt = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height - 50, 'Hold [E] to Loot', { fontSize: '14px', color: '#ffff88', backgroundColor: '#000000aa', padding: { x: 8, y: 4 } }).setOrigin(0.5).setVisible(false);
    this.container.add(this.lootPrompt);
  }

  update(stats) {
    const drawBar = (fill, bg, y, pct, color) => {
      bg.clear().fillStyle(0x222222).fillRoundedRect(this.pad, y, this.barW, this.barH, 4);
      fill.clear().fillStyle(color).fillRoundedRect(this.pad + 1, y + 1, Math.max(0, (this.barW - 2) * pct), this.barH - 2, 3);
    };

    drawBar(this.hudHungerFill, this.hudHungerBg, this.pad, stats.hunger / 100, 0xffaa33);
    drawBar(this.hudThirstFill, this.hudThirstBg, this.pad + 34, stats.thirst / 100, 0x33aaff);
    drawBar(this.hudHPFill, this.hudHPBg, this.pad + 68, stats.hp / stats.maxHp, 0xff3333);
    drawBar(this.hudXPFill, this.hudXPBg, this.pad + 102, stats.xp / stats.xpMax, 0x00ffff);

    this.lvlText.setText('⭐ LVL: ' + stats.level);
    this.killText.setText('Kills: ' + stats.killCount);
  }

  showLootPrompt(visible) {
    this.lootPrompt.setVisible(visible);
  }
}
