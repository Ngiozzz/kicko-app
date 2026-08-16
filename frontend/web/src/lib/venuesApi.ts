import { apiFetch } from '@kicko/shared';

export type VenueStatus = 'pending' | 'verified' | 'suspended';

export type Venue = {
  id: string;
  owner_id: string;
  name: string;
  location: string;
  sport: string;
  price_peak: number;
  price_off_peak: number;
  opening_time: string;
  closing_time: string;
  amenities: string[];
  status: VenueStatus;
  photos: string[];
  created_at: string;
  updated_at: string;
};

export type VenueInput = {
  name: string;
  location: string;
  sport: string;
  price_peak: number;
  price_off_peak: number;
  opening_time: string;
  closing_time: string;
  amenities: string[];
  photos: string[];
};

export const venuesApi = {
  list: () => apiFetch<{ venues: Venue[] }>('/api/venues'),
  get: (id: string) => apiFetch<{ venue: Venue }>(`/api/venues/${id}`),
  create: (input: VenueInput) =>
    apiFetch<{ venue: Venue }>('/api/venues', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: VenueInput) =>
    apiFetch<{ venue: Venue }>(`/api/venues/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: string) => apiFetch<null>(`/api/venues/${id}`, { method: 'DELETE' }),
};
