import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import {
  fetchPPPProposals,
  createPPPProposal,
  updatePPPProposalStatus,
  applyToPPPProposal,
  fetchPPPGeneralDrive,
  updatePPPGeneralDrive,
  createPPPExternal,
  acceptPPPApplicant,
  rejectPPPApplicant,
  selectPPPProposals,
  selectPPPGeneralDrive,
  selectPPPStatus,
} from '../../redux/slices/pppSlice';
import { PPPProposal } from '../services/pppService';
import { useUserProfile } from './useUserProfile';
import { showToast } from '../utils/toast';

export interface CreateProposalFormData {
  title: string;
  description: string;
  driveFolderUrl: string;
  internalNotes: string;
}

export const usePPPProposals = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser) as any;
  const { user: userProfile, isTutor: profileIsTutor } = useUserProfile();

  // Determinar roles del usuario
  const userRoles = useMemo(() => {
    const rawRoles = Array.isArray(currentUser?.roles)
      ? currentUser.roles
      : currentUser?.rol
      ? [currentUser.rol]
      : [];
    return rawRoles.map((roleRecord: any) =>
      String(roleRecord).toUpperCase().trim()
    );
  }, [currentUser]);

  const isAdmin =
    userRoles.includes('ADMIN') || userRoles.includes('ADMINISTRADOR');
  const isTeacher = userRoles.some((roleName: string) =>
    ['DOCENTE', 'TEACHER', 'PROFESSOR'].includes(roleName)
  );
  const isTutor = Boolean(
    currentUser?.isTutor ?? userProfile?.isTutor ?? profileIsTutor
  );
  const isStudent = !isAdmin && !isTeacher;
  const canManageApplicants = isAdmin || (isTeacher && !isTutor);

  // Estado de Redux
  const proposals = useSelector(selectPPPProposals);
  const generalDriveUrl = useSelector(selectPPPGeneralDrive);
  const pppStatus = useSelector(selectPPPStatus);

  // Estados locales de filtrado y visualización
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterState, setFilterState] = useState<'all' | 'open' | 'closed'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<CreateProposalFormData>({
    title: '',
    description: '',
    driveFolderUrl: '',
    internalNotes: '',
  });

  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [selectedProposalToApply, setSelectedProposalToApply] =
    useState<PPPProposal | null>(null);
  const [previousKnowledge, setPreviousKnowledge] = useState<string>('');

  const [showApplicantsModal, setShowApplicantsModal] = useState<boolean>(false);
  const [selectedProposalApplicants, setSelectedProposalApplicants] =
    useState<PPPProposal | null>(null);

  const [showDriveModal, setShowDriveModal] = useState<boolean>(false);
  const [driveInput, setDriveInput] = useState<string>('');

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Carga inicial
  useEffect(() => {
    dispatch(fetchPPPProposals({ isStudent }));
    dispatch(fetchPPPGeneralDrive());
  }, [dispatch, isStudent]);

  useEffect(() => {
    if (generalDriveUrl) {
      setDriveInput(generalDriveUrl);
    }
  }, [generalDriveUrl]);

  // Filtrado de propuestas
  const filteredProposals = useMemo(() => {
    let proposalList = [...proposals];

    // Para estudiantes, estrictamente solo abiertas
    if (isStudent) {
      proposalList = proposalList.filter((proposalItem) => proposalItem.isOpen);
    } else if (filterState === 'open') {
      proposalList = proposalList.filter((proposalItem) => proposalItem.isOpen);
    } else if (filterState === 'closed') {
      proposalList = proposalList.filter((proposalItem) => !proposalItem.isOpen);
    }

    if (searchQuery.trim()) {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      proposalList = proposalList.filter((proposalItem) => {
        const titleMatch = (proposalItem.title || '')
          .toLowerCase()
          .includes(normalizedQuery);
        const descriptionMatch = (proposalItem.description || '')
          .toLowerCase()
          .includes(normalizedQuery);
        const notesMatch = (proposalItem.internalNotes || '')
          .toLowerCase()
          .includes(normalizedQuery);
        return titleMatch || descriptionMatch || notesMatch;
      });
    }

    return proposalList;
  }, [proposals, isStudent, filterState, searchQuery]);

  // Manejador: Abrir / Cerrar Convocatoria
  const handleToggleOpenStatus = async (proposalItem: PPPProposal) => {
    setActionLoading(true);
    try {
      const newStatus = !proposalItem.isOpen;
      await dispatch(
        updatePPPProposalStatus({
          id: proposalItem.id,
          isOpen: newStatus,
        })
      ).unwrap();
      showToast(
        `Convocatoria ${newStatus ? 'abierta' : 'cerrada'} correctamente`,
        'success'
      );
    } catch (toggleError: any) {
      showToast(
        toggleError || 'Error al cambiar estado de la convocatoria',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Manejador: Crear Propuesta
  const handleCreateProposalSubmit = async (
    formSubmitEvent: React.FormEvent
  ) => {
    formSubmitEvent.preventDefault();
    if (!createForm.title.trim() || !createForm.description.trim()) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await dispatch(createPPPProposal(createForm)).unwrap();
      showToast('Propuesta interna de PPP creada exitosamente', 'success');
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        driveFolderUrl: '',
        internalNotes: '',
      });
    } catch (createError: any) {
      showToast(createError || 'Error al crear la propuesta', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const [appliedFeedback, setAppliedFeedback] = useState<{
    id: number | string;
    status: string;
    proposalTitle: string;
  } | null>(null);

  // Manejador: Postularse a Propuesta
  const handleApplySubmit = async (formSubmitEvent: React.FormEvent) => {
    formSubmitEvent.preventDefault();
    if (!selectedProposalToApply) return;

    setActionLoading(true);
    try {
      const studentData = {
        id: currentUser?.id,
        name:
          [currentUser?.nombre, currentUser?.apellido]
            .filter(Boolean)
            .join(' ') || currentUser?.email,
        email: currentUser?.email,
        previousKnowledge: previousKnowledge.trim(),
      };

      const proposalId = selectedProposalToApply.id;
      const proposalTitle = selectedProposalToApply.title;

      const applyResponse = await dispatch(
        applyToPPPProposal({
          proposalId,
          previousKnowledge: previousKnowledge.trim(),
          studentInfo: studentData,
        })
      ).unwrap();

      const createdApplicationId = applyResponse?.id || Date.now();
      const applicationStatus = applyResponse?.status || 'pending_application';

      // Persistir localmente para que el estudiante conserve el ID de su postulación
      try {
        const studentStorageKey = `ppp_student_applications_${currentUser?.id || 'me'}`;
        const existingApplications = JSON.parse(
          localStorage.getItem(studentStorageKey) || '[]'
        );
        const newRecord = {
          id: createdApplicationId,
          proposalId,
          proposalTitle,
          status: applicationStatus,
          appliedAt: new Date().toISOString(),
        };
        const updatedList = [
          newRecord,
          ...existingApplications.filter(
            (applicationItem: any) =>
              String(applicationItem.proposalId) !== String(proposalId)
          ),
        ];
        localStorage.setItem(studentStorageKey, JSON.stringify(updatedList));
      } catch (storageError) {
        console.warn('Error al guardar postulación localmente', storageError);
      }

      setAppliedFeedback({
        id: createdApplicationId,
        status: applicationStatus,
        proposalTitle,
      });

      showToast(
        `¡Postulación registrada! Tu número de trámite es #${createdApplicationId}`,
        'success'
      );
      setShowApplyModal(false);
      setSelectedProposalToApply(null);
      setPreviousKnowledge('');
    } catch (applyError: any) {
      showToast(applyError || 'Error al enviar postulación', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Manejador: Iniciar Trámite Externo
  const handleCreateExternal = async () => {
    const confirmAction = window.confirm(
      '¿Deseás iniciar un trámite de Práctica Profesional Supervisada externa? Podrás descargar los modelos y convenios oficiales a continuación.'
    );
    if (!confirmAction) return;

    setActionLoading(true);
    try {
      const studentInfo = {
        id: currentUser?.id,
        name:
          [currentUser?.nombre, currentUser?.apellido]
            .filter(Boolean)
            .join(' ') || currentUser?.email,
        email: currentUser?.email,
      };
      const newExpediente = await dispatch(
        createPPPExternal({ studentInfo })
      ).unwrap();
      showToast('Trámite externo iniciado con éxito', 'success');
      if (newExpediente?.id) {
        navigate(`/ppp/${newExpediente.id}`);
      }
    } catch (externalError: any) {
      showToast(
        externalError || 'Error al iniciar trámite externo',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Manejador: Configurar Drive General
  const handleUpdateDriveSubmit = async (formSubmitEvent: React.FormEvent) => {
    formSubmitEvent.preventDefault();
    if (!driveInput.trim()) {
      showToast('La URL institucional del Drive es obligatoria', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await dispatch(updatePPPGeneralDrive(driveInput.trim())).unwrap();
      showToast(
        'Drive general de la carrera actualizado correctamente',
        'success'
      );
      setShowDriveModal(false);
    } catch (driveError: any) {
      showToast(driveError || 'Error al configurar Drive general', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Manejador: Aceptar / Rechazar Postulante
  const handleApplicantAction = async (
    proposalId: number | string,
    studentId: number | string,
    shouldAccept: boolean
  ) => {
    setActionLoading(true);
    try {
      if (shouldAccept) {
        await dispatch(
          acceptPPPApplicant({ proposalId, studentId })
        ).unwrap();
        showToast(
          'Postulante aceptado. Trámite iniciado en estado Documentación Pendiente.',
          'success'
        );
      } else {
        await dispatch(
          rejectPPPApplicant({ proposalId, studentId })
        ).unwrap();
        showToast('Postulación desestimada.', 'info');
      }
      setShowApplicantsModal(false);
    } catch (applicantError: any) {
      showToast(
        applicantError || 'Error al procesar postulante',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Manejador: Navegar a página completa de postulaciones de la propuesta
  const handleNavigateToApplicantsPage = (proposalItem: PPPProposal) => {
    navigate(`/ppp/convocatorias/${proposalItem.id}/postulaciones`);
  };

  return {
    isAdmin,
    isTeacher,
    isStudent,
    isTutor,
    canManageApplicants,
    proposals,
    generalDriveUrl,
    pppStatus,
    searchQuery,
    setSearchQuery,
    filterState,
    setFilterState,
    viewMode,
    setViewMode,
    filteredProposals,
    actionLoading,
    showCreateModal,
    setShowCreateModal,
    createForm,
    setCreateForm,
    showApplyModal,
    setShowApplyModal,
    selectedProposalToApply,
    setSelectedProposalToApply,
    previousKnowledge,
    setPreviousKnowledge,
    appliedFeedback,
    setAppliedFeedback,
    showApplicantsModal,
    setShowApplicantsModal,
    selectedProposalApplicants,
    setSelectedProposalApplicants,
    showDriveModal,
    setShowDriveModal,
    driveInput,
    setDriveInput,
    handleToggleOpenStatus,
    handleCreateProposalSubmit,
    handleApplySubmit,
    handleCreateExternal,
    handleUpdateDriveSubmit,
    handleApplicantAction,
    handleNavigateToApplicantsPage,
    handleViewTramite: (tramiteId: number | string) => navigate(`/ppp/${tramiteId}`),
  };
};
