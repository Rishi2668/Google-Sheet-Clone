// UI-related type definitions

export interface ToastState {
    visible: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timeoutId: number | null;
  }
  
  export interface ContextMenuState {
    visible: boolean;
    position: {
      x: number;
      y: number;
    };
    targetId: string | null; // Cell ID, row ID ("row:1"), or column ID ("col:A")
  }
  
  export interface FindReplaceState {
    visible: boolean;
    findText: string;
    replaceText: string;
    matchCase: boolean;
    matchEntireCell: boolean;
    results: string[]; // Cell IDs matching search criteria
    currentResultIndex: number;
  }
  
  export interface ViewOptionsState {
    showFormulaBar: boolean;
    showGridlines: boolean;
    showHeaders: boolean;
    zoom: number;
  }
  
  export interface UIState {
    editMode: boolean;
    formulaBarFocused: boolean;
    contextMenu: ContextMenuState;
    findReplace: FindReplaceState;
    toast: ToastState;
    viewOptions: ViewOptionsState;
  }