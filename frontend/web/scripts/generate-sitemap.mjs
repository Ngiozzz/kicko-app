// Regenerates public/sitemap.xml from the live public venues API on every
// build, so a newly verified venue shows up in the sitemap on the next
// deploy without anyone having to edit it by hand. Runs before `expo
// export` (see package.json's "build" script) — public/ is copied as-is
// into dist by Expo's web export.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SITE = 'https://kicko-app.co.ke';
const API = process.env.EXPO_PUBLIC_API_URL || 'https://api.kicko-app.co.ke';

// Only genuinely public, indexable pages — auth/dashboard routes are kept
// out of both this and robots.txt since they require sign-in anyway.
const STATIC_PATHS = ['/', '/venues', '/privacy', '/terms'];

async function fetchVerifiedVenueIds() {
  try {
    const res = await fetch(`${API}/api/public/venues`);
    if (!res.ok) {
      console.warn(`generate-sitemap: /api/public/venues returned ${res.status}, continuing with static pages only`);
      return [];
    }
    const data = await res.json();
    return (data.venues ?? []).map((v) => v.id);
  } catch (err) {
    console.warn('generate-sitemap: could not reach the API, continuing with static pages only:', err.message);
    return [];
  }
}

async function main() {
  const venueIds = await fetchVerifiedVenueIds();

  const urls = [...STATIC_PATHS.map((p) => `${SITE}${p}`), ...venueIds.map((id) => `${SITE}/venues/${id}`)];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n') +
    `\n</urlset>\n`;

  const outDir = path.join(process.cwd(), 'public');
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'sitemap.xml'), xml);
  console.log(`generate-sitemap: wrote ${urls.length} URLs (${venueIds.length} venues) to public/sitemap.xml`);
}

main();
