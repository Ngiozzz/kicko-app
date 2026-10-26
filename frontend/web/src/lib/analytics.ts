import posthog from 'posthog-js';
import { supabase } from '@kicko/shared';

// PostHog product analytics + session replay (web only). Off entirely
// unless EXPO_PUBLIC_POSTHOG_KEY is set, so local dev and preview builds
// without the key send nothing.
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

// The admin dashboard shows other people's names, phones and payouts —
// never record or track it, only the player/owner/manager side.
function isPrivatePath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin-dashboard');
}

let started = false;

export function initAnalytics() {
  if (started || !POSTHOG_KEY || typeof window === 'undefined') return;
  started = true;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: '2025-05-24',
    // Expo Router navigates client-side, so pageviews come from history
    // changes rather than full page loads.
    capture_pageview: 'history_change',
    // Anonymous visitors stay anonymous; a person profile only exists once
    // identifyUser() runs after sign-in.
    person_profiles: 'identified_only',
    // Replays show clicks and screens, never what people type (phones,
    // passwords, M-Pesa numbers).
    session_recording: { maskAllInputs: true },
    before_send: (event) => {
      const path = event?.properties?.$pathname;
      if (typeof path === 'string' && isPrivatePath(path)) return null;
      return event;
    },
  });

  // Tie events to the Supabase user id only — no email or name is sent.
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      posthog.identify(session.user.id);
    } else if (event === 'SIGNED_OUT') {
      posthog.reset();
    }
  });
}

// Called on every route change from the root layout: pauses the replay
// while on admin pages, resumes it everywhere else.
export function trackRoute(pathname: string) {
  if (!started) return;
  if (isPrivatePath(pathname)) posthog.stopSessionRecording();
  else posthog.startSessionRecording();
}
