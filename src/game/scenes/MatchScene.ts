import Phaser from 'phaser';
import { Legend, LEGENDS } from '../../data/legends';
import { FIELD, GOAL, BALL_CONFIG, PLAYER_CONFIG, MATCH, COLORS } from '../config';
import { Ball } from '../objects/Ball';
import { PlayerSprite } from '../objects/Player';
import { updateHUD, showResult, hideResult, showScreen } from '../../ui/screens';
import type { Difficulty } from '../../ui/screens';

export class MatchScene extends Phaser.Scene {
  private ball!: Ball;
  private homePlayers: PlayerSprite[] = [];
  private awayPlayers: PlayerSprite[] = [];
  private allPlayers: PlayerSprite[] = [];
  private controlledPlayer!: PlayerSprite;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private kickKey?: Phaser.Input.Keyboard.Key;
  private sprintKey?: Phaser.Input.Keyboard.Key;
  private skillKey?: Phaser.Input.Keyboard.Key;
  private homeScore = 0;
  private awayScore = 0;
  private matchTime = 0;
  private matchActive = false;
  private goalPause = false;
  private difficulty: Difficulty = 'normal';
  private playerLegends: Legend[] = [];
  private fieldGraphics!: Phaser.GameObjects.Graphics;
  private joystick = { active: false, dx: 0, dy: 0 };
  private mobileKick = false;
  private mobileSprint = false;
  private mobileSkill = false;

  constructor() {
    super({ key: 'MatchScene' });
  }

  init(data: { players: Legend[]; difficulty: Difficulty }): void {
    this.playerLegends = data.players || [];
    this.difficulty = data.difficulty || 'normal';
    this.homeScore = 0;
    this.awayScore = 0;
    this.matchTime = 0;
    this.matchActive = false;
    this.goalPause = false;
    this.homePlayers = [];
    this.awayPlayers = [];
    this.allPlayers = [];
  }

  create(): void {
    this.physics.world.setBounds(0, 0, FIELD.WIDTH, FIELD.HEIGHT);

    this.fieldGraphics = this.add.graphics();
    this.drawField();

    const cx = FIELD.WIDTH / 2;
    const cy = FIELD.HEIGHT / 2;
    this.ball = new Ball(this, cx, cy);

    this.spawnPlayers();

    if (this.homePlayers.length > 0) {
      this.controlledPlayer = this.homePlayers[0];
    }

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.kickKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.sprintKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.skillKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    }

    this.allPlayers.forEach((p) => {
      this.physics.add.collider(p.body, this.ball.body);
      this.allPlayers.forEach((other) => {
        if (p !== other) {
          this.physics.add.collider(p.body, other.body);
        }
      });
    });

    this.setupMobileControls();

