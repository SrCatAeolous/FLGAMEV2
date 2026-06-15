import { Legend, LEGENDS, getLegendById } from '../data/legends';
import { PACK_TYPES } from '../data/packs';
import { createLegendCard, updateCardSelection } from './cards';
import * as api from '../api/client';

export type Screen = 'login' | 'home' | 'team-select' | 'game' | 'packs' | 'club' | 'lobby';
export type Difficulty = 'easy' | 'normal' | 'hard';

interface AppState {
  currentScreen: Screen;
  selectedPlayers: Legend[];
  difficulty: Difficulty;
  userData: api.UserData | null;
  onStartGame: (players: Legend[], difficulty: Difficulty) => void;
}

const MAX_TEAM_SIZE = 3;
let state: AppState;

export function initUI(onStartGame: (players: Legend[], difficulty: Difficulty) => void): void {
  state = {
    currentScreen: 'login',
    selectedPlayers: [],
    difficulty: 'normal',
    userData: null,
    onStartGame,
  };

  const app = document.getElementById('app')!;
  app.innerHTML = '';

  app.appendChild(createLoginScreen());
  app.appendChild(createHomeScreen());
  app.appendChild(createPacksScreen());
  app.appendChild(createClubScreen());
  app.appendChild(createTeamSelectScreen());
  app.appendChild(createGameScreen());
  app.appendChild(createLobbyScreen());

  if (api.isLoggedIn()) {
    api.getProfile().then((user) => {
      state.userData = user;
      showScreen('home');
      updateHomeUI();
    }).catch(() => {
      api.clearToken();
      showScreen('login');
    });
  } else {
    showScreen('login');
  }
}

// ==================== LOGIN SCREEN ====================
function createLoginScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen login-screen';
  screen.id = 'screen-login';

  screen.innerHTML = `
    <div class="login-container">
      <div class="menu-logo">Fut Legends</div>
      <div class="gold-line"></div>
      <div class="menu-subtitle">Leyendas del F\u00FAtbol</div>
      <div class="login-form">
        <input type="text" id="login-username" placeholder="Usuario" class="input-field" maxlength="20" autocomplete="username" />
        <input type="password" id="login-password" placeholder="Contrase\u00F1a" class="input-field" autocomplete="current-password" />
        <div class="login-error" id="login-error"></div>
        <button class="btn btn-primary" id="btn-login">Iniciar Sesi\u00F3n</button>
        <button class="btn" id="btn-register">Crear Cuenta</button>
        <div class="login-divider"><span>o</span></div>
        <button class="btn btn-guest" id="btn-guest">Jugar sin cuenta</button>
      </div>
    </div>
  `;

  const doAuth = async (action: 'login' | 'register') => {
    const username = (screen.querySelector('#login-username') as HTMLInputElement).value.trim();
    const password = (screen.querySelector('#login-password') as HTMLInputElement).value;
    const errorEl = screen.querySelector('#login-error') as HTMLElement;
    errorEl.textContent = '';

    if (!username || !password) {
      errorEl.textContent = 'Completa todos los campos';
      return;
    }

    try {
      const fn = action === 'login' ? api.login : api.register;
      const data = await fn(username, password);
      state.userData = data.user;
      showScreen('home');
      updateHomeUI();
    } catch (err) {
      errorEl.textContent = (err as Error).message;
    }
  };

  screen.querySelector('#btn-login')!.addEventListener('click', () => doAuth('login'));
  screen.querySelector('#btn-register')!.addEventListener('click', () => doAuth('register'));

  screen.querySelector('#btn-guest')!.addEventListener('click', () => {
    state.userData = {
      id: 'guest',
      username: 'Invitado',
      coins: 10000,
      level: 1,
      xp: 0,
      cards: LEGENDS.slice(0, 8).map((l) => ({ legendId: l.id, obtainedAt: new Date().toISOString() })),
      stats: { wins: 0, losses: 0, draws: 0, goalsScored: 0, goalsConceded: 0, matchesPlayed: 0 },
    };
    showScreen('home');
    updateHomeUI();
  });

  screen.querySelector('#login-password')!.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') doAuth('login');
  });

  return screen;
}

