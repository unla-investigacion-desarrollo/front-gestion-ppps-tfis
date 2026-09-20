import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './features/auth';
import usersReducer from './features/users';
import projectsReducer from './features/projects';
import pppReducer from './features/ppp';

export const rootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  projects: projectsReducer,
  ppp: pppReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
