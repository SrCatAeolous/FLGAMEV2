import Phaser from 'phaser';
import { Legend, LEGENDS } from '../../data/legends';
import { FIELD, GOAL, BALL_CONFIG, PLAYER_CONFIG, GK_CONFIG, MATCH, COLORS } from '../config';
import { Ball } from '../objects/Ball';
import { PlayerSprite } from '../objects/Player';
import { updateHUD, showResult, hideResult, showScreen } from '../../ui/screens';
import type { Difficulty } from '../../ui/screens';

export class MatchScene extends Phaser.Scene {
  private ball!: Ball;
  private homePlayer!: PlayerSprite;
  private awayPlayer!: PlayerSprite;
  private homeGK!: PlayerSprite;
  private awayGK!: PlayerSprite;
  private allPlayers: PlayerSprite[] = [];
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private kickKey?: Phaser.Input.Keyboard.Key;
  private sprintKey?: Phaser.Input.Keyboard.Key;
  private skillKey?: Phaser.Input.Keyboard.Key;
  private wasdKeys?: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; E: Phaser.Input.Keyboard.Key; };
  private homeScore = 0;
  private awayScore = 0;
  private matchTime = 0;
  private matchActive = false;
  private goalPause = false;
  private difficulty: Difficulty = 'normal';
  private playerLegend!: Legend;
  private gkLegend!: Legend;
  private fieldGraphics!: Phaser.GameObjects.Graphics;
  private joystick = { active: false, dx: 0, dy: 0 };
  private mobileKick = false;
  private mobileSprint = false;
  private mobileSkill = false;

  // Sound
  private sndKick?: Phaser.Sound.BaseSound;
  private sndGoal?: Phaser.Sound.BaseSound;
  private sndWhistle?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'MatchScene' });
  }

  init(data: { player: Legend; goalkeeper: Legend; difficulty: Difficulty }): void {
    this.playerLegend = data.player || LEGENDS[0];
    this.gkLegend = data.goalkeeper || LEGENDS.find(l => l.position === 'GK') || LEGENDS[0];
    this.difficulty = data.difficulty || 'normal';
    this.homeScore = 0;
    this.awayScore = 0;
    this.matchTime = 0;
    this.matchActive = false;
    this.goalPause = false;
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

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.kickKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.sprintKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.skillKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      };
    }

    this.allPlayers.forEach((p) => {
      this.physics.add.collider(p.body, this.ball.body);
      this.allPlayers.forEach((other) => {
        if (p !== other) {
          this.physics.add.collider(p.body, other.body);
        }
      });
    });

    this.generateSounds();
    this.setupMobileControls();

    this.time.delayedCall(500, () => {
      this.matchActive = true;
      this.sndWhistle?.play();
    });
  }

  private generateSounds(): void {
    const mgr = this.sound as Phaser.Sound.WebAudioSoundManager;
    if (!mgr || !('context' in mgr)) return;
    const ctx = mgr.context;
    if (!ctx) return;

    // Kick sound
    this.sndKick = this.createSynthSound('kick', (actx: AudioContext) => {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, actx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.4, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start(actx.currentTime);
      osc.stop(actx.currentTime + 0.12);
    });

    // Goal sound
    this.sndGoal = this.createSynthSound('goal', (actx: AudioContext) => {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, actx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.2, actx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + i * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(actx.currentTime + i * 0.12);
        osc.stop(actx.currentTime + i * 0.12 + 0.3);
      });
    });

    // Whistle sound
    this.sndWhistle = this.createSynthSound('whistle', (actx: AudioContext) => {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, actx.currentTime);
      osc.frequency.setValueAtTime(1200, actx.currentTime + 0.15);
      osc.frequency.setValueAtTime(800, actx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start(actx.currentTime);
      osc.stop(actx.currentTime + 0.5);
    });
  }

  private createSynthSound(key: string, playFn: (ctx: AudioContext) => void): Phaser.Sound.BaseSound {
    const scene = this;
    return {
      key,
      play: () => {
        try {
          const mgr = scene.sound as Phaser.Sound.WebAudioSoundManager;
          if (!mgr || !('context' in mgr)) return true;
          const actx = mgr.context;
          if (actx && actx.state === 'running') {
            playFn(actx);
          } else if (actx && actx.state === 'suspended') {
            actx.resume().then(() => playFn(actx));
          }
        } catch { /* ignore audio errors */ }
        return true;
      },
    } as unknown as Phaser.Sound.BaseSound;
  }

  private spawnPlayers(): void {
    const cx = FIELD.WIDTH / 2;
    const cy = FIELD.HEIGHT / 2;

    // Home field player (user controlled)
    this.homePlayer = new PlayerSprite(this, cx - 100, cy, this.playerLegend, true, 'field');
    this.allPlayers.push(this.homePlayer);

    // Home GK (AI)
    this.homeGK = new PlayerSprite(this, GK_CONFIG.HOME_X, cy, this.gkLegend, true, 'goalkeeper');
    this.allPlayers.push(this.homeGK);

    // Away field player (AI)
    const availableField = LEGENDS.filter(l => l.position !== 'GK' && l.id !== this.playerLegend.id);
    const awayLegend = availableField[Math.floor(Math.random() * availableField.length)];
    this.awayPlayer = new PlayerSprite(this, cx + 100, cy, awayLegend, false, 'field');
    this.allPlayers.push(this.awayPlayer);

    // Away GK (AI)
    const availableGKs = LEGENDS.filter(l => l.position === 'GK' && l.id !== this.gkLegend.id);
    const awayGKLegend = availableGKs.length > 0
      ? availableGKs[Math.floor(Math.random() * availableGKs.length)]
      : LEGENDS.find(l => l.position === 'GK')!;
    this.awayGK = new PlayerSprite(this, GK_CONFIG.AWAY_X, cy, awayGKLegend, false, 'goalkeeper');
    this.allPlayers.push(this.awayGK);
  }

  update(_time: number, delta: number): void {
    if (!this.matchActive || this.goalPause) {
      this.allPlayers.forEach((p) => p.update(delta, p === this.homePlayer));
      this.ball.update();
      return;
    }

    this.matchTime += delta / 1000;
    if (this.matchTime >= MATCH.DURATION) {
      this.endMatch();
      return;
    }

    this.handleInput();
    this.updateAwayAI(delta);
    this.updateGKAI(this.homeGK, true);
    this.updateGKAI(this.awayGK, false);

    this.allPlayers.forEach((p) => p.update(delta, p === this.homePlayer));
    this.ball.update();

    this.checkGoal();

    updateHUD(this.homeScore, this.awayScore, this.matchTime);
  }

  private handleInput(): void {
    let dx = 0;
    let dy = 0;

    if (this.joystick.active) {
      dx = this.joystick.dx;
      dy = this.joystick.dy;
    } else {
      if (this.cursors?.left.isDown || this.wasdKeys?.A.isDown) dx = -1;
      if (this.cursors?.right.isDown || this.wasdKeys?.D.isDown) dx = 1;
      if (this.cursors?.up.isDown || this.wasdKeys?.W.isDown) dy = -1;
      if (this.cursors?.down.isDown || this.wasdKeys?.S.isDown) dy = 1;
    }

    const isSprinting = this.mobileSprint || (this.sprintKey?.isDown ?? false);
    const canSprint = this.homePlayer.canSprint();
    const speedMult = isSprinting && canSprint ? PLAYER_CONFIG.SPRINT_MULTIPLIER : 1;
    const speed = this.homePlayer.getSpeed() * speedMult;

    if (isSprinting && canSprint) {
      this.homePlayer.sprint(true);
    }

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.homePlayer.body.setVelocity(
        (dx / len) * speed,
        (dy / len) * speed
      );
    } else {
      this.homePlayer.body.setVelocity(0, 0);
    }

    const wantsKick = this.mobileKick || (this.kickKey && Phaser.Input.Keyboard.JustDown(this.kickKey)) || (this.wasdKeys?.E && Phaser.Input.Keyboard.JustDown(this.wasdKeys.E));
    if (wantsKick) {
      this.tryKick(this.homePlayer);
      this.mobileKick = false;
    }

    const wantsSkill = this.mobileSkill || (this.skillKey && Phaser.Input.Keyboard.JustDown(this.skillKey));
    if (wantsSkill) {
      const sdx = dx || (this.homePlayer.body.body?.velocity.x ?? 0);
      const sdy = dy || (this.homePlayer.body.body?.velocity.y ?? 0);
      this.homePlayer.performSkillMove(sdx, sdy);
      this.mobileSkill = false;
    }
  }

  private tryKick(player: PlayerSprite): void {
    const dist = player.distanceTo(this.ball.body.x, this.ball.body.y);
    if (dist > PLAYER_CONFIG.KICK_RANGE + BALL_CONFIG.RADIUS) return;

    // Aim toward the opponent's goal with some variation based on player position
    const goalX = player.isHome ? FIELD.WIDTH : 0;
    const goalCY = FIELD.HEIGHT / 2;
    // Add slight aim toward goal center Y, mixed with ball-relative direction
    const toBallX = this.ball.body.x - player.body.x;
    const toBallY = this.ball.body.y - player.body.y;
    const toGoalX = goalX - this.ball.body.x;
    const toGoalY = goalCY - this.ball.body.y + (Math.random() - 0.5) * 60;

    // Blend: 40% ball direction, 60% goal direction for smarter kicks
    const dirX = toBallX * 0.4 + toGoalX * 0.6;
    const dirY = toBallY * 0.4 + toGoalY * 0.6;

    const shotPower = player.legend.stats.sho / 100;
    const force = BALL_CONFIG.KICK_FORCE * (0.7 + shotPower * 0.6);

    this.ball.kick(dirX, dirY, force);
    this.sndKick?.play();
  }

  private updateAwayAI(_delta: number): void {
    const diffMult = this.difficulty === 'easy' ? 0.55 : this.difficulty === 'hard' ? 1.2 : 0.85;
    const ballX = this.ball.body.x;
    const ballY = this.ball.body.y;
    const goalX = 0;
    const goalY = FIELD.HEIGHT / 2;

    let targetX: number;
    let targetY: number;

    // Chase ball when it's on their half or near
    if (ballX > FIELD.WIDTH * 0.35) {
      targetX = ballX - 20;
      targetY = ballY;
    } else {
      // Attack toward home goal
      targetX = ballX + (goalX - ballX) * 0.4;
      targetY = ballY + (goalY - ballY) * 0.3;
    }

    targetX = Phaser.Math.Clamp(targetX, FIELD.PADDING, FIELD.WIDTH - FIELD.PADDING);
    targetY = Phaser.Math.Clamp(targetY, FIELD.PADDING, FIELD.HEIGHT - FIELD.PADDING);

    const aiSpeed = this.awayPlayer.getSpeed() * diffMult;
    this.awayPlayer.moveTo(targetX, targetY, aiSpeed);

    // Kick when close
    const distToBall = this.awayPlayer.distanceTo(ballX, ballY);
    if (distToBall < PLAYER_CONFIG.KICK_RANGE + BALL_CONFIG.RADIUS + 5) {
      const kickDirX = goalX - this.awayPlayer.body.x;
      const kickDirY = goalY - this.awayPlayer.body.y;
      const kickForce = BALL_CONFIG.KICK_FORCE * diffMult * (0.6 + this.awayPlayer.legend.stats.sho / 200);
      this.ball.kick(kickDirX, kickDirY, kickForce);
      this.sndKick?.play();
    }

    // Skill moves on hard
    if (diffMult > 1 && distToBall < 50 && this.awayPlayer.legend.skillMoves >= 3 && Math.random() < 0.005) {
      const vx = this.awayPlayer.body.body?.velocity.x ?? 0;
      const vy = this.awayPlayer.body.body?.velocity.y ?? 0;
      this.awayPlayer.performSkillMove(vx, vy);
    }
  }

  private updateGKAI(gk: PlayerSprite, isHome: boolean): void {
    const ballX = this.ball.body.x;
    const ballY = this.ball.body.y;
    const ballVX = this.ball.body.body?.velocity.x ?? 0;

    const baseX = isHome ? GK_CONFIG.HOME_X : GK_CONFIG.AWAY_X;
    const goalTop = (FIELD.HEIGHT - GOAL.HEIGHT) / 2;
    const goalBottom = goalTop + GOAL.HEIGHT;
    const goalCenterY = FIELD.HEIGHT / 2;

    // Track ball Y position within goal range
    let targetY = Phaser.Math.Clamp(ballY, goalTop + GK_CONFIG.RADIUS, goalBottom - GK_CONFIG.RADIUS);

    // Only track actively when ball is coming toward this GK
    const ballComingHome = isHome && ballVX < -50;
    const ballComingAway = !isHome && ballVX > 50;
    const ballClose = isHome ? ballX < FIELD.WIDTH * 0.35 : ballX > FIELD.WIDTH * 0.65;

    if (ballComingHome || ballComingAway || ballClose) {
      // Active tracking
      const gkSpeed = gk.getSpeed() * 1.3;
      gk.moveTo(baseX, targetY, gkSpeed);

      // Dive on fast shots
      const ballSpeed = Math.sqrt(ballVX * ballVX + ((this.ball.body.body?.velocity.y ?? 0) ** 2));
      if (ballSpeed > 250 && gk.distanceTo(ballX, ballY) < GK_CONFIG.SAVE_RANGE * 1.5) {
        const diveDir = ballY > gk.body.y ? 1 : -1;
        gk.dive(diveDir);
      }
    } else {
      // Idle - stay centered
      gk.moveTo(baseX, goalCenterY, gk.getSpeed() * 0.5);
    }

    // GK auto-kick when ball is very close
    const distToBall = gk.distanceTo(ballX, ballY);
    if (distToBall < GK_CONFIG.RADIUS + BALL_CONFIG.RADIUS + 8) {
      const clearX = isHome ? FIELD.WIDTH * 0.6 : FIELD.WIDTH * 0.4;
      const clearY = FIELD.HEIGHT / 2 + (Math.random() - 0.5) * 200;
      const kickDirX = clearX - gk.body.x;
      const kickDirY = clearY - gk.body.y;
      this.ball.kick(kickDirX, kickDirY, GK_CONFIG.KICK_FORCE);
      this.sndKick?.play();
    }
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

    // Prevent ball from going past goal line outside the goalposts
    if (bx < GOAL.WIDTH + BALL_CONFIG.RADIUS && (by <= goalTop || by >= goalBottom)) {
      this.ball.body.setX(GOAL.WIDTH + BALL_CONFIG.RADIUS + 1);
      this.ball.body.setVelocityX(Math.abs(this.ball.body.body?.velocity.x ?? 0) * 0.5);
    }
    if (bx > FIELD.WIDTH - GOAL.WIDTH - BALL_CONFIG.RADIUS && (by <= goalTop || by >= goalBottom)) {
      this.ball.body.setX(FIELD.WIDTH - GOAL.WIDTH - BALL_CONFIG.RADIUS - 1);
      this.ball.body.setVelocityX(-Math.abs(this.ball.body.body?.velocity.x ?? 0) * 0.5);
    }

    // Keep players inside the pitch (between goal lines except in goal area)
    this.allPlayers.forEach(p => {
      const px = p.body.x;
      const py = p.body.y;
      const r = p.role === 'goalkeeper' ? GK_CONFIG.RADIUS : PLAYER_CONFIG.RADIUS;
      if (px < GOAL.WIDTH + r && (py <= goalTop || py >= goalBottom)) {
        p.body.setX(GOAL.WIDTH + r + 1);
        p.body.setVelocityX(0);
      }
      if (px > FIELD.WIDTH - GOAL.WIDTH - r && (py <= goalTop || py >= goalBottom)) {
        p.body.setX(FIELD.WIDTH - GOAL.WIDTH - r - 1);
        p.body.setVelocityX(0);
      }
    });
  }

  private onGoal(homeScored: boolean): void {
    this.goalPause = true;
    this.sndGoal?.play();

    const text = this.add.text(FIELD.WIDTH / 2, FIELD.HEIGHT / 2, '¡GOL!', {
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

    this.homePlayer.body.setPosition(cx - 100, cy);
    this.homePlayer.body.setVelocity(0, 0);

    this.awayPlayer.body.setPosition(cx + 100, cy);
    this.awayPlayer.body.setVelocity(0, 0);

    this.homeGK.body.setPosition(GK_CONFIG.HOME_X, cy);
    this.homeGK.body.setVelocity(0, 0);

    this.awayGK.body.setPosition(GK_CONFIG.AWAY_X, cy);
    this.awayGK.body.setVelocity(0, 0);
  }

  private endMatch(): void {
    this.matchActive = false;
    this.sndWhistle?.play();

    showResult(this.homeScore, this.awayScore);

    const rematchBtn = document.getElementById('btn-rematch');
    const backBtn = document.getElementById('btn-back-select');

    const handleRematch = () => {
      rematchBtn?.removeEventListener('click', handleRematch);
      backBtn?.removeEventListener('click', handleBack);
      hideResult();
      this.scene.restart({ player: this.playerLegend, goalkeeper: this.gkLegend, difficulty: this.difficulty });
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

    const radius = 60;

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
