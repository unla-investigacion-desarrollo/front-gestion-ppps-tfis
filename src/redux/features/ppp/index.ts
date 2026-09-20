import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  PPPProposal,
  PPPEpidiente,
  CreateProposalDTO,
  fetchPPPProposals,
  createPPPProposal,
  updatePPPProposalStatus,
  fetchPPPGeneralDrive,
  updatePPPGeneralDrive,
  fetchPPPExpedientes,
  fetchPPPExpedienteById,
  createPPPExternal,
} from './asyncActions';

export type { PPPProposal, PPPEpidiente, CreateProposalDTO };

export interface PPPState {
  proposals: PPPProposal[];
  expedientes: PPPEpidiente[];
  currentExpediente: PPPEpidiente | null;
  generalDriveUrl: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

export const initialState: PPPState = {
  proposals: [],
  expedientes: [],
  currentExpediente: null,
  generalDriveUrl: '',
  status: 'idle',
  error: null,
};

export const pppSlice = createSlice({
  name: 'ppp',
  initialState,
  reducers: {
    clearCurrentExpediente: (state) => {
      state.currentExpediente = null;
    },
    clearPPPError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPPPProposals.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPPPProposals.fulfilled, (state, action: PayloadAction<PPPProposal[]>) => {
        state.status = 'succeeded';
        state.proposals = action.payload;
      })
      .addCase(fetchPPPProposals.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || 'Error al cargar convocatorias';
      })
      .addCase(createPPPProposal.fulfilled, (state, action: PayloadAction<PPPProposal>) => {
        state.proposals.unshift(action.payload);
      })
      .addCase(updatePPPProposalStatus.fulfilled, (state, action) => {
        const item = state.proposals.find((p) => String(p.id) === String(action.payload.id));
        if (item) {
          item.isOpen = action.payload.isOpen;
        }
      })
      .addCase(fetchPPPGeneralDrive.fulfilled, (state, action: PayloadAction<string>) => {
        state.generalDriveUrl = action.payload;
      })
      .addCase(updatePPPGeneralDrive.fulfilled, (state, action: PayloadAction<string>) => {
        state.generalDriveUrl = action.payload;
      })
      .addCase(fetchPPPExpedientes.fulfilled, (state, action: PayloadAction<PPPEpidiente[]>) => {
        state.expedientes = action.payload;
      })
      .addCase(fetchPPPExpedienteById.fulfilled, (state, action: PayloadAction<PPPEpidiente | null>) => {
        state.currentExpediente = action.payload;
      })
      .addCase(createPPPExternal.fulfilled, (state, action: PayloadAction<PPPEpidiente>) => {
        state.expedientes.unshift(action.payload);
        state.currentExpediente = action.payload;
      });
  },
});

export const { clearCurrentExpediente, clearPPPError } = pppSlice.actions;

// Selectores tipados
export const selectPPPProposals = (state: { ppp: PPPState }) => state.ppp?.proposals || [];
export const selectPPPExpedientes = (state: { ppp: PPPState }) => state.ppp?.expedientes || [];
export const selectCurrentPPPExpediente = (state: { ppp: PPPState }) => state.ppp?.currentExpediente;
export const selectPPPGeneralDrive = (state: { ppp: PPPState }) => state.ppp?.generalDriveUrl;
export const selectPPPStatus = (state: { ppp: PPPState }) => state.ppp?.status || 'idle';
export const selectPPPError = (state: { ppp: PPPState }) => state.ppp?.error;

export * from './asyncActions';
export default pppSlice.reducer;
