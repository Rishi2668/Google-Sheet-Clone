/**
 * Utility functions for keyboard handling
 */

/**
 * Check if a keyboard event is a navigation key
 */
export const isNavigationKey = (event: KeyboardEvent): boolean => {
    return [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Enter',
      'Home',
      'End',
      'PageUp',
      'PageDown'
    ].includes(event.key);
  };
  
  /**
   * Check if a keyboard event is a modifier key
   */
  export const isModifierKey = (event: KeyboardEvent): boolean => {
    return [
      'Shift',
      'Control',
      'Alt',
      'Meta',
      'CapsLock',
      'Escape'
    ].includes(event.key);
  };
  
  /**
   * Check if a keyboard event is a special key (not a character input)
   */
  export const isSpecialKey = (event: KeyboardEvent): boolean => {
    return isNavigationKey(event) || isModifierKey(event);
  };
  
  /**
   * Check if a keyboard event is a shortcut combination
   */
  export const isShortcutKey = (event: KeyboardEvent): boolean => {
    return event.ctrlKey || event.metaKey;
  };
  
  /**
   * Handle keyboard shortcuts for the spreadsheet
   */
  export const handleShortcut = (
    event: KeyboardEvent, 
    handlers: {
      [key: string]: () => void;
    }
  ): boolean => {
    // Common shortcut keys
    const shortcuts: { [key: string]: string } = {
      'c': 'copy',
      'x': 'cut',
      'v': 'paste',
      'z': 'undo',
      'y': 'redo',
      'b': 'bold',
      'i': 'italic',
      'f': 'find',
      'h': 'replace',
      's': 'save',
      'a': 'selectAll'
    };
    
    // Check if the event is a known shortcut
    if (isShortcutKey(event) && shortcuts[event.key.toLowerCase()]) {
      const action = shortcuts[event.key.toLowerCase()];
      
      // If we have a handler for this action, execute it
      if (handlers[action]) {
        event.preventDefault();
        handlers[action]();
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Common keyboard shortcuts map for documentation
   */
  export const KEYBOARD_SHORTCUTS = {
    NAVIGATION: [
      { key: 'Arrow Keys', description: 'Move active cell' },
      { key: 'Tab', description: 'Move right one cell' },
      { key: 'Shift+Tab', description: 'Move left one cell' },
      { key: 'Enter', description: 'Move down one cell' },
      { key: 'Shift+Enter', description: 'Move up one cell' },
      { key: 'Home', description: 'Move to the beginning of the row' },
      { key: 'Ctrl+Home', description: 'Move to the beginning of the sheet (A1)' },
      { key: 'End', description: 'Move to the last cell in the row with data' },
      { key: 'Ctrl+End', description: 'Move to the last cell with data' }
    ],
    SELECTION: [
      { key: 'Shift+Arrow Keys', description: 'Extend selection' },
      { key: 'Ctrl+Space', description: 'Select entire column' },
      { key: 'Shift+Space', description: 'Select entire row' },
      { key: 'Ctrl+A', description: 'Select all cells' }
    ],
    EDITING: [
      { key: 'F2', description: 'Edit active cell' },
      { key: 'Escape', description: 'Cancel editing' },
      { key: 'Delete', description: 'Clear contents of selected cells' },
      { key: 'Ctrl+B', description: 'Toggle bold' },
      { key: 'Ctrl+I', description: 'Toggle italic' }
    ],
    CLIPBOARD: [
      { key: 'Ctrl+C', description: 'Copy selected cells' },
      { key: 'Ctrl+X', description: 'Cut selected cells' },
      { key: 'Ctrl+V', description: 'Paste from clipboard' }
    ],
    FORMULAS: [
      { key: '=', description: 'Start a formula' },
      { key: 'Ctrl+Enter', description: 'Complete formula without moving' }
    ],
    MISC: [
      { key: 'Ctrl+F', description: 'Find' },
      { key: 'Ctrl+H', description: 'Find and replace' },
      { key: 'Ctrl+Z', description: 'Undo' },
      { key: 'Ctrl+Y', description: 'Redo' },
      { key: 'Ctrl+S', description: 'Save' }
    ]
  };
// ... (existing imports and code)

/**
 * Check if a keyboard event is a navigation key that should be handled by the spreadsheet
 */
export const isSpreadsheetNavigationKey = (event: KeyboardEvent): boolean => {
    return [
      'Tab',
      'Enter',
      'Home',
      'End',
      'PageUp',
      'PageDown'
    ].includes(event.key);
  };
  
  /**
   * Handle keyboard events for the spreadsheet
   */
  export const handleKeyboardEvent = (
    event: KeyboardEvent,
    handlers: {
      [key: string]: () => void;
    },
    activeCell: HTMLInputElement | null
  ): boolean => {
    // Check if the event is a known shortcut
    if (handleShortcut(event, handlers)) {
      return true;
    }
  
    // Check if the event is a navigation key
    if (isNavigationKey(event)) {
      // If the active cell is being edited, handle arrow keys for text navigation
      if (activeCell && document.activeElement === activeCell) {
        handleArrowKeysInCell(event, activeCell);
        return true;
      }
  
      // Otherwise, handle spreadsheet navigation
      if (isSpreadsheetNavigationKey(event)) {
        // TODO: Implement spreadsheet navigation logic here
        return true;
      }
    }
  
    return false;
  };
  
  /**
   * Handle arrow key navigation within a cell's text
   */
/**
 * Handle arrow key navigation within a cell's text
 */
const handleArrowKeysInCell = (event: KeyboardEvent, cell: HTMLInputElement) => {
    const cursorPosition = cell.selectionStart;
    const textLength = cell.value.length;
  
    if (cursorPosition !== null) {
      if (event.key === 'ArrowLeft' && cursorPosition > 0) {
        event.preventDefault();
        cell.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
      } else if (event.key === 'ArrowRight' && cursorPosition < textLength) {
        event.preventDefault();
        cell.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
      }
    }
  };
  
  // ... (existing code and exports)