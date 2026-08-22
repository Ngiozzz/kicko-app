import { apiFetch } from '@kicko/shared';

export type EmailTemplateKey =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'new_booking'
  | 'payout_paid'
  | 'payout_failed'
  | 'venue_verified'
  | 'venue_suspended'
  | 'new_review'
  | 'game_reminder'
  | 'review_request';

export type EmailTemplate = {
  key: EmailTemplateKey;
  subject: string;
  html: string;
  updated_at: string | null;
  isDefault: boolean;
  vars: string[];
};

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
  booking_confirmed: 'Booking confirmed',
  booking_cancelled: 'Booking cancelled',
  new_booking: 'New booking (owner/manager)',
  payout_paid: 'Payout sent',
  payout_failed: 'Payout failed',
  venue_verified: 'Venue verified',
  venue_suspended: 'Venue suspended',
  new_review: 'New review',
  game_reminder: 'Game reminder (1hr before)',
  review_request: 'Review request (after the game)',
};

export const emailTemplatesApi = {
  list: () => apiFetch<{ templates: EmailTemplate[] }>('/api/admin/email-templates'),
  update: (key: EmailTemplateKey, subject: string, html: string) =>
    apiFetch<{ template: EmailTemplate }>(`/api/admin/email-templates/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ subject, html }),
    }),
  reset: (key: EmailTemplateKey) =>
    apiFetch<{ template: EmailTemplate }>(`/api/admin/email-templates/${key}`, { method: 'DELETE' }),
  // Sends whatever draft is passed (falls back to the saved/default copy
  // server-side if omitted) — lets "send test" work before the admin has
  // saved their edits. `to` defaults server-side to the admin's own
  // account email when omitted.
  sendTest: (key: EmailTemplateKey, draft: { subject: string; html: string }, to?: string) =>
    apiFetch<{ sentTo: string }>(`/api/admin/email-templates/${key}/send-test`, {
      method: 'POST',
      body: JSON.stringify({ ...draft, to }),
    }),
  // Renders unsaved subject/html through the exact same path a real send
  // uses, with sample data filled in — powers the editor's live preview
  // pane, so what's shown always matches what saving/sending would
  // actually produce.
  previewDraft: (key: EmailTemplateKey, subject: string, html: string) =>
    apiFetch<{ subject: string; html: string }>(`/api/admin/email-templates/${key}/preview-draft`, {
      method: 'POST',
      body: JSON.stringify({ subject, html }),
    }),
};
