import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Auth only (sign up / sign in / session refresh) — everything else goes
// through ../../../backend instead of calling Supabase directly from here
// (see src/lib/api.ts). Both env vars are unset until the real Supabase
// project exists (see README) — configured is checked by screens before
// making auth calls so the app can still render and be previewed without
// them.
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
