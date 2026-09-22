import { ProjectItem } from './types';

/**
 * Resuelve el nombre visible (nombre, apellido o correo) de un usuario miembro.
 */
export const resolveUserName = (memberItem: any, userList: any[] = []): string => {
  if (!memberItem) return '';

  if (typeof memberItem === 'object') {
    const userObject =
      memberItem.student?.user ||
      memberItem.professor?.user ||
      memberItem.user ||
      memberItem.student ||
      memberItem.professor ||
      memberItem;

    const firstName = userObject.firstName || userObject.nombre || '';
    const lastName = userObject.lastName || userObject.apellido || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    if (userObject.name) return userObject.name;
    if (userObject.email) return userObject.email;

    const rawIdentifier = String(
      userObject.id ||
      userObject.id_user ||
      memberItem.id ||
      memberItem.id_user ||
      ''
    );

    if (rawIdentifier && userList.length > 0) {
      const foundUser = userList.find(
        (targetUser) =>
          String(targetUser.id) === rawIdentifier ||
          String(targetUser.id_user) === rawIdentifier
      );
      if (foundUser) {
        return (
          [foundUser.nombre, foundUser.apellido].filter(Boolean).join(' ') ||
          foundUser.email ||
          `Usuario #${rawIdentifier}`
        );
      }
    }
    return rawIdentifier ? `Usuario #${rawIdentifier}` : '';
  }

  const identifierString = String(memberItem);
  if (userList.length > 0) {
    const foundUser = userList.find(
      (targetUser) =>
        String(targetUser.id) === identifierString ||
        String(targetUser.id_user) === identifierString
    );
    if (foundUser) {
      return (
        [foundUser.nombre, foundUser.apellido].filter(Boolean).join(' ') ||
        foundUser.email
      );
    }
  }

  return `Usuario #${identifierString}`;
};

/**
 * Obtiene la lista de nombres de docentes tutores asignados al proyecto.
 */
export const getProjectTeachers = (
  projectItem: ProjectItem,
  userList: any[] = []
): string[] => {
  const teacherList: string[] = [];
  const seenNames = new Set<string>();

  if (
    Array.isArray(projectItem.activeProfessors) &&
    projectItem.activeProfessors.length > 0
  ) {
    projectItem.activeProfessors.forEach((activeProfessorRecord) => {
      if (activeProfessorRecord && activeProfessorRecord.active !== false) {
        const resolvedName = resolveUserName(activeProfessorRecord, userList);
        if (resolvedName && !seenNames.has(resolvedName)) {
          seenNames.add(resolvedName);
          teacherList.push(resolvedName);
        }
      }
    });
  }

  const mainTeacher =
    projectItem.teacher || projectItem.tutor || projectItem.teacherId;
  if (mainTeacher) {
    const resolvedName = resolveUserName(mainTeacher, userList);
    if (resolvedName && !seenNames.has(resolvedName)) {
      seenNames.add(resolvedName);
      teacherList.push(resolvedName);
    }
  }

  return teacherList;
};

/**
 * Obtiene la lista de nombres de estudiantes asignados al proyecto.
 */
export const getProjectStudents = (
  projectItem: ProjectItem,
  userList: any[] = []
): string[] => {
  const studentList: string[] = [];
  const seenNames = new Set<string>();

  if (
    Array.isArray(projectItem.activeStudents) &&
    projectItem.activeStudents.length > 0
  ) {
    projectItem.activeStudents.forEach((activeStudentRecord) => {
      if (activeStudentRecord && activeStudentRecord.active !== false) {
        const resolvedName = resolveUserName(activeStudentRecord, userList);
        if (resolvedName && !seenNames.has(resolvedName)) {
          seenNames.add(resolvedName);
          studentList.push(resolvedName);
        }
      }
    });
  }

  if (Array.isArray(projectItem.students) && projectItem.students.length > 0) {
    projectItem.students.forEach((studentMember) => {
      const resolvedName = resolveUserName(studentMember, userList);
      if (resolvedName && !seenNames.has(resolvedName)) {
        seenNames.add(resolvedName);
        studentList.push(resolvedName);
      }
    });
  }

  return studentList;
};

/**
 * Formatea una fecha ISO a formato local legible en español (es-AR).
 */
export const formatCreationDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return dateString;
    return parsedDate.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};
