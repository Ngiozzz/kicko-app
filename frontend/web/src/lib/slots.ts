import { BookedSlot } from './venuesApi';

export function dateOptions(): { date: string; label: string }[] {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' });
    out.push({ date, label });
  }
  return out;
}

export function hourSlots(openingTime: string, closingTime: string): number[] {
  const startHour = Number(openingTime.slice(0, 2));
  const endHour = Number(closingTime.slice(0, 2));
  const hours: number[] = [];
  for (let h = startHour; h < endHour; h++) hours.push(h);
  return hours;
}

export function slotRange(date: string, hour: number) {
  const start = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

export function overlaps(start: Date, end: Date, booked: BookedSlot[]) {
  return booked.some((b) => start < new Date(b.end_at) && end > new Date(b.start_at));
}

/** Whether a venue has at least one bookable (not taken, not past) hour slot on the given date. */
export function hasOpenSlot(openingTime: string, closingTime: string, date: string, booked: BookedSlot[]): boolean {
  const now = Date.now();
  return hourSlots(openingTime, closingTime).some((hour) => {
    const { start, end } = slotRange(date, hour);
    return start.getTime() >= now && !overlaps(start, end, booked);
  });
}
