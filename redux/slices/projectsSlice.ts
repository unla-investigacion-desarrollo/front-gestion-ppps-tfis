import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Project {
  id: string;
  teacherId: string;
  titulo: string;
  descripcion: string;
  categoria?: string;
  createdAt: string;
  updatedAt: string;
  students: string[]; // student user IDs
  coTeachers?: string[]; // optional list of additional teacher user IDs
}

interface ProjectsState {
  list: Project[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const STORAGE_KEY = 'projects';
const USER_NOTIFICATIONS_KEY = 'userNotifications';
const TRASH_KEY = 'projectsTrash';

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}
function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function loadProjectsTrash(): (Project & { deletedAt: string })[] {
  try {
    const raw = localStorage.getItem(TRASH_KEY);
    return raw ? (JSON.parse(raw) as (Project & { deletedAt: string })[]) : [];
  } catch {
    return [];
  }
}
function saveProjectsTrash(list: (Project & { deletedAt: string })[]) {
  localStorage.setItem(TRASH_KEY, JSON.stringify(list));
}

// Estructura de notificaciones: { [userId: string]: string[] }
function loadUserNotifications(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(USER_NOTIFICATIONS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}
function saveUserNotifications(map: Record<string, string[]>) {
  localStorage.setItem(USER_NOTIFICATIONS_KEY, JSON.stringify(map));
}

const initialState: ProjectsState = {
  list: loadProjects(),
  status: 'idle',
  error: null,
};

export const fetchProjects = createAsyncThunk<Project[]>('projects/fetch', async () => {
  await new Promise((r) => setTimeout(r, 200));
  return loadProjects();
});

export const createProject = createAsyncThunk<
  Project,
  { teacherId: string; titulo: string; descripcion: string; categoria?: string }
>('projects/create', async ({ teacherId, titulo, descripcion, categoria }) => {
  await new Promise((r) => setTimeout(r, 200));
  const projects = loadProjects();
  const now = new Date().toISOString();
  const project: Project = {
    id: crypto.randomUUID(),
    teacherId,
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    categoria,
    createdAt: now,
    updatedAt: now,
    students: [],
    coTeachers: [],
  };
  const updated = [...projects, project];
  saveProjects(updated);
  return project;
});

export const assignStudentToProject = createAsyncThunk<
  Project,
  { projectId: string; studentId: string },
  { rejectValue: string }
>('projects/assignStudent', async ({ projectId, studentId }, { rejectWithValue }) => {
  await new Promise((r) => setTimeout(r, 150));
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return rejectWithValue('Proyecto no encontrado') as any;
  const p = projects[idx];
  if (p.students.includes(studentId)) return rejectWithValue('El alumno ya está asignado a este proyecto') as any;
  if (p.students.length >= 5) return rejectWithValue('El proyecto ya tiene 5 alumnos asignados') as any;
  projects[idx] = { ...p, students: [...p.students, studentId], updatedAt: new Date().toISOString() };
  saveProjects(projects);
  // Guardar notificación persistente para el alumno asignado
  try {
    const notifRaw = localStorage.getItem(USER_NOTIFICATIONS_KEY);
    const notifMap: Record<string, string[]> = notifRaw ? JSON.parse(notifRaw) : {};
    const msg = `Fuiste asignado al proyecto "${projects[idx].titulo}"`;
    const list = Array.isArray(notifMap[studentId]) ? notifMap[studentId] : [];
    notifMap[studentId] = [...list, msg];
    localStorage.setItem(USER_NOTIFICATIONS_KEY, JSON.stringify(notifMap));
  } catch {
    // ignorar errores de almacenamiento
  }
  return projects[idx];
});

export const deleteProject = createAsyncThunk<
  string,
  { projectId: string },
  { rejectValue: string }
>('projects/delete', async ({ projectId }, { rejectWithValue }) => {
  await new Promise((r) => setTimeout(r, 150));
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return rejectWithValue('Proyecto no encontrado') as any;
  const removed = projects[idx];
  const remaining = projects.filter((p) => p.id !== projectId);
  saveProjects(remaining);
  // Move to trash with timestamp
  const trash = loadProjectsTrash();
  trash.push({ ...removed, deletedAt: new Date().toISOString() });
  saveProjectsTrash(trash);
  return projectId;
});

export const addCoTeacher = createAsyncThunk<
  Project,
  { projectId: string; teacherId: string },
  { rejectValue: string }
>('projects/addCoTeacher', async ({ projectId, teacherId }, { rejectWithValue }) => {
  await new Promise((r) => setTimeout(r, 120));
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx === -1) return rejectWithValue('Proyecto no encontrado') as any;
  const p = projects[idx];
  const current = Array.isArray(p.coTeachers) ? p.coTeachers : [];
  if (current.includes(teacherId)) return rejectWithValue('El docente ya está agregado') as any;
  const next = { ...p, coTeachers: [...current, teacherId], updatedAt: new Date().toISOString() } as Project;
  projects[idx] = next;
  saveProjects(projects);
  return next;
});

export const removeCoTeacher = createAsyncThunk<
  Project,
  { projectId: string; teacherId: string },
  { rejectValue: string }
>('projects/removeCoTeacher', async ({ projectId, teacherId }, { rejectWithValue }) => {
  await new Promise((r) => setTimeout(r, 120));
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx === -1) return rejectWithValue('Proyecto no encontrado') as any;
  const p = projects[idx];
  const current = Array.isArray(p.coTeachers) ? p.coTeachers : [];
  const next = { ...p, coTeachers: current.filter(t => t !== teacherId), updatedAt: new Date().toISOString() } as Project;
  projects[idx] = next;
  saveProjects(projects);
  return next;
});

