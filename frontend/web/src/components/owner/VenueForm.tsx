import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@kicko/shared';
import { Button, Field } from '../ui';
import { SportIcon, Sport } from '../SportIcon';
import { VenueInput } from '../../lib/venuesApi';
import { VenuePhotoGallery } from './VenuePhotoGallery';
import { NumberField, TimeField } from './WebInput';

const SPORTS: { sport: Sport; label: string }[] = [
  { sport: 'football', label: 'Football' },
  { sport: 'basketball', label: 'Basketball' },
  { sport: 'tennis', label: 'Tennis' },
  { sport: 'padel', label: 'Padel' },
  { sport: 'volleyball', label: 'Volleyball' },
];

const AMENITIES = [
  'Floodlit',
  'Parking',
  'Changing rooms',
  'Water refill',
  'Artificial turf',
  'Seating',
  'Showers',
  'Equipment rental',
  'WiFi',
  'First aid kit',
  'Scoreboard',
  'Kiosk / snacks',
];

export type VenueFormValue = {
  name: string;
  location: string;
  sport: Sport | null;
  pricePeak: string;
  priceOffPeak: string;
  openingTime: string;
  closingTime: string;
  amenities: string[];
  photos: string[];
};

const EMPTY: VenueFormValue = {
  name: '',
  location: '',
  sport: null,
  pricePeak: '',
  priceOffPeak: '',
  openingTime: '06:00',
  closingTime: '22:00',
  amenities: [],
  photos: [],
};

export function venueInputFromForm(form: VenueFormValue): VenueInput | null {
  const pricePeak = Number(form.pricePeak);
  const priceOffPeak = Number(form.priceOffPeak);
  if (
    !form.name.trim() ||
    !form.location.trim() ||
    !form.sport ||
    !pricePeak ||
    pricePeak <= 0 ||
    !priceOffPeak ||
    priceOffPeak <= 0 ||
    !form.openingTime ||
    !form.closingTime
  ) {
    return null;
  }
  return {
    name: form.name.trim(),
    location: form.location.trim(),
    sport: form.sport,
    price_peak: pricePeak,
    price_off_peak: priceOffPeak,
    opening_time: form.openingTime,
    closing_time: form.closingTime,
    amenities: form.amenities,
    photos: form.photos,
  };
}

export function VenueForm({
  ownerId,
  initial,
  onSubmit,
  onChange,
  submitLabel,
  loading,
  error,
}: {
  ownerId: string;
  initial?: Partial<VenueFormValue>;
  onSubmit: (form: VenueFormValue) => void;
  onChange?: (form: VenueFormValue) => void;
  submitLabel: string;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<VenueFormValue>({ ...EMPTY, ...initial });

  useEffect(() => {
    onChange?.(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  function toggleAmenity(value: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(value) ? f.amenities.filter((a) => a !== value) : [...f.amenities, value],
    }));
  }

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={styles.label}>Photos</Text>
        <VenuePhotoGallery ownerId={ownerId} photos={form.photos} onChange={(photos) => setForm((f) => ({ ...f, photos }))} />
      </View>

      <Field label="Venue name" placeholder="Parklands Turf" value={form.name} onChangeText={(name) => setForm((f) => ({ ...f, name }))} />
      <Field
        label="Location"
        placeholder="Parklands, Nairobi"
        value={form.location}
        onChangeText={(location) => setForm((f) => ({ ...f, location }))}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Sport</Text>
        <View style={styles.sportRow}>
          {SPORTS.map(({ sport, label }) => {
            const active = form.sport === sport;
            return (
              <Pressable key={sport} onPress={() => setForm((f) => ({ ...f, sport }))} style={[styles.sportChip, active && styles.sportChipActive]}>
                <SportIcon sport={sport} size={20} />
                <Text style={[styles.sportChipText, active && styles.sportChipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldRow}>
        <View style={styles.fieldRowItem}>
          <NumberField
            label="Peak rate (KES/hr)"
            placeholder="2000"
            value={form.pricePeak}
            onChangeText={(pricePeak) => setForm((f) => ({ ...f, pricePeak }))}
          />
        </View>
        <View style={styles.fieldRowItem}>
          <NumberField
            label="Off-peak rate (KES/hr)"
            placeholder="1600"
            value={form.priceOffPeak}
            onChangeText={(priceOffPeak) => setForm((f) => ({ ...f, priceOffPeak }))}
          />
        </View>
      </View>

      <View style={styles.fieldRow}>
        <View style={styles.fieldRowItem}>
          <TimeField
            label="Opening time"
            value={form.openingTime}
            onChangeText={(openingTime) => setForm((f) => ({ ...f, openingTime }))}
          />
        </View>
        <View style={styles.fieldRowItem}>
          <TimeField
            label="Closing time"
            value={form.closingTime}
            onChangeText={(closingTime) => setForm((f) => ({ ...f, closingTime }))}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Amenities</Text>
        <View style={styles.amenityGrid}>
          {AMENITIES.map((a) => {
            const checked = form.amenities.includes(a);
            return (
              <Pressable key={a} onPress={() => toggleAmenity(a)} style={styles.amenityRow}>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.amenityLabel}>{a}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title={loading ? 'Saving…' : submitLabel} onPress={() => onSubmit(form)} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { maxWidth: 440 },
  field: { marginBottom: 16 },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sportChipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  sportChipText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textSoft },
  sportChipTextActive: { color: colors.accent, fontFamily: fonts.sansSemiBold },

  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldRowItem: { flex: 1 },

  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '47%',
    paddingVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkboxMark: { color: colors.accentText, fontSize: 12, fontFamily: fonts.sansBold, lineHeight: 13 },
  amenityLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.text },

  error: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.danger, marginBottom: 4, lineHeight: 18 },
});
