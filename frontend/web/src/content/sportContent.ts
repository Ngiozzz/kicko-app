import { Sport } from '../components/SportIcon';

export type SportContent = {
  venueWord: string;
  sideNames: { home: string; away: string };
  sideInitials: { home: string; away: string };
  positions: string[];
};

const FOOTBALL: SportContent = {
  venueWord: 'pitch',
  sideNames: { home: 'Home', away: 'Away' },
  sideInitials: { home: 'H', away: 'A' },
  positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
};

const BASKETBALL: SportContent = {
  venueWord: 'court',
  sideNames: { home: 'Team A', away: 'Team B' },
  sideInitials: { home: 'A', away: 'B' },
  positions: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
};

// Sports without an entry here fall back to football's side/venue wording
// (their session flow isn't designed yet) but get no positions, since
// showing football positions on a padel or tennis profile would be wrong.
const SPORT_CONTENT: Partial<Record<Sport, SportContent>> = {
  football: FOOTBALL,
  basketball: BASKETBALL,
};

export function getSportContent(sport: string | null | undefined): SportContent {
  return SPORT_CONTENT[sport as Sport] ?? { ...FOOTBALL, positions: [] };
}
