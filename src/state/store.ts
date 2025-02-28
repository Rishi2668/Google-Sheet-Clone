import { configureStore, Action } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import spreadsheetReducer from './slices/spreadsheetSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    spreadsheet: spreadsheetReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values for specific paths
        ignoredActions: ['ui/showToast', 'ui/setToastTimeout'],
        ignoredPaths: ['ui.toast.timeoutId']
      }
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;