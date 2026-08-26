import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiFetch, colors, fonts, supabase } from '@kicko/shared';
import { Button, Card, Field } from '../src/components/ui';
import { LogoMark } from '../src/components/Logo';
import { sessionsApi, JoinInfo } from '../src/lib/sessionsApi';
import { getSportContent } from '../src/content/sportContent';

// Lives outside /player/* on purpose — that layout redirects to sign-in
// unconditionally, but an invite link has to be previewable (and, for a
// regular join, usable) before the recipient has ever logged in.
const PENDING_CLAIM_KEY = 'kicko-pending-claim';

type Stage = 'loading' | 'not_found' | 'ready' | 'joined';
type AuthMode = 'signin' | 'signup';

export default function JoinSession() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [stage, setStage] = useState<Stage>('loading');
  const [info, setInfo] = useState<JoinInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [displayName, setDisplayName] = useState('');
  // Honeypot for the backend's bot check — real users never see or fill
  // this field (see the Field with name="website" below); a scripted bot
  // filling every input it finds will.
  const [website, setWebsite] = useState('');

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [joinedSessionId, setJoinedSessionId] = useState<string | null>(null);
  const [joinedSide, setJoinedSide] = useState<'home' | 'away' | null>(null);
  const [pendingClaimToken, setPendingClaimToken] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStage('not_found');
      return;
    }
    sessionsApi
      .joinInfo(token)
      .then((data) => {
        setInfo(data);
        setStage('ready');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'This invite link isn’t valid.');
        setStage('not_found');
      });
  }, [token]);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setCheckingAuth(false);
        return;
      }
      try {
        const { user } = await apiFetch<{ user: { name: string } }>('/api/account/me');
        setCurrentUserName(user.name);
      } catch {
        // Session token is stale/invalid — treat as logged out for this page.
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, []);

  async function finishJoin() {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const { session, participant, claim_token } = await sessionsApi.join({ token, display_name: displayName.trim() || undefined, website });
      setJoinedSessionId(session.id);
      setJoinedSide(participant.side);
      if (claim_token) {
        setPendingClaimToken(claim_token);
        localStorage.setItem(PENDING_CLAIM_KEY, JSON.stringify({ sessionId: session.id, claimToken: claim_token }));
      }
      setStage('joined');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join this session.');
    } finally {
      setSubmitting(false);
    }
  }

  // Used both before joining (mustLogIn — becoming a captain needs a real
  // account) and after an anonymous join (upgrading a placeholder spot to
  // a real identity via the stashed claim token).
  async function handleInlineAuth() {
    setAuthError(null);
    if (!email.trim() || !password) {
      setAuthError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      if (authMode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw new Error(signInError.message);
      } else {
        if (!name.trim()) throw new Error('Enter your name.');
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim(), role: 'player' } },
        });
        if (signUpError) throw new Error(signUpError.message);
      }
      apiFetch('/api/account/device-event', { method: 'POST', body: JSON.stringify({ event: authMode }) }).catch(() => {});
      const { user } = await apiFetch<{ user: { name: string } }>('/api/account/me');
      setCurrentUserName(user.name);

      if (joinedSessionId && pendingClaimToken) {
        await sessionsApi.claim(joinedSessionId, pendingClaimToken);
        localStorage.removeItem(PENDING_CLAIM_KEY);
        setPendingClaimToken(null);
      } else {
        await finishJoin();
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Could not sign you in.');
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === 'loading' || checkingAuth) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (stage === 'not_found') {
    return (
      <View style={styles.center}>
        <Card>
          <Text style={styles.title}>Link not valid</Text>
          <Text style={styles.body}>{error ?? 'This invite link has expired or was typed wrong.'}</Text>
        </Card>
      </View>
    );
  }

  if (stage === 'joined' && joinedSessionId) {
    return (
      <View style={styles.center}>
        <Card>
          <LogoMark size={28} />
          <Text style={styles.title}>You're in!</Text>
          <Text style={styles.body}>
            You joined the {joinedSide === 'home' ? getSportContent(info?.venue.sport).sideNames.home : getSportContent(info?.venue.sport).sideNames.away} side of the
            session at {info?.venue.name}.
          </Text>

          {currentUserName ? (
            <Button title="Go to the session" onPress={() => router.replace(`/player/sessions/${joinedSessionId}`)} />
          ) : (
            <>
              <Text style={styles.sectionNote}>Log in or sign up now to manage your spot and pay your share — otherwise your captain will need to keep you posted.</Text>
              <View style={styles.authToggle}>
                <Text style={[styles.authToggleOption, authMode === 'signin' && styles.authToggleOptionActive]} onPress={() => setAuthMode('signin')}>
                  Log in
                </Text>
                <Text style={[styles.authToggleOption, authMode === 'signup' && styles.authToggleOptionActive]} onPress={() => setAuthMode('signup')}>
                  Sign up
                </Text>
              </View>
              {authMode === 'signup' && <Field label="Name" value={name} onChangeText={setName} autoComplete="name" />}
              <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
              <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
              {authError && <Text style={styles.error}>{authError}</Text>}
              <Button title={submitting ? 'Please wait…' : authMode === 'signin' ? 'Log in' : 'Sign up'} onPress={handleInlineAuth} disabled={submitting} />
            </>
          )}
        </Card>
      </View>
    );
  }

  if (!info) return null;
  const mustLogIn = info.will_become_captain && !currentUserName;

  return (
    <View style={styles.center}>
      <Card>
        <LogoMark size={28} />
        <Text style={styles.title}>You've been invited to play</Text>
        <Text style={styles.body}>
          <Text style={styles.strong}>{info.organizer_name}</Text> invited you to {info.venue.name} —{' '}
          {new Date(info.start_at).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
        </Text>
        <Text style={styles.body}>
          You'll be joining the{' '}
          <Text style={styles.strong}>{info.side === 'home' ? getSportContent(info.venue.sport).sideNames.home : getSportContent(info.venue.sport).sideNames.away}</Text>{' '}
          side{info.will_become_captain ? ', as its captain' : ''}. {info.headcount} already accepted.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.honeypot} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Field label="Website" value={website} onChangeText={setWebsite} autoComplete="off" importantForAutofill="no" />
        </View>

        {mustLogIn ? (
          <>
            <Text style={styles.sectionNote}>Becoming a captain needs a real Kicko account — log in or sign up to claim the spot.</Text>
            <View style={styles.authToggle}>
              <Text
                style={[styles.authToggleOption, authMode === 'signin' && styles.authToggleOptionActive]}
                onPress={() => setAuthMode('signin')}
              >
                Log in
              </Text>
              <Text
                style={[styles.authToggleOption, authMode === 'signup' && styles.authToggleOptionActive]}
                onPress={() => setAuthMode('signup')}
              >
                Sign up
              </Text>
            </View>
            {authMode === 'signup' && <Field label="Name" value={name} onChangeText={setName} autoComplete="name" />}
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
            {authError && <Text style={styles.error}>{authError}</Text>}
            <Button title={submitting ? 'Please wait…' : authMode === 'signin' ? 'Log in & join' : 'Sign up & join'} onPress={handleInlineAuth} disabled={submitting} />
          </>
        ) : currentUserName ? (
          <Button title={submitting ? 'Joining…' : `Join as ${currentUserName}`} onPress={() => finishJoin()} disabled={submitting} />
        ) : (
          <>
            <Field label="Your name" value={displayName} onChangeText={setDisplayName} placeholder="So your captain knows who you are" />
            <Button title={submitting ? 'Joining…' : 'Join without an account'} onPress={() => finishJoin()} disabled={submitting} />
            <Text style={styles.sectionNote}>Have a Kicko account? Log in first to manage your spot and pay your share.</Text>
          </>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 20 },
  honeypot: { position: 'absolute', left: -9999, top: -9999, height: 1, width: 1, overflow: 'hidden' },
  title: { fontFamily: fonts.serif, fontSize: 22, color: colors.text, marginTop: 14, marginBottom: 10 },
  body: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, lineHeight: 20, marginBottom: 10 },
  strong: { fontFamily: fonts.sansBold, color: colors.text, textTransform: 'capitalize' },
  error: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.danger, marginBottom: 10 },
  sectionNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 12, lineHeight: 17 },
  authToggle: { flexDirection: 'row', gap: 16, marginBottom: 16, marginTop: 4 },
  authToggleOption: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSoft, paddingBottom: 4 },
  authToggleOptionActive: { color: colors.accent, borderBottomWidth: 2, borderBottomColor: colors.accent },
});