// ==================== HOME SCREEN ====================
function createHomeScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen home-screen';
  screen.id = 'screen-home';

  screen.innerHTML = `
    <div class="home-top-bar">
      <div class="home-user-info">
        <span class="home-username" id="home-username"></span>
        <span class="home-level" id="home-level">Nv. 1</span>
      </div>
      <div class="home-xp-bar">
        <div class="home-xp-fill" id="home-xp-fill"></div>
      </div>
      <div class="home-coins">
        <span id="home-coins">0</span> \uD83D\uDCB0
      </div>
    </div>
    <div class="home-stats-row" id="home-stats-row">
      <div class="stat-box"><span class="stat-num" id="home-wins">0</span><span class="stat-lbl">Victorias</span></div>
      <div class="stat-box"><span class="stat-num" id="home-draws">0</span><span class="stat-lbl">Empates</span></div>
      <div class="stat-box"><span class="stat-num" id="home-losses">0</span><span class="stat-lbl">Derrotas</span></div>
      <div class="stat-box"><span class="stat-num" id="home-goals">0</span><span class="stat-lbl">Goles</span></div>
    </div>
    <div class="home-menu-grid">
      <button class="home-menu-btn" id="btn-play">
        <span class="hm-icon">\u26BD</span>
        <span class="hm-label">Jugar</span>
      </button>
      <button class="home-menu-btn" id="btn-open-packs">
        <span class="hm-icon">\uD83C\uDCCF</span>
        <span class="hm-label">Sobres</span>
      </button>
      <button class="home-menu-btn" id="btn-my-club">
        <span class="hm-icon">\uD83C\uDFC6</span>
        <span class="hm-label">Mi Club</span>
      </button>
      <button class="home-menu-btn" id="btn-online">
        <span class="hm-icon">\uD83C\uDF10</span>
        <span class="hm-label">Online</span>
      </button>
    </div>
    <div class="difficulty-section">
      <div class="difficulty-label">Dificultad</div>
      <div class="difficulty-options">
        <button class="btn diff-btn" data-diff="easy">F\u00E1cil</button>
        <button class="btn diff-btn active" data-diff="normal">Normal</button>
        <button class="btn diff-btn" data-diff="hard">Dif\u00EDcil</button>
      </div>
    </div>
    <button class="btn-logout" id="btn-logout">Cerrar Sesi\u00F3n</button>
  `;

  screen.querySelector('#btn-play')!.addEventListener('click', () => showScreen('team-select'));
  screen.querySelector('#btn-open-packs')!.addEventListener('click', () => {
    showScreen('packs');
    renderPacks();
  });
  screen.querySelector('#btn-my-club')!.addEventListener('click', () => {
    showScreen('club');
    renderClub();
  });
  screen.querySelector('#btn-online')!.addEventListener('click', () => showScreen('lobby'));

  screen.querySelectorAll('.diff-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      screen.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.difficulty = (btn as HTMLElement).dataset.diff as Difficulty;
    });
  });

  screen.querySelector('#btn-logout')!.addEventListener('click', () => {
    api.clearToken();
    state.userData = null;
    showScreen('login');
  });

  return screen;
}

function updateHomeUI(): void {
  const u = state.userData;
  if (!u) return;

  const setText = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('home-username', u.username);
  setText('home-level', `Nv. ${u.level}`);
  setText('home-coins', String(u.coins));
  setText('home-wins', String(u.stats.wins));
  setText('home-draws', String(u.stats.draws));
  setText('home-losses', String(u.stats.losses));
  setText('home-goals', String(u.stats.goalsScored));

  const xpFill = document.getElementById('home-xp-fill');
  if (xpFill) {
    const xpNeeded = 500 * u.level;
    xpFill.style.width = `${Math.min((u.xp / xpNeeded) * 100, 100)}%`;
  }
}

// ==================== PACKS SCREEN ====================
function createPacksScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen packs-screen';
  screen.id = 'screen-packs';

  screen.innerHTML = `
    <button class="back-btn" id="btn-back-packs">\u2190 Inicio</button>
    <div class="packs-header">Tienda de Sobres</div>
    <div class="packs-coins">\uD83D\uDCB0 <span id="packs-coins">0</span></div>
    <div class="packs-grid" id="packs-grid"></div>
    <div class="pack-opening-overlay" id="pack-opening-overlay">
      <div class="pack-opening-content" id="pack-opening-content"></div>
    </div>
  `;

  screen.querySelector('#btn-back-packs')!.addEventListener('click', () => {
    showScreen('home');
    updateHomeUI();
  });

  return screen;
}