export const restoreProject = createAsyncThunk<
  Project,
  { projectId: string },
  { rejectValue: string }
>('projects/restore', async ({ projectId }, { rejectWithValue }) => {
  await new Promise((r) => setTimeout(r, 150));
  const trash = loadProjectsTrash();
  const idx = trash.findIndex(t => t.id === projectId);
  if (idx === -1) return rejectWithValue('Proyecto no encontrado en Papelera') as any;
  const item = trash[idx];
  const remainingTrash = trash.filter(t => t.id !== projectId);
  saveProjectsTrash(remainingTrash);
  const projects = loadProjects();
  const now = new Date().toISOString();
  const restored: Project = { id: item.id, teacherId: item.teacherId, titulo: item.titulo, descripcion: item.descripcion, categoria: item.categoria, createdAt: item.createdAt, updatedAt: now, students: item.students || [] };
  const updated = [...projects, restored];
  saveProjects(updated);
  return restored;
});

export const purgeProject = createAsyncThunk<
  string,
  { projectId: string },
  { rejectValue: string }
>('projects/purge', async ({ projectId }, { rejectWithValue }) => {
  await new Promise((r) => setTimeout(r, 150));
  const trash = loadProjectsTrash();
  const idx = trash.findIndex(t => t.id === projectId);
  if (idx === -1) return rejectWithValue('Proyecto no encontrado en Papelera') as any;
  const remaining = trash.filter(t => t.id !== projectId);
  saveProjectsTrash(remaining);
  return projectId;
});

export const removeStudentFromProject = createAsyncThunk<
  Project,
  { projectId: string; studentId: string },
  { rejectValue: string }
>('projects/removeStudent', async ({ projectId, studentId }, { rejectWithValue }) => {
  await new Promise((r) => setTimeout(r, 150));
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return rejectWithValue('Proyecto no encontrado') as any;
  const p = projects[idx];
  projects[idx] = { ...p, students: p.students.filter((s) => s !== studentId), updatedAt: new Date().toISOString() };
  saveProjects(projects);
  return projects[idx];
});

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Error al cargar proyectos';
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(assignStudentToProject.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(removeStudentFromProject.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
        state.list = state.list.filter((p) => p.id !== action.payload);
      })
      .addCase(restoreProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.list.push(action.payload);
      })
      .addCase(addCoTeacher.fulfilled, (state, action: PayloadAction<Project>) => {
        const idx = state.list.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(removeCoTeacher.fulfilled, (state, action: PayloadAction<Project>) => {
        const idx = state.list.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      });
  },
});

export default projectsSlice.reducer;

// Selectores
export const selectProjects = (state: any) => state.projects.list as Project[];
export const selectProjectsByTeacher = (teacherId: string) => (state: any) => (state.projects.list as Project[]).filter(p => p.teacherId === teacherId);
