import { Sport } from '../components/SportIcon';
import { SplitFormat } from '../lib/bookingsApi';

// 'squad' sports (football, basketball, rugby) recruit strangers into open
// home/away sides over time — match_sessions. 'pair' sports (tennis, padel)
// book with a fixed, already-known small group — split bookings. See
// docs/legal note-free conversation history for why these need different
// booking mechanics, not just different words.
export type BookingMode = 'squad' | 'pair';

export type PairFormat = { key: SplitFormat; label: string; totalPlayers: number };

// A squad sport can be played in more than one shape (rugby: sevens vs
// union 15s vs touch) — the organizer picks one at session creation
// (match_sessions.format). Purely descriptive: it doesn't change the
// booking mechanics, capacity limit, or payment flow, just what's shown.
// Sports with a single shape (football, basketball) leave this empty and
// skip the picker entirely.
export type SessionFormat = { key: string; label: string };

export type SportContent = {
  venueWord: string;
  sideNames: { home: string; away: string };
  sideInitials: { home: string; away: string };
  positions: string[];
  bookingMode: BookingMode;
  pairFormats: PairFormat[];
  sessionFormats: SessionFormat[];
};

const FOOTBALL: SportContent = {
  venueWord: 'pitch',
  sideNames: { home: 'Home', away: 'Away' },
  sideInitials: { home: 'H', away: 'A' },
  positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  bookingMode: 'squad',
  pairFormats: [],
  sessionFormats: [],
};

const BASKETBALL: SportContent = {
  venueWord: 'court',
  sideNames: { home: 'Team A', away: 'Team B' },
  sideInitials: { home: 'A', away: 'B' },
  positions: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  bookingMode: 'squad',
  pairFormats: [],
  sessionFormats: [],
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
  sessionFormats: [],
};

// Padel is almost always doubles — courts are purpose-built 4-wall
// enclosures, singles is the occasional exception rather than the norm
// (the reverse of tennis) — so doubles leads here, unlike TENNIS above.
const PADEL: SportContent = {
  venueWord: 'court',
  sideNames: { home: 'Home', away: 'Away' }, // unused — bookingMode: 'pair' never renders sides
  sideInitials: { home: 'H', away: 'A' },
  positions: [],
  bookingMode: 'pair',
  pairFormats: [
    { key: 'doubles', label: 'Doubles', totalPlayers: 4 },
    { key: 'singles', label: 'Singles', totalPlayers: 2 },
  ],
  sessionFormats: [],
};

// Rugby is a squad sport like football/basketball (recruit two sides,
// fill up a pitch over time) but unlike them it's genuinely played in
// several very different shapes — sevens leads given Kenya's rugby
// culture (Kenya Sevens/Shujaa, Safari Sevens), but a real pitch could
// just as easily be booked for a full 15s match or a casual touch game,
// so the organizer picks the shape per session rather than it being
// baked into the sport.
const RUGBY: SportContent = {
  venueWord: 'pitch',
  sideNames: { home: 'Home', away: 'Away' },
  sideInitials: { home: 'H', away: 'A' },
  positions: ['Prop', 'Hooker', 'Lock', 'Flanker', 'Number 8', 'Scrum-half', 'Fly-half', 'Centre', 'Wing', 'Fullback'],
  bookingMode: 'squad',
  pairFormats: [],
  sessionFormats: [
    { key: 'sevens', label: 'Sevens (7s)' },
    { key: 'fifteens', label: 'Union 15s' },
    { key: 'touch', label: 'Touch / Social' },
  ],
};

// Sports without an entry here fall back to football's side/venue wording
// (their session flow isn't designed yet) but get no positions, since
// showing football positions on a padel or tennis profile would be wrong.
const SPORT_CONTENT: Partial<Record<Sport, SportContent>> = {
  football: FOOTBALL,
  basketball: BASKETBALL,
  tennis: TENNIS,
  padel: PADEL,
  rugby: RUGBY,
};

export function getSportContent(sport: string | null | undefined): SportContent {
  return SPORT_CONTENT[sport as Sport] ?? { ...FOOTBALL, positions: [], sessionFormats: [] };
}
