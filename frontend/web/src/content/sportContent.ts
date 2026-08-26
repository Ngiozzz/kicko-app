import { Sport } from '../components/SportIcon';
import { SplitFormat } from '../lib/bookingsApi';

// 'squad' sports (football, basketball) recruit strangers into open
// home/away sides over time — match_sessions. 'pair' sports (tennis) book
// with a fixed, already-known small group — split bookings. See
// docs/legal note-free conversation history for why these need different
// booking mechanics, not just different words.
export type BookingMode = 'squad' | 'pair';

export type PairFormat = { key: SplitFormat; label: string; totalPlayers: number };

export type SportContent = {
  venueWord: string;
  sideNames: { home: string; away: string };
  sideInitials: { home: string; away: string };
  positions: string[];
  bookingMode: BookingMode;
  pairFormats: PairFormat[];
};

const FOOTBALL: SportContent = {
  venueWord: 'pitch',
  sideNames: { home: 'Home', away: 'Away' },
  sideInitials: { home: 'H', away: 'A' },
  positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  bookingMode: 'squad',
  pairFormats: [],
};

const BASKETBALL: SportContent = {
  venueWord: 'court',
  sideNames: { home: 'Team A', away: 'Team B' },
  sideInitials: { home: 'A', away: 'B' },
  positions: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  bookingMode: 'squad',
  pairFormats: [],
};

const TENNIS: SportContent = {
  venueWord: 'court',
  sideNames: { home: 'Home', away: 'Away' }, // unused — bookingMode: 'pair' never renders sides
  sideInitials: { home: 'H', away: 'A' },
  positions: [],
  bookingMode: 'pair',
  pairFormats: [
    { key: 'singles', label: 'Singles', totalPlayers: 2 },
    { key: 'doubles', label: 'Doubles', totalPlayers: 4 },
  ],
};

// Sports without an entry here fall back to football's side/venue wording
// (their session flow isn't designed yet) but get no positions, since
// showing football positions on a padel or tennis profile would be wrong.
const SPORT_CONTENT: Partial<Record<Sport, SportContent>> = {
  football: FOOTBALL,
  basketball: BASKETBALL,
  tennis: TENNIS,
};

export function getSportContent(sport: string | null | undefined): SportContent {
  return SPORT_CONTENT[sport as Sport] ?? { ...FOOTBALL, positions: [] };
}
