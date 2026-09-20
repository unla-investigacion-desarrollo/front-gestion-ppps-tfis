import { configureStore } from '@reduxjs/toolkit';
import { rootReducer, RootState } from './reducers';

export const store = configureStore({
  reducer: rootReducer,
});

export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type { RootState };

export default store;
