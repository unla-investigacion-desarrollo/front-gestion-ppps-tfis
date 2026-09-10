import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  pppService,
  PPPProposal,
  PPPEpidiente,
  CreateProposalDTO,
} from '../../src/services/pppService';

interface PPPState {
  proposals: PPPProposal[];
  expedientes: PPPEpidiente[];
  currentExpediente: PPPEpidiente | null;
  generalDriveUrl: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: PPPState = {
  proposals: [],
  expedientes: [],
  currentExpediente: null,
  generalDriveUrl: '',
  status: 'idle',
  error: null,
};

export const fetchPPPProposals = createAsyncThunk<
  PPPProposal[],
  { isStudent?: boolean } | void,
  { rejectValue: string }
>('ppp/fetchProposals', async (params, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token') || '';
    const isStudent = !!params?.isStudent;
    return await pppService.getProposals(token, isStudent);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al cargar propuestas de PPP');
  }
});

export const createPPPProposal = createAsyncThunk<
  PPPProposal,
  CreateProposalDTO,
  { rejectValue: string }
>('ppp/createProposal', async (payload, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token') || '';
    return await pppService.createProposal(payload, token);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al crear propuesta de PPP');
  }
});

export const updatePPPProposalStatus = createAsyncThunk<
  { id: number | string; isOpen: boolean },
  { id: number | string; isOpen: boolean },
  { rejectValue: string }
>('ppp/updateProposalStatus', async ({ id, isOpen }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await pppService.updateProposalStatus(id, isOpen, token);
    return { id, isOpen };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al cambiar estado de la convocatoria');
  }
});

export const applyToPPPProposal = createAsyncThunk<
  any,
  { proposalId: number | string; previousKnowledge: string; studentInfo?: any },
  { rejectValue: string }
>('ppp/applyProposal', async ({ proposalId, previousKnowledge, studentInfo }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    const res = await pppService.applyToProposal(proposalId, previousKnowledge, token, studentInfo);
    dispatch(fetchPPPProposals({ isStudent: true }));
    return res;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al postularse a la convocatoria');
  }
});

export const fetchPPPGeneralDrive = createAsyncThunk<string, void, { rejectValue: string }>(
  'ppp/fetchGeneralDrive',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || '';
      return await pppService.getGeneralDrive(token);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al obtener Drive general');
    }
  }
);

export const updatePPPGeneralDrive = createAsyncThunk<string, string, { rejectValue: string }>(
  'ppp/updateGeneralDrive',
  async (url, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || '';
      await pppService.updateGeneralDrive(url, token);
      return url;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al actualizar Drive general');
    }
  }
);

export const createPPPExternal = createAsyncThunk<
  PPPEpidiente,
  { studentInfo?: any } | void,
  { rejectValue: string }
>('ppp/createExternal', async (params, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token') || '';
    return await pppService.createExternalPPP(token, params?.studentInfo);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al iniciar trámite externo');
  }
});

export const fetchPPPExpedientes = createAsyncThunk<PPPEpidiente[], void, { rejectValue: string }>(
  'ppp/fetchExpedientes',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || '';
      return await pppService.getExpedientes(token);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al cargar expedientes');
    }
  }
);

export const fetchPPPExpedienteById = createAsyncThunk<
  PPPEpidiente | null,
  number | string,
  { rejectValue: string }
>('ppp/fetchExpedienteById', async (id, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token') || '';
    return await pppService.getExpedienteById(id, token);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al cargar detalle del expediente');
  }
});

export const acceptPPPApplicant = createAsyncThunk<
  { proposalId: number | string; studentId: number | string },
  { proposalId: number | string; studentId: number | string },
  { rejectValue: string }
