import { ReactNode, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
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
import { getSportContent, SportContent } from '../../../src/content/sportContent';
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

// ============================================================
// "Match Success" hero — a deliberately fixed-dark, floodlit-stadium
// treatment that ignores the site's light/dark theme toggle on purpose
// (like modalOverlay below, which also hardcodes literal black). This is
// the one moment in the app meant to feel like a broadcast graphic, not
// a form — see MatchSuccessHero further down.
// ============================================================

type StatIconProps = { size?: number; color: string };

function CheckIcon({ size = 40, color }: StatIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12.5l5.5 5.5L20 7" />
    </Svg>
  );
}

function CalendarIcon({ size = 15, color }: StatIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3.5} y={5} width={17} height={16} rx={2.5} />
      <Path d="M3.5 10h17" />
      <Path d="M8 3v4M16 3v4" />
    </Svg>
  );
}

function PinIcon({ size = 15, color }: StatIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z" />
      <Circle cx={12} cy={9} r={2.4} />
    </Svg>
  );
}

function UsersIcon({ size = 15, color }: StatIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={9} cy={8} r={3.2} />
      <Path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <Path d="M16 4.2a3.2 3.2 0 0 1 0 6.2" />
      <Path d="M21.5 19.4c0-2.8-2-4.9-5-5.3" />
    </Svg>
  );
}

function WalletIcon({ size = 15, color }: StatIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={2.5} y={6} width={19} height={13} rx={2.5} />
      <Path d="M2.5 10h19" />
      <Path d="M16 14.2h3" />
    </Svg>
  );
}

// react-native-web (0.19+) turns these into real CSS @keyframes — reused
// by reference across every piece/ring so they compile to one rule each,
// with only timing (duration/delay) varying per element.
const confettiFallKeyframes = {
  '0%': { opacity: 0, transform: [{ translateY: '-20px' }, { rotate: '0deg' }] },
  '12%': { opacity: 1 },
  '55%': { transform: [{ translateY: '140px' }, { rotate: '190deg' }] },
  '100%': { opacity: 0, transform: [{ translateY: '280px' }, { rotate: '380deg' }] },
} as const;

const pulseRingKeyframes = {
  '0%': { transform: [{ scale: 1 }], opacity: 0.5 },
  '100%': { transform: [{ scale: 1.9 }], opacity: 0 },
} as const;