function renderPacks(): void {
  const grid = document.getElementById('packs-grid')!;
  const coinsEl = document.getElementById('packs-coins')!;
  grid.innerHTML = '';
  coinsEl.textContent = String(state.userData?.coins || 0);

  PACK_TYPES.forEach((pack) => {
    const packEl = document.createElement('div');
    packEl.className = 'pack-item';
    packEl.style.borderColor = pack.color;
    packEl.innerHTML = `
      <div class="pack-glow" style="background:${pack.glowColor}"></div>
      <div class="pack-icon" style="color:${pack.color}">\uD83C\uDCCF</div>
      <div class="pack-name" style="color:${pack.color}">${pack.name}</div>
      <div class="pack-desc">${pack.description}</div>
      <div class="pack-info">${pack.cardCount} cartas</div>
      <button class="btn pack-buy-btn" style="border-color:${pack.color};color:${pack.color}">\uD83D\uDCB0 ${pack.cost}</button>
    `;

    const buyBtn = packEl.querySelector('.pack-buy-btn')!;
    buyBtn.addEventListener('click', () => handleOpenPack(pack.id));
    grid.appendChild(packEl);
  });
}

async function handleOpenPack(packId: string): Promise<void> {
  const pack = PACK_TYPES.find((p) => p.id === packId);
  if (!pack || !state.userData) return;

  if (state.userData.coins < pack.cost) {
    alert('\u00A1No tienes suficientes monedas!');
    return;
  }

  let cards: { legendId: string; tier: string }[];

  if (state.userData.id === 'guest') {
    state.userData.coins -= pack.cost;
    cards = generateGuestPack(packId);
    for (const c of cards) {
      state.userData.cards.push({ legendId: c.legendId, obtainedAt: new Date().toISOString() });
    }
  } else {
    try {
      const result = await api.openPack(packId);
      cards = result.cards;
      state.userData.coins = result.remainingCoins;
      state.userData.cards.push(...cards.map((c) => ({ legendId: c.legendId, obtainedAt: new Date().toISOString() })));
    } catch (err) {
      alert((err as Error).message);
      return;
    }
  }

  showPackOpening(cards);
  document.getElementById('packs-coins')!.textContent = String(state.userData.coins);
}

function generateGuestPack(packId: string): { legendId: string; tier: string }[] {
  const tierPools: Record<string, string[]> = {
    bronze: LEGENDS.filter((l) => l.tier === 'bronze').map((l) => l.id),
    silver: LEGENDS.filter((l) => l.tier === 'silver').map((l) => l.id),
    gold: LEGENDS.filter((l) => l.tier === 'gold').map((l) => l.id),
    icon: LEGENDS.filter((l) => l.tier === 'icon').map((l) => l.id),
    prime: LEGENDS.filter((l) => l.tier === 'prime').map((l) => l.id),
  };

  const weights: Record<string, { tier: string; weight: number }[]> = {
    bronze: [{ tier: 'bronze', weight: 75 }, { tier: 'silver', weight: 20 }, { tier: 'gold', weight: 5 }],
    silver: [{ tier: 'silver', weight: 60 }, { tier: 'gold', weight: 30 }, { tier: 'icon', weight: 10 }],
    gold: [{ tier: 'gold', weight: 55 }, { tier: 'icon', weight: 35 }, { tier: 'prime', weight: 10 }],
    icon: [{ tier: 'icon', weight: 50 }, { tier: 'prime', weight: 50 }],
  };

  const w = weights[packId] || weights.bronze;
  const cards: { legendId: string; tier: string }[] = [];

  for (let i = 0; i < 3; i++) {
    const total = w.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    let tier = w[w.length - 1].tier;
    for (const x of w) {
      r -= x.weight;
      if (r <= 0) { tier = x.tier; break; }
    }
    const pool = tierPools[tier];
    cards.push({ legendId: pool[Math.floor(Math.random() * pool.length)], tier });
  }

  return cards;
}

