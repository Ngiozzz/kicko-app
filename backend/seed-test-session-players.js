// One-off dev seed: creates (or reuses) two real player accounts for
// exercising the Match Session feature as two distinct logged-in
// identities (organizer/home captain + away captain), since that's the
// only faithful way to test blind-roster visibility and independent
// per-person payments. Run with: node seed-test-session-players.js
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PLAYERS = [
  { email: "session-organizer@kicko.test", password: "TestPass123!", name: "Session Organizer", phone: "+254700111111" },
  { email: "session-away-captain@kicko.test", password: "TestPass123!", name: "Away Captain", phone: "+254700222222" },
];

for (const player of PLAYERS) {
  const { data: existingList } = await supabase.auth.admin.listUsers();
  const existing = existingList?.users?.find((u) => u.email === player.email);

  if (existing) {
    console.log(`Already exists: ${player.email} (id ${existing.id})`);
    continue;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: player.email,
    password: player.password,
    email_confirm: true,
    user_metadata: { name: player.name, phone: player.phone, role: "player" },
  });

  if (error) {
    console.error(`Failed to create ${player.email}:`, error.message);
    continue;
  }
  console.log(`Created: ${player.email} (id ${data.user.id}), password: ${player.password}, phone: ${player.phone}`);
}
