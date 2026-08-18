import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import {
  isRedacted,
  sessionsApi,
  MatchSession,
  SessionDetail as SessionDetailData,
  SessionParticipant,
  SessionSide,
} from '../../../src/lib/sessionsApi';
import { Payment } from '../../../src/lib/bookingsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { useCountdown } from '../../../src/lib/useCountdown';
import { copyToClipboard } from '../../../src/lib/copyToClipboard';
import { useBreadcrumb } from '../../../src/lib/breadcrumbContext';
import { settingsApi } from '../../../src/lib/settingsApi';

const ACTIVE_PHASES: MatchSession['phase'][] = ['joining', 'paying', 'awaiting_decision'];
const POLL_MS = 6000;

// Admin-editable via /admin-dashboard/settings — used only to size the
// countdown/progress bar correctly per phase; the server's phase_deadline
// (and, for awaiting_decision, its grace period) stays the source of truth
// for when things actually transition. Defaults match platform_settings'
// own defaults so the countdown is correct even before the fetch resolves.
type PhaseWindows = { joinSeconds: number; paySeconds: number; decisionGraceSeconds: number };
const DEFAULT_PHASE_WINDOWS: PhaseWindows = { joinSeconds: 15 * 60, paySeconds: 5 * 60, decisionGraceSeconds: 10 * 60 };

// Small scattered accents around the "funded" hero's checkmark — positions
// as plain style objects so they can share the confettiDot base style.
const CONFETTI_DOTS = [
  { top: 4, left: 10, backgroundColor: colors.accent },
  { top: 14, right: 6, backgroundColor: colors.good },
  { bottom: 10, left: 2, backgroundColor: colors.good },
  { bottom: 2, right: 16, backgroundColor: colors.accent },
  { top: -4, left: '45%', backgroundColor: colors.accentSoft },
] as const;

function phaseWindowSeconds(phase: MatchSession['phase'], windows: PhaseWindows): number {
  if (phase === 'joining') return windows.joinSeconds;
  if (phase === 'paying') return windows.paySeconds;
  return windows.decisionGraceSeconds;
}

// awaiting_decision's phase_deadline marks when the session ENTERED that
// phase (already in the past) — the real auto-cancel moment is that plus
// the grace period, so the countdown needs to target that, not the raw
// deadline field itself.
function countdownTargetIso(session: MatchSession, windows: PhaseWindows): string {
  if (session.phase !== 'awaiting_decision') return session.phase_deadline;
  return new Date(new Date(session.phase_deadline).getTime() + windows.decisionGraceSeconds * 1000).toISOString();
}

function phaseLabel(session: MatchSession): string {
  if (session.phase === 'joining') return 'Building the roster';
  if (session.phase === 'paying') return 'Collecting payment';
  if (session.phase === 'awaiting_decision') return "Needs the organizer's decision";
  if (session.phase === 'funded') return 'Confirmed';
  return 'Cancelled';
}

// The breadcrumb's last segment — states the outcome outright once there
// is one, rather than the generic "Match session" label active phases use.
function sessionCrumbLabel(phase: MatchSession['phase']): string {
  if (phase === 'funded') return 'Match Success';
  if (phase === 'cancelled') return 'Match Failure';
  return 'Match session';
}

function inviteLinkUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/join-session?token=${token}`;
}

function CopyLinkRow({ label, token }: { label: string; token: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <View style={styles.linkRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.linkLabel}>{label}</Text>
        <Text style={styles.linkValue} numberOfLines={1}>
          {inviteLinkUrl(token)}
        </Text>
      </View>
      <Pressable
        style={styles.linkCopyBtn}
        onPress={async () => {
          const ok = await copyToClipboard(inviteLinkUrl(token));
          if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }
        }}
      >
        <Text style={styles.linkCopyText}>{copied ? 'Copied!' : 'Copy'}</Text>
      </Pressable>
    </View>
  );
}

function ParticipantRow({ p, canManage, onRemove, removing }: { p: SessionParticipant; canManage: boolean; onRemove: () => void; removing: boolean }) {
  return (
    <View style={styles.participantRow}>
      <View style={styles.participantAvatar}>
        <Text style={styles.participantAvatarText}>{(p.user?.name ?? p.display_name ?? '?').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.participantName}>
          {p.user?.name ?? p.display_name ?? 'Unclaimed spot'} {p.is_captain && <Text style={styles.captainTag}>Captain</Text>}
        </Text>
        <Text style={styles.participantMeta}>
          {p.status === 'invited' ? 'Invited — awaiting response' : p.paid ? 'Paid' : 'Accepted — awaiting payment'}
        </Text>
      </View>
      {canManage && (
        <Pressable disabled={removing} onPress={onRemove}>
          <Text style={styles.removeLink}>{removing ? '…' : 'Remove'}</Text>
        </Pressable>
      )}
    </View>
  );
}

// A lineup card, not just a list — the VS divider between the two of these
// is what actually sells the matchday framing.
function SideRosterCard({
  side,
  rows,
  isOrganizer,
  isCaptain,
  callerSide,
  organizerId,
  myUserId,
  removingId,
  onRemove,
}: {
  side: SessionSide;
  rows: SessionParticipant[] | { redacted: true; count: number };
  isOrganizer: boolean;
  isCaptain: boolean;
  callerSide: SessionSide;
  organizerId: string;
  myUserId?: string;
  removingId: string | null;
  onRemove: (participantId: string) => void;
}) {
  return (
    <View style={[styles.sideCard, side === 'home' ? styles.sideCardHome : styles.sideCardAway]}>
      <View style={styles.sideHeader}>
        <View style={[styles.sideBadge, side === 'home' ? styles.sideBadgeHome : styles.sideBadgeAway]}>
          <Text style={styles.sideBadgeText}>{side === 'home' ? 'H' : 'A'}</Text>
        </View>
        <Text style={styles.sideTitle}>{side === 'home' ? 'Home' : 'Away'}</Text>
      </View>
      {isRedacted(rows) ? (
        <View style={styles.redactedPanel}>
          <Text style={styles.redactedIcon}>🔒</Text>
          <Text style={styles.redactedText}>{rows.count} accepted — roster hidden until you're on this side</Text>
        </View>
      ) : rows.length === 0 ? (
        <Text style={styles.emptyText}>Nobody yet.</Text>
      ) : (
        rows.map((p) => {
          const canManage = isOrganizer || (isCaptain && callerSide === side) || p.user?.id === myUserId;
          const canRemove = canManage && !(side === 'home' && p.user?.id === organizerId);
          return <ParticipantRow key={p.id} p={p} canManage={canRemove} removing={removingId === p.id} onRemove={() => onRemove(p.id)} />;
        })
      )}
    </View>
  );
}

export default function MatchSessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [detail, setDetail] = useState<SessionDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topup, setTopup] = useState<{ owed: number; purpose: 'session_topup' | 'session_remainder' } | null>(null);
  const [windows, setWindows] = useState<PhaseWindows>(DEFAULT_PHASE_WINDOWS);

  const [inviteSide, setInviteSide] = useState<SessionSide>('home');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [pendingPayment, setPendingPayment] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await sessionsApi.get(id);
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this session.');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!detail || !ACTIVE_PHASES.includes(detail.session.phase)) return;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [detail?.session.phase, load]);

  // Covers arriving here already authenticated with a claim still pending
  // from join-session.tsx (e.g. logged in separately, then navigated in
  // directly) — join-session.tsx itself handles the immediate case.
  useEffect(() => {
    if (!id || !detail || detail.my_participant) return;
    const raw = localStorage.getItem('kicko-pending-claim');
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as { sessionId: string; claimToken: string };
      if (pending.sessionId !== id) return;
      sessionsApi.claim(id, pending.claimToken).then(() => {
        localStorage.removeItem('kicko-pending-claim');
        load();
      }).catch(() => {});
    } catch {
      localStorage.removeItem('kicko-pending-claim');
    }
  }, [id, detail?.my_participant, load]);

  useEffect(() => {
    if (!detail || !id || detail.session.phase !== 'awaiting_decision') {
      setTopup(null);
      return;
    }
    sessionsApi
      .topupOwed(id)
      .then(setTopup)
      .catch(() => setTopup(null));
  }, [id, detail?.session.phase, detail?.session.resplit_active]);

  useEffect(() => {
    settingsApi
      .get()
      .then(({ settings }) =>
        setWindows({
          joinSeconds: settings.session_join_window_minutes * 60,
          paySeconds: settings.session_pay_window_minutes * 60,
          decisionGraceSeconds: settings.session_decision_grace_minutes * 60,
        })
      )
      .catch(() => {});
  }, []);

  const countdown = useCountdown(detail && ACTIVE_PHASES.includes(detail.session.phase) ? countdownTargetIso(detail.session, windows) : null);

  async function submitInvite() {
    if (!id || !invitePhone.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      await sessionsApi.invite(id, { side: inviteSide, phone: invitePhone.trim() });
      setInvitePhone('');
      await load();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Could not send that invite.');
    } finally {
      setInviting(false);
    }
  }

  async function respond(accept: boolean) {
    if (!id) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await sessionsApi.respond(id, accept);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update your invite.');
    } finally {
      setSubmitting(false);
    }
  }

  async function completeRoster() {
    if (!id) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await sessionsApi.completeRoster(id);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not close your roster.');
    } finally {
      setSubmitting(false);
    }
  }

  async function payShare() {
    if (!id || !phone.trim()) {
      setActionError('Enter the phone number to receive the M-Pesa prompt on.');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const { payment } = await sessionsApi.pay(id, phone.trim());
      setPendingPayment(payment);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not start payment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function payTopUp() {
    if (!id || !phone.trim()) {
      setActionError('Enter the phone number to receive the M-Pesa prompt on.');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const { payment } = await sessionsApi.payTopup(id, phone.trim());
      setPendingPayment(payment);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not start payment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function simulateConfirm() {
    if (!pendingPayment) return;
    setSubmitting(true);
    try {
      await sessionsApi.confirmPayment(pendingPayment.id);
      setPendingPayment(null);
      setPhone('');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not confirm payment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function resplit() {
    if (!id) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await sessionsApi.resplit(id);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not resplit this session.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmCancel() {
    if (!id) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await sessionsApi.cancel(id);
      setShowCancelModal(false);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not cancel this session.');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeParticipant(participantId: string) {
    if (!id) return;
    setRemovingId(participantId);
    setActionError(null);
    try {
      await sessionsApi.removeParticipant(id, participantId);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not remove that participant.');
    } finally {
      setRemovingId(null);
    }
  }

  useBreadcrumb(
    detail
      ? [
          { label: 'Home', href: '/player' },
          { label: 'Bookings', href: '/player/bookings' },
          { label: detail.session.venue.name, href: `/player/explore/${detail.session.venue.id}` },
          { label: sessionCrumbLabel(detail.session.phase) },
        ]
      : null
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!detail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const { session, home, away, is_organizer, is_captain, my_participant, home_join_link, away_join_link, per_person_share, total_target, amount_paid_so_far } = detail;

  const iHaveInvite = my_participant?.status === 'invited';
  const iCanPayShare = session.phase === 'paying' && my_participant?.status === 'accepted' && !my_participant.paid;
  const urgentCountdown = countdown.secondsLeft <= 120;
  const isTerminal = session.phase === 'funded' || session.phase === 'cancelled';
  const homeCount = isRedacted(home) ? home.count : home.length;
  const awayCount = isRedacted(away) ? away.count : away.length;

  return (
    <View>
      <View style={styles.headRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.titleRow}>
            <SportIcon sport={session.venue.sport as Sport} size={20} />
            <Text style={styles.title}>{session.venue.name}</Text>
          </View>
          <Text style={styles.subtitle}>
            {new Date(session.start_at).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            {' · '}
            {session.venue.location}
          </Text>
        </View>
        {session.phase === 'awaiting_decision' && is_organizer && (
          <Pressable style={styles.cancelBtn} onPress={() => setShowCancelModal(true)}>
            <Text style={styles.cancelBtnText}>Cancel session</Text>
          </Pressable>
        )}
      </View>

      {isTerminal ? (
        <View style={styles.terminalHero}>
          <View style={[styles.heroIconRing, session.phase === 'cancelled' && styles.heroIconRingMuted]}>
            {session.phase === 'funded' &&
              CONFETTI_DOTS.map((dot, i) => <View key={i} style={[styles.confettiDot, dot]} />)}
            <Text style={styles.heroIconBig}>{session.phase === 'funded' ? '✅' : '✕'}</Text>
          </View>
          <Text style={styles.heroTitle}>{session.phase === 'funded' ? "You're all set — the game is on!" : 'Session cancelled'}</Text>
          <Text style={styles.heroBody}>
            {session.phase === 'funded'
              ? "Everyone's paid their share. See you on the pitch."
              : "This session didn't get fully funded in time and was cancelled."}
          </Text>

          {session.phase === 'cancelled' && (
            <View style={styles.heroReasonBox}>
              <Text style={styles.heroReasonLabel}>Why</Text>
              <Text style={styles.heroReasonText}>{session.cancellation_reason ?? 'This session was cancelled.'}</Text>
            </View>
          )}

          <View style={styles.heroDetails}>
            <View style={styles.heroDetail}>
              <Text style={styles.heroDetailLabel}>Venue</Text>
              <Text style={styles.heroDetailValue}>{session.venue.name}</Text>
            </View>
            <View style={styles.heroDetail}>
              <Text style={styles.heroDetailLabel}>When</Text>
              <Text style={styles.heroDetailValue}>
                {new Date(session.start_at).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.heroDetail}>
              <Text style={styles.heroDetailLabel}>Players joined</Text>
              <Text style={styles.heroDetailValue}>{homeCount + awayCount}</Text>
            </View>
            {session.phase === 'funded' && (
              <View style={styles.heroDetail}>
                <Text style={styles.heroDetailLabel}>Total collected</Text>
                <Text style={styles.heroDetailValue}>KES {amount_paid_so_far.toLocaleString()}</Text>
              </View>
            )}
          </View>

          <View style={styles.heroActions}>
            {session.phase === 'funded' ? (
              <Pressable style={styles.btn} onPress={() => router.push('/player/bookings')}>
                <Text style={styles.btnText}>View my bookings</Text>
              </Pressable>
            ) : (
              <>
                <Pressable style={styles.btn} onPress={() => router.push(`/player/explore/${session.venue.id}`)}>
                  <Text style={styles.btnText}>Book {session.venue.name} again</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.btnOutline]} onPress={() => router.push('/player/bookings')}>
                  <Text style={styles.btnOutlineText}>Back to bookings</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerLabel}>{phaseLabel(session)}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  urgentCountdown && styles.progressFillUrgent,
                  { width: `${Math.min(100, (countdown.secondsLeft / phaseWindowSeconds(session.phase, windows)) * 100)}%` },
                ]}
              />
            </View>
          </View>
          <View style={[styles.clockBox, urgentCountdown && styles.clockBoxUrgent]}>
            <Text style={[styles.clockLabel, urgentCountdown && styles.clockLabelUrgent]}>
              {session.phase === 'awaiting_decision' ? 'AUTO-CANCEL IN' : session.phase === 'paying' ? 'PAY BY' : 'ROSTER CLOSES'}
            </Text>
            <Text style={[styles.clockTime, urgentCountdown && styles.clockTimeUrgent]}>{countdown.label}</Text>
          </View>
        </View>
      )}

      {actionError && <Text style={styles.error}>{actionError}</Text>}

      {session.phase === 'joining' && (home_join_link || away_join_link) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invite links</Text>
          {home_join_link && <CopyLinkRow label="Home side" token={home_join_link} />}
          {away_join_link && <CopyLinkRow label={away_join_link === session.away_invite_token && detail.caller_side === 'away' ? 'Your team' : 'Away captain'} token={away_join_link} />}
        </View>
      )}

      {session.phase === 'joining' && is_captain && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invite a player by phone</Text>
          <View style={styles.inviteRow}>
            <TextInput
              value={invitePhone}
              onChangeText={setInvitePhone}
              placeholder="+254 7XX XXX XXX"
              placeholderTextColor={colors.textSoft}
              style={styles.inviteInput}
            />
            <Pressable disabled={inviting} onPress={submitInvite} style={[styles.btn, styles.inviteBtn, inviting && styles.btnDisabled]}>
              <Text style={styles.btnText}>{inviting ? 'Sending…' : 'Invite'}</Text>
            </Pressable>
          </View>
          {inviteError && <Text style={styles.error}>{inviteError}</Text>}
          <Pressable disabled={submitting} onPress={completeRoster}>
            <Text style={styles.linkAction}>Close my side's invites now →</Text>
          </Pressable>
        </View>
      )}

      {session.phase === 'joining' && iHaveInvite && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>You've been invited to this session</Text>
          <View style={styles.inviteRow}>
            <Pressable disabled={submitting} onPress={() => respond(true)} style={styles.btn}>
              <Text style={styles.btnText}>Accept</Text>
            </Pressable>
            <Pressable disabled={submitting} onPress={() => respond(false)} style={[styles.btn, styles.btnOutline]}>
              <Text style={styles.btnOutlineText}>Decline</Text>
            </Pressable>
          </View>
        </View>
      )}

      {iCanPayShare && (
        <View style={styles.card}>
          {!pendingPayment ? (
            <>
              <Text style={styles.cardTitle}>Pay your share</Text>
              <Text style={styles.priceLine}>KES {per_person_share.toLocaleString()}</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+254 7XX XXX XXX"
                placeholderTextColor={colors.textSoft}
                style={styles.phoneInput}
              />
              <Pressable disabled={submitting} onPress={payShare} style={[styles.btn, submitting && styles.btnDisabled]}>
                <Text style={styles.btnText}>{submitting ? 'Starting…' : 'Continue to pay with M-Pesa'}</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.stkPanel}>
              <Text style={styles.stkIcon}>📱</Text>
              <Text style={styles.stkTitle}>STK push sent</Text>
              <Text style={styles.stkBody}>
                Check <Text style={styles.stkStrong}>{pendingPayment.phone_number}</Text> and enter your M-Pesa PIN to pay{' '}
                <Text style={styles.stkStrong}>KES {pendingPayment.amount.toLocaleString()}</Text>.
              </Text>
              <Pressable onPress={simulateConfirm} disabled={submitting}>
                <Text style={styles.confirmLink}>{submitting ? 'Confirming…' : 'Simulate M-Pesa confirmation →'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {session.phase === 'awaiting_decision' && is_organizer && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Funding stalled — pick one</Text>
          <Text style={styles.stkBody}>
            KES {amount_paid_so_far.toLocaleString()} collected of KES {total_target.toLocaleString()} needed.
          </Text>
          <View style={styles.inviteRow}>
            {!session.resplit_active && (
              <Pressable disabled={submitting} onPress={resplit} style={[styles.btn, styles.btnOutline]}>
                <Text style={styles.btnOutlineText}>Resplit among who's paid</Text>
              </Pressable>
            )}
            <Pressable disabled={submitting} onPress={() => setShowCancelModal(true)} style={[styles.btn, styles.btnOutline]}>
              <Text style={styles.btnOutlineText}>Cancel &amp; refund</Text>
            </Pressable>
          </View>
        </View>
      )}

      {topup && topup.owed > 0 && (
        <View style={styles.card}>
          {!pendingPayment ? (
            <>
              <Text style={styles.cardTitle}>{topup.purpose === 'session_remainder' ? 'Pay the remaining gap' : 'Your resplit top-up'}</Text>
              <Text style={styles.priceLine}>KES {topup.owed.toLocaleString()}</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+254 7XX XXX XXX"
                placeholderTextColor={colors.textSoft}
                style={styles.phoneInput}
              />
              <Pressable disabled={submitting} onPress={payTopUp} style={[styles.btn, submitting && styles.btnDisabled]}>
                <Text style={styles.btnText}>{submitting ? 'Starting…' : 'Continue to pay with M-Pesa'}</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.stkPanel}>
              <Text style={styles.stkIcon}>📱</Text>
              <Text style={styles.stkTitle}>STK push sent</Text>
              <Text style={styles.stkBody}>
                Check <Text style={styles.stkStrong}>{pendingPayment.phone_number}</Text> and enter your M-Pesa PIN to pay{' '}
                <Text style={styles.stkStrong}>KES {pendingPayment.amount.toLocaleString()}</Text>.
              </Text>
              <Pressable onPress={simulateConfirm} disabled={submitting}>
                <Text style={styles.confirmLink}>{submitting ? 'Confirming…' : 'Simulate M-Pesa confirmation →'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <View style={styles.rosterGrid}>
        <SideRosterCard
          side="home"
          rows={home}
          isOrganizer={is_organizer}
          isCaptain={is_captain}
          callerSide={detail.caller_side}
          organizerId={session.organizer_id}
          myUserId={my_participant?.user?.id}
          removingId={removingId}
          onRemove={removeParticipant}
        />
        <View style={styles.vsWrap}>
          <View style={styles.vsBadge}>
            <Text style={styles.vsBadgeText}>VS</Text>
          </View>
        </View>
        <SideRosterCard
          side="away"
          rows={away}
          isOrganizer={is_organizer}
          isCaptain={is_captain}
          callerSide={detail.caller_side}
          organizerId={session.organizer_id}
          myUserId={my_participant?.user?.id}
          removingId={removingId}
          onRemove={removeParticipant}
        />
      </View>

      {showCancelModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.cardTitle}>Cancel this session?</Text>
            <Text style={styles.stkBody}>Anyone who's paid will be refunded per the cancellation policy — this can't be undone.</Text>
            {actionError && <Text style={styles.error}>{actionError}</Text>}
            <View style={styles.inviteRow}>
              <Pressable disabled={submitting} onPress={() => setShowCancelModal(false)} style={[styles.btn, styles.btnOutline]}>
                <Text style={styles.btnOutlineText}>Keep session</Text>
              </Pressable>
              <Pressable disabled={submitting} onPress={confirmCancel} style={styles.btn}>
                <Text style={styles.btnText}>{submitting ? 'Cancelling…' : 'Cancel & refund everyone'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 12 },

  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, marginTop: 4 },
  cancelBtn: { borderWidth: 1, borderColor: colors.danger, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 16 },
  cancelBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.danger },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 18,
    overflow: 'hidden',
    backgroundImage: `repeating-linear-gradient(-45deg, ${colors.surface2} 0px, ${colors.surface2} 1px, transparent 1px, transparent 22px)`,
  } as any,
  bannerLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text, marginBottom: 8 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  progressFillUrgent: { backgroundColor: colors.danger },

  // A "match clock" readout — the scoreboard treatment leans into the
  // football theme instead of a plain timestamp.
  clockBox: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 118,
  },
  clockBoxUrgent: { borderColor: colors.danger },
  clockLabel: { fontFamily: fonts.sansBold, fontSize: 9.5, letterSpacing: 0.8, color: colors.textSoft, marginBottom: 3 },
  clockLabelUrgent: { color: colors.danger },
  clockTime: {
    fontFamily: fonts.sansBold,
    fontSize: 26,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  } as any,
  clockTimeUrgent: { color: colors.danger },

  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20, marginBottom: 18 },
  cardTitle: { fontFamily: fonts.serifMedium, fontSize: 16, color: colors.text, marginBottom: 14 },
  priceLine: { fontFamily: fonts.serif, fontSize: 24, color: colors.text, marginBottom: 14 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  linkLabel: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft, marginBottom: 3 },
  linkValue: { fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  linkCopyBtn: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  linkCopyText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.accent },

  inviteRow: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  inviteInput: {
    flex: 1,
    minWidth: 180,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    outlineStyle: 'none',
  } as any,
  inviteBtn: { paddingHorizontal: 20 },
  linkAction: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.accent, marginTop: 14 },

  phoneInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    marginBottom: 14,
    outlineStyle: 'none',
  } as any,

  btn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentText },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  btnOutlineText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.text },

  stkPanel: { alignItems: 'center', paddingVertical: 6 },
  stkIcon: { fontSize: 28, marginBottom: 10 },
  stkTitle: { fontFamily: fonts.serifMedium, fontSize: 15, color: colors.text, marginBottom: 8 },
  stkBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft, textAlign: 'center', lineHeight: 19, marginBottom: 14 },
  stkStrong: { fontFamily: fonts.sansBold, color: colors.text },
  confirmLink: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.accent, textDecorationLine: 'underline' },

  rosterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' },
  sideCard: { flexGrow: 1, flexBasis: 300, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 20, borderTopWidth: 3 },
  sideCardHome: { borderTopColor: colors.accent },
  sideCardAway: { borderTopColor: colors.textSoft },
  sideHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sideBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sideBadgeHome: { backgroundColor: colors.accentSoft },
  sideBadgeAway: { backgroundColor: colors.surface2 },
  sideBadgeText: { fontFamily: fonts.sansBold, fontSize: 11.5, color: colors.text },
  sideTitle: { fontFamily: fonts.serifMedium, fontSize: 15, color: colors.text },

  vsWrap: { alignSelf: 'center', paddingHorizontal: 4 },
  vsBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsBadgeText: { fontFamily: fonts.serif, fontSize: 13, color: colors.accent },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },

  redactedPanel: { alignItems: 'center', paddingVertical: 24 },
  redactedIcon: { fontSize: 22, marginBottom: 8 },
  redactedText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, textAlign: 'center' },

  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  participantAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  participantAvatarText: { fontFamily: fonts.serif, fontSize: 14, color: colors.accent },
  participantName: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.text },
  captainTag: { fontFamily: fonts.sansBold, fontSize: 10.5, color: colors.accent },
  participantMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginTop: 2 },
  removeLink: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.danger },

  terminalHero: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  heroDetails: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 30, marginBottom: 22 },
  heroDetail: { alignItems: 'center', minWidth: 96 },
  heroDetailLabel: { fontFamily: fonts.sansBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSoft, marginBottom: 5 },
  heroDetailValue: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.text, textAlign: 'center' },
  heroIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundImage: `radial-gradient(circle, ${colors.accentSoft}, transparent 70%)`,
  } as any,
  heroIconRingMuted: { backgroundImage: `radial-gradient(circle, ${colors.surface2}, transparent 70%)` } as any,
  heroIconBig: { fontSize: 40 },
  confettiDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 } as any,
  heroTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.text, marginBottom: 10 },
  heroBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, textAlign: 'center', lineHeight: 21, marginBottom: 22, maxWidth: 440 },
  heroReasonBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 18,
    maxWidth: 440,
  },
  heroReasonLabel: { fontFamily: fonts.sansBold, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.danger, marginBottom: 6, textAlign: 'center' },
  heroReasonText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.text, textAlign: 'center', lineHeight: 19 },
  heroActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },

  modalOverlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: { width: '90%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 24 },
});
