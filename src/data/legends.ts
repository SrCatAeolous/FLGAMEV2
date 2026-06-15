export interface LegendStats {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

export type Tier = 'bronze' | 'silver' | 'gold' | 'icon' | 'prime';

export interface Legend {
  id: string;
  name: string;
  shortName: string;
  rating: number;
  position: string;
  nationality: string;
  stats: LegendStats;
  tier: Tier;
  skillMoves: number;
}

export const TIER_COLORS: Record<Tier, { primary: string; dark: string; light: string; bg: string }> = {
  bronze: { primary: '#CD7F32', dark: '#8B5E3C', light: '#D4976A', bg: '#2A1F14' },
  silver: { primary: '#C0C0C0', dark: '#808080', light: '#D8D8D8', bg: '#1E1E24' },
  gold: { primary: '#FFD700', dark: '#B8960F', light: '#FFE44D', bg: '#2A2410' },
  icon: { primary: '#D4AF37', dark: '#8B7225', light: '#F0D060', bg: '#1A1A2E' },
  prime: { primary: '#FF6B35', dark: '#CC4400', light: '#FF9966', bg: '#2E1A10' },
};

export const LEGENDS: Legend[] = [
  // === PRIME (90-99) ===
  {
    id: 'messi', name: 'Lionel Messi', shortName: 'MESSI', rating: 99,
    position: 'RW', nationality: 'ARG', tier: 'prime', skillMoves: 5,
    stats: { pac: 93, sho: 96, pas: 98, dri: 99, def: 38, phy: 65 },
  },
  {
    id: 'cristiano', name: 'Cristiano Ronaldo', shortName: 'CR7', rating: 98,
    position: 'ST', nationality: 'POR', tier: 'prime', skillMoves: 5,
    stats: { pac: 94, sho: 99, pas: 86, dri: 95, def: 40, phy: 85 },
  },
  {
    id: 'maradona', name: 'Diego Maradona', shortName: 'MARADONA', rating: 97,
    position: 'CAM', nationality: 'ARG', tier: 'prime', skillMoves: 5,
    stats: { pac: 90, sho: 93, pas: 95, dri: 99, def: 35, phy: 70 },
  },
  {
    id: 'pele', name: 'Pel\u00e9', shortName: 'PEL\u00c9', rating: 98,
    position: 'CF', nationality: 'BRA', tier: 'prime', skillMoves: 5,
    stats: { pac: 92, sho: 97, pas: 94, dri: 97, def: 42, phy: 76 },
  },
  {
    id: 'ronaldo9', name: 'Ronaldo Naz\u00e1rio', shortName: 'R9', rating: 97,
    position: 'ST', nationality: 'BRA', tier: 'prime', skillMoves: 5,
    stats: { pac: 96, sho: 97, pas: 82, dri: 96, def: 32, phy: 80 },
  },

  // === ICON (88-94) ===
  {
    id: 'zidane', name: 'Zinedine Zidane', shortName: 'ZIDANE', rating: 96,
    position: 'CAM', nationality: 'FRA', tier: 'icon', skillMoves: 5,
    stats: { pac: 82, sho: 90, pas: 96, dri: 97, def: 45, phy: 78 },
  },
  {
    id: 'ronaldinho', name: 'Ronaldinho', shortName: 'R10', rating: 95,
    position: 'LW', nationality: 'BRA', tier: 'icon', skillMoves: 5,
    stats: { pac: 90, sho: 88, pas: 93, dri: 98, def: 30, phy: 72 },
  },
  {
    id: 'beckenbauer', name: 'Franz Beckenbauer', shortName: 'KAISER', rating: 95,
    position: 'CB', nationality: 'GER', tier: 'icon', skillMoves: 3,
    stats: { pac: 78, sho: 72, pas: 90, dri: 88, def: 96, phy: 85 },
  },
  {
    id: 'cruyff', name: 'Johan Cruyff', shortName: 'CRUYFF', rating: 96,
    position: 'CF', nationality: 'NED', tier: 'icon', skillMoves: 5,
    stats: { pac: 88, sho: 90, pas: 94, dri: 97, def: 48, phy: 70 },
  },
  {
    id: 'maldini', name: 'Paolo Maldini', shortName: 'MALDINI', rating: 95,
    position: 'LB', nationality: 'ITA', tier: 'icon', skillMoves: 2,
    stats: { pac: 82, sho: 55, pas: 78, dri: 82, def: 97, phy: 88 },
  },
  {
    id: 'yashin', name: 'Lev Yashin', shortName: 'YASHIN', rating: 94,
    position: 'GK', nationality: 'RUS', tier: 'icon', skillMoves: 1,
    stats: { pac: 70, sho: 30, pas: 65, dri: 55, def: 88, phy: 90 },
  },
  {
    id: 'buffon', name: 'Gianluigi Buffon', shortName: 'BUFFON', rating: 94,
    position: 'GK', nationality: 'ITA', tier: 'icon', skillMoves: 1,
    stats: { pac: 68, sho: 25, pas: 60, dri: 45, def: 90, phy: 92 },
  },
  {
    id: 'eusebio', name: 'Eus\u00e9bio', shortName: 'EUS\u00c9BIO', rating: 93,
    position: 'ST', nationality: 'POR', tier: 'icon', skillMoves: 4,
    stats: { pac: 90, sho: 95, pas: 80, dri: 90, def: 35, phy: 78 },
  },

  // === GOLD (83-87) ===
  {
    id: 'pirlo', name: 'Andrea Pirlo', shortName: 'PIRLO', rating: 87,
    position: 'CM', nationality: 'ITA', tier: 'gold', skillMoves: 4,
    stats: { pac: 60, sho: 78, pas: 95, dri: 88, def: 55, phy: 62 },
  },
  {
    id: 'henry', name: 'Thierry Henry', shortName: 'HENRY', rating: 87,
    position: 'ST', nationality: 'FRA', tier: 'gold', skillMoves: 4,
    stats: { pac: 94, sho: 90, pas: 82, dri: 90, def: 35, phy: 75 },
  },
  {
    id: 'xavi', name: 'Xavi Hern\u00e1ndez', shortName: 'XAVI', rating: 86,
    position: 'CM', nationality: 'ESP', tier: 'gold', skillMoves: 4,
    stats: { pac: 65, sho: 72, pas: 96, dri: 90, def: 60, phy: 65 },
  },
  {
    id: 'iniesta', name: 'Andr\u00e9s Iniesta', shortName: 'INIESTA', rating: 86,
    position: 'CM', nationality: 'ESP', tier: 'gold', skillMoves: 4,
    stats: { pac: 72, sho: 75, pas: 94, dri: 95, def: 55, phy: 60 },
  },
  {
    id: 'ibrahimovic', name: 'Zlatan Ibrahimovi\u0107', shortName: 'ZLATAN', rating: 86,
    position: 'ST', nationality: 'SWE', tier: 'gold', skillMoves: 5,
    stats: { pac: 78, sho: 92, pas: 80, dri: 88, def: 35, phy: 90 },
  },
  {
    id: 'neymar', name: 'Neymar Jr', shortName: 'NEYMAR', rating: 86,
    position: 'LW', nationality: 'BRA', tier: 'gold', skillMoves: 5,
    stats: { pac: 92, sho: 85, pas: 88, dri: 96, def: 30, phy: 55 },
  },
  {
    id: 'roberto_carlos', name: 'Roberto Carlos', shortName: 'R.CARLOS', rating: 85,
    position: 'LB', nationality: 'BRA', tier: 'gold', skillMoves: 3,
    stats: { pac: 90, sho: 85, pas: 82, dri: 80, def: 82, phy: 80 },
  },
  {
    id: 'cafu', name: 'Caf\u00fa', shortName: 'CAF\u00da', rating: 85,
    position: 'RB', nationality: 'BRA', tier: 'gold', skillMoves: 3,
    stats: { pac: 88, sho: 60, pas: 78, dri: 80, def: 85, phy: 82 },
  },

  // === SILVER (78-82) ===
  {
    id: 'valderrama', name: 'Carlos Valderrama', shortName: 'PIBE', rating: 82,
    position: 'CAM', nationality: 'COL', tier: 'silver', skillMoves: 4,
    stats: { pac: 65, sho: 68, pas: 92, dri: 88, def: 40, phy: 60 },
  },
  {
    id: 'stoichkov', name: 'Hristo Stoichkov', shortName: 'STOICHKOV', rating: 82,
    position: 'LW', nationality: 'BUL', tier: 'silver', skillMoves: 4,
    stats: { pac: 85, sho: 88, pas: 78, dri: 85, def: 35, phy: 75 },
  },
  {
    id: 'batistuta', name: 'Gabriel Batistuta', shortName: 'BATIGOL', rating: 81,
    position: 'ST', nationality: 'ARG', tier: 'silver', skillMoves: 3,
    stats: { pac: 82, sho: 92, pas: 72, dri: 78, def: 30, phy: 82 },
  },
  {
    id: 'rivaldo', name: 'Rivaldo', shortName: 'RIVALDO', rating: 82,
    position: 'CAM', nationality: 'BRA', tier: 'silver', skillMoves: 4,
    stats: { pac: 78, sho: 88, pas: 85, dri: 90, def: 35, phy: 72 },
  },
  {
    id: 'gerrard', name: 'Steven Gerrard', shortName: 'GERRARD', rating: 80,
    position: 'CM', nationality: 'ENG', tier: 'silver', skillMoves: 3,
    stats: { pac: 78, sho: 85, pas: 82, dri: 78, def: 72, phy: 85 },
  },
  {
    id: 'lampard', name: 'Frank Lampard', shortName: 'LAMPARD', rating: 80,
    position: 'CM', nationality: 'ENG', tier: 'silver', skillMoves: 3,
    stats: { pac: 70, sho: 88, pas: 82, dri: 78, def: 68, phy: 78 },
  },
  {
    id: 'drogba', name: 'Didier Drogba', shortName: 'DROGBA', rating: 80,
    position: 'ST', nationality: 'CIV', tier: 'silver', skillMoves: 3,
    stats: { pac: 82, sho: 88, pas: 68, dri: 78, def: 38, phy: 90 },
  },
  {
    id: 'scholes', name: 'Paul Scholes', shortName: 'SCHOLES', rating: 79,
    position: 'CM', nationality: 'ENG', tier: 'silver', skillMoves: 3,
    stats: { pac: 62, sho: 82, pas: 90, dri: 80, def: 60, phy: 70 },
  },

  // === BRONZE (72-77) ===
  {
    id: 'chilavert', name: 'Jos\u00e9 Luis Chilavert', shortName: 'CHILAVERT', rating: 77,
    position: 'GK', nationality: 'PAR', tier: 'bronze', skillMoves: 1,
    stats: { pac: 55, sho: 70, pas: 65, dri: 45, def: 80, phy: 82 },
  },
  {
    id: 'higuita', name: 'Ren\u00e9 Higuit\u00e1', shortName: 'HIGUIT\u00c1', rating: 74,
    position: 'GK', nationality: 'COL', tier: 'bronze', skillMoves: 2,
    stats: { pac: 60, sho: 55, pas: 70, dri: 65, def: 72, phy: 70 },
  },
  {
    id: 'kluivert', name: 'Patrick Kluivert', shortName: 'KLUIVERT', rating: 76,
    position: 'ST', nationality: 'NED', tier: 'bronze', skillMoves: 3,
    stats: { pac: 80, sho: 82, pas: 72, dri: 78, def: 30, phy: 75 },
  },
  {
    id: 'seedorf', name: 'Clarence Seedorf', shortName: 'SEEDORF', rating: 78,
    position: 'CM', nationality: 'NED', tier: 'bronze', skillMoves: 3,
    stats: { pac: 72, sho: 80, pas: 82, dri: 82, def: 65, phy: 80 },
  },
  {
    id: 'trezeguet', name: 'David Trezeguet', shortName: 'TREZEGUET', rating: 76,
    position: 'ST', nationality: 'FRA', tier: 'bronze', skillMoves: 3,
    stats: { pac: 78, sho: 88, pas: 65, dri: 72, def: 28, phy: 78 },
  },
  {
    id: 'nakata', name: 'Hidetoshi Nakata', shortName: 'NAKATA', rating: 74,
    position: 'CAM', nationality: 'JPN', tier: 'bronze', skillMoves: 3,
    stats: { pac: 75, sho: 72, pas: 80, dri: 80, def: 55, phy: 68 },
  },
  {
    id: 'okocha', name: 'Jay-Jay Okocha', shortName: 'OKOCHA', rating: 77,
    position: 'CAM', nationality: 'NGA', tier: 'bronze', skillMoves: 5,
    stats: { pac: 82, sho: 75, pas: 82, dri: 92, def: 35, phy: 65 },
  },
  {
    id: 'vieri', name: 'Christian Vieri', shortName: 'VIERI', rating: 76,
    position: 'ST', nationality: 'ITA', tier: 'bronze', skillMoves: 2,
    stats: { pac: 78, sho: 90, pas: 55, dri: 70, def: 30, phy: 88 },
  },
];

export function getLegendById(id: string): Legend | undefined {
  return LEGENDS.find((l) => l.id === id);
}

export function getLegendsByTier(tier: Tier): Legend[] {
  return LEGENDS.filter((l) => l.tier === tier);
}

export function getFieldPlayers(): Legend[] {
  return LEGENDS.filter((l) => l.position !== 'GK');
}

export function getOverallRating(stats: LegendStats): number {
  return Math.round((stats.pac + stats.sho + stats.pas + stats.dri + stats.def + stats.phy) / 6);
}
