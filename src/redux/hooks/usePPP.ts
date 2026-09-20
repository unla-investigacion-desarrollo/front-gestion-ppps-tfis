import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  selectPPPProposals,
  selectPPPExpedientes,
  selectCurrentPPPExpediente,
  selectPPPGeneralDrive,
  selectPPPStatus,
  selectPPPError,
  clearCurrentExpediente,
  clearPPPError,
} from '../features/ppp';
import {
  fetchPPPProposals,
  createPPPProposal,
  updatePPPProposalStatus,
  applyToPPPProposal,
  fetchPPPGeneralDrive,
  updatePPPGeneralDrive,
  createPPPExternal,
  fetchPPPExpedientes,
  fetchPPPExpedienteById,
  acceptPPPApplicant,
  rejectPPPApplicant,
  observePPPExpediente,
  approvePPPExpediente,
  disapprovePPPExpediente,
  loadSiuPPPExpediente,
  notifyPPPDocSent,
  abandonPPPExpediente,
  CreateProposalDTO,
} from '../features/ppp/asyncActions';

export const usePPP = () => {
  const dispatch = useAppDispatch();
  const proposals = useAppSelector(selectPPPProposals);
  const expedientes = useAppSelector(selectPPPExpedientes);
  const currentExpediente = useAppSelector(selectCurrentPPPExpediente);
  const generalDriveUrl = useAppSelector(selectPPPGeneralDrive);
  const status = useAppSelector(selectPPPStatus);
  const error = useAppSelector(selectPPPError);

  const loadProposals = useCallback(
    (params?: { isStudent?: boolean }) => {
      return dispatch(fetchPPPProposals(params)).unwrap();
    },
    [dispatch]
  );

  const createProposal = useCallback(
    (payload: CreateProposalDTO) => {
      return dispatch(createPPPProposal(payload)).unwrap();
    },
    [dispatch]
  );

  const toggleProposalStatus = useCallback(
    (id: number | string, isOpen: boolean) => {
      return dispatch(updatePPPProposalStatus({ id, isOpen })).unwrap();
    },
    [dispatch]
  );

  const applyToProposal = useCallback(
    (payload: { proposalId: number | string; previousKnowledge: string; studentInfo?: any }) => {
      return dispatch(applyToPPPProposal(payload)).unwrap();
    },
    [dispatch]
  );

  const loadGeneralDrive = useCallback(() => {
    return dispatch(fetchPPPGeneralDrive()).unwrap();
  }, [dispatch]);

  const saveGeneralDrive = useCallback(
    (url: string) => {
      return dispatch(updatePPPGeneralDrive(url)).unwrap();
    },
    [dispatch]
  );

  const startExternalPPP = useCallback(
    (params?: { studentInfo?: any }) => {
      return dispatch(createPPPExternal(params)).unwrap();
    },
    [dispatch]
  );

  const loadExpedientes = useCallback(() => {
    return dispatch(fetchPPPExpedientes()).unwrap();
  }, [dispatch]);

  const loadExpedienteById = useCallback(
    (id: number | string) => {
      return dispatch(fetchPPPExpedienteById(id)).unwrap();
    },
    [dispatch]
  );

  const acceptApplicant = useCallback(
    (proposalId: number | string, studentId: number | string) => {
      return dispatch(acceptPPPApplicant({ proposalId, studentId })).unwrap();
    },
    [dispatch]
  );

  const rejectApplicant = useCallback(
    (proposalId: number | string, studentId: number | string) => {
      return dispatch(rejectPPPApplicant({ proposalId, studentId })).unwrap();
    },
    [dispatch]
  );

  const observeExpediente = useCallback(
    (id: number | string) => {
      return dispatch(observePPPExpediente(id)).unwrap();
    },
    [dispatch]
  );

  const approveExpediente = useCallback(
    (id: number | string) => {
      return dispatch(approvePPPExpediente(id)).unwrap();
    },
    [dispatch]
  );

  const disapproveExpediente = useCallback(
    (id: number | string) => {
      return dispatch(disapprovePPPExpediente(id)).unwrap();
    },
    [dispatch]
  );

  const registerSiu = useCallback(
    (id: number | string) => {
      return dispatch(loadSiuPPPExpediente(id)).unwrap();
    },
    [dispatch]
  );

  const notifyDocSent = useCallback(
    (id: number | string) => {
      return dispatch(notifyPPPDocSent(id)).unwrap();
    },
    [dispatch]
  );

  const abandonExpediente = useCallback(
    (id: number | string) => {
      return dispatch(abandonPPPExpediente(id)).unwrap();
    },
    [dispatch]
  );

  const resetCurrentExpediente = useCallback(() => {
    dispatch(clearCurrentExpediente());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearPPPError());
  }, [dispatch]);

  return {
    proposals,
    expedientes,
    currentExpediente,
    generalDriveUrl,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'succeeded',
    isError: status === 'failed',
    error,
    loadProposals,
    createProposal,
    toggleProposalStatus,
    applyToProposal,
    loadGeneralDrive,
    saveGeneralDrive,
    startExternalPPP,
    loadExpedientes,
    loadExpedienteById,
    acceptApplicant,
    rejectApplicant,
    observeExpediente,
    approveExpediente,
    disapproveExpediente,
    registerSiu,
    notifyDocSent,
    abandonExpediente,
    resetCurrentExpediente,
    clearError,
  };
};

export default usePPP;
