import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { sessionsApi, OpenSessionSummary } from '../../../src/lib/sessionsApi';
import { bookingsApi, OpenBookingSummary } from '../../../src/lib/bookingsApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';

function RowThumb({ photo, sport }: { photo: string | null; sport: string }) {
  return (
    <View style={styles.thumb}>
      {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <View style={styles.thumbGradient} />}
      <View style={styles.thumbSportBadge}>
        <SportIcon sport={sport as Sport} size={12} />
      </View>
    </View>
  );
}

type Row = {
  key: string;
  href: string;
  sport: string;
  photo: string | null;
  venueName: string;
  location: string;
  startAt: string;
  kindLabel: string;
  detail: string;
};

// Squad sports (match_sessions) recruit an open-ended headcount, so there's
// no fixed "spots left" to show — just how many have joined so far. Pair
// sports (split bookings) have a hard-capped size, so "N spots left" is
// meaningful there instead.
function sessionRow(o: OpenSessionSummary): Row {
  const totalIn = o.home_count + o.away_count;
  return {
    key: `session-${o.session.id}`,
    href: `/player/sessions/${o.session.id}`,
    sport: o.session.venue.sport,
    photo: o.session.venue.photos[0] ?? null,
    venueName: o.session.venue.name,
    location: o.session.venue.location,
    startAt: o.session.start_at,
    kindLabel: 'Open session',
    detail: `${totalIn} player${totalIn === 1 ? '' : 's'} joined so far · KES ${o.session.total_cost.toLocaleString()} total`,
  };
}

function bookingRow(o: OpenBookingSummary): Row {
  const format = o.total_players === 2 ? 'Singles' : 'Doubles';
  const perPerson = Math.round(o.booking.total_amount / o.total_players);
  return {
    key: `split-${o.booking.id}`,
    href: `/player/bookings/${o.booking.id}`,
    sport: o.booking.venue.sport,
    photo: o.booking.venue.photos[0] ?? null,
    venueName: o.booking.venue.name,
    location: o.booking.venue.location,
    startAt: o.booking.start_at,
    kindLabel: `Open ${format.toLowerCase()}`,
    detail: `${o.open_slots} spot${o.open_slots === 1 ? '' : 's'} left · KES ${perPerson.toLocaleString()} each`,
  };
}

export default function OpenSessions() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [{ sessions }, { bookings }] = await Promise.all([sessionsApi.open(), bookingsApi.open()]);
      const merged = [...sessions.map(sessionRow), ...bookings.map(bookingRow)].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
      setRows(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load open games.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Open Sessions</Text>
          <Text style={styles.subtitle}>Games and bookings other players have opened up — join directly, no invite needed.</Text>
        </View>
      </View>

      {rows === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {rows && rows.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <Text style={styles.emptyIcon}>🌐</Text>
          </View>
          <Text style={styles.emptyTitle}>No open games right now</Text>
          <Text style={styles.emptyBody}>
            When someone marks a match session or split booking "open," it'll show up here for anyone to join. Start your own from Explore.
          </Text>
          <Pressable style={styles.emptyCta} onPress={() => router.push('/player/explore')}>
            <Text style={styles.emptyCtaText}>Explore venues →</Text>
          </Pressable>
        </View>
      )}

      {rows?.map((r) => (
        <Link key={r.key} href={r.href as any} asChild>
          <Pressable style={styles.row}>
            <View style={styles.rowInfo}>
              <RowThumb photo={r.photo} sport={r.sport} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.rowTitleLine}>
                  <Text style={styles.rowTitle}>{r.venueName}</Text>
                  <Text style={styles.kindTag}>{r.kindLabel}</Text>
                </View>
                <Text style={styles.rowMeta}>
                  {new Date(r.startAt).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  {' · '}
                  {r.location}
                </Text>
                <Text style={styles.rowDetail}>{r.detail}</Text>
              </View>
            </View>
            <Text style={styles.joinLink}>Join →</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { marginBottom: 24 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, maxWidth: 560, lineHeight: 20 },

  loading: { paddingVertical: 60, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 12 },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 24 },
  emptyTitle: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text, marginBottom: 8 },
  emptyBody: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, textAlign: 'center', maxWidth: 420, lineHeight: 19, marginBottom: 18 },
  emptyCta: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 11, paddingHorizontal: 20 },
  emptyCtaText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentText },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  rowInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  thumb: { width: 52, height: 52, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface2 },
  thumbGradient: { flex: 1, backgroundColor: colors.accentSoft },
  thumbSportBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.text },
  kindTag: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    color: colors.accent,
    overflow: 'hidden',
  },
  rowMeta: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, marginTop: 3 },
  rowDetail: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.text, marginTop: 3 },
  joinLink: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accent },
});
