// First clipboard precedent in this app — a thin wrapper so callers can
// flip a "Copy" button to "Copied!" for a moment without duplicating the
// browser API call everywhere an invite link needs a copy button.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
