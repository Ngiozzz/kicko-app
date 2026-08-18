import { useEffect, useState } from 'react';
import { settingsApi, PlatformSettings, ServiceFeeTier, RefundTier } from './settingsApi';

// Shared by every /admin-dashboard/settings/* page that edits
// platform_settings (fees, refunds, match windows) — each page mounts its
// own copy (fetches independently, same as every other admin sub-page), but
// all of them PATCH the FULL settings object on save since the backend has
// a single settings row, not a per-page one.
export type PlatformFormState = {
  settings: PlatformSettings | null;
  feeTiers: ServiceFeeTier[];
  setFeeTiers: React.Dispatch<React.SetStateAction<ServiceFeeTier[]>>;
  refundTiers: RefundTier[];
  setRefundTiers: React.Dispatch<React.SetStateAction<RefundTier[]>>;
  walkInPct: string;
  setWalkInPct: (v: string) => void;
  joinMin: string;
  setJoinMin: (v: string) => void;
  payMin: string;
  setPayMin: (v: string) => void;
  graceMin: string;
  setGraceMin: (v: string) => void;
  maxPerSide: string;
  setMaxPerSide: (v: string) => void;
  saving: boolean;
  saved: boolean;
  error: string | null;
  handleSave: () => void;
};

export function usePlatformSettings(): PlatformFormState {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [feeTiers, setFeeTiers] = useState<ServiceFeeTier[]>([]);
  const [refundTiers, setRefundTiers] = useState<RefundTier[]>([]);
  const [walkInPct, setWalkInPct] = useState('');
  const [joinMin, setJoinMin] = useState('');
  const [payMin, setPayMin] = useState('');
  const [graceMin, setGraceMin] = useState('');
  const [maxPerSide, setMaxPerSide] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsApi
      .get()
      .then(({ settings }) => {
        setSettings(settings);
        setFeeTiers(settings.service_fee_tiers);
        setRefundTiers(settings.refund_tiers);
        setWalkInPct(String(settings.walk_in_refund_pct));
        setJoinMin(String(settings.session_join_window_minutes));
        setPayMin(String(settings.session_pay_window_minutes));
        setGraceMin(String(settings.session_decision_grace_minutes));
        setMaxPerSide(String(settings.session_max_per_side));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load platform settings.'));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { settings: updated } = await settingsApi.update({
        service_fee_tiers: feeTiers,
        refund_tiers: refundTiers,
        walk_in_refund_pct: Number(walkInPct),
        session_join_window_minutes: Number(joinMin),
        session_pay_window_minutes: Number(payMin),
        session_decision_grace_minutes: Number(graceMin),
        session_max_per_side: Number(maxPerSide),
      });
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save platform settings.');
    } finally {
      setSaving(false);
    }
  }

  return {
    settings,
    feeTiers,
    setFeeTiers,
    refundTiers,
    setRefundTiers,
    walkInPct,
    setWalkInPct,
    joinMin,
    setJoinMin,
    payMin,
    setPayMin,
    graceMin,
    setGraceMin,
    maxPerSide,
    setMaxPerSide,
    saving,
    saved,
    error,
    handleSave,
  };
}
