/**
 * Utilidades compartidas para nombres e iniciales de usuarios.
 */

/**
 * Extrae iniciales a partir de un nombre completo (ej: "Juan Perez" -> "JP").
 */
export function getInitialsFromName(name?: string, fallback = 'U'): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

/**
 * Extrae iniciales a partir de nombre, apellido o email.
 */
export function getUserInitials(
  nombre?: string,
  apellido?: string,
  email?: string,
  fallback = 'US'
): string {
  const first = (nombre || '').trim();
  const last = (apellido || '').trim();
  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
  if (first) return first.substring(0, 2).toUpperCase();
  if (email && email.trim()) return email.trim().substring(0, 2).toUpperCase();
  return fallback;
}
