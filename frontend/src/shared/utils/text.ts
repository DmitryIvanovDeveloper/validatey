/**
 * Decodes HTML entities in a string (e.g. &#x2F; → /, &amp; → &).
 * Safe for use in text interpolation (Vue {{ }} escapes the result).
 */
export function decodeHtmlEntities(str: string | null | undefined): string {
  if (str == null || typeof str !== 'string') return '';
  const el = document.createElement('textarea');
  el.innerHTML = str;
  return el.value;
}
