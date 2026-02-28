/**
 * Run in browser console on project Overview page to verify progress bar fill vs track width.
 * Paste this whole script or call: checkProgressBars()
 */
function checkProgressBars() {
  const bars = document.querySelectorAll('[role="progressbar"]');
  const trackSelector = '.progress-bar__track';
  const results = [];

  bars.forEach((fill, i) => {
    const track = fill.closest('.progress-bar')?.querySelector(trackSelector);
    if (!track) return;

    const fillRect = fill.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const fillWidth = fillRect.width;

    // data-progress-fill-width is the exact % used for width (may be decimal, e.g. 25.3)
    const declaredPct = Number(fill.dataset?.progressFillWidth ?? fill.getAttribute('aria-valuenow') ?? 0);
    const actualPct = trackWidth > 0 ? Math.round((fillWidth / trackWidth) * 1000) / 10 : 0;

    const ok = Math.abs(actualPct - declaredPct) < 0.5;
    results.push({
      index: i + 1,
      declaredPercent: declaredPct,
      actualPercent: actualPct,
      trackWidth: Math.round(trackWidth * 10) / 10,
      fillWidth: Math.round(fillWidth * 10) / 10,
      match: ok ? 'yes' : 'no',
    });
  });

  console.table(results);
  return results;
}

if (typeof window !== 'undefined') {
  window.checkProgressBars = checkProgressBars;
}
