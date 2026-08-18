import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '@kicko/shared';
import { exploreApi, Venue, VenueBookedSlot } from '../../../src/lib/venuesApi';
import { SportIcon, Sport } from '../../../src/components/SportIcon';
import { NumberField } from '../../../src/components/owner/WebInput';
import { dateOptions, hasOpenSlot } from '../../../src/lib/slots';
import { useClickOutside } from '../../../src/lib/useClickOutside';

type SortKey = 'recommended' | 'price_asc' | 'price_desc';
const SORT_LABEL: Record<SortKey, string> = {
  recommended: 'Recommended',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
};

type Panel = 'price' | 'amenities' | 'date' | 'sort' | null;

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
      <Text style={[styles.filterChev, active && styles.filterChipTextActive]}>▾</Text>
    </Pressable>
  );
}

export default function Explore() {
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState<string>('all');

  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateBooked, setDateBooked] = useState<VenueBookedSlot[] | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('recommended');
  const [openPanel, setOpenPanel] = useState<Panel>(null);

  const dates = useMemo(dateOptions, []);

  const load = useCallback(async () => {
    try {
      const { venues } = await exploreApi.list();
      setVenues(venues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load venues.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!selectedDate) {
      setDateBooked(null);
      return;
    }
    exploreApi
      .availabilityForDate(selectedDate)
      .then(({ booked }) => setDateBooked(booked))
      .catch(() => setDateBooked([]));
  }, [selectedDate]);

  const sports = useMemo(() => Array.from(new Set((venues ?? []).map((v) => v.sport))), [venues]);
  const amenitiesList = useMemo(() => Array.from(new Set((venues ?? []).flatMap((v) => v.amenities))).sort(), [venues]);

  function toggleAmenity(a: string) {
    setSelectedAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  const filtered = useMemo(() => {
    if (!venues) return [];
    const q = query.trim().toLowerCase();
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    return venues.filter((v) => {
      if (sport !== 'all' && v.sport !== sport) return false;
      if (q && !v.name.toLowerCase().includes(q) && !v.location.toLowerCase().includes(q)) return false;
      if (min !== null && v.price_off_peak < min) return false;
      if (max !== null && v.price_off_peak > max) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every((a) => v.amenities.includes(a))) return false;
      if (selectedDate && dateBooked) {
        const booked = dateBooked.filter((b) => b.venue_id === v.id);
        if (!hasOpenSlot(v.opening_time, v.closing_time, selectedDate, booked)) return false;
      }
      return true;
    });
  }, [venues, query, sport, priceMin, priceMax, selectedAmenities, selectedDate, dateBooked]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === 'price_asc') list.sort((a, b) => a.price_off_peak - b.price_off_peak);
    if (sortBy === 'price_desc') list.sort((a, b) => b.price_off_peak - a.price_off_peak);
    return list;
  }, [filtered, sortBy]);

  function togglePanel(p: Panel) {
    setOpenPanel((cur) => (cur === p ? null : p));
  }

  const closePanel = useCallback(() => setOpenPanel(null), []);
  const priceRef = useClickOutside<HTMLDivElement>(openPanel === 'price', closePanel);
  const amenitiesRef = useClickOutside<HTMLDivElement>(openPanel === 'amenities', closePanel);
  const dateRef = useClickOutside<HTMLDivElement>(openPanel === 'date', closePanel);
  const sortRef = useClickOutside<HTMLDivElement>(openPanel === 'sort', closePanel);

  const priceActive = priceMin !== '' || priceMax !== '';
  const dateLabel = selectedDate ? dates.find((d) => d.date === selectedDate)?.label ?? 'Date' : 'Date & time';

  return (
    <View>
      <View style={styles.welcome}>
        <Text style={styles.title}>Find your next game</Text>
        <Text style={styles.subtitle}>{venues === null ? 'Loading venues…' : `${venues.length} venue${venues.length === 1 ? '' : 's'} on Kicko right now.`}</Text>
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.searchBox}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder='Search by area, e.g. "Kilimani"'
            placeholderTextColor={colors.textSoft}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filterWrap} ref={priceRef as any}>
          <FilterChip label={priceActive ? `KES ${priceMin || '0'}–${priceMax || '∞'}` : 'Price'} active={priceActive} onPress={() => togglePanel('price')} />
          {openPanel === 'price' && (
            <View style={styles.panel}>
              <View style={styles.panelRow}>
                <View style={styles.panelHalf}>
                  <NumberField label="Min KES/hr" placeholder="0" value={priceMin} onChangeText={setPriceMin} />
                </View>
                <View style={styles.panelHalf}>
                  <NumberField label="Max KES/hr" placeholder="Any" value={priceMax} onChangeText={setPriceMax} />
                </View>
              </View>
              <View style={styles.panelFoot}>
                <Pressable
                  onPress={() => {
                    setPriceMin('');
                    setPriceMax('');
                  }}
                >
                  <Text style={styles.panelClear}>Clear</Text>
                </Pressable>
                <Pressable onPress={() => setOpenPanel(null)} style={styles.panelDoneBtn}>
                  <Text style={styles.panelDoneText}>Done</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.filterWrap} ref={amenitiesRef as any}>
          <FilterChip
            label={selectedAmenities.length > 0 ? `${selectedAmenities.length} amenit${selectedAmenities.length === 1 ? 'y' : 'ies'}` : 'Amenities'}
            active={selectedAmenities.length > 0}
            onPress={() => togglePanel('amenities')}
          />
          {openPanel === 'amenities' && (
            <View style={styles.panel}>
              {amenitiesList.length === 0 ? (
                <Text style={styles.panelEmpty}>No amenities listed yet.</Text>
              ) : (
                <View style={styles.amenityList}>
                  {amenitiesList.map((a) => {
                    const active = selectedAmenities.includes(a);
                    return (
                      <Pressable key={a} onPress={() => toggleAmenity(a)} style={styles.amenityRow}>
                        <View style={[styles.checkbox, active && styles.checkboxActive]}>{active && <Text style={styles.checkmark}>✓</Text>}</View>
                        <Text style={styles.amenityText}>{a}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              <View style={styles.panelFoot}>
                <Pressable onPress={() => setSelectedAmenities([])}>
                  <Text style={styles.panelClear}>Clear</Text>
                </Pressable>
                <Pressable onPress={() => setOpenPanel(null)} style={styles.panelDoneBtn}>
                  <Text style={styles.panelDoneText}>Done</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.filterWrap} ref={dateRef as any}>
          <FilterChip label={dateLabel} active={Boolean(selectedDate)} onPress={() => togglePanel('date')} />
          {openPanel === 'date' && (
            <View style={styles.panel}>
              <View style={styles.dateGrid}>
                {dates.map((d) => {
                  const active = selectedDate === d.date;
                  return (
                    <Pressable key={d.date} onPress={() => setSelectedDate(active ? null : d.date)} style={[styles.dateOption, active && styles.dateOptionActive]}>
                      <Text style={[styles.dateOptionText, active && styles.dateOptionTextActive]}>{d.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.panelNote}>Shows venues with at least one open hour that day.</Text>
              <View style={styles.panelFoot}>
                <Pressable onPress={() => setSelectedDate(null)}>
                  <Text style={styles.panelClear}>Clear</Text>
                </Pressable>
                <Pressable onPress={() => setOpenPanel(null)} style={styles.panelDoneBtn}>
                  <Text style={styles.panelDoneText}>Done</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.sportTabs}>
        <Pressable onPress={() => setSport('all')} style={[styles.sportTabRow, sport === 'all' && styles.sportTabRowActive]}>
          <Text style={[styles.sportTab, sport === 'all' && styles.sportTabActive]}>All</Text>
        </Pressable>
        {sports.map((s) => (
          <Pressable key={s} onPress={() => setSport(s)} style={[styles.sportTabRow, sport === s && styles.sportTabRowActive]}>
            <SportIcon sport={s as Sport} size={19} />
            <Text style={[styles.sportTab, sport === s && styles.sportTabActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {venues === null ? '—' : `Showing ${sorted.length} of ${venues.length}`}
        </Text>
        <View style={styles.filterWrap} ref={sortRef as any}>
          <Pressable onPress={() => togglePanel('sort')}>
            <Text style={styles.sortText}>Sort: {SORT_LABEL[sortBy]} ▾</Text>
          </Pressable>
          {openPanel === 'sort' && (
            <View style={[styles.panel, styles.sortPanel]}>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
                <Pressable
                  key={key}
                  onPress={() => {
                    setSortBy(key);
                    setOpenPanel(null);
                  }}
                  style={styles.sortOption}
                >
                  <Text style={[styles.sortOptionText, sortBy === key && styles.sortOptionTextActive]}>{SORT_LABEL[key]}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      {venues === null && !error && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {venues && sorted.length === 0 && <Text style={styles.emptyText}>No venues match your search.</Text>}

      <View style={styles.grid}>
        {sorted.map((venue) => (
          <Link key={venue.id} href={`/player/explore/${venue.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.thumb}>
                {venue.photos[0] && <Image source={{ uri: venue.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                {venue.amenities[0] && (
                  <View style={styles.thumbBadge}>
                    <Text style={styles.thumbBadgeText}>{venue.amenities[0]}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle}>{venue.name}</Text>
              <View style={styles.cardMeta}>
                <SportIcon sport={venue.sport as Sport} size={13} />
                <Text style={styles.cardMetaText}>
                  {venue.sport} · {venue.location}
                </Text>
              </View>
              <Text style={styles.cardPrice}>From KES {venue.price_off_peak.toLocaleString()}/hr</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: { marginBottom: 22 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft },

  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', marginBottom: 6, zIndex: 5 },
  searchBox: { flexGrow: 1, minWidth: 200, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 20 },
  searchInput: { fontFamily: fonts.sans, fontSize: 13, color: colors.text, paddingVertical: 12, outlineStyle: 'none' } as any,

  filterWrap: { position: 'relative' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  filterChipActive: { backgroundColor: colors.accentSoft, borderColor: 'transparent' },
  filterChipText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.text },
  filterChipTextActive: { color: colors.accent },
  filterChev: { fontSize: 10, color: colors.textSoft },

  panel: {
    position: 'absolute',
    top: 48,
    left: 0,
    minWidth: 260,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    zIndex: 40,
    boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
  } as any,
  panelRow: { flexDirection: 'row', gap: 12 },
  panelHalf: { flex: 1 },
  panelFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  panelClear: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textSoft },
  panelDoneBtn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 16 },
  panelDoneText: { fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.accentText },
  panelEmpty: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, marginBottom: 8 },
  panelNote: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textSoft, marginTop: 10, marginBottom: 4 },

  amenityList: { gap: 4, maxHeight: 220 },
  amenityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.accentText, fontSize: 12, fontFamily: fonts.sansBold },
  amenityText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text },

  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, maxWidth: 320 },
  dateOption: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  dateOptionActive: { backgroundColor: colors.accent, borderColor: 'transparent' },
  dateOptionText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textSoft },
  dateOptionTextActive: { color: colors.accentText },

  sportTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 22, borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 20, marginBottom: 16, paddingBottom: 2 },
  // Padding and the active underline live on the row, not the Text — an
  // icon+label pair only centers correctly via alignItems when neither
  // child carries its own asymmetric padding.
  sportTabRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  sportTabRowActive: { borderBottomColor: colors.accent },
  sportTab: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft, textTransform: 'capitalize' },
  sportTabActive: { color: colors.text, fontFamily: fonts.sansSemiBold },

  resultsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, zIndex: 3 },
  resultsText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },
  sortText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },
  sortPanel: { top: 26, right: 0, left: 'auto', minWidth: 200 },
  sortOption: { paddingVertical: 9 },
  sortOptionText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },
  sortOptionTextActive: { fontFamily: fonts.sansSemiBold, color: colors.accent },

  loading: { paddingVertical: 40, alignItems: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 16 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSoft, paddingVertical: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 22 },
  card: { flexGrow: 1, flexBasis: 260, maxWidth: 340, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  thumb: { height: 140, backgroundImage: `linear-gradient(135deg, ${colors.accent}, transparent)` } as any,
  thumbBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(30,33,38,0.55)', borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  thumbBadgeText: { fontFamily: fonts.sansBold, fontSize: 10.5, color: '#fff' },
  cardTitle: { fontFamily: fonts.serifMedium, fontSize: 16, color: colors.text, marginTop: 14, marginHorizontal: 16 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginHorizontal: 16 },
  cardMetaText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSoft, textTransform: 'capitalize' },
  cardPrice: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accent, marginTop: 12, marginHorizontal: 16, marginBottom: 16 },
});
