import Phaser from 'phaser';
import { Legend } from '../../data/legends';
import { PLAYER_CONFIG, COLORS } from '../config';

export class PlayerSprite {
  body: Phaser.Physics.Arcade.Sprite;
  graphics: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  legend: Legend;
  isHome: boolean;
  stamina: number;
  isSkillMoving: boolean;
  skillMoveTimer: number;
  private scene: Phaser.Scene;
  private _initialText?: Phaser.GameObjects.Text;
  private staminaBar?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, legend: Legend, isHome: boolean) {
    this.scene = scene;
    this.legend = legend;
    this.isHome = isHome;
    this.stamina = PLAYER_CONFIG.STAMINA_MAX;
    this.isSkillMoving = false;
    this.skillMoveTimer = 0;

    this.graphics = scene.add.graphics();
    this.staminaBar = scene.add.graphics();

    this.body = scene.physics.add.sprite(x, y, '__DEFAULT');
    this.body.setVisible(false);
    this.body.setCircle(PLAYER_CONFIG.RADIUS);
    this.body.setOffset(-PLAYER_CONFIG.RADIUS, -PLAYER_CONFIG.RADIUS);
    this.body.setCollideWorldBounds(true);
    this.body.setDamping(true);
    this.body.setDrag(0.9);
    this.body.setDepth(4);
    this.body.setMaxVelocity(this.getSpeed() * PLAYER_CONFIG.SPRINT_MULTIPLIER);

    this.nameLabel = scene.add.text(x, y + PLAYER_CONFIG.RADIUS + 6, legend.shortName, {
      fontFamily: 'Oswald',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    });
    this.nameLabel.setOrigin(0.5, 0);
    this.nameLabel.setDepth(6);

    this.drawPlayer(x, y);
  }

  private drawPlayer(x: number, y: number): void {
    this.graphics.clear();
    this.graphics.setDepth(4);

    const fillColor = this.isHome ? COLORS.HOME : COLORS.AWAY;
    const outlineColor = this.isHome ? COLORS.HOME_OUTLINE : COLORS.AWAY_OUTLINE;

    if (this.isSkillMoving) {
      this.graphics.lineStyle(PLAYER_CONFIG.BORDER_WIDTH + 2, 0x00ff88, 0.8);
      this.graphics.strokeCircle(x, y, PLAYER_CONFIG.RADIUS + 4);
    }

    this.graphics.fillStyle(fillColor, 1);
    this.graphics.fillCircle(x, y, PLAYER_CONFIG.RADIUS);

    this.graphics.lineStyle(PLAYER_CONFIG.BORDER_WIDTH, outlineColor, 1);
    this.graphics.strokeCircle(x, y, PLAYER_CONFIG.RADIUS);

    const initial = this.legend.shortName.charAt(0);
    if (this._initialText) this._initialText.destroy();
    this._initialText = this.scene.add.text(x, y, initial, {
      fontFamily: 'Oswald',
      fontSize: '14px',
      fontStyle: 'bold',
      color: this.isHome ? '#0A0A0F' : '#FFFFFF',
    });
    this._initialText.setOrigin(0.5, 0.5);
    this._initialText.setDepth(4);

    if (this.staminaBar && this.isHome) {
      this.staminaBar.clear();
      this.staminaBar.setDepth(7);
      const barW = PLAYER_CONFIG.RADIUS * 2;
      const barH = 3;
      const barX = x - barW / 2;
      const barY = y - PLAYER_CONFIG.RADIUS - 8;

      this.staminaBar.fillStyle(0x333333, 0.7);
      this.staminaBar.fillRect(barX, barY, barW, barH);

      const pct = this.stamina / PLAYER_CONFIG.STAMINA_MAX;
      const color = pct > 0.5 ? 0x00ff00 : pct > 0.25 ? 0xffff00 : 0xff0000;
      this.staminaBar.fillStyle(color, 0.9);
      this.staminaBar.fillRect(barX, barY, barW * pct, barH);
    }
  }

  getSpeed(): number {
    return PLAYER_CONFIG.SPEED * (0.8 + (this.legend.stats.pac / 100) * 0.4);
  }

  update(delta: number): void {
    if (this.isSkillMoving) {
      this.skillMoveTimer -= delta;
      if (this.skillMoveTimer <= 0) {
        this.isSkillMoving = false;
      }
    }

    if (this.stamina < PLAYER_CONFIG.STAMINA_MAX) {
      this.stamina = Math.min(PLAYER_CONFIG.STAMINA_MAX, this.stamina + PLAYER_CONFIG.STAMINA_REGEN * (delta / 1000));
    }

    this.drawPlayer(this.body.x, this.body.y);
    this.nameLabel.setPosition(this.body.x, this.body.y + PLAYER_CONFIG.RADIUS + 6);
  }

  performSkillMove(dirX: number, dirY: number): boolean {
    if (this.isSkillMoving || this.legend.skillMoves < 2) return false;
    if (this.stamina < 20) return false;

    this.isSkillMoving = true;
    this.skillMoveTimer = PLAYER_CONFIG.SKILL_MOVE_DURATION;
    this.stamina -= 20;

    const speed = this.getSpeed() * PLAYER_CONFIG.SKILL_MOVE_SPEED_BOOST * (this.legend.stats.dri / 100);
    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;

    const perpX = -dirY / len;
    const perpY = dirX / len;
    const swerve = (Math.random() > 0.5 ? 1 : -1) * 0.5;

    this.body.setVelocity(
      (dirX / len + perpX * swerve) * speed,
      (dirY / len + perpY * swerve) * speed
    );

    return true;
  }

  sprint(active: boolean): void {
    if (active && this.stamina > 0) {
      this.stamina -= PLAYER_CONFIG.STAMINA_DRAIN * (1 / 60);
    }
  }

  canSprint(): boolean {
    return this.stamina > 10;
  }

  moveTo(x: number, y: number, speed?: number): void {
    const dx = x - this.body.x;
    const dy = y - this.body.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 4) {
      this.body.setVelocity(0, 0);
      return;
    }

    const s = speed ?? this.getSpeed();
    this.body.setVelocity((dx / dist) * s, (dy / dist) * s);
  }

  distanceTo(x: number, y: number): number {
    const dx = x - this.body.x;
    const dy = y - this.body.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  destroy(): void {
    this.body.destroy();
    this.graphics.destroy();
    this.nameLabel.destroy();
    this._initialText?.destroy();
    this.staminaBar?.destroy();
  }
}
