export type Role = 'player' | 'owner' | 'manager';

export type Cta = { text: string; href: '/sign-up' | '/sign-in' } | { text: string; comingSoon: true };

export type RoleFaq = { q: string; a: string };

export type RoleData = {
  tabLabel: string;
  eyebrow: string;
  headlineLines: [string, string, string];
  sub: string;
  primary: Cta;
  secondary: Cta;
  faqKicker: string;
  faqIntro: string;
  faqs: RoleFaq[];
};

// Copy is deliberately honest about Kicko being pre-launch — no invented
// stats (bookings confirmed, venues onboarded) and no FAQ answers about
// features (payouts, manager permissions) that aren't built yet.
export const roleContent: Record<Role, RoleData> = {
  player: {
    tabLabel: 'For players',
    eyebrow: 'Multi-sport venue booking',
    headlineLines: ['Find a court.', 'Pick a slot.', 'Get playing.'],
    sub: 'Kicko connects players with venues across every sport — real-time availability, instant confirmation, no back-and-forth with the front desk.',
    primary: { text: 'Create your account', href: '/sign-up' },
    secondary: { text: 'Sign in', href: '/sign-in' },
    faqKicker: 'Questions, players ask most',
    faqIntro: 'What booking on Kicko will actually look like.',
    faqs: [
      {
        q: 'Is Kicko live yet?',
        a: 'Kicko is in early development. You can create a player account now on web or the mobile app — booking features are rolling out next.',
      },
      {
        q: 'What sports does Kicko support?',
        a: 'Football, basketball, tennis, padel, and volleyball to start, with more sports planned.',
      },
      {
        q: 'How will I book a court?',
        a: "Once you're signed in, you'll search by sport and location, pick a slot, and confirm instantly — that's what we're building next.",
      },
      {
        q: 'Can I list my own venue instead?',
        a: 'Yes — create an owner account instead of a player account, and you can list your venue right away.',
      },
    ],
  },
  owner: {
    tabLabel: 'For owners',
    eyebrow: 'Now onboarding early venues',
    headlineLines: ['Your venue.', 'Fully booked.', 'Zero spreadsheets.'],
    sub: 'List your venue, set your own slots and pricing, and manage bookings and payouts from one dashboard.',
    primary: { text: 'Create your account', href: '/sign-up' },
    secondary: { text: 'Sign in', href: '/sign-in' },
    faqKicker: 'Questions, owners ask most',
    faqIntro: 'What listing your venue actually involves.',
    faqs: [
      {
        q: 'Does it cost anything to list my venue?',
        a: 'Listing is free while Kicko is in early access.',
      },
      {
        q: 'How do I get paid?',
        a: 'Payouts run through Paystack. Full payout support is rolling out as we onboard early venues.',
      },
      {
        q: 'Can I add staff to help run things?',
        a: "Yes — once your account is set up, you can add managers who handle bookings without owning the account.",
      },
      {
        q: 'What sports can I list?',
        a: 'Football, basketball, tennis, padel, and volleyball courts are all supported.',
      },
    ],
  },
  manager: {
    tabLabel: 'For managers',
    eyebrow: "Added by your venue owner, not signed up directly",
    headlineLines: ['Run the day-to-day.', 'Without owning', 'the account.'],
    sub: "Managers are added directly by their venue owner to help run daily operations — there's no separate sign-up.",
    primary: { text: 'Manager sign in', href: '/sign-in' },
    secondary: { text: 'Help your owner get started', href: '/sign-up' },
    faqKicker: 'Questions, managers ask most',
    faqIntro: 'How the manager role actually works.',
    faqs: [
      {
        q: 'Can I sign up as a manager directly?',
        a: 'No — a manager account only exists once your venue owner creates it for you.',
      },
      {
        q: 'What will I be able to do once I’m added?',
        a: "Help manage bookings and day-to-day operations for your owner's venues — those tools are part of what's being built next.",
      },
      {
        q: 'Does the owner still see everything?',
        a: 'Yes — owners keep full visibility into their venues even after adding a manager.',
      },
      {
        q: "I don't have an owner account set up yet — what do I do?",
        a: 'Get your owner registered first. Once they create your manager account, sign in here.',
      },
    ],
  },
};
