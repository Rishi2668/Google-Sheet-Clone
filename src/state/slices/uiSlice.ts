import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from '../store';
import { Cell, SelectionRange } from '../../types/spreadsheet';

// Context Menu State Interface
export interface ContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
  targetId: string | null;
}

// Find Replace State Interface
export interface FindReplaceState {
  visible: boolean;
  findText: string;
  replaceText: string;
  matchCase: boolean;
  matchEntireCell: boolean;
  results: string[];
  currentResultIndex: number;
}

// Toast State Interface
export interface ToastState {
  visible: boolean;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timeoutId: number | null;
}

// View Options State Interface
export interface ViewOptionsState {
  showFormulaBar: boolean;
  showGridlines: boolean;
  showHeaders: boolean;
  zoom: number;
}

// Clipboard State Interface
export interface ClipboardState {
  type: 'cells' | 'text' | null;
  cells?: Record<string, any>;
  text?: string;
  sourceRange?: SelectionRange;
}

// Complete UI State Interface
export interface UIState {
  editMode: boolean;
  formulaBarFocused: boolean;
  contextMenu: ContextMenuState;
  findReplace: FindReplaceState;
  toast: ToastState;
  viewOptions: ViewOptionsState;
  clipboard: ClipboardState;
}

// Initial State
const initialState: UIState = {
  editMode: false,
  formulaBarFocused: false,
  contextMenu: {
    visible: false,
    position: { x: 0, y: 0 },
    targetId: null
  },
  findReplace: {
    visible: false,
    findText: '',
    replaceText: '',
    matchCase: false,
    matchEntireCell: false,
    results: [],
    currentResultIndex: -1
  },
  toast: {
    visible: false,
    message: '',
    type: 'info',
    timeoutId: null
  },
  viewOptions: {
    showFormulaBar: true,
    showGridlines: true,
    showHeaders: true,
    zoom: 100
  },
  clipboard: {
    type: null
  }
};

// Create UI Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Edit Mode
    setEditMode: (state, action: PayloadAction<boolean>) => {
      state.editMode = action.payload;
    },
    
    // Formula Bar Focus
    setFormulaBarFocused: (state, action: PayloadAction<boolean>) => {
      state.formulaBarFocused = action.payload;
    },
    
    // Context Menu
    showContextMenu: (state, action: PayloadAction<{ 
      position: { x: number; y: number }; 
      targetId: string | null 
    }>) => {
      const { position, targetId } = action.payload;
      state.contextMenu = {
        visible: true,
        position,
        targetId
      };
    },
    
    hideContextMenu: (state) => {
      state.contextMenu.visible = false;
    },
    
    // Find & Replace
    showFindReplace: (state) => {
      state.findReplace.visible = true;
    },
    
    hideFindReplace: (state) => {
      state.findReplace.visible = false;
    },
    
    setFindReplaceOptions: (state, action: PayloadAction<Partial<FindReplaceState>>) => {
      state.findReplace = {
        ...state.findReplace,
        ...action.payload
      };
    },
    
    setFindResults: (state, action: PayloadAction<string[]>) => {
      state.findReplace.results = action.payload;
      state.findReplace.currentResultIndex = action.payload.length > 0 ? 0 : -1;
    },
    
    navigateToNextResult: (state) => {
      const { results, currentResultIndex } = state.findReplace;
      if (results.length > 0) {
        state.findReplace.currentResultIndex = (currentResultIndex + 1) % results.length;
      }
    },
    
    navigateToPrevResult: (state) => {
      const { results, currentResultIndex } = state.findReplace;
      if (results.length > 0) {
        state.findReplace.currentResultIndex = 
          (currentResultIndex - 1 + results.length) % results.length;
      }
    },
    
    // Toast Notifications
    showToast: (state, action: PayloadAction<{ 
      message: string; 
      type?: 'info' | 'success' | 'warning' | 'error';
    }>) => {
      const { message, type = 'info' } = action.payload;
      
      // Clear existing timeout
      if (state.toast.timeoutId !== null) {
        window.clearTimeout(state.toast.timeoutId);
      }
      
      state.toast = {
        visible: true,
        message,
        type,
        timeoutId: null
      };
    },
    
    setToastTimeout: (state, action: PayloadAction<number | null>) => {
      state.toast.timeoutId = action.payload;
    },
    
    hideToast: (state) => {
      state.toast.visible = false;
      if (state.toast.timeoutId !== null) {
        window.clearTimeout(state.toast.timeoutId);
        state.toast.timeoutId = null;
      }
    },
    
    // View Options
    toggleFormulaBar: (state) => {
      state.viewOptions.showFormulaBar = !state.viewOptions.showFormulaBar;
    },
    
    toggleGridlines: (state) => {
      state.viewOptions.showGridlines = !state.viewOptions.showGridlines;
    },
    
    toggleHeaders: (state) => {
      state.viewOptions.showHeaders = !state.viewOptions.showHeaders;
    },
    
    // Zoom Actions
    setZoom: (state, action: PayloadAction<number>) => {
      state.viewOptions.zoom = Math.max(50, Math.min(200, action.payload));
    },
    
    // Reset Zoom to Default
    resetZoom: (state) => {
      state.viewOptions.zoom = 100;
    },
    
    // Clipboard Operations
    setClipboard: (state, action: PayloadAction<ClipboardState>) => {
      state.clipboard = action.payload;
    },
    
    clearClipboard: (state) => {
      state.clipboard = {
        type: null
      };
    }
  }
});

// Export Actions
export const {
  setEditMode,
  setFormulaBarFocused,
  showContextMenu,
  hideContextMenu,
  showFindReplace,
  hideFindReplace,
  setFindReplaceOptions,
  setFindResults,
  navigateToNextResult,
  navigateToPrevResult,
  showToast,
  setToastTimeout,
  hideToast,
  toggleFormulaBar,
  toggleGridlines,
  toggleHeaders,
  setZoom,
  resetZoom,
  setClipboard,
  clearClipboard
} = uiSlice.actions;

// Toast Thunk Action
export const displayToast = (
  message: string, 
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  duration: number = 3000
): AppThunk => (dispatch: any) => {
  dispatch(showToast({ message, type }));
  
  const timeoutId = window.setTimeout(() => {
    dispatch(hideToast());
  }, duration);
  
  dispatch(setToastTimeout(timeoutId));
};

export default uiSlice.reducer;