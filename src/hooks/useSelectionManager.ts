import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../state/store';
import { 
  setActiveCell,
  setSelectionRange
} from '../state/slices/spreadsheetSlice';
import {
  setEditMode,
  hideContextMenu
} from '../state/slices/uiSlice';
import {
  colLetterToIndex,
  indexToColLetter,
  parseCellId
} from '../utils/cellUtils';

/**
 * Custom hook for managing cell selection
 */
function useSelectionManager() {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get state from Redux
  const activeCell = useSelector((state: RootState) => 
    state.spreadsheet.activeCell
  );
  
  const selection = useSelector((state: RootState) => 
    state.spreadsheet.selection
  );
  
  const visibleColumns = useSelector((state: RootState) => 
    Object.keys(state.spreadsheet.columns)
      .filter(col => state.spreadsheet.columns[col].visible)
      .sort()
  );
  
  const visibleRows = useSelector((state: RootState) => 
    Object.keys(state.spreadsheet.rows)
      .filter(row => state.spreadsheet.rows[row].visible)
      .sort((a, b) => parseInt(a) - parseInt(b))
  );
  
  /**
   * Handle cell click
   */
  const handleCellClick = useCallback((
    cellId: string,
    event: React.MouseEvent
  ) => {
    // If shift key is pressed, extend the selection
    if (event.shiftKey && activeCell) {
      dispatch(setSelectionRange({
        start: activeCell,
        end: cellId
      }));
    } else {
      // Otherwise, select just this cell
      dispatch(setActiveCell(cellId));
    }
    
    // Hide context menu if open
    dispatch(hideContextMenu());
  }, [dispatch, activeCell]);
  
  /**
   * Handle key navigation
   */
  const handleKeyNavigation = useCallback((
    event: KeyboardEvent
  ) => {
    if (!activeCell) return;
    
    // Parse current cell coordinates
    const [colLetter, rowNum] = parseCellId(activeCell);
    const colIndex = colLetterToIndex(colLetter);
    const rowIndex = visibleRows.indexOf(rowNum.toString());
    
    // If cell is not in our visible range, don't navigate
    if (colIndex < 0 || rowIndex < 0) return;
    
    let newColIndex = colIndex;
    let newRowIndex = rowIndex;
    
    // Handle navigation keys
    switch (event.key) {
      case 'ArrowUp':
        newRowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowDown':
        newRowIndex = Math.min(visibleRows.length - 1, rowIndex + 1);
        break;
      case 'ArrowLeft':
        newColIndex = Math.max(0, colIndex - 1);
        break;
      case 'ArrowRight':
        newColIndex = Math.min(visibleColumns.length - 1, colIndex + 1);
        break;
      case 'Tab':
        if (event.shiftKey) {
          newColIndex = Math.max(0, colIndex - 1);
        } else {
          newColIndex = Math.min(visibleColumns.length - 1, colIndex + 1);
        }
        break;
      case 'Enter':
        if (event.shiftKey) {
          newRowIndex = Math.max(0, rowIndex - 1);
        } else {
          newRowIndex = Math.min(visibleRows.length - 1, rowIndex + 1);
        }
        break;
      case 'Home':
        newColIndex = 0;
        break;
      case 'End':
        newColIndex = visibleColumns.length - 1;
        break;
      case 'PageUp':
        newRowIndex = Math.max(0, rowIndex - 10);
        break;
      case 'PageDown':
        newRowIndex = Math.min(visibleRows.length - 1, rowIndex + 10);
        break;
      case 'Escape':
        dispatch(hideContextMenu());
        dispatch(setEditMode(false));
        return;
      default:
        return; // Not a navigation key
    }
    
    // Prevent default behavior
    event.preventDefault();
    
    // Update active cell if position changed
    if (newColIndex !== colIndex || newRowIndex !== rowIndex) {
      const newColLetter = visibleColumns[newColIndex];
      const newRowStr = visibleRows[newRowIndex];
      const newCellId = `${newColLetter}${newRowStr}`;
      
      // If shift key is pressed, extend selection
      if (event.shiftKey && !event.metaKey && !event.ctrlKey) {
        dispatch(setSelectionRange({
          start: activeCell,
          end: newCellId
        }));
      } else {
        dispatch(setActiveCell(newCellId));
      }
    }
  }, [dispatch, activeCell, visibleColumns, visibleRows]);
  
  /**
   * Select all cells
   */
  const selectAll = useCallback(() => {
    if (visibleColumns.length === 0 || visibleRows.length === 0) return;
    
    const startCell = `${visibleColumns[0]}${visibleRows[0]}`;
    const endCell = `${visibleColumns[visibleColumns.length - 1]}${visibleRows[visibleRows.length - 1]}`;
    
    dispatch(setSelectionRange({
      start: startCell,
      end: endCell
    }));
  }, [dispatch, visibleColumns, visibleRows]);
  
  /**
   * Select entire row
   */
  const selectRow = useCallback((rowIndex: number) => {
    if (visibleColumns.length === 0) return;
    
    const rowStr = rowIndex.toString();
    const startCell = `${visibleColumns[0]}${rowStr}`;
    const endCell = `${visibleColumns[visibleColumns.length - 1]}${rowStr}`;
    
    dispatch(setSelectionRange({
      start: startCell,
      end: endCell
    }));
  }, [dispatch, visibleColumns]);
  
  /**
   * Select entire column
   */
  const selectColumn = useCallback((colLetter: string) => {
    if (visibleRows.length === 0) return;
    
    const startCell = `${colLetter}${visibleRows[0]}`;
    const endCell = `${colLetter}${visibleRows[visibleRows.length - 1]}`;
    
    dispatch(setSelectionRange({
      start: startCell,
      end: endCell
    }));
  }, [dispatch, visibleRows]);
  
  return {
    handleCellClick,
    handleKeyNavigation,
    selectAll,
    selectRow,
    selectColumn
  };
}

export default useSelectionManager;