function showPackOpening(cards: { legendId: string; tier: string }[]): void {
  const overlay = document.getElementById('pack-opening-overlay')!;
  const content = document.getElementById('pack-opening-content')!;
  overlay.classList.add('active');

  content.innerHTML = '<div class="pack-anim-title">\u00A1Sobre Abierto!</div><div class="pack-cards-reveal" id="pack-reveal"></div>';

  const revealContainer = document.getElementById('pack-reveal')!;

  cards.forEach((cardData, index) => {
    const legend = getLegendById(cardData.legendId);
    if (!legend) return;

    setTimeout(() => {
      const wrapper = document.createElement('div');
      wrapper.className = 'pack-card-wrapper reveal-anim';
      const card = createLegendCard(legend, undefined, 'normal');
      wrapper.appendChild(card);
      revealContainer.appendChild(wrapper);
    }, index * 600);
  });

  setTimeout(() => {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-primary pack-close-btn';
    closeBtn.textContent = 'Continuar';
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });
    content.appendChild(closeBtn);
  }, cards.length * 600 + 500);
}

// ==================== CLUB SCREEN ====================
function createClubScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen club-screen';
  screen.id = 'screen-club';

  screen.innerHTML = `
    <button class="back-btn" id="btn-back-club">\u2190 Inicio</button>
    <div class="club-header">Mi Club</div>
    <div class="club-count" id="club-count">0 cartas</div>
    <div class="club-filters" id="club-filters">
      <button class="btn filter-btn active" data-filter="all">Todos</button>
      <button class="btn filter-btn" data-filter="prime">Prime</button>
      <button class="btn filter-btn" data-filter="icon">\u00CDcono</button>
      <button class="btn filter-btn" data-filter="gold">Oro</button>
      <button class="btn filter-btn" data-filter="silver">Plata</button>
      <button class="btn filter-btn" data-filter="bronze">Bronce</button>
    </div>
    <div class="club-grid" id="club-grid"></div>
  `;

  screen.querySelector('#btn-back-club')!.addEventListener('click', () => {
    showScreen('home');
    updateHomeUI();
  });

  screen.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      screen.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderClub((btn as HTMLElement).dataset.filter);
    });
  });

  return screen;
}

function renderClub(filter?: string): void {
  const grid = document.getElementById('club-grid')!;
  const countEl = document.getElementById('club-count')!;
  grid.innerHTML = '';

  if (!state.userData) return;

  const ownedIds = state.userData.cards.map((c) => c.legendId);
  const uniqueIds = [...new Set(ownedIds)];
  let legends = uniqueIds.map((id) => getLegendById(id)).filter(Boolean) as Legend[];

  if (filter && filter !== 'all') {
    legends = legends.filter((l) => l.tier === filter);
  }

  legends.sort((a, b) => b.rating - a.rating);
  countEl.textContent = `${uniqueIds.length} cartas \u00FAnicas`;

  legends.forEach((legend) => {
    const count = ownedIds.filter((id) => id === legend.id).length;
    const wrapper = document.createElement('div');
    wrapper.className = 'club-card-wrapper';
    const card = createLegendCard(legend);
    wrapper.appendChild(card);
    if (count > 1) {
      const badge = document.createElement('div');
      badge.className = 'card-count-badge';
      badge.textContent = `x${count}`;
      wrapper.appendChild(badge);
    }
    grid.appendChild(wrapper);
  });

  if (legends.length === 0) {
    grid.innerHTML = '<div class="empty-msg">No tienes cartas de este tipo</div>';
  }
}

// ==================== TEAM SELECT SCREEN ====================
function createTeamSelectScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen team-select-screen';
  screen.id = 'screen-team-select';

  const header = document.createElement('div');
  header.innerHTML = `
    <button class="back-btn" id="btn-back-home">\u2190 Inicio</button>
    <div class="team-select-header">Elige tu Equipo</div>
    <div class="team-select-sub">Selecciona ${MAX_TEAM_SIZE} leyendas de tu colecci\u00F3n</div>
  `;
  screen.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'cards-grid';
  grid.id = 'cards-grid';
  screen.appendChild(grid);

  const bar = document.createElement('div');
  bar.className = 'selected-team-bar';
  bar.id = 'selected-team-bar';
  bar.innerHTML = `
    <div class="selected-team-info">Equipo: <span id="team-count">0</span> / ${MAX_TEAM_SIZE}</div>
    <div class="selected-avatars" id="selected-avatars">
      ${Array(MAX_TEAM_SIZE).fill('<div class="selected-mini"></div>').join('')}
    </div>
    <button class="btn btn-primary" id="btn-start-match" style="padding:10px 20px;font-size:14px" disabled>\u00A1Jugar!</button>
  `;
  screen.appendChild(bar);

  screen.querySelector('#btn-back-home')!.addEventListener('click', () => {
    showScreen('home');
    updateHomeUI();
  });

  screen.querySelector('#btn-start-match')!.addEventListener('click', () => {
    if (state.selectedPlayers.length === MAX_TEAM_SIZE) {
      showScreen('game');
      state.onStartGame(state.selectedPlayers, state.difficulty);
    }
  });

  return screen;
}

