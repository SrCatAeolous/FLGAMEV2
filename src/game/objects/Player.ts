import Phaser from 'phaser';
import { Legend } from '../../data/legends';
import { PLAYER_CONFIG, GK_CONFIG, COLORS } from '../config';

export type PlayerRole = 'field' | 'goalkeeper';

export class PlayerSprite {
  body: Phaser.Physics.Arcade.Sprite;
  graphics: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  legend: Legend;
  isHome: boolean;
  role: PlayerRole;
  stamina: number;
  isSkillMoving: boolean;
  skillMoveTimer: number;
  isDiving: boolean;
  diveTimer: number;
  private scene: Phaser.Scene;
  private _initialText?: Phaser.GameObjects.Text;
  private staminaBar?: Phaser.GameObjects.Graphics;
  private controlIndicator?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, legend: Legend, isHome: boolean, role: PlayerRole = 'field') {
    this.scene = scene;
    this.legend = legend;
    this.isHome = isHome;
    this.role = role;
    this.stamina = PLAYER_CONFIG.STAMINA_MAX;
    this.isSkillMoving = false;
    this.skillMoveTimer = 0;
    this.isDiving = false;
    this.diveTimer = 0;

    this.graphics = scene.add.graphics();
    this.staminaBar = scene.add.graphics();
    this.controlIndicator = scene.add.graphics();

    const radius = role === 'goalkeeper' ? GK_CONFIG.RADIUS : PLAYER_CONFIG.RADIUS;

    this.body = scene.physics.add.sprite(x, y, '__DEFAULT');
    this.body.setVisible(false);
    this.body.setCircle(radius);
    this.body.setOffset(-radius, -radius);
    this.body.setCollideWorldBounds(true);
    this.body.setDamping(true);
    this.body.setDrag(0.85);
    this.body.setDepth(4);
    this.body.setMaxVelocity(this.getSpeed() * PLAYER_CONFIG.SPRINT_MULTIPLIER);

    this.nameLabel = scene.add.text(x, y + radius + 6, legend.shortName, {
      fontFamily: 'Oswald',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    });
    this.nameLabel.setOrigin(0.5, 0);
    this.nameLabel.setDepth(6);

    this.drawPlayer(x, y, false);
  }

  private getColors(): { fill: number; outline: number } {
    if (this.role === 'goalkeeper') {
      return {
        fill: this.isHome ? COLORS.GK_HOME : COLORS.GK_AWAY,
        outline: this.isHome ? COLORS.GK_HOME_OUTLINE : COLORS.GK_AWAY_OUTLINE,
      };
    }
    return {
      fill: this.isHome ? COLORS.HOME : COLORS.AWAY,
      outline: this.isHome ? COLORS.HOME_OUTLINE : COLORS.AWAY_OUTLINE,
    };
  }

  private drawPlayer(x: number, y: number, isControlled: boolean): void {
    this.graphics.clear();
    this.graphics.setDepth(4);

    const radius = this.role === 'goalkeeper' ? GK_CONFIG.RADIUS : PLAYER_CONFIG.RADIUS;
    const { fill, outline } = this.getColors();

    if (this.isSkillMoving) {
      this.graphics.lineStyle(PLAYER_CONFIG.BORDER_WIDTH + 2, 0x00ff88, 0.8);
      this.graphics.strokeCircle(x, y, radius + 4);
    }

    if (this.isDiving) {
      this.graphics.lineStyle(3, 0xff4444, 0.9);
      this.graphics.strokeCircle(x, y, radius + 3);
    }

    this.graphics.fillStyle(fill, 1);
    this.graphics.fillCircle(x, y, radius);

    this.graphics.lineStyle(PLAYER_CONFIG.BORDER_WIDTH, outline, 1);
    this.graphics.strokeCircle(x, y, radius);

    const initial = this.role === 'goalkeeper' ? 'GK' : this.legend.shortName.charAt(0);
    if (this._initialText) this._initialText.destroy();
    this._initialText = this.scene.add.text(x, y, initial, {
      fontFamily: 'Oswald',
      fontSize: this.role === 'goalkeeper' ? '11px' : '14px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    this._initialText.setOrigin(0.5, 0.5);
    this._initialText.setDepth(4);

    if (this.controlIndicator) {
      this.controlIndicator.clear();
      this.controlIndicator.setDepth(8);
      if (isControlled) {
        this.controlIndicator.lineStyle(2, 0xffffff, 0.9);
        this.controlIndicator.strokeTriangle(
          x, y - radius - 12,
          x - 5, y - radius - 18,
          x + 5, y - radius - 18
        );
      }
    }

    if (this.staminaBar && this.role === 'field') {
      this.staminaBar.clear();
      this.staminaBar.setDepth(7);
      const barW = radius * 2;
      const barH = 3;
      const barX = x - barW / 2;
      const barY = y - radius - 8;

      this.staminaBar.fillStyle(0x333333, 0.7);
      this.staminaBar.fillRect(barX, barY, barW, barH);

      const pct = this.stamina / PLAYER_CONFIG.STAMINA_MAX;
      const color = pct > 0.5 ? 0x00ff00 : pct > 0.25 ? 0xffff00 : 0xff0000;
      this.staminaBar.fillStyle(color, 0.9);
      this.staminaBar.fillRect(barX, barY, barW * pct, barH);
    }
  }

  getSpeed(): number {
    if (this.role === 'goalkeeper') {
      return GK_CONFIG.SPEED * (0.85 + (this.legend.stats.pac / 100) * 0.3);
    }
    return PLAYER_CONFIG.SPEED * (0.8 + (this.legend.stats.pac / 100) * 0.4);
  }

  update(delta: number, isControlled = false): void {
    if (this.isSkillMoving) {
      this.skillMoveTimer -= delta;
      if (this.skillMoveTimer <= 0) {
        this.isSkillMoving = false;
      }
    }

    if (this.isDiving) {
      this.diveTimer -= delta;
      if (this.diveTimer <= 0) {
        this.isDiving = false;
      }
    }

    if (this.stamina < PLAYER_CONFIG.STAMINA_MAX && this.role === 'field') {
      this.stamina = Math.min(PLAYER_CONFIG.STAMINA_MAX, this.stamina + PLAYER_CONFIG.STAMINA_REGEN * (delta / 1000));
    }

    this.drawPlayer(this.body.x, this.body.y, isControlled);
    const radius = this.role === 'goalkeeper' ? GK_CONFIG.RADIUS : PLAYER_CONFIG.RADIUS;
    this.nameLabel.setPosition(this.body.x, this.body.y + radius + 6);
  }

  performSkillMove(dirX: number, dirY: number): boolean {
    if (this.isSkillMoving || this.legend.skillMoves < 2) return false;
    if (this.stamina < 15) return false;

    // Use current velocity as fallback direction
    let dx = dirX;
    let dy = dirY;
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
      dx = this.body.body?.velocity.x ?? 0;
      dy = this.body.body?.velocity.y ?? 0;
    }
    // If still no direction, dash forward
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
      dx = this.isHome ? 1 : -1;
      dy = 0;
    }

    this.isSkillMoving = true;
    this.skillMoveTimer = PLAYER_CONFIG.SKILL_MOVE_DURATION;
    this.stamina -= 15;

    const driBonus = 0.6 + (this.legend.stats.dri / 100) * 0.6;
    const speed = this.getSpeed() * PLAYER_CONFIG.SKILL_MOVE_SPEED_BOOST * driBonus;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    // Quick directional dash with slight perpendicular offset
    const perpX = -dy / len;
    const perpY = dx / len;
    const swerve = (Math.random() > 0.5 ? 1 : -1) * 0.3;

    this.body.setVelocity(
      (dx / len + perpX * swerve) * speed,
      (dy / len + perpY * swerve) * speed
    );

    return true;
  }

  dive(dirY: number): void {
    if (this.isDiving || this.role !== 'goalkeeper') return;
    this.isDiving = true;
    this.diveTimer = GK_CONFIG.DIVE_DURATION;
    this.body.setVelocityY(dirY * GK_CONFIG.DIVE_SPEED);
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
    this.controlIndicator?.destroy();
  }
}
