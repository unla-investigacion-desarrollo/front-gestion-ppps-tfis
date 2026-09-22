export interface ProjectItem {
  id: number | string;
  title?: string;
  titulo?: string;
  description?: string;
  descripcion?: string;
  status?: string;
  estado?: string;
  projectType?: { id: number; name: string };
  categoria?: string;
  projectTypeId?: number;
  createdAt?: string;
  updatedAt?: string;
  students?: any[];
  activeStudents?: any[];
  professors?: any[];
  activeProfessors?: any[];
  teacher?: any;
  tutor?: any;
  teacherId?: string | number;
  raw?: any;
}

export interface RequestItem {
  id: number;
  active: boolean;
  createdAt?: string;
  project: {
    id: number;
    title: string;
    description: string;
    status: string;
    createdAt?: string;
    projectType?: { id: number; name: string };
    categoria?: string;
    activeProfessors?: any[];
    teacher?: any;
  };
}

export type ExplorerTab = 'all' | 'requests' | 'active';
export type ViewMode = 'table' | 'cards';