function renderTeamSelect(): void {
  const grid = document.getElementById('cards-grid')!;
  grid.innerHTML = '';
  state.selectedPlayers = [];
  updateTeamBar();

  const cardElements = new Map<string, HTMLElement>();

  let availableLegends: Legend[];
  if (state.userData && state.userData.id !== 'guest') {
    const ownedIds = [...new Set(state.userData.cards.map((c) => c.legendId))];
    availableLegends = ownedIds.map((id) => getLegendById(id)).filter(Boolean) as Legend[];
  } else {
    availableLegends = [...LEGENDS];
  }

  availableLegends.sort((a, b) => b.rating - a.rating);

  availableLegends.forEach((legend) => {
    const card = createLegendCard(legend, () => {
      const idx = state.selectedPlayers.findIndex((p) => p.id === legend.id);
      if (idx >= 0) {
        state.selectedPlayers.splice(idx, 1);
        updateCardSelection(cardElements.get(legend.id)!, false);
      } else if (state.selectedPlayers.length < MAX_TEAM_SIZE) {
        state.selectedPlayers.push(legend);
        updateCardSelection(cardElements.get(legend.id)!, true);
      }
      updateTeamBar();
    });
    cardElements.set(legend.id, card);
    grid.appendChild(card);
  });
}

function updateTeamBar(): void {
  const countEl = document.getElementById('team-count')!;
  const avatarsEl = document.getElementById('selected-avatars')!;
  const startBtn = document.getElementById('btn-start-match') as HTMLButtonElement;

  countEl.textContent = String(state.selectedPlayers.length);
  startBtn.disabled = state.selectedPlayers.length !== MAX_TEAM_SIZE;

  const minis = avatarsEl.querySelectorAll('.selected-mini');
  minis.forEach((mini, i) => {
    if (i < state.selectedPlayers.length) {
      mini.classList.add('filled');
      mini.textContent = state.selectedPlayers[i].shortName.charAt(0);
    } else {
      mini.classList.remove('filled');
      mini.textContent = '';
    }
  });
}

// ==================== GAME SCREEN ====================
function createGameScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen game-screen';
  screen.id = 'screen-game';

  screen.innerHTML = `
    <div id="game-container"></div>
    <div class="game-hud">
      <div class="hud-score">
        <span class="gold" id="hud-home">0</span> - <span id="hud-away">0</span>
      </div>
      <div class="hud-timer" id="hud-timer">00:00</div>
    </div>
    <div class="mobile-controls" id="mobile-controls">
      <div class="joystick-area" id="joystick">
        <div class="joystick-knob" id="joystick-knob"></div>
      </div>
      <div class="mobile-right-btns">
        <div class="action-btn skill-btn" id="skill-btn">SKILL</div>
        <div class="action-btn sprint-btn" id="sprint-btn">SPRINT</div>
        <div class="action-btn kick-btn" id="kick-btn">KICK</div>
      </div>
    </div>
    <div class="result-overlay" id="result-overlay">
      <div class="result-title" id="result-title"></div>
      <div class="result-score" id="result-score"></div>
      <div class="result-rewards" id="result-rewards"></div>
      <div class="result-buttons">
        <button class="btn" id="btn-rematch">Revancha</button>
        <button class="btn btn-primary" id="btn-back-select">Inicio</button>
      </div>
    </div>
  `;

  return screen;
}

