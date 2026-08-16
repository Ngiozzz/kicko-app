import { Role } from './roleContent';

export type SignInCopy = { roleLabel: string; headline: string; subhead: string; bullets: string[] };

// Sign-in is one shared route (/sign-in?role=...) used by all three
// roles that authenticate on web — the role param only picks which
// copy shows on the brand panel and drives the page title ("Player
// sign in" etc.), so it's always clear whose sign-in page this is.
// Admin has its own separate, unbranded page (see app/admin.tsx) and
// isn't part of this map.
export const signInContent: Record<Role, SignInCopy> = {
  player: {
    roleLabel: 'Player',
    headline: 'Good to have you back.',
    subhead: 'Find courts, book slots, and keep track of your games.',
    bullets: [
      'Book courts across every sport we support',
      'See your upcoming games in one place',
      'One account, on the app or on the web',
    ],
  },
  owner: {
    roleLabel: 'Owner',
    headline: 'Good to have you back.',
    subhead: 'Everything you need to run your venues, in one place.',
    bullets: [
      'Real-time bookings across every court you manage',
      'Clear payout tracking, no spreadsheets',
      'Add managers and staff without giving up control',
    ],
  },
  manager: {
    roleLabel: 'Manager',
    headline: 'Good to have you back.',
    subhead: "Sign in to help run the venues you've been added to.",
    bullets: [
      'Approve bookings for the venues you manage',
      'Handle the day-to-day, without owning the account',
      'Your owner keeps full visibility, always',
    ],
  },
};
