import { Legend, TIER_COLORS } from '../data/legends';

const POSITION_EMOJI: Record<string, string> = {
  GK: '\uD83E\uDDE4',
  CB: '\uD83D\uDEE1\uFE0F',
  LB: '\uD83D\uDEE1\uFE0F',
  RB: '\uD83D\uDEE1\uFE0F',
  CM: '\u26BD',
  CAM: '\u26BD',
  LW: '\u26BD',
  RW: '\u26BD',
  CF: '\u26BD',
  ST: '\u26BD',
};

export function createLegendCard(legend: Legend, onClick?: () => void, size: 'normal' | 'small' | 'large' = 'normal'): HTMLElement {
  const card = document.createElement('div');
  card.className = `legend-card card-${size} tier-${legend.tier}`;
  card.dataset.id = legend.id;

  const colors = TIER_COLORS[legend.tier];
  const emoji = POSITION_EMOJI[legend.position] || '\u26BD';
  const stars = '\u2B50'.repeat(Math.min(legend.skillMoves, 5));

  card.innerHTML = `
    <div class="card-inner" style="background:linear-gradient(165deg, ${colors.bg}, #0A0A0F);border:2px solid ${colors.primary}">
      <span class="card-tier-badge" style="background:${colors.dark}40;color:${colors.primary}">${legend.tier}</span>
      <div class="card-rating" style="color:${colors.primary}">${legend.rating}</div>
      <div class="card-position">${legend.position}</div>
      <div class="card-avatar" style="background:linear-gradient(135deg, ${colors.dark}, ${colors.primary})">${emoji}</div>
      <div class="card-name">${legend.shortName}</div>
      <div class="card-nationality">${legend.nationality}</div>
      <div class="card-skills">${stars}</div>
      <div class="card-stats">
        <div class="card-stat"><span class="stat-value" style="color:${colors.primary}">${legend.stats.pac}</span><span class="stat-label">PAC</span></div>
        <div class="card-stat"><span class="stat-value" style="color:${colors.primary}">${legend.stats.sho}</span><span class="stat-label">SHO</span></div>
        <div class="card-stat"><span class="stat-value" style="color:${colors.primary}">${legend.stats.pas}</span><span class="stat-label">PAS</span></div>
        <div class="card-stat"><span class="stat-value" style="color:${colors.primary}">${legend.stats.dri}</span><span class="stat-label">DRI</span></div>
        <div class="card-stat"><span class="stat-value" style="color:${colors.primary}">${legend.stats.def}</span><span class="stat-label">DEF</span></div>
        <div class="card-stat"><span class="stat-value" style="color:${colors.primary}">${legend.stats.phy}</span><span class="stat-label">PHY</span></div>
      </div>
    </div>
  `;

  if (onClick) {
    card.addEventListener('click', onClick);
    card.style.cursor = 'pointer';
  }

  return card;
}

export function updateCardSelection(cardEl: HTMLElement, selected: boolean): void {
  cardEl.classList.toggle('selected', selected);
}
