import './styles/main.css';
import { initUI } from './ui/screens';
import { startGame } from './game/GameManager';
import type { Legend } from './data/legends';
import type { Difficulty } from './ui/screens';

function onStartGame(players: Legend[], difficulty: Difficulty): void {
  startGame(players, difficulty);
}

document.addEventListener('DOMContentLoaded', () => {
  initUI(onStartGame);
});