>('ppp/acceptApplicant', async ({ proposalId, studentId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await pppService.acceptProposalApplicant(proposalId, studentId, token);
    dispatch(fetchPPPProposals());
    dispatch(fetchPPPExpedientes());
    return { proposalId, studentId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al aceptar postulante');
  }
});

export const rejectPPPApplicant = createAsyncThunk<
  { proposalId: number | string; studentId: number | string },
  { proposalId: number | string; studentId: number | string },
  { rejectValue: string }
>('ppp/rejectApplicant', async ({ proposalId, studentId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await pppService.rejectProposalApplicant(proposalId, studentId, token);
    dispatch(fetchPPPProposals());
    dispatch(fetchPPPExpedientes());
    return { proposalId, studentId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al rechazar postulante');
  }
});

export const observePPPExpediente = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>('ppp/observeExpediente', async (id, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await pppService.observeExpediente(id, token);
    dispatch(fetchPPPExpedienteById(id));
    dispatch(fetchPPPExpedientes());
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al observar expediente');
  }
});

export const approvePPPExpediente = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>('ppp/approveExpediente', async (id, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await pppService.approveExpediente(id, token);
    dispatch(fetchPPPExpedienteById(id));
    dispatch(fetchPPPExpedientes());
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al aprobar expediente');
  }
});

export const disapprovePPPExpediente = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>('ppp/disapproveExpediente', async (id, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await pppService.disapproveExpediente(id, token);
    dispatch(fetchPPPExpedienteById(id));
    dispatch(fetchPPPExpedientes());
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al desaprobar expediente');
  }
});

export const loadSiuPPPExpediente = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>('ppp/loadSiuExpediente', async (id, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await pppService.loadSiuExpediente(id, token);
    dispatch(fetchPPPExpedienteById(id));
    dispatch(fetchPPPExpedientes());
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al registrar carga en SIU');
  }
});

export const notifyPPPDocSent = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>('ppp/notifyDocSent', async (id, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await pppService.notifySent(id, token);
    dispatch(fetchPPPExpedienteById(id));
    dispatch(fetchPPPExpedientes());
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al notificar envío de documentación');
  }
});

export const abandonPPPExpediente = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>('ppp/abandonExpediente', async (id, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await pppService.abandonExpediente(id, token);
    dispatch(fetchPPPExpedienteById(id));
    dispatch(fetchPPPExpedientes());
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al dar de baja el trámite');
  }
});

const pppSlice = createSlice({
  name: 'ppp',
  initialState,
  reducers: {
    clearCurrentExpediente: (state) => {
      state.currentExpediente = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProposals
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
        state.error = (action.payload as string) || 'Error al cargar convocatorias';
      })
      // createProposal
      .addCase(createPPPProposal.fulfilled, (state, action: PayloadAction<PPPProposal>) => {
        state.proposals.unshift(action.payload);
      })
      // updateProposalStatus
      .addCase(updatePPPProposalStatus.fulfilled, (state, action) => {
        const item = state.proposals.find((p) => String(p.id) === String(action.payload.id));
        if (item) {
          item.isOpen = action.payload.isOpen;
        }
      })
      // fetchGeneralDrive
      .addCase(fetchPPPGeneralDrive.fulfilled, (state, action: PayloadAction<string>) => {
        state.generalDriveUrl = action.payload;
      })
      // updateGeneralDrive
      .addCase(updatePPPGeneralDrive.fulfilled, (state, action: PayloadAction<string>) => {
        state.generalDriveUrl = action.payload;
      })
      // fetchExpedientes
      .addCase(fetchPPPExpedientes.fulfilled, (state, action: PayloadAction<PPPEpidiente[]>) => {
        state.expedientes = action.payload;
      })
      // fetchExpedienteById
      .addCase(fetchPPPExpedienteById.fulfilled, (state, action: PayloadAction<PPPEpidiente | null>) => {
        state.currentExpediente = action.payload;
      })
      // createExternal
      .addCase(createPPPExternal.fulfilled, (state, action: PayloadAction<PPPEpidiente>) => {
        state.expedientes.unshift(action.payload);
        state.currentExpediente = action.payload;
      });
  },
});

export const { clearCurrentExpediente } = pppSlice.actions;

export const selectPPPProposals = (state: any) => state.ppp?.proposals || [];
export const selectPPPExpedientes = (state: any) => state.ppp?.expedientes || [];
export const selectCurrentPPPExpediente = (state: any) => state.ppp?.currentExpediente;
export const selectPPPGeneralDrive = (state: any) => state.ppp?.generalDriveUrl;
export const selectPPPStatus = (state: any) => state.ppp?.status || 'idle';
export const selectPPPError = (state: any) => state.ppp?.error;

export default pppSlice.reducer;
