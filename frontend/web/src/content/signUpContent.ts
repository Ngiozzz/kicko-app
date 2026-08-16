export type SignUpRole = 'player' | 'owner';

export type SignUpCopy = {
  headline: string;
  subhead: string;
  bullets: string[];
  formTitle: string;
  formSubtitle: string;
};

// Sign-up is now shared by players and owners (/sign-up?role=...) —
// managers and admins still never self-register (managers are added by
// their owner, admins are provisioned by hand), so there's no third
// entry here.
export const signUpContent: Record<SignUpRole, SignUpCopy> = {
  player: {
    headline: 'Book your next game in minutes.',
    subhead: 'Create your Kicko account and get ready to find courts across every sport we support.',
    bullets: [
      'Book courts across every sport we support',
      'Track your games from web or mobile',
      'One account, wherever you play',
    ],
    formTitle: 'Create your player account',
    formSubtitle: 'Find courts, join games, and manage your bookings — all from one account.',
  },
  owner: {
    headline: 'Turn your pitch into a business.',
    subhead: 'List your venue, take bookings automatically, and get paid on time.',
    bullets: [
      'Real-time bookings across every court you manage',
      'Clear payout tracking, no spreadsheets',
      'Add managers and staff without giving up control',
    ],
    formTitle: 'Create your owner account',
    formSubtitle: 'Manage your venues, review bookings, and get paid — all from one dashboard.',
  },
};
