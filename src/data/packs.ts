export interface PackType {
  id: string;
  name: string;
  cost: number;
  cardCount: number;
  description: string;
  color: string;
  glowColor: string;
}

export const PACK_TYPES: PackType[] = [
  {
    id: 'bronze',
    name: 'Sobre Bronce',
    cost: 500,
    cardCount: 3,
    description: 'Jugadores de nivel bronce con posibilidad de plata',
    color: '#CD7F32',
    glowColor: 'rgba(205, 127, 50, 0.4)',
  },
  {
    id: 'silver',
    name: 'Sobre Plata',
    cost: 2000,
    cardCount: 3,
    description: 'Jugadores plata garantizados, posibilidad de oro',
    color: '#C0C0C0',
    glowColor: 'rgba(192, 192, 192, 0.4)',
  },
  {
    id: 'gold',
    name: 'Sobre Oro',
    cost: 5000,
    cardCount: 3,
    description: 'Jugadores oro garantizados, posibilidad de \u00edcono',
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.4)',
  },
  {
    id: 'icon',
    name: 'Sobre \u00cdcono',
    cost: 15000,
    cardCount: 3,
    description: '\u00cdconos y Primes garantizados',
    color: '#D4AF37',
    glowColor: 'rgba(212, 175, 55, 0.5)',
  },
];
