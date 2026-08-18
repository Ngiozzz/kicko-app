import { apiFetch } from '@kicko/shared';

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export const notificationsApi = {
  list: () => apiFetch<{ notifications: Notification[] }>('/api/notifications'),
  markRead: (id: string) => apiFetch<null>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiFetch<null>('/api/notifications/read-all', { method: 'PATCH' }),
};
