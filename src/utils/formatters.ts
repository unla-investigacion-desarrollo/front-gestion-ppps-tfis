/**
 * Utilidades compartidas de formateo de fechas en español (es-AR).
 */

export function formatShortDate(
  rawDate?: string | Date | null,
  fallback = '-'
): string {
  if (!rawDate) return fallback;
  try {
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return String(rawDate);
    return parsed.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return typeof rawDate === 'string' ? rawDate : fallback;
  }
}

export function formatTwoDigitShortDate(
  rawDate?: string | Date | null,
  fallback = 'No registrada'
): string {
  if (!rawDate) return fallback;
  try {
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return fallback;
    return parsed.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return fallback;
  }
}

export function formatNumericDate(
  rawDate?: string | Date | null,
  fallback = '-'
): string {
  if (!rawDate) return fallback;
  try {
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return fallback;
    return parsed.toLocaleDateString('es-AR');
  } catch {
    return fallback;
  }
}
