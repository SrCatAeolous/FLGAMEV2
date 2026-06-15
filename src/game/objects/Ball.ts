import Phaser from 'phaser';
import { BALL_CONFIG, FIELD } from '../config';

export class Ball {
  body: Phaser.Physics.Arcade.Sprite;
  graphics: Phaser.GameObjects.Graphics;
  trail: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.trail = scene.add.graphics();
    this.trail.setDepth(2);
    this.graphics.setDepth(5);

    this.body = scene.physics.add.sprite(x, y, '__DEFAULT');
    this.body.setVisible(false);
    this.body.setCircle(BALL_CONFIG.RADIUS);
    this.body.setOffset(-BALL_CONFIG.RADIUS, -BALL_CONFIG.RADIUS);
    this.body.setBounce(0.7);
    this.body.setCollideWorldBounds(true);
    this.body.setDamping(true);
    this.body.setDrag(0.99);
    this.body.setMaxVelocity(BALL_CONFIG.MAX_SPEED);
    this.body.setDepth(5);

    this.drawBall(x, y);
  }

  private drawBall(x: number, y: number): void {
    this.graphics.clear();

    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(x, y, BALL_CONFIG.RADIUS);

    this.graphics.fillStyle(0x333333, 1);
    const r = BALL_CONFIG.RADIUS * 0.35;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      this.graphics.fillCircle(
        x + Math.cos(angle) * BALL_CONFIG.RADIUS * 0.55,
        y + Math.sin(angle) * BALL_CONFIG.RADIUS * 0.55,
        r
      );
    }

    this.graphics.lineStyle(1, 0xcccccc, 0.5);
    this.graphics.strokeCircle(x, y, BALL_CONFIG.RADIUS);
  }

  update(): void {
    const vx = this.body.body?.velocity.x ?? 0;
    const vy = this.body.body?.velocity.y ?? 0;
    const speed = Math.sqrt(vx * vx + vy * vy);

    this.trail.clear();
    if (speed > 200) {
      const alpha = Math.min((speed - 200) / 400, 0.4);
      this.trail.fillStyle(0xffffff, alpha);
      const len = Math.min(speed / 20, 20);
      const nx = -vx / speed;
      const ny = -vy / speed;
      this.trail.fillCircle(this.body.x + nx * len * 0.3, this.body.y + ny * len * 0.3, BALL_CONFIG.RADIUS * 0.7);
      this.trail.fillCircle(this.body.x + nx * len * 0.6, this.body.y + ny * len * 0.6, BALL_CONFIG.RADIUS * 0.5);
    }

    this.drawBall(this.body.x, this.body.y);
  }

  reset(): void {
    const cx = FIELD.WIDTH / 2;
    const cy = FIELD.HEIGHT / 2;
    this.body.setPosition(cx, cy);
    this.body.setVelocity(0, 0);
    this.trail.clear();
    this.drawBall(cx, cy);
  }

  kick(dirX: number, dirY: number, force: number): void {
    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    this.body.setVelocity((dirX / len) * force, (dirY / len) * force);
  }
}
