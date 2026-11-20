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

/**
 * Resuelve el nombre visible de un usuario o integrante de proyecto
 * a partir de un ID o de un descriptor de objeto anidado (student/professor/user).
 */
export function resolveMemberDisplayName(
  member: any,
  users: any[] = [],
  emptyFallback = ''
): string {
  if (!member) return emptyFallback;

  let lookupId: string | number = member;
  if (typeof member === 'object') {
    const userObj =
      member.student?.user ||
      member.professor?.user ||
      member.user ||
      member.student ||
      member.professor ||
      member;
    const firstName = userObj.firstName || userObj.nombre || '';
    const lastName = userObj.lastName || userObj.apellido || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    if (userObj.name) return userObj.name;
    if (userObj.email) return userObj.email;

    const rawId = String(userObj.id || userObj.id_user || member.id || member.id_user || '');
    if (!rawId) return emptyFallback;
    lookupId = rawId;
  }

  const idStr = String(lookupId);
  const userFound = users.find(
    (u) => String(u.id) === idStr || String(u.id_user) === idStr
  );
  if (userFound) {
    return (
      [userFound.nombre || userFound.firstName, userFound.apellido || userFound.lastName]
        .filter(Boolean)
        .join(' ') ||
      userFound.email ||
      `Usuario #${idStr}`
    );
  }
  return `Usuario #${idStr}`;
}
