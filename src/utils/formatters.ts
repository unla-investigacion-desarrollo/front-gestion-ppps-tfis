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

export function formatPPPStatus(
  status?: string | null,
  fallback = 'Estado no disponible'
): string {
  const labels: Record<string, string> = {
    pending_application: 'Pendiente de postulación',
    application_rejected: 'Postulación rechazada',
    pending_documentation: 'Documentación pendiente',
    in_review: 'En revisión',
    observed: 'Observada',
    approved: 'Aprobada',
    disapproved: 'Desaprobada',
    dropped_out: 'Abandonada',
  };

  const normalized = String(status || '').trim().toLowerCase();
  return labels[normalized] || fallback;
}

export function formatTFIStatus(
  status?: string | null,
  fallback = 'Estado no disponible'
): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    pendiente: 'Pendiente',
    in_progress: 'En curso',
    en_curso: 'En curso',
    active: 'En curso',
    curso: 'En curso',
    finalized: 'Finalizado',
    finalizado: 'Finalizado',
    cancelled: 'Cancelado',
    canceled: 'Cancelado',
    cancelado: 'Cancelado',
  };

  const normalized = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return labels[normalized] || fallback;
}
