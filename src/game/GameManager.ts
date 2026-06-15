import Phaser from 'phaser';
import { Legend } from '../data/legends';
import { FIELD } from './config';
import { MatchScene } from './scenes/MatchScene';
import type { Difficulty } from '../ui/screens';

let game: Phaser.Game | null = null;

export function startGame(players: Legend[], difficulty: Difficulty): void {
  const container = document.getElementById('game-container');
  if (!container) return;

  if (game) {
    game.destroy(true);
    game = null;
  }

  container.innerHTML = '';

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: FIELD.WIDTH,
    height: FIELD.HEIGHT,
    backgroundColor: '#1a6b30',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [MatchScene],
  };

  game = new Phaser.Game(config);
  game.scene.start('MatchScene', { players, difficulty });
}

export function destroyGame(): void {
  if (game) {
    game.destroy(true);
    game = null;
  }
}
