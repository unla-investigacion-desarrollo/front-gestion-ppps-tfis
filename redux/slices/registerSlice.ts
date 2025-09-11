import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  recordarme: false,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

const registerSlice = createSlice({
  name: 'register',
  initialState,
  reducers: {
    setField: (state, action) => {
      const { field, value } = action.payload;
      state[field] = value;
    },
    resetForm: () => initialState,
  },
});

export const { setField, resetForm } = registerSlice.actions;

export const selectRegister = (state) => state.register;

export default registerSlice.reducer;
