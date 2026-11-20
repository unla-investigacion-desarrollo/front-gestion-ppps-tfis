import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProjects,
  fetchPendingProjectRequests,
  selectPendingProjectRequests,
  selectPendingProjectRequestsStatus,
  selectProjects,
  approveStudentProjectRequest,
  rejectStudentProjectRequest,
  approveProfessorProjectRequest,
  rejectProfessorProjectRequest,
  UnifiedPendingRequest,
} from '../../../../redux/slices/projectsSlice';
import {
  fetchPPPExpedientes,
  fetchPPPProposals,
  selectPPPExpedientes,
  selectPPPExpedientesStatus,
  selectPPPProposals,
  acceptPPPApplicant,
  rejectPPPApplicant,
} from '../../../../redux/slices/pppSlice';
import {
  fetchUsers,
  selectUsers,
} from '../../../../redux/slices/usersSlice';
import ProjectApprovalTable from './components/ProjectApprovalTable';
import Pagination from '../../../components/Pagination';
import './ApprovalQueue.css';
import { showToast } from '../../../utils/toast';
import {
  FaFileCircleCheck,
  FaMagnifyingGlass,
  FaArrowRotateLeft,
} from 'react-icons/fa6';

const ApprovalQueue: React.FC = () => {
  const dispatch = useDispatch<any>();

  const [activeTab, setActiveTab] = useState<'tfi' | 'ppp'>('tfi');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [sortBy, setSortBy] = useState('recientes');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const rawPendingProjectRequests = useSelector(selectPendingProjectRequests);
  const pendingRequestsStatus = useSelector(selectPendingProjectRequestsStatus);
  const pppExpedientes = useSelector(selectPPPExpedientes);
  const pppExpedientesStatus = useSelector(selectPPPExpedientesStatus);
  const pppProposals = useSelector(selectPPPProposals);
  const allUsers = useSelector(selectUsers);
  const allProjects = useSelector(selectProjects);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchPendingProjectRequests());
    dispatch(fetchPPPExpedientes());
    dispatch(fetchPPPProposals());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Solicitudes pendientes reales traídas de la base de datos a través de Redux
  const pendingProjectRequests = rawPendingProjectRequests || [];

  // Postulaciones PPP pendientes de evaluación mapeadas al formato de tabla unificada
  const pendingPPPRequests: UnifiedPendingRequest[] = useMemo(() => {
    return (pppExpedientes || [])
      .filter((exp) => exp.status === 'pending_application')
      .map((exp) => {
        const matchedProposal = (pppProposals || []).find(
          (p) =>
            String(p.title || '').trim().toLowerCase() ===
            String(exp.proposalTitle || exp.proposal?.title || '').trim().toLowerCase()
        );
        const proposalId = String(
          exp.proposalId ??
            exp.proposal_id ??
            exp.proposal?.id ??
            exp.convocatoria?.id ??
            exp.propuesta?.id ??
            matchedProposal?.id ??
            exp.id ??
            ''
        );
        const studentId = String(
          exp.student?.id_user ??
            exp.studentUserId ??
            exp.student?.user?.id ??
            exp.student?.user?.id_user ??
            exp.studentId ??
            exp.student?.id ??
            exp.userId ??
            ''
        );
        const isExternal = exp.type === 'externa' || exp.type === 'external';
        const rawStudent = exp.student?.user || exp.student || exp.user || exp.estudiante || exp.alumno;

        return {
          id: `ppp-${exp.id}`,
          projectId: proposalId,
          projectTitle: exp.proposalTitle || exp.proposal?.title || 'Convocatoria PPP',
          projectType: isExternal ? 'PPP Externa' : 'PPP Interna',
          studentUserId: studentId,
          applicantId: studentId,
          applicantRole: 'student',
          applicantRoleLabel: 'Estudiante',
          applicantName: exp.studentName || 'Estudiante',
          applicantEmail: exp.studentEmail || '',
          createdAt: exp.createdAt,
          rawApplicant: rawStudent,
        };
      });
  }, [pppExpedientes, pppProposals]);

  const activeSourceRequests = activeTab === 'tfi' ? pendingProjectRequests : pendingPPPRequests;

  // Filtrado de solicitudes según la pestaña activa
  const filteredRequests = useMemo(() => {
    let list = [...activeSourceRequests];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const student = allUsers.find((u) => String(u.id) === String(r.studentUserId || r.applicantId));
        const studentName = [student?.nombre, student?.apellido].filter(Boolean).join(' ').toLowerCase();
        const studentEmail = (student?.email || '').toLowerCase();
        const applicantName = (r.applicantName || '').toLowerCase();
        const applicantEmail = (r.applicantEmail || '').toLowerCase();
        const projectTitle = (r.projectTitle || '').toLowerCase();
        const projectType = (r.projectType || '').toLowerCase();
        const specialization = (r.specialization || '').toLowerCase();
        const year = r.yearOfAdmission ? String(r.yearOfAdmission) : '';

        return (
          applicantName.includes(q) ||
          applicantEmail.includes(q) ||
          studentName.includes(q) ||
          studentEmail.includes(q) ||
          projectTitle.includes(q) ||
          projectType.includes(q) ||
          specialization.includes(q) ||
          year.includes(q) ||
          (student?.legajo && String(student.legajo).includes(q))
        );
      });
    }

    if (sortBy === 'antiguos') {
      list.reverse();
    }

    return list;
  }, [activeSourceRequests, searchQuery, sortBy, allUsers]);

  // Resetear filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterStatus('todos');
    setSortBy('recientes');
    setCurrentPage(1);
  };

  // Paginación
  const activeItemsCount = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(activeItemsCount / pageSize));

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Manejador para aprobar solicitud de proyecto (estudiante o docente)
  const handleApproveProjectRequest = async (
    projectId: string,
    applicantId: string,
    role: 'student' | 'professor' = 'student'
  ) => {
    let result: any;
    if (role === 'professor') {
      result = await dispatch(approveProfessorProjectRequest({ projectId, professorUserId: applicantId }));
      if (!result.error) {
        showToast('¡Solicitud de docente aprobada con éxito!', 'success');
      } else {
        showToast(result.payload || 'Error al aprobar la solicitud del docente', 'error');
      }
    } else {
      result = await dispatch(approveStudentProjectRequest({ projectId, studentUserId: applicantId }));
      if (!result.error) {
        showToast('¡Solicitud aprobada con éxito! El estudiante fue asignado al proyecto.', 'success');
      } else {
        showToast(result.payload || 'Error al aprobar la solicitud del estudiante', 'error');
      }
    }
  };

  // Manejador para rechazar solicitud de proyecto (estudiante o docente)
  const handleRejectProjectRequest = async (
    projectId: string,
    applicantId: string,
    role: 'student' | 'professor' = 'student'
  ) => {
    let result: any;
    if (role === 'professor') {
      result = await dispatch(rejectProfessorProjectRequest({ projectId, professorUserId: applicantId }));
      if (!result.error) {
        showToast('Solicitud del docente rechazada.', 'info');
      } else {
        showToast(result.payload || 'Error al rechazar la solicitud del docente', 'error');
      }
    } else {
      result = await dispatch(rejectStudentProjectRequest({ projectId, studentUserId: applicantId }));
      if (!result.error) {
        showToast('Solicitud rechazada.', 'info');
      } else {
        showToast(result.payload || 'Error al rechazar la solicitud', 'error');
      }
    }
  };

  // Manejadores para aprobar/rechazar postulación PPP
  const handleApprovePPPRequest = async (proposalId: string, studentId: string) => {
    const result: any = await dispatch(acceptPPPApplicant({ proposalId, studentId }));
    if (!result.error) {
      showToast('¡Postulación PPP aprobada con éxito!', 'success');
    } else {
      showToast(result.payload || 'Error al aprobar la postulación PPP', 'error');
    }
  };

  const handleRejectPPPRequest = async (proposalId: string, studentId: string) => {
    const result: any = await dispatch(rejectPPPApplicant({ proposalId, studentId }));
    if (!result.error) {
      showToast('Postulación PPP rechazada.', 'info');
    } else {
      showToast(result.payload || 'Error al rechazar la postulación PPP', 'error');
    }
  };

  const handleSelectTab = (tab: 'tfi' | 'ppp') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Cálculo de texto mostrando X - Y de Z
  const startIndex = activeItemsCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, activeItemsCount);

  return (
    <div className="approvals-page-wrapper">
      <div className="approvals-container">
        <div className="approvals-card">
          {/* Cabecera idéntica al Mockup */}
          <div className="approvals-header">
            <div className="approvals-header-icon-box">
              <FaFileCircleCheck size={24} />
            </div>
            <div>
              <h1 className="approvals-header-title">Solicitudes</h1>
              <p className="approvals-header-subtitle">
                Revisa y gestiona las solicitudes de postulación a proyectos.
              </p>
            </div>
          </div>

          {/* Pestañas de navegación */}
          <div className="approvals-tabs">
            <button
              type="button"
              className={`approvals-tab-button ${activeTab === 'tfi' ? 'active' : ''}`}
              onClick={() => handleSelectTab('tfi')}
            >
              <span>Solicitudes a Proyectos TFI</span>
              <span className="approvals-tab-counter">
                {pendingProjectRequests.length}
              </span>
            </button>
            <button
              type="button"
              className={`approvals-tab-button ${activeTab === 'ppp' ? 'active' : ''}`}
              onClick={() => handleSelectTab('ppp')}
            >
              <span>Solicitudes PPP</span>
              <span className="approvals-tab-counter">
                {pendingPPPRequests.length}
              </span>
            </button>
          </div>

          {/* Barra de Filtros idéntica al Mockup */}
          <div className="approvals-filters-bar">
            {/* Input de Búsqueda con lupa */}
            <div className="approvals-search-box">
              <span className="approvals-search-icon">
                <FaMagnifyingGlass size={15} />
              </span>
              <input
                type="text"
                className="approvals-search-input"
                placeholder="Buscar por estudiante, proyecto o correo..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Select de Estado */}
            <select
              className="approvals-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="todos">Estado: todos</option>
              <option value="pendiente">Estado: pendiente</option>
            </select>

            {/* Select de Ordenamiento */}
            <select
              className="approvals-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recientes">Ordenar por: más recientes</option>
              <option value="antiguos">Ordenar por: más antiguos</option>
            </select>

            {/* Botón Limpiar Filtros */}
            <button
              type="button"
              className="approvals-clear-btn d-inline-flex align-items-center gap-1"
              onClick={handleClearFilters}
            >
              <FaArrowRotateLeft size={13} />
              Limpiar filtros
            </button>
          </div>

          {/* Contenido: Solicitudes de Proyectos TFI o PPP */}
          <ProjectApprovalTable
            requests={paginatedRequests}
            users={allUsers}
            projects={
              activeTab === 'tfi'
                ? allProjects
                : pppProposals.map((p) => ({
                    id: p.id,
                    descripcion: p.description,
                  }))
            }
            onApprove={activeTab === 'tfi' ? handleApproveProjectRequest : handleApprovePPPRequest}
            onReject={activeTab === 'tfi' ? handleRejectProjectRequest : handleRejectPPPRequest}
            loading={
              activeTab === 'tfi'
                ? pendingRequestsStatus === 'loading'
                : pppExpedientesStatus === 'loading'
            }
          />

          {/* Paginación consolidada */}
          <Pagination
            variant="approvals"
            itemLabel="solicitudes"
            currentPage={currentPage}
            totalItems={activeItemsCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default ApprovalQueue;
