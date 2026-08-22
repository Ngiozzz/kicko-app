export type DeviceType = "mobile" | "tablet" | "desktop" | "other";

/** Coarse, dependency-free User-Agent sniffing — good enough for a rough "what device do people use" breakdown, not meant to be exhaustive. */
export function parseDevice(userAgent: string | undefined): { deviceType: DeviceType; browser: string } {
  const ua = userAgent ?? "";
  if (!ua) return { deviceType: "other", browser: "Unknown" };

  const isTablet = /iPad|Tablet|Nexus 7|Nexus 10|SM-T/i.test(ua);
  const isMobile = !isTablet && /Mobi|Android|iPhone|iPod/i.test(ua);
  const deviceType: DeviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let browser = "Other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";

  return { deviceType, browser };
}