const popInKeyframes = {
  '0%': { opacity: 0, transform: [{ scale: 0.4 }] },
  '60%': { opacity: 1, transform: [{ scale: 1.08 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
} as const;

const fadeUpKeyframes = {
  '0%': { opacity: 0, transform: [{ translateY: '14px' }] },
  '100%': { opacity: 1, transform: [{ translateY: '0px' }] },
} as const;

const CONFETTI_COLORS = ['#E8B65A', '#3C7A5C', '#FFFFFF', '#C08A3E'];
// Golden-angle spacing (i * 137.5° mod 100) spreads pieces across the
// width without visible clustering, deterministically — no Math.random.
const CONFETTI_PIECES = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 137.5) % 100}%`,
  delay: (i % 7) * 0.16,
  duration: 2.3 + (i % 5) * 0.26,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 5 + (i % 4) * 1.6,
  square: i % 3 !== 0,
}));

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
  sportContent,
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
  sportContent: SportContent;
  rows: SessionParticipant[] | { redacted: true; count: number };
  isOrganizer: boolean;
  isCaptain: boolean;
  callerSide: SessionSide | null;
  organizerId: string;
  myUserId?: string;
  removingId: string | null;
  onRemove: (participantId: string) => void;
}) {
  return (
    <View style={[styles.sideCard, side === 'home' ? styles.sideCardHome : styles.sideCardAway]}>
      <View style={styles.sideHeader}>
        <View style={[styles.sideBadge, side === 'home' ? styles.sideBadgeHome : styles.sideBadgeAway]}>
          <Text style={styles.sideBadgeText}>{side === 'home' ? sportContent.sideInitials.home : sportContent.sideInitials.away}</Text>
        </View>
        <Text style={styles.sideTitle}>{side === 'home' ? sportContent.sideNames.home : sportContent.sideNames.away}</Text>
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

function TicketStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View style={styles.ticketStat}>
      <View style={styles.ticketStatIcon}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.ticketStatLabel}>{label}</Text>
        <Text style={styles.ticketStatValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// The funded outcome — the one moment in this whole flow worth making a
// spectacle of. Fixed dark "floodlit" panel (see the comment above the
// keyframe constants) with a bursting confetti layer, a pulsing checkmark
// badge, and a printed-ticket-style stub for the details, instead of the
// plain label/value grid every other terminal state uses.
function MatchSuccessHero({
  venueName,
  sport,
  startAt,
  location,
  playersJoined,
  amountCollected,
  onViewBookings,
}: {
  venueName: string;
  sport: Sport;
  startAt: string;
  location: string;
  playersJoined: number;
  amountCollected: number;
  onViewBookings: () => void;
}) {
  const when = new Date(startAt).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const sportContent = getSportContent(sport);

  return (
    <View style={styles.successHero}>
      <View style={styles.confettiLayer} pointerEvents="none">
        {CONFETTI_PIECES.map((c, i) => (
          <View
            key={i}
            style={[
              styles.confettiPiece,
              {
                left: c.left,
                width: c.size,
                height: c.size,
                backgroundColor: c.color,
                borderRadius: c.square ? 1.5 : c.size / 2,
                animationKeyframes: confettiFallKeyframes,
                animationDuration: `${c.duration}s`,
                animationDelay: `${c.delay}s`,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'ease-in',
              } as any,
            ]}
          />
        ))}
      </View>

      <View style={styles.successContent}>
        <View style={[styles.successKicker, { animationKeyframes: fadeUpKeyframes, animationDuration: '0.5s', animationDelay: '0.05s', animationFillMode: 'both' } as any]}>
          <View style={styles.successKickerDot} />
          <Text style={styles.successKickerText}>Match confirmed</Text>
        </View>

        <View style={styles.successBadgeWrap}>
          <View
            style={[
              styles.successPulseRing,
              { animationKeyframes: pulseRingKeyframes, animationDuration: '2.2s', animationDelay: '0s', animationIterationCount: 'infinite', animationTimingFunction: 'ease-out' } as any,
            ]}
          />
          <View
            style={[
              styles.successPulseRing,
              { animationKeyframes: pulseRingKeyframes, animationDuration: '2.2s', animationDelay: '1.1s', animationIterationCount: 'infinite', animationTimingFunction: 'ease-out' } as any,
            ]}
          />
          <View style={[styles.successBadge, { animationKeyframes: popInKeyframes, animationDuration: '0.6s', animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', animationFillMode: 'both' } as any]}>
            <CheckIcon size={34} color="#0F1210" />
          </View>
        </View>

        <Text style={[styles.successTitle, { animationKeyframes: fadeUpKeyframes, animationDuration: '0.5s', animationDelay: '0.15s', animationFillMode: 'both' } as any]}>
          Game <Text style={styles.successTitleAccent}>on.</Text>
        </Text>
        <Text style={[styles.successSubtitle, { animationKeyframes: fadeUpKeyframes, animationDuration: '0.5s', animationDelay: '0.22s', animationFillMode: 'both' } as any]}>
          Everyone's paid their share — see you on the {sportContent.venueWord}.
        </Text>

        <View style={[styles.ticket, { animationKeyframes: fadeUpKeyframes, animationDuration: '0.55s', animationDelay: '0.3s', animationFillMode: 'both' } as any]}>
          <View style={styles.ticketStub}>
            <View style={styles.ticketSportBadge}>
              <SportIcon sport={sport} size={24} />
            </View>
            <Text style={styles.ticketKicker}>Venue</Text>
            <Text style={styles.ticketVenue}>{venueName}</Text>
            <Text style={styles.ticketDate}>{when}</Text>
          </View>
          <View style={styles.ticketDivider} />
          <View style={styles.ticketStats}>
            <TicketStat icon={<PinIcon size={14} color="#C08A3E" />} label="Location" value={location} />
            <TicketStat icon={<UsersIcon size={14} color="#C08A3E" />} label="Squad" value={`${playersJoined} players`} />
            <TicketStat icon={<WalletIcon size={14} color="#C08A3E" />} label="Collected" value={`KES ${amountCollected.toLocaleString()}`} />
          </View>
        </View>

        <View style={[styles.successActions, { animationKeyframes: fadeUpKeyframes, animationDuration: '0.5s', animationDelay: '0.42s', animationFillMode: 'both' } as any]}>
          <Pressable style={styles.successBtn} onPress={onViewBookings}>
            <Text style={styles.successBtnText}>View my bookings →</Text>
          </Pressable>
        </View>
      </View>
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

  async function joinOpen(side: SessionSide) {
    if (!id) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await sessionsApi.joinOpen(id, side);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not join this session.');
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

  const {
    session,
    home,
    away,
    is_organizer,
    is_captain,
    my_participant,
    home_join_link,
    away_join_link,
    per_person_share,
    total_target,
    amount_paid_so_far,
    can_join_open,
    home_full,
    away_full,
  } = detail;

  const iHaveInvite = my_participant?.status === 'invited';
  const iCanPayShare = session.phase === 'paying' && my_participant?.status === 'accepted' && !my_participant.paid;
  const urgentCountdown = countdown.secondsLeft <= 120;
  const isTerminal = session.phase === 'funded' || session.phase === 'cancelled';
  const homeCount = isRedacted(home) ? home.count : home.length;
  const awayCount = isRedacted(away) ? away.count : away.length;
  const sportContent = getSportContent(session.venue.sport);

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

      {session.phase === 'funded' ? (
        <MatchSuccessHero
          venueName={session.venue.name}
          sport={session.venue.sport as Sport}
          startAt={session.start_at}
          location={session.venue.location}
          playersJoined={homeCount + awayCount}
          amountCollected={amount_paid_so_far}
          onViewBookings={() => router.push('/player/bookings')}
        />
      ) : isTerminal ? (
        <View style={styles.terminalHero}>
          <View style={[styles.heroIconRing, styles.heroIconRingMuted]}>
            <Text style={styles.heroIconBig}>✕</Text>
          </View>
          <Text style={styles.heroTitle}>Session cancelled</Text>
          <Text style={styles.heroBody}>This session didn't get fully funded in time and was cancelled.</Text>

          <View style={styles.heroReasonBox}>
            <Text style={styles.heroReasonLabel}>Why</Text>
            <Text style={styles.heroReasonText}>{session.cancellation_reason ?? 'This session was cancelled.'}</Text>
          </View>

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
          </View>

          <View style={styles.heroActions}>
            <Pressable style={styles.btn} onPress={() => router.push(`/player/explore/${session.venue.id}`)}>
              <Text style={styles.btnText}>Book {session.venue.name} again</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnOutline]} onPress={() => router.push('/player/bookings')}>
              <Text style={styles.btnOutlineText}>Back to bookings</Text>
            </Pressable>
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
          {home_join_link && <CopyLinkRow label={`${sportContent.sideNames.home} side`} token={home_join_link} />}
          {away_join_link && (
            <CopyLinkRow
              label={away_join_link === session.away_invite_token && detail.caller_side === 'away' ? 'Your team' : `${sportContent.sideNames.away} captain`}
              token={away_join_link}
            />
          )}
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

      {can_join_open && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This session is open — anyone can join</Text>
          {actionError && <Text style={styles.error}>{actionError}</Text>}
          <View style={styles.inviteRow}>
            <Pressable
              disabled={submitting || home_full}
              onPress={() => joinOpen('home')}
              style={[styles.btn, styles.joinOpenBtn, (submitting || home_full) && styles.btnDisabled]}
            >
              <Text style={styles.btnText}>{home_full ? `${sportContent.sideNames.home} full` : `Join ${sportContent.sideNames.home}`}</Text>
            </Pressable>
            <Pressable
              disabled={submitting || away_full}
              onPress={() => joinOpen('away')}
              style={[styles.btn, styles.btnOutline, styles.joinOpenBtn, (submitting || away_full) && styles.btnDisabled]}
            >
              <Text style={styles.btnOutlineText}>{away_full ? `${sportContent.sideNames.away} full` : `Join ${sportContent.sideNames.away}`}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.rosterGrid}>
        <SideRosterCard
          side="home"
          sportContent={sportContent}
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
          sportContent={sportContent}
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
  joinOpenBtn: { flex: 1, minWidth: 140 },

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

  // Fixed-dark "floodlit stadium" panel — literal colors throughout
  // (never colors.text/colors.bg), since this deliberately ignores the
  // site's light/dark toggle. See the big comment above the icon/keyframe
  // constants for why.
  successHero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
    marginBottom: 18,
    backgroundColor: '#10140F',
    backgroundImage:
      'radial-gradient(60% 50% at 15% 0%, rgba(232,182,90,0.35), transparent 60%), radial-gradient(55% 45% at 85% 0%, rgba(60,122,92,0.30), transparent 60%), linear-gradient(180deg, #171C14 0%, #0E120D 100%)',
  } as any,
  confettiLayer: { position: 'absolute', top: 0, left: 0, right: 0, height: 260, overflow: 'hidden' },
  confettiPiece: { position: 'absolute', top: 0 } as any,
  successContent: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 24, position: 'relative', zIndex: 1 },

  successKicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginBottom: 22,
  },
  successKickerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3C7A5C' },
  successKickerText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.85)' },

  successBadgeWrap: { width: 116, height: 116, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  successPulseRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -55,
    marginLeft: -55,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#E8B65A',
  } as any,
  successBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8B65A',
    boxShadow: '0 0 32px rgba(232,182,90,0.55)',
    zIndex: 2,
  } as any,

  successTitle: { fontFamily: fonts.serif, fontSize: 40, color: '#FFFFFF', marginBottom: 10, letterSpacing: -0.5 },
  successTitleAccent: { color: '#E8B65A' },
  successSubtitle: { fontFamily: fonts.sans, fontSize: 14.5, color: 'rgba(255,255,255,0.72)', textAlign: 'center', lineHeight: 21, marginBottom: 30, maxWidth: 420 },

  ticket: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFBF3',
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 28,
    boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
  } as any,
  ticketStub: { flexBasis: 210, flexGrow: 1, padding: 22, alignItems: 'flex-start' },
  ticketSportBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3E7D2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ticketKicker: { fontFamily: fonts.sansBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, color: '#B08A4E', marginBottom: 3 },
  ticketVenue: { fontFamily: fonts.serifMedium, fontSize: 17, color: '#1E2126', marginBottom: 5 },
  ticketDate: { fontFamily: fonts.sans, fontSize: 13, color: '#6B6152' },
  ticketDivider: { width: 0, borderLeftWidth: 1.5, borderStyle: 'dashed', borderLeftColor: 'rgba(30,33,38,0.22)', alignSelf: 'stretch', marginVertical: 18 } as any,
  ticketStats: { flexBasis: 220, flexGrow: 1, padding: 22, gap: 16, justifyContent: 'center' },
  ticketStat: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  ticketStatIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3E7D2', alignItems: 'center', justifyContent: 'center' },
  ticketStatLabel: { fontFamily: fonts.sansBold, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.5, color: '#B08A4E', marginBottom: 2 },
  ticketStatValue: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: '#1E2126' },

  successActions: { flexDirection: 'row', justifyContent: 'center' },
  successBtn: { backgroundColor: '#E8B65A', borderRadius: radius.pill, paddingVertical: 15, paddingHorizontal: 28, boxShadow: '0 8px 24px rgba(232,182,90,0.35)' } as any,
  successBtnText: { fontFamily: fonts.sansBold, fontSize: 14.5, color: '#1E2126' },

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
