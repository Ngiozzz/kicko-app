export type LogLevel = "info" | "warn" | "error";

export type LogEntry = {
  id: string;
  level: LogLevel;
  message: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  detail?: string;
  timestamp: string;
};

// In-memory ring buffer — resets on every restart/redeploy, which is fine
// for "what just went wrong" triage but not a durable log store. Render's
// free/starter plans run a single instance, so one buffer per process is
// enough to cover everything the admin panel needs to show.
const MAX_ENTRIES = 500;
const buffer: LogEntry[] = [];
let seq = 0;

export function addLog(entry: Omit<LogEntry, "id" | "timestamp">): void {
  buffer.push({ ...entry, id: String(++seq), timestamp: new Date().toISOString() });
  if (buffer.length > MAX_ENTRIES) buffer.shift();
}

/** Newest first. */
export function getLogs({ level, limit = 200 }: { level?: LogLevel; limit?: number } = {}): LogEntry[] {
  const filtered = level ? buffer.filter((l) => l.level === level) : buffer;
  return filtered.slice(-limit).reverse();
}
