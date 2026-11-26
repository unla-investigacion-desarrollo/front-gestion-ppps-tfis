import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import { fetchUsers, selectUsers } from '../../redux/slices/usersSlice';
import { projectService } from '../services/projectService';
import { showToast } from '../utils/toast';
import {
  ProjectItem,
  RequestItem,
  ExplorerTab,
  ViewMode,
} from '../components/ProjectExplorer/types';
import { getProjectTeachers } from '../components/ProjectExplorer/projectExplorerUtils';

const CLOSED_PROJECT_STATUSES = new Set(['finalized', 'canceled', 'cancelled']);

export interface UseProjectExplorerOptions {
  onJoinSuccess?: (projectId: number | string) => void;
}

export const useProjectExplorer = (options?: UseProjectExplorerOptions) => {
  const dispatch = useDispatch<any>();
  const location = useLocation();
  const currentUser = useSelector(selectCurrentUser) as any;
  const allUsers = useSelector(selectUsers) as any[];
  const authToken = localStorage.getItem('token') || '';

  // Determinar pestaña activa desde URL o estado local
  const [activeTab, setActiveTab] = useState<ExplorerTab>('all');

  // Sincronizar reactivamente con query param ?tab=...
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'requests' || tabParam === 'active') {
        setActiveTab(tabParam as ExplorerTab);
      } else {
        setActiveTab('all');
      }
    } catch {
      setActiveTab('all');
    }
  }, [location.search, location.key]);

  // Estados de datos principales
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [myRequests, setMyRequests] = useState<RequestItem[]>([]);
  const [myActiveProjects, setMyActiveProjects] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [requestingId, setRequestingId] = useState<number | string | null>(null);

  // Estados de filtrado
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modo de visualización: Tabla o Tarjetas
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // Rol docente o alumno
  const userRoles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : currentUser?.roles
    ? [currentUser.roles]
    : [];
  const isTeacher = userRoles.some((roleName: string) =>
    ['DOCENTE', 'PROFESSOR'].includes(String(roleName).toUpperCase().trim())
  );

  // Carga de datos del backend
  const loadData = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      if (!allUsers || allUsers.length === 0) {
        dispatch(fetchUsers());
      }

      const [allProjectsData, requestsData, activeProjectsData, projectTypesData] = await Promise.all([
        projectService.getProjects(authToken),
        projectService.getMyRequests(authToken),
        projectService.getMyActiveProjects(authToken),
        projectService.getProjectTypes(authToken),
      ]);

      const openProjects = Array.isArray(allProjectsData)
        ? allProjectsData.filter((projectItem: ProjectItem) => {
            const normalizedStatus = String(projectItem.status || projectItem.estado || '')
              .toLowerCase()
              .trim();
            return !CLOSED_PROJECT_STATUSES.has(normalizedStatus);
          })
        : [];

      const openActiveProjects = Array.isArray(activeProjectsData)
        ? activeProjectsData.filter((activeItem: any) => {
            const proj = activeItem.project || activeItem;
            const normalizedStatus = String(proj?.status || proj?.estado || '')
              .toLowerCase()
              .trim();
            if (CLOSED_PROJECT_STATUSES.has(normalizedStatus)) return false;
            const workStatus = String(
              proj?.studentWork?.status || activeItem?.studentWork?.status || ''
            )
              .toLowerCase()
              .trim();
            if (workStatus === 'disapproved') return false;
            return true;
          })
        : [];

      setProjects(openProjects);
      setProjectTypes(
        Array.isArray(projectTypesData)
          ? projectTypesData
              .map((projectType) => projectType.name)
              .filter((categoryName) => categoryName?.trim().toUpperCase() !== 'PPP')
          : []
      );
      setMyRequests(Array.isArray(requestsData) ? requestsData : []);
      setMyActiveProjects(openActiveProjects);
    } catch (networkError: any) {
      console.error('Error cargando proyectos del usuario:', networkError);
    } finally {
      setLoading(false);
    }
  }, [authToken, dispatch, allUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Conjunto de identificadores de proyectos con solicitud pendiente
  const pendingProjectIds = useMemo(() => {
    return new Set(
      myRequests.map((requestItem) => String(requestItem.project?.id || requestItem.id))
    );
  }, [myRequests]);

  // Conjunto de identificadores de proyectos activos
  const activeProjectIds = useMemo(() => {
    return new Set(
      myActiveProjects.map((activeItem) => String(activeItem.project?.id || activeItem.id))
    );
  }, [myActiveProjects]);

  // Un estudiante solo puede tener un único TFI activo
  const activeTfi = !isTeacher && myActiveProjects.length > 0 ? myActiveProjects[0] : null;
  const hasActiveTfi = Boolean(activeTfi);

  // Lista de categorías únicas encontradas en la lista de proyectos
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    projectTypes.forEach((categoryName) => {
      if (categoryName.trim()) {
        categorySet.add(categoryName.trim());
      }
    });
    projects.forEach((projectItem) => {
      const categoryName = projectItem.projectType?.name || projectItem.categoria;
      if (categoryName && typeof categoryName === 'string' && categoryName.trim()) {
        if (categoryName.trim().toUpperCase() !== 'PPP') {
          categorySet.add(categoryName.trim());
        }
      }
    });
    return Array.from(categorySet);
  }, [projectTypes, projects]);

  // Manejar solicitud para unirse al proyecto
  const handleJoinProject = async (
    projectId: number | string,
    projectTitle: string
  ) => {
    if (!authToken) {
      showToast('Sesión no válida o expirada', 'error');
      return;
    }

    if (hasActiveTfi) {
      showToast('Ya tenés un TFI asignado. No podés postularte a otro proyecto.', 'error');
      return;
    }

    setRequestingId(projectId);
    try {
      if (isTeacher) {
        await projectService.requestJoinAsProfessor(projectId, authToken);
      } else {
        await projectService.requestJoinAsStudent(projectId, authToken);
      }

      showToast(
        `¡Solicitud enviada para "${projectTitle}"! Pendiente de aprobación.`,
        'success'
      );
      if (options?.onJoinSuccess) {
        options.onJoinSuccess(projectId);
      }
      await loadData();
    } catch (joinError: any) {
      showToast(
        joinError?.message || 'Error al enviar solicitud al proyecto',
        'error'
      );
    } finally {
      setRequestingId(null);
    }
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setCurrentPage(1);
  };

  // Filtrado de proyectos para la pestaña "Explorar"
  const filteredProjects = useMemo(() => {
    return projects.filter((projectItem) => {
      const stringId = String(projectItem.id);
      const isApproved = activeProjectIds.has(stringId);
      const isPending = pendingProjectIds.has(stringId);

      // Filtro por texto
      const normalizedQuery = searchQuery.trim().toLowerCase();
      if (normalizedQuery) {
        const titleText = (projectItem.title || projectItem.titulo || '').toLowerCase();
        const descriptionText = (projectItem.description || projectItem.descripcion || '').toLowerCase();
        const categoryText = (projectItem.projectType?.name || projectItem.categoria || '').toLowerCase();
        const teacherNamesText = getProjectTeachers(projectItem, allUsers).join(' ').toLowerCase();

        const matchesQuery =
          titleText.includes(normalizedQuery) ||
          descriptionText.includes(normalizedQuery) ||
          categoryText.includes(normalizedQuery) ||
          teacherNamesText.includes(normalizedQuery);

        if (!matchesQuery) return false;
      }

      // Filtro por categoría
      if (selectedCategory !== 'ALL') {
        const currentCategory = (projectItem.projectType?.name || projectItem.categoria || '').toLowerCase();
        if (currentCategory !== selectedCategory.toLowerCase()) return false;
      }

      // Filtro por estado
      if (selectedStatus === 'AVAILABLE') {
        if (isApproved || isPending) return false;
      } else if (selectedStatus === 'PENDING') {
        if (!isPending) return false;
      } else if (selectedStatus === 'ACTIVE') {
        if (!isApproved) return false;
      }

      return true;
    });
  }, [
    projects,
    searchQuery,
    selectedCategory,
    selectedStatus,
    activeProjectIds,
    pendingProjectIds,
    allUsers,
  ]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProjects.slice(startIndex, startIndex + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  return {
    allUsers,
    projects,
    myRequests,
    myActiveProjects,
    loading,
    requestingId,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pendingProjectIds,
    activeProjectIds,
    activeTfi,
    hasActiveTfi,
    availableCategories,
    filteredProjects,
    paginatedProjects,
    handleJoinProject,
    handleClearFilters,
    loadData,
  };
};