    this.time.delayedCall(500, () => {
      this.matchActive = true;
    });
  }

  private spawnPlayers(): void {
    const homeX = FIELD.WIDTH * 0.25;
    const awayX = FIELD.WIDTH * 0.75;
    const cy = FIELD.HEIGHT / 2;
    const spread = FIELD.HEIGHT * 0.3;

    const homeLegends = this.playerLegends.length >= 3
      ? this.playerLegends.slice(0, 3)
      : LEGENDS.slice(0, 3);

    const usedIds = new Set(homeLegends.map((l) => l.id));
    const available = LEGENDS.filter((l) => !usedIds.has(l.id) && l.position !== 'GK');
    const awayLegends = available.sort(() => Math.random() - 0.5).slice(0, 3);

    const homePositions = [
      { x: homeX - 60, y: cy },
      { x: homeX, y: cy - spread },
      { x: homeX, y: cy + spread },
    ];
    const awayPositions = [
      { x: awayX + 60, y: cy },
      { x: awayX, y: cy - spread },
      { x: awayX, y: cy + spread },
    ];

    homeLegends.forEach((legend, i) => {
      const pos = homePositions[i];
      const player = new PlayerSprite(this, pos.x, pos.y, legend, true);
      this.homePlayers.push(player);
      this.allPlayers.push(player);
    });

    awayLegends.forEach((legend, i) => {
      const pos = awayPositions[i];
      const player = new PlayerSprite(this, pos.x, pos.y, legend, false);
      this.awayPlayers.push(player);
      this.allPlayers.push(player);
    });
  }

  update(_time: number, delta: number): void {
    if (!this.matchActive || this.goalPause) {
      this.allPlayers.forEach((p) => p.update(delta));
      this.ball.update();
      return;
    }

    this.matchTime += delta / 1000;
    if (this.matchTime >= MATCH.DURATION) {
      this.endMatch();
      return;
    }

    this.autoSwitchPlayer();
    this.handleInput();
    this.updateAI(delta);

    this.allPlayers.forEach((p) => p.update(delta));
    this.ball.update();

    this.checkGoal();

    updateHUD(this.homeScore, this.awayScore, this.matchTime);
  }

  private handleInput(): void {
    if (!this.controlledPlayer) return;

    let dx = 0;
    let dy = 0;

    if (this.joystick.active) {
      dx = this.joystick.dx;
      dy = this.joystick.dy;
    } else if (this.cursors) {
      if (this.cursors.left.isDown) dx = -1;
      if (this.cursors.right.isDown) dx = 1;
      if (this.cursors.up.isDown) dy = -1;
      if (this.cursors.down.isDown) dy = 1;
    }

    const isSprinting = this.mobileSprint || (this.sprintKey?.isDown ?? false);
    const canSprint = this.controlledPlayer.canSprint();
    const speedMult = isSprinting && canSprint ? PLAYER_CONFIG.SPRINT_MULTIPLIER : 1;
    const speed = this.controlledPlayer.getSpeed() * speedMult;

    if (isSprinting && canSprint) {
      this.controlledPlayer.sprint(true);
    }

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.controlledPlayer.body.setVelocity(
        (dx / len) * speed,
        (dy / len) * speed
      );
    } else {
      this.controlledPlayer.body.setVelocity(0, 0);
    }

    const wantsKick = this.mobileKick || Phaser.Input.Keyboard.JustDown(this.kickKey!);
    if (wantsKick) {
      this.tryKick(this.controlledPlayer);
      this.mobileKick = false;
    }

    const wantsSkill = this.mobileSkill || (this.skillKey && Phaser.Input.Keyboard.JustDown(this.skillKey));
    if (wantsSkill) {
      const sdx = dx || (this.controlledPlayer.body.body?.velocity.x ?? 0);
      const sdy = dy || (this.controlledPlayer.body.body?.velocity.y ?? 0);
      this.controlledPlayer.performSkillMove(sdx, sdy);
      this.mobileSkill = false;
    }
  }

  private tryKick(player: PlayerSprite): void {
    const dist = player.distanceTo(this.ball.body.x, this.ball.body.y);
    if (dist > PLAYER_CONFIG.KICK_RANGE + BALL_CONFIG.RADIUS) return;

    const dirX = this.ball.body.x - player.body.x;
    const dirY = this.ball.body.y - player.body.y;

    const shotPower = player.legend.stats.sho / 100;
    const force = BALL_CONFIG.KICK_FORCE * (0.7 + shotPower * 0.6);

    this.ball.kick(dirX, dirY, force);
  }

  private autoSwitchPlayer(): void {
    let closest: PlayerSprite | null = null;
    let minDist = Infinity;

    for (const p of this.homePlayers) {
      const d = p.distanceTo(this.ball.body.x, this.ball.body.y);
      if (d < minDist) {
        minDist = d;
        closest = p;
      }
    }

    if (closest && closest !== this.controlledPlayer && minDist < 100) {
      this.controlledPlayer = closest;
    }
  }

  private updateAI(delta: number): void {
    const diffMult = this.difficulty === 'easy' ? 0.55 : this.difficulty === 'hard' ? 1.2 : 0.85;
    const ballX = this.ball.body.x;
    const ballY = this.ball.body.y;
    const goalX = 0;
    const goalY = FIELD.HEIGHT / 2;

    this.awayPlayers.forEach((player, index) => {
      let targetX: number;
      let targetY: number;

      const role = index === 0 ? 'striker' : index === 1 ? 'midfielder' : 'defender';

      switch (role) {
        case 'striker':
          if (ballX < FIELD.WIDTH * 0.5) {
            targetX = ballX - 30;
            targetY = ballY;
          } else {
            targetX = ballX + (goalX - ballX) * 0.3;
            targetY = ballY + (goalY - ballY) * 0.3;
          }
          break;
        case 'midfielder':
          targetX = Math.max(ballX + 50, FIELD.WIDTH * 0.45);
          targetY = ballY + (index === 1 ? -60 : 60);
          break;
        case 'defender':
        default:
          targetX = Math.max(FIELD.WIDTH * 0.7, ballX + 100);
          targetY = FIELD.HEIGHT / 2 + (ballY > FIELD.HEIGHT / 2 ? -40 : 40);
          break;
      }

      targetX = Phaser.Math.Clamp(targetX, FIELD.PADDING, FIELD.WIDTH - FIELD.PADDING);
      targetY = Phaser.Math.Clamp(targetY, FIELD.PADDING, FIELD.HEIGHT - FIELD.PADDING);

      const aiSpeed = player.getSpeed() * diffMult;
      player.moveTo(targetX, targetY, aiSpeed);

      const distToBall = player.distanceTo(ballX, ballY);
      if (distToBall < PLAYER_CONFIG.KICK_RANGE + BALL_CONFIG.RADIUS + 5) {
        const kickDirX = goalX - player.body.x;
        const kickDirY = goalY - player.body.y;
        const kickForce = BALL_CONFIG.KICK_FORCE * diffMult * (0.6 + player.legend.stats.sho / 200);
        this.ball.kick(kickDirX, kickDirY, kickForce);
      }

      if (diffMult > 1 && distToBall < 60 && player.legend.skillMoves >= 3 && Math.random() < 0.005) {
        const vx = player.body.body?.velocity.x ?? 0;
        const vy = player.body.body?.velocity.y ?? 0;
        player.performSkillMove(vx, vy);
      }
    });

    this.homePlayers.forEach((player) => {
      if (player === this.controlledPlayer) return;

      const dist = player.distanceTo(ballX, ballY);
      let tx: number;
      let ty: number;

      if (dist < 150 && ballX < FIELD.WIDTH / 2) {
        tx = ballX + 50;
        ty = ballY + (player.body.y > ballY ? -40 : 40);
      } else {
        tx = FIELD.WIDTH * 0.3;
        ty = player.body.y > FIELD.HEIGHT / 2 ? FIELD.HEIGHT * 0.35 : FIELD.HEIGHT * 0.65;
      }

      player.moveTo(tx, ty, player.getSpeed() * 0.7);

      if (player.distanceTo(ballX, ballY) < PLAYER_CONFIG.KICK_RANGE + BALL_CONFIG.RADIUS) {
        const kickDirX = FIELD.WIDTH - player.body.x;
        const kickDirY = FIELD.HEIGHT / 2 - player.body.y;
        this.ball.kick(kickDirX, kickDirY, BALL_CONFIG.KICK_FORCE * 0.6);
      }
    });

    void delta;
  }

  private checkGoal(): void {
    const bx = this.ball.body.x;
    const by = this.ball.body.y;
    const goalTop = (FIELD.HEIGHT - GOAL.HEIGHT) / 2;
    const goalBottom = goalTop + GOAL.HEIGHT;

    if (bx <= GOAL.WIDTH + BALL_CONFIG.RADIUS && by > goalTop && by < goalBottom) {
      this.awayScore++;
      this.onGoal(false);
    } else if (bx >= FIELD.WIDTH - GOAL.WIDTH - BALL_CONFIG.RADIUS && by > goalTop && by < goalBottom) {
      this.homeScore++;
      this.onGoal(true);
    }
  }

  private onGoal(homeScored: boolean): void {
    this.goalPause = true;

    const text = this.add.text(FIELD.WIDTH / 2, FIELD.HEIGHT / 2, '\u00A1GOL!', {
      fontFamily: 'Oswald',
      fontSize: '64px',
      fontStyle: 'bold',
      color: homeScored ? '#FFD700' : '#4a90d9',
      stroke: '#000000',
      strokeThickness: 4,
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(20);

    this.tweens.add({
      targets: text,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: MATCH.GOAL_PAUSE,
      onComplete: () => {
        text.destroy();
        this.resetPositions();
        this.goalPause = false;
      },
    });
  }

  private resetPositions(): void {
    this.ball.reset();

    const cx = FIELD.WIDTH / 2;
    const cy = FIELD.HEIGHT / 2;
    const spread = FIELD.HEIGHT * 0.3;

    const homePositions = [
      { x: cx - 120, y: cy },
      { x: cx - 60, y: cy - spread },
      { x: cx - 60, y: cy + spread },
    ];
    const awayPositions = [
      { x: cx + 120, y: cy },
      { x: cx + 60, y: cy - spread },
      { x: cx + 60, y: cy + spread },
    ];

    this.homePlayers.forEach((p, i) => {
      const pos = homePositions[i] || homePositions[0];
      p.body.setPosition(pos.x, pos.y);
      p.body.setVelocity(0, 0);
    });

    this.awayPlayers.forEach((p, i) => {
      const pos = awayPositions[i] || awayPositions[0];
      p.body.setPosition(pos.x, pos.y);
      p.body.setVelocity(0, 0);
    });
  }

  private endMatch(): void {
    this.matchActive = false;

    showResult(this.homeScore, this.awayScore);

    const rematchBtn = document.getElementById('btn-rematch');
    const backBtn = document.getElementById('btn-back-select');

    const handleRematch = () => {
      rematchBtn?.removeEventListener('click', handleRematch);
      backBtn?.removeEventListener('click', handleBack);
      hideResult();
      this.scene.restart({ players: this.playerLegends, difficulty: this.difficulty });
    };

    const handleBack = () => {
      rematchBtn?.removeEventListener('click', handleRematch);
      backBtn?.removeEventListener('click', handleBack);
      hideResult();
      showScreen('home');
      this.scene.stop();
      this.game.destroy(true);
    };

    rematchBtn?.addEventListener('click', handleRematch);
    backBtn?.addEventListener('click', handleBack);
  }

  private setupMobileControls(): void {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const controlsEl = document.getElementById('mobile-controls');
    if (controlsEl) {
      controlsEl.style.display = isMobile ? 'flex' : 'none';
    }

    const joystickArea = document.getElementById('joystick');
    const joystickKnob = document.getElementById('joystick-knob');

    if (!joystickArea || !joystickKnob) return;

    const radius = 50;

    const handleTouch = (clientX: number, clientY: number) => {
      const rect = joystickArea.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }

      joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.joystick.active = true;
      this.joystick.dx = dx / radius;
      this.joystick.dy = dy / radius;
    };

    const resetJoystick = () => {
      joystickKnob.style.transform = 'translate(0, 0)';
      this.joystick.active = false;
      this.joystick.dx = 0;
      this.joystick.dy = 0;
    };

    joystickArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      handleTouch(t.clientX, t.clientY);
    });

    joystickArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      handleTouch(t.clientX, t.clientY);
    });

    joystickArea.addEventListener('touchend', (e) => {
      e.preventDefault();
      resetJoystick();
    });

    const kickBtn = document.getElementById('kick-btn');
    const sprintBtn = document.getElementById('sprint-btn');
    const skillBtn = document.getElementById('skill-btn');

    kickBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.mobileKick = true;
    });

    sprintBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.mobileSprint = true;
    });
    sprintBtn?.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.mobileSprint = false;
    });

    skillBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.mobileSkill = true;
    });
  }

  private drawField(): void {
    const g = this.fieldGraphics;
    g.setDepth(0);

    g.fillStyle(FIELD.GRASS_COLOR, 1);
    g.fillRect(0, 0, FIELD.WIDTH, FIELD.HEIGHT);

    const stripeWidth = FIELD.WIDTH / 10;
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        g.fillStyle(FIELD.GRASS_DARK, 0.3);
        g.fillRect(i * stripeWidth, 0, stripeWidth, FIELD.HEIGHT);
      }
    }

    g.lineStyle(2, FIELD.LINE_COLOR, 0.8);
    g.strokeRect(FIELD.PADDING, FIELD.PADDING, FIELD.WIDTH - FIELD.PADDING * 2, FIELD.HEIGHT - FIELD.PADDING * 2);

    const cx = FIELD.WIDTH / 2;
    const cy = FIELD.HEIGHT / 2;
    g.beginPath();
    g.moveTo(cx, FIELD.PADDING);
    g.lineTo(cx, FIELD.HEIGHT - FIELD.PADDING);
    g.strokePath();

    g.strokeCircle(cx, cy, 60);
    g.fillStyle(FIELD.LINE_COLOR, 0.8);
    g.fillCircle(cx, cy, 4);

    const penaltyW = 80;
    const penaltyH = 200;
    const penaltyTop = (FIELD.HEIGHT - penaltyH) / 2;
    g.strokeRect(FIELD.PADDING, penaltyTop, penaltyW, penaltyH);
    g.strokeRect(FIELD.WIDTH - FIELD.PADDING - penaltyW, penaltyTop, penaltyW, penaltyH);

    const goalTop = (FIELD.HEIGHT - GOAL.HEIGHT) / 2;

    g.lineStyle(3, FIELD.BORDER_COLOR, 1);
    g.strokeRect(0, goalTop, GOAL.WIDTH, GOAL.HEIGHT);
    g.strokeRect(FIELD.WIDTH - GOAL.WIDTH, goalTop, GOAL.WIDTH, GOAL.HEIGHT);

    g.fillStyle(GOAL.NET_COLOR, 0.15);
    g.fillRect(0, goalTop, GOAL.WIDTH, GOAL.HEIGHT);
    g.fillRect(FIELD.WIDTH - GOAL.WIDTH, goalTop, GOAL.WIDTH, GOAL.HEIGHT);

    g.lineStyle(1, GOAL.NET_COLOR, 0.3);
    for (let y = goalTop; y <= goalTop + GOAL.HEIGHT; y += 10) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(GOAL.WIDTH, y);
      g.strokePath();

      g.beginPath();
      g.moveTo(FIELD.WIDTH - GOAL.WIDTH, y);
      g.lineTo(FIELD.WIDTH, y);
      g.strokePath();
    }

    g.lineStyle(3, FIELD.BORDER_COLOR, 0.6);
    g.strokeRect(0, 0, FIELD.WIDTH, FIELD.HEIGHT);
  }
}
