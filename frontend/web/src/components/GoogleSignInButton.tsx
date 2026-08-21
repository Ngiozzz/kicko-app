import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radius, supabase } from '@kicko/shared';
import { stashOAuthIntent, OAuthRole } from '../lib/oauthIntent';

function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </Svg>
  );
}

// Shared by sign-up (player, owner) and sign-in (player, owner) — never
// manager, whose accounts use a synthetic phone-derived email that can
// never match a real Google account (see managerPhoneToEmail in
// sign-in.tsx). `role` decides what a brand-new signup becomes (see
// /auth/callback + the backend's /api/account/me/role claim endpoint);
// for a returning user it's ignored in favor of their real account role.
export function GoogleSignInSection({ role, next }: { role: OAuthRole; next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePress() {
    setError(null);
    setLoading(true);
    stashOAuthIntent({ role, next });
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // A redirect happens on success, so this only runs when it failed
    // before ever leaving the page (e.g. provider not enabled yet).
    if (oauthError) {
      setLoading(false);
      setError(oauthError.message);
    }
  }

  return (
    <View>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        onPress={handlePress}
        disabled={loading}
        style={({ pressed }) => [styles.btn, loading && styles.btnDisabled, pressed && !loading && styles.btnPressed]}
      >
        <GoogleMark size={18} />
        <Text style={styles.btnText}>{loading ? 'Connecting…' : 'Continue with Google'}</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textSoft },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: 14,
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.text },
  error: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.danger,
    marginTop: 10,
    lineHeight: 18,
  },
});