// ==================== LOBBY SCREEN ====================
function createLobbyScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen lobby-screen';
  screen.id = 'screen-lobby';

  screen.innerHTML = `
    <button class="back-btn" id="btn-back-lobby">\u2190 Inicio</button>
    <div class="lobby-header">Online</div>
    <div class="lobby-content">
      <div class="lobby-section">
        <div class="lobby-title">Crear Sala</div>
        <button class="btn btn-primary" id="btn-create-room">Crear Sala</button>
        <div class="room-code-display" id="room-code-display" style="display:none">
          <div class="room-code-label">C\u00F3digo de sala:</div>
          <div class="room-code" id="room-code"></div>
          <div class="room-waiting">Esperando rival...</div>
        </div>
      </div>
      <div class="lobby-divider"></div>
      <div class="lobby-section">
        <div class="lobby-title">Unirse a Sala</div>
        <input type="text" id="join-room-input" placeholder="C\u00F3digo de sala" class="input-field" maxlength="5" style="text-transform:uppercase" />
        <button class="btn btn-primary" id="btn-join-room">Unirse</button>
        <div class="lobby-error" id="lobby-error"></div>
      </div>
    </div>
  `;

  screen.querySelector('#btn-back-lobby')!.addEventListener('click', () => {
    showScreen('home');
    updateHomeUI();
  });

  screen.querySelector('#btn-create-room')!.addEventListener('click', () => {
    const codeDisplay = document.getElementById('room-code-display')!;
    const codeEl = document.getElementById('room-code')!;
    const code = generateLocalRoomCode();
    codeEl.textContent = code;
    codeDisplay.style.display = 'block';
  });

  screen.querySelector('#btn-join-room')!.addEventListener('click', () => {
    const input = document.getElementById('join-room-input') as HTMLInputElement;
    const error = document.getElementById('lobby-error')!;
    const code = input.value.trim().toUpperCase();
    if (code.length !== 5) {
      error.textContent = 'El c\u00F3digo debe tener 5 caracteres';
      return;
    }
    error.textContent = 'Conectando...';
  });

  return screen;
}

function generateLocalRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

// ==================== NAVIGATION ====================
export function showScreen(screen: Screen): void {
  state.currentScreen = screen;
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(`screen-${screen}`)?.classList.add('active');

  if (screen === 'team-select') {
    renderTeamSelect();
  }
}

export function updateHUD(homeScore: number, awayScore: number, timeSeconds: number): void {
  const homeEl = document.getElementById('hud-home');
  const awayEl = document.getElementById('hud-away');
  const timerEl = document.getElementById('hud-timer');
  if (homeEl) homeEl.textContent = String(homeScore);
  if (awayEl) awayEl.textContent = String(awayScore);
  if (timerEl) {
    const min = Math.floor(timeSeconds / 60);
    const sec = Math.floor(timeSeconds % 60);
    timerEl.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
}

export async function showResult(homeScore: number, awayScore: number): Promise<void> {
  const overlay = document.getElementById('result-overlay')!;
  const titleEl = document.getElementById('result-title')!;
  const scoreEl = document.getElementById('result-score')!;
  const rewardsEl = document.getElementById('result-rewards')!;

  scoreEl.textContent = `${homeScore} - ${awayScore}`;

  if (homeScore > awayScore) {
    titleEl.textContent = '\u00A1Victoria!';
    titleEl.className = 'result-title win';
  } else if (homeScore < awayScore) {
    titleEl.textContent = 'Derrota';
    titleEl.className = 'result-title lose';
  } else {
    titleEl.textContent = 'Empate';
    titleEl.className = 'result-title draw';
  }

  if (state.userData && state.userData.id !== 'guest') {
    try {
      const result = await api.submitMatchResult(homeScore, awayScore);
      state.userData.coins = result.totalCoins;
      state.userData.level = result.level;
      state.userData.xp = result.xp;
      state.userData.stats = result.stats;
      rewardsEl.innerHTML = `
        <div class="reward-item">+${result.coinsEarned} \uD83D\uDCB0</div>
        <div class="reward-item">+${result.xpEarned} XP</div>
      `;
    } catch {
      rewardsEl.innerHTML = '';
    }
  } else if (state.userData) {
    const coinsEarned = homeScore > awayScore ? 500 : homeScore === awayScore ? 200 : 100;
    state.userData.coins += coinsEarned;
    state.userData.stats.matchesPlayed += 1;
    state.userData.stats.goalsScored += homeScore;
    state.userData.stats.goalsConceded += awayScore;
    if (homeScore > awayScore) state.userData.stats.wins += 1;
    else if (homeScore === awayScore) state.userData.stats.draws += 1;
    else state.userData.stats.losses += 1;
    rewardsEl.innerHTML = `<div class="reward-item">+${coinsEarned} \uD83D\uDCB0</div>`;
  }

  overlay.classList.add('active');
}

export function hideResult(): void {
  document.getElementById('result-overlay')?.classList.remove('active');
}

export function getUserData(): api.UserData | null {
  return state.userData;
}
