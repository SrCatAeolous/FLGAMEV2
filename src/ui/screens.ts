import { Legend, LEGENDS, getLegendById } from '../data/legends';
import { PACK_TYPES } from '../data/packs';
import { createLegendCard, updateCardSelection } from './cards';
import * as api from '../api/client';

export type Screen = 'login' | 'home' | 'player-select' | 'game' | 'packs' | 'club' | 'lobby';
export type Difficulty = 'easy' | 'normal' | 'hard';

interface AppState {
  currentScreen: Screen;
  selectedPlayer: Legend | null;
  selectedGK: Legend | null;
  difficulty: Difficulty;
  userData: api.UserData | null;
  onStartGame: (player: Legend, goalkeeper: Legend, difficulty: Difficulty) => void;
}

let state: AppState;

export function initUI(onStartGame: (player: Legend, goalkeeper: Legend, difficulty: Difficulty) => void): void {
  state = {
    currentScreen: 'login',
    selectedPlayer: null,
    selectedGK: null,
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
  app.appendChild(createPlayerSelectScreen());
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
        <span class="hm-label">Buscar Rival</span>
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

  screen.querySelector('#btn-play')!.addEventListener('click', () => showScreen('player-select'));
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

  try {
    const result = await api.openPack(packId);
    const cards = result.cards;
    state.userData.coins = result.remainingCoins;
    state.userData.cards.push(...cards.map((c) => ({ legendId: c.legendId, obtainedAt: new Date().toISOString() })));
    showPackOpening(cards);
    document.getElementById('packs-coins')!.textContent = String(state.userData.coins);
  } catch (err) {
    alert((err as Error).message);
  }
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

// ==================== PLAYER SELECT SCREEN ====================
function createPlayerSelectScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen player-select-screen';
  screen.id = 'screen-player-select';

  const header = document.createElement('div');
  header.innerHTML = `
    <button class="back-btn" id="btn-back-home">\u2190 Inicio</button>
    <div class="team-select-header">Elige tu Jugador</div>
    <div class="team-select-sub">Selecciona 1 leyenda de campo</div>
  `;
  screen.appendChild(header);

  const fieldSection = document.createElement('div');
  fieldSection.className = 'select-section';
  fieldSection.innerHTML = '<div class="section-title">\u26BD Jugador de Campo</div>';
  const fieldGrid = document.createElement('div');
  fieldGrid.className = 'cards-grid';
  fieldGrid.id = 'field-cards-grid';
  fieldSection.appendChild(fieldGrid);
  screen.appendChild(fieldSection);

  const gkSection = document.createElement('div');
  gkSection.className = 'select-section';
  gkSection.innerHTML = '<div class="section-title">\uD83E\uDDE4 Portero</div>';
  const gkGrid = document.createElement('div');
  gkGrid.className = 'cards-grid gk-grid';
  gkGrid.id = 'gk-cards-grid';
  gkSection.appendChild(gkGrid);
  screen.appendChild(gkSection);

  const bar = document.createElement('div');
  bar.className = 'selected-team-bar';
  bar.id = 'selected-team-bar';
  bar.innerHTML = `
    <div class="selected-team-info">
      <span class="sel-label">Jugador:</span> <span id="sel-player-name">---</span>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <span class="sel-label">Portero:</span> <span id="sel-gk-name">---</span>
    </div>
    <button class="btn btn-primary" id="btn-start-match" style="padding:10px 20px;font-size:14px" disabled>\u00A1Jugar!</button>
  `;
  screen.appendChild(bar);

  screen.querySelector('#btn-back-home')!.addEventListener('click', () => {
    showScreen('home');
    updateHomeUI();
  });

  screen.querySelector('#btn-start-match')!.addEventListener('click', () => {
    if (state.selectedPlayer && state.selectedGK) {
      showScreen('game');
      state.onStartGame(state.selectedPlayer, state.selectedGK, state.difficulty);
    }
  });

  return screen;
}

function renderPlayerSelect(): void {
  const fieldGrid = document.getElementById('field-cards-grid')!;
  const gkGrid = document.getElementById('gk-cards-grid')!;
  fieldGrid.innerHTML = '';
  gkGrid.innerHTML = '';
  state.selectedPlayer = null;
  state.selectedGK = null;
  updateSelectBar();

  const fieldCardEls = new Map<string, HTMLElement>();
  const gkCardEls = new Map<string, HTMLElement>();

  let availableLegends: Legend[];
  if (state.userData) {
    const ownedIds = [...new Set(state.userData.cards.map((c) => c.legendId))];
    availableLegends = ownedIds.map((id) => getLegendById(id)).filter(Boolean) as Legend[];
  } else {
    availableLegends = [...LEGENDS];
  }

  const fieldPlayers = availableLegends.filter(l => l.position !== 'GK').sort((a, b) => b.rating - a.rating);
  const gkPlayers = availableLegends.filter(l => l.position === 'GK').sort((a, b) => b.rating - a.rating);

  // If no GKs owned, show all GKs as available
  const gkList = gkPlayers.length > 0 ? gkPlayers : LEGENDS.filter(l => l.position === 'GK');

  fieldPlayers.forEach((legend) => {
    const card = createLegendCard(legend, () => {
      if (state.selectedPlayer?.id === legend.id) {
        state.selectedPlayer = null;
        updateCardSelection(fieldCardEls.get(legend.id)!, false);
      } else {
        if (state.selectedPlayer) {
          updateCardSelection(fieldCardEls.get(state.selectedPlayer.id)!, false);
        }
        state.selectedPlayer = legend;
        updateCardSelection(fieldCardEls.get(legend.id)!, true);
      }
      updateSelectBar();
    });
    fieldCardEls.set(legend.id, card);
    fieldGrid.appendChild(card);
  });

  gkList.forEach((legend) => {
    const card = createLegendCard(legend, () => {
      if (state.selectedGK?.id === legend.id) {
        state.selectedGK = null;
        updateCardSelection(gkCardEls.get(legend.id)!, false);
      } else {
        if (state.selectedGK) {
          updateCardSelection(gkCardEls.get(state.selectedGK.id)!, false);
        }
        state.selectedGK = legend;
        updateCardSelection(gkCardEls.get(legend.id)!, true);
      }
      updateSelectBar();
    });
    gkCardEls.set(legend.id, card);
    gkGrid.appendChild(card);
  });

  if (fieldPlayers.length === 0) {
    fieldGrid.innerHTML = '<div class="empty-msg">Abre sobres para conseguir jugadores</div>';
  }
}

function updateSelectBar(): void {
  const playerNameEl = document.getElementById('sel-player-name')!;
  const gkNameEl = document.getElementById('sel-gk-name')!;
  const startBtn = document.getElementById('btn-start-match') as HTMLButtonElement;

  playerNameEl.textContent = state.selectedPlayer?.shortName || '---';
  gkNameEl.textContent = state.selectedGK?.shortName || '---';
  startBtn.disabled = !state.selectedPlayer || !state.selectedGK;
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
        <div class="action-btn skill-btn" id="skill-btn">\u26A1</div>
        <div class="action-btn sprint-btn" id="sprint-btn">\uD83C\uDFC3</div>
        <div class="action-btn kick-btn" id="kick-btn">\u26BD</div>
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

// ==================== MATCHMAKING SCREEN ====================
function createLobbyScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen lobby-screen';
  screen.id = 'screen-lobby';

  screen.innerHTML = `
    <button class="back-btn" id="btn-back-lobby">\u2190 Inicio</button>
    <div class="lobby-header">\u26BD Matchmaking 1v1</div>
    <div class="matchmaking-content">
      <div class="matchmaking-info">
        <p>Busca un rival aleatorio y juega un partido 1v1.</p>
        <p>Primero selecciona tu jugador y portero.</p>
      </div>
      <div class="matchmaking-status" id="mm-status" style="display:none">
        <div class="mm-searching">
          <div class="mm-spinner"></div>
          <span>Buscando rival...</span>
        </div>
      </div>
      <div class="mm-opponent" id="mm-opponent" style="display:none">
        <div class="mm-vs">\u00A1Rival encontrado!</div>
        <div class="mm-opponent-name" id="mm-opponent-name"></div>
        <div class="mm-opponent-legend" id="mm-opponent-legend"></div>
      </div>
      <button class="btn btn-primary btn-large" id="btn-find-match" disabled>\uD83D\uDD0E Buscar Rival</button>
      <div class="mm-selections">
        <div class="mm-sel-row">
          <span class="sel-label">Tu jugador:</span> <span id="mm-player-name" class="mm-sel-value">No seleccionado</span>
        </div>
        <div class="mm-sel-row">
          <span class="sel-label">Tu portero:</span> <span id="mm-gk-name" class="mm-sel-value">No seleccionado</span>
        </div>
        <button class="btn" id="btn-mm-select">Elegir Equipo</button>
      </div>
      <div class="mm-controls-help">
        <div class="controls-title">Controles</div>
        <div class="controls-grid">
          <div class="ctrl-item"><kbd>\u2190\u2191\u2193\u2192</kbd> o <kbd>WASD</kbd> Mover</div>
          <div class="ctrl-item"><kbd>SPACE</kbd> o <kbd>E</kbd> Chutar</div>
          <div class="ctrl-item"><kbd>SHIFT</kbd> Sprint</div>
          <div class="ctrl-item"><kbd>Q</kbd> Regate</div>
        </div>
      </div>
    </div>
  `;

  screen.querySelector('#btn-back-lobby')!.addEventListener('click', () => {
    showScreen('home');
    updateHomeUI();
  });

  screen.querySelector('#btn-mm-select')!.addEventListener('click', () => {
    showScreen('player-select');
  });

  screen.querySelector('#btn-find-match')!.addEventListener('click', () => {
    if (!state.selectedPlayer || !state.selectedGK) return;
    startMatchmaking();
  });

  return screen;
}

function updateMatchmakingUI(): void {
  const playerEl = document.getElementById('mm-player-name');
  const gkEl = document.getElementById('mm-gk-name');
  const findBtn = document.getElementById('btn-find-match') as HTMLButtonElement;

  if (playerEl) playerEl.textContent = state.selectedPlayer?.shortName || 'No seleccionado';
  if (gkEl) gkEl.textContent = state.selectedGK?.shortName || 'No seleccionado';
  if (findBtn) findBtn.disabled = !state.selectedPlayer || !state.selectedGK;
}

function startMatchmaking(): void {
  const statusEl = document.getElementById('mm-status')!;
  const opponentEl = document.getElementById('mm-opponent')!;
  const findBtn = document.getElementById('btn-find-match') as HTMLButtonElement;

  statusEl.style.display = 'flex';
  opponentEl.style.display = 'none';
  findBtn.disabled = true;

  // Simulate matchmaking search (1-3 seconds)
  const searchTime = 1000 + Math.random() * 2000;

  setTimeout(() => {
    statusEl.style.display = 'none';
    opponentEl.style.display = 'block';

    // Pick random opponent
    const fieldPlayers = LEGENDS.filter(l => l.position !== 'GK' && l.id !== state.selectedPlayer?.id);
    const oppLegend = fieldPlayers[Math.floor(Math.random() * fieldPlayers.length)];
    const oppNames = ['CR7_Fan', 'Maradona10', 'D10S', 'FutMaster', 'GoldenBoy', 'ElPibe', 'LaPulga', 'R9Legend', 'ZizouMagic', 'OFenomeno', 'ElMatador', 'Fantasista'];
    const oppName = oppNames[Math.floor(Math.random() * oppNames.length)];

    document.getElementById('mm-opponent-name')!.textContent = oppName;
    document.getElementById('mm-opponent-legend')!.textContent = `${oppLegend.name} (${oppLegend.rating})`;

    // Start match after showing opponent
    setTimeout(() => {
      opponentEl.style.display = 'none';
      findBtn.disabled = false;
      if (state.selectedPlayer && state.selectedGK) {
        showScreen('game');
        state.onStartGame(state.selectedPlayer, state.selectedGK, state.difficulty);
      }
    }, 1500);
  }, searchTime);
}

// ==================== NAVIGATION ====================
export function showScreen(screen: Screen): void {
  state.currentScreen = screen;
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(`screen-${screen}`)?.classList.add('active');

  if (screen === 'player-select') {
    renderPlayerSelect();
  }
  if (screen === 'lobby') {
    updateMatchmakingUI();
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

  if (state.userData) {
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
  }

  overlay.classList.add('active');
}

export function hideResult(): void {
  document.getElementById('result-overlay')?.classList.remove('active');
}

export function getUserData(): api.UserData | null {
  return state.userData;
}
