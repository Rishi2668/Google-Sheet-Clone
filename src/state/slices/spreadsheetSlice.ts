import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  Cell, 
  CellType, 
  SelectionRange, 
  SpreadsheetState 
} from '../../types/spreadsheet';
import { 
  evaluateFormula, 
  parseFormula, 
  dependencyGraph, 
  expandCellRange 
} from '../../services/formula/FormulaEngine';

// Helper functions
const determineCellDataType = (value: string): CellType => {
  if (value.startsWith('=')) return 'formula';
  if (!isNaN(parseFloat(value)) && isFinite(Number(value))) return 'number';
  return 'text';
};

// Define the interface for removeDuplicates payload
interface RemoveDuplicatesPayload {
  range: string;
  columnsToCheck: string[];
  hasHeaderRow: boolean;
}
  
// Create initial columns A-Z
const generateInitialColumns = () => {
  const columns: { [colId: string]: { width: number, visible: boolean } } = {};
  for (let i = 65; i <= 90; i++) {
    const colLetter = String.fromCharCode(i);
    columns[colLetter] = { width: 100, visible: true };
  }
  return columns;
};

// Create initial rows 1-100
const generateInitialRows = () => {
  const rows: { [rowId: string]: { height: number, visible: boolean } } = {};
  for (let i = 1; i <= 100; i++) {
    rows[i.toString()] = { height: 25, visible: true };
  }
  return rows;
};

// Initial state
const initialState: SpreadsheetState = {
  cells: {},
  columns: generateInitialColumns(),
  rows: generateInitialRows(),
  selection: {
    active: null,
    ranges: [],
    mode: 'cell' // 'cell', 'range', 'row', 'column'
  },
  activeCell: null,
  history: {
    past: [],
    future: [],
    isBatching: false
  }
};

// Helper function to create formula data
const createFormulaData = (value: string, cells: Record<string, Cell>) => {
  if (!value.startsWith('=')) return null;
  
  try {
    const dependencies = new Set<string>();
    const displayValue = String(evaluateFormula(value, cells, dependencies));
    
    // Get formula info
    const parsed = parseFormula(value);
    if ('error' in parsed) {
      return null;
    }
    
    return {
      expression: value.substring(1), // Remove '='
      dependencies: Array.from(dependencies),
      functionName: parsed.functionName
    };
  } catch (e) {
    return null;
  }
};

// Recalculate all cells that depend on the changed cells
const recalculateDependentCells = (
  state: SpreadsheetState, 
  changedCellIds: string[]
) => {
  // Get all dependent cells
  let dependentCells: string[] = [];
  
  changedCellIds.forEach(cellId => {
    dependentCells = [...dependentCells, ...dependencyGraph.getDependents(cellId)];
  });
  
  // Remove duplicates
  dependentCells = Array.from(new Set(dependentCells));
  
  // Topologically sort for correct evaluation order
  const sortedDependents = dependencyGraph.getTopologicalSort(dependentCells);
  
  // Recalculate dependent cells
  sortedDependents.forEach(cellId => {
    const cell = state.cells[cellId];
    if (cell && cell.type === 'formula' && cell.formula) {
      const dependencies = new Set<string>();
      const newDisplayValue = evaluateFormula(cell.value, state.cells, dependencies);
      
      // Update cell
      state.cells[cellId] = {
        ...cell,
        displayValue: String(newDisplayValue),
        formula: {
          ...cell.formula,
          dependencies: Array.from(dependencies)
        }
      };
      
      // Update dependency graph
      dependencyGraph.updateDependencies(cellId, Array.from(dependencies));
    }
  });
};

// Helper to escape regex special characters
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    // Set cell value
    setCellValue: (state, action: PayloadAction<{ cellId: string, value: string }>) => {
      const { cellId, value } = action.payload;
      const type = determineCellDataType(value);
      
      // Prepare updated cell
      let displayValue = value;
      let formulaData = null;
      
      // Handle formulas
      if (type === 'formula') {
        const dependencies = new Set<string>();
        displayValue = String(evaluateFormula(value, state.cells, dependencies));
        
        // Get formula info
        const parsed = parseFormula(value);
        if (!('error' in parsed)) {
          formulaData = {
            expression: value.substring(1), // Remove '='
            dependencies: Array.from(dependencies),
            functionName: parsed.functionName
          };
        }
      }
      
      // Create or update the cell
      const updatedCell: Cell = {
        id: cellId,
        value,
        displayValue,
        type,
        formula: formulaData,
        format: state.cells[cellId]?.format || {
          bold: false,
          italic: false,
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#000000',
          backgroundColor: null
        }
      };
      
      // Update the cell
      state.cells[cellId] = updatedCell;
      
      // Update dependency graph if it's a formula
      if (type === 'formula' && formulaData) {
        dependencyGraph.updateDependencies(cellId, formulaData.dependencies);
      } else {
        // If it was a formula before but not anymore, clear dependencies
        dependencyGraph.updateDependencies(cellId, []);
      }
      
      // Recalculate cells that depend on this one
      recalculateDependentCells(state, [cellId]);
    },
    
    // Set cell formatting
    setCellFormat: (state, action: PayloadAction<{ 
      cellId: string, 
      format: Partial<Cell['format']> 
    }>) => {
      const { cellId, format } = action.payload;
      
      if (!state.cells[cellId]) {
        // Create cell if it doesn't exist
        state.cells[cellId] = {
          id: cellId,
          value: '',
          displayValue: '',
          type: 'text',
          formula: null,
          format: {
            bold: false,
            italic: false,
            fontSize: 12,
            fontFamily: 'Arial',
            color: '#000000',
            backgroundColor: null,
            ...format
          }
        };
      } else {
        // Update existing cell format
        state.cells[cellId].format = {
          ...state.cells[cellId].format,
          ...format
        };
      }
    },
    
    // Set active cell
    setActiveCell: (state, action: PayloadAction<string | null>) => {
      state.activeCell = action.payload;
      
      // Update selection
      if (action.payload) {
        state.selection = {
          ...state.selection,
          active: action.payload,
          ranges: [{ start: action.payload, end: action.payload }],
          mode: 'cell'
        };
      } else {
        state.selection = {
          active: null,
          ranges: [],
          mode: 'cell'
        };
      }
    },
    
    // Set selection range
    setSelectionRange: (state, action: PayloadAction<SelectionRange>) => {
      const { start, end } = action.payload;
      
      state.selection = {
        ...state.selection,
        ranges: [{ start, end }],
        mode: 'range'
      };
    },
    
    // Add row
    addRow: (state, action: PayloadAction<{ afterRowIndex: number }>) => {
      const { afterRowIndex } = action.payload;
      const newRowIndex = afterRowIndex + 1;
      
      // Shift existing rows
      const updatedRows = { ...state.rows };
      
      Object.keys(state.rows)
        .map(Number)
        .sort((a, b) => b - a) // Sort in descending order to avoid overwriting
        .forEach(rowIndex => {
          if (rowIndex >= newRowIndex) {
            updatedRows[(rowIndex + 1).toString()] = state.rows[rowIndex.toString()];
          }
        });
      
      // Add new row
      updatedRows[newRowIndex.toString()] = { height: 25, visible: true };
      
      // Update cells
      const updatedCells: { [cellId: string]: Cell } = {};
      Object.keys(state.cells).forEach(cellId => {
        const match = cellId.match(/([A-Z]+)(\d+)/);
        if (!match) return;
        
        const [, colLetter, rowStr] = match;
        const rowIndex = parseInt(rowStr);
        
        if (rowIndex < newRowIndex) {
          updatedCells[cellId] = state.cells[cellId];
        } else {
          const newCellId = `${colLetter}${rowIndex + 1}`;
          updatedCells[newCellId] = {
            ...state.cells[cellId],
            id: newCellId
          };
        }
      });
      
      state.rows = updatedRows;
      state.cells = updatedCells;
      
      // Update dependency graph - we need to update all formulas
      // This is a simplified approach; in a real app, we would need to
      // update cell references in formulas too
      dependencyGraph.clear();
      Object.keys(state.cells).forEach(cellId => {
        const cell = state.cells[cellId];
        if (cell.type === 'formula' && cell.formula) {
          dependencyGraph.updateDependencies(cellId, cell.formula.dependencies);
        }
      });
    },
    
    // Delete row
    deleteRow: (state, action: PayloadAction<{ rowIndex: number }>) => {
      const { rowIndex } = action.payload;
      
      // Remove row
      const updatedRows = { ...state.rows };
      delete updatedRows[rowIndex.toString()];
      
      // Shift remaining rows
      Object.keys(updatedRows)
        .map(Number)
        .filter(idx => idx > rowIndex)
        .sort((a, b) => a - b)
        .forEach(idx => {
          updatedRows[(idx - 1).toString()] = updatedRows[idx.toString()];
          delete updatedRows[idx.toString()];
        });
      
      // Update cells
      const updatedCells: { [cellId: string]: Cell } = {};
      Object.keys(state.cells).forEach(cellId => {
        const match = cellId.match(/([A-Z]+)(\d+)/);
        if (!match) return;
        
        const [, colLetter, rowStr] = match;
        const currRowIndex = parseInt(rowStr);
        
        if (currRowIndex < rowIndex) {
          updatedCells[cellId] = state.cells[cellId];
        } else if (currRowIndex > rowIndex) {
          const newCellId = `${colLetter}${currRowIndex - 1}`;
          updatedCells[newCellId] = {
            ...state.cells[cellId],
            id: newCellId
          };
        }
        // Skip cells in the deleted row
      });
      
      state.rows = updatedRows;
      state.cells = updatedCells;
      
      // Update dependency graph
      dependencyGraph.clear();
      Object.keys(state.cells).forEach(cellId => {
        const cell = state.cells[cellId];
        if (cell.type === 'formula' && cell.formula) {
          dependencyGraph.updateDependencies(cellId, cell.formula.dependencies);
        }
      });
    },
    
    // Add column
    addColumn: (state, action: PayloadAction<{ afterColumnLetter: string }>) => {
      const { afterColumnLetter } = action.payload;
      const afterColumnCode = afterColumnLetter.charCodeAt(0);
      const newColumnLetter = String.fromCharCode(afterColumnCode + 1);
      
      // Shift existing columns
      const updatedColumns = { ...state.columns };
      
      Object.keys(state.columns)
        .sort((a, b) => b.charCodeAt(0) - a.charCodeAt(0)) // Sort in descending order
        .forEach(colLetter => {
          const colCode = colLetter.charCodeAt(0);
          if (colCode > afterColumnCode) {
            const shiftedLetter = String.fromCharCode(colCode + 1);
            updatedColumns[shiftedLetter] = state.columns[colLetter];
            delete updatedColumns[colLetter];
          }
        });
      
      // Add new column
      updatedColumns[newColumnLetter] = { width: 100, visible: true };
      
      // Update cells
      const updatedCells: { [cellId: string]: Cell } = {};
      Object.keys(state.cells).forEach(cellId => {
        const match = cellId.match(/([A-Z]+)(\d+)/);
        if (!match) return;
        
        const [, colLetter, rowNum] = match;
        const colCode = colLetter.charCodeAt(0);
        
        if (colCode <= afterColumnCode) {
          updatedCells[cellId] = state.cells[cellId];
        } else {
          const shiftedLetter = String.fromCharCode(colCode + 1);
          const newCellId = `${shiftedLetter}${rowNum}`;
          updatedCells[newCellId] = {
            ...state.cells[cellId],
            id: newCellId
          };
        }
      });
      
      state.columns = updatedColumns;
      state.cells = updatedCells;
      
      // Update dependency graph
      dependencyGraph.clear();
      Object.keys(state.cells).forEach(cellId => {
        const cell = state.cells[cellId];
        if (cell.type === 'formula' && cell.formula) {
          dependencyGraph.updateDependencies(cellId, cell.formula.dependencies);
        }
      });
    },
    
    // Delete column
    deleteColumn: (state, action: PayloadAction<{ columnLetter: string }>) => {
      const { columnLetter } = action.payload;
      const columnCode = columnLetter.charCodeAt(0);
      
      // Remove column
      const updatedColumns = { ...state.columns };
      delete updatedColumns[columnLetter];
      
      // Shift remaining columns
      Object.keys(updatedColumns)
        .filter(col => col.charCodeAt(0) > columnCode)
        .sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0))
        .forEach(col => {
          const colCode = col.charCodeAt(0);
          const newLetter = String.fromCharCode(colCode - 1);
          updatedColumns[newLetter] = updatedColumns[col];
          delete updatedColumns[col];
        });
      
      // Update cells
      const updatedCells: { [cellId: string]: Cell } = {};
      Object.keys(state.cells).forEach(cellId => {
        const match = cellId.match(/([A-Z]+)(\d+)/);
        if (!match) return;
        
        const [, colLetter, rowNum] = match;
        const colCode = colLetter.charCodeAt(0);
        
        if (colCode < columnCode) {
          updatedCells[cellId] = state.cells[cellId];
        } else if (colCode > columnCode) {
          const newLetter = String.fromCharCode(colCode - 1);
          const newCellId = `${newLetter}${rowNum}`;
          updatedCells[newCellId] = {
            ...state.cells[cellId],
            id: newCellId
          };
        }
        // Skip cells in the deleted column
      });
      
      state.columns = updatedColumns;
      state.cells = updatedCells;
      
      // Update dependency graph
      dependencyGraph.clear();
      Object.keys(state.cells).forEach(cellId => {
        const cell = state.cells[cellId];
        if (cell.type === 'formula' && cell.formula) {
          dependencyGraph.updateDependencies(cellId, cell.formula.dependencies);
        }
      });
    },
    
    // Resize column
    resizeColumn: (state, action: PayloadAction<{ columnLetter: string, width: number }>) => {
      const { columnLetter, width } = action.payload;
      
      if (state.columns[columnLetter]) {
        state.columns[columnLetter].width = Math.max(30, width); // Minimum width of 30px
      }
    },
    
    // Resize row
    resizeRow: (state, action: PayloadAction<{ rowIndex: number, height: number }>) => {
      const { rowIndex, height } = action.payload;
      
      if (state.rows[rowIndex.toString()]) {
        state.rows[rowIndex.toString()].height = Math.max(20, height); // Minimum height of 20px
      }
    },
    
    // Remove duplicates from a range
// Remove duplicates from a range
removeDuplicates: (state, action: PayloadAction<RemoveDuplicatesPayload>) => {
    const { range, columnsToCheck, hasHeaderRow } = action.payload;
    
    if (!range || columnsToCheck.length === 0) return;
    
    // Parse range (e.g., "A1:B5")
    const [startCell, endCell] = range.split(':');
    if (!startCell || !endCell) return;
    
    const startMatch = startCell.match(/([A-Z]+)(\d+)/);
    const endMatch = endCell.match(/([A-Z]+)(\d+)/);
    if (!startMatch || !endMatch) return;
    
    const [, startCol, startRow] = startMatch;
    const [, endCol, endRow] = endMatch;
    
    const startColIdx = startCol.charCodeAt(0) - 65;
    const endColIdx = endCol.charCodeAt(0) - 65;
    const startRowIdx = parseInt(startRow);
    const endRowIdx = parseInt(endRow);
    
    // Convert columnsToCheck to array of indices within the range
    const columnIndices = columnsToCheck.map(col => col.charCodeAt(0) - 65)
      .filter(idx => idx >= startColIdx && idx <= endColIdx);
    
    // Determine the starting row (account for header)
    const dataStartRow = hasHeaderRow ? startRowIdx + 1 : startRowIdx;
    
    // Extract rows in the range
    const rows: Array<{ 
      index: number, 
      values: string[], 
      key: string,
      originalCells: Record<string, Cell>
    }> = [];
    
    // Store the original cells for each row
    for (let rowIdx = dataStartRow; rowIdx <= endRowIdx; rowIdx++) {
      const rowData: string[] = [];
      const keyParts: string[] = [];
      const originalCells: Record<string, Cell> = {};
      
      for (let colIdx = startColIdx; colIdx <= endColIdx; colIdx++) {
        const colLetter = String.fromCharCode(colIdx + 65);
        const cellId = `${colLetter}${rowIdx}`;
        const cell = state.cells[cellId];
        
        if (cell) {
          originalCells[cellId] = { ...cell };
          rowData.push(cell.displayValue || '');
        } else {
          rowData.push('');
        }
        
        // Only include selected columns in the key for duplicate checking
        if (columnIndices.includes(colIdx)) {
          const cellValue = state.cells[cellId]?.displayValue || '';
          keyParts.push(cellValue);
        }
      }
      
      // Create a unique key based only on the selected columns
      const key = keyParts.join('|');
      rows.push({ 
        index: rowIdx, 
        values: rowData, 
        key,
        originalCells
      });
    }
    
    // Store the header row if needed
    let headerRow: Record<string, Cell> = {};
    if (hasHeaderRow) {
      for (let colIdx = startColIdx; colIdx <= endColIdx; colIdx++) {
        const colLetter = String.fromCharCode(colIdx + 65);
        const cellId = `${colLetter}${startRowIdx}`;
        if (state.cells[cellId]) {
          headerRow[cellId] = { ...state.cells[cellId] };
        }
      }
    }
    
    // Find the unique rows (keeping the first occurrence of each key)
    const uniqueKeys = new Set<string>();
    const uniqueRows: typeof rows = [];
    
    rows.forEach(row => {
      if (!uniqueKeys.has(row.key)) {
        uniqueKeys.add(row.key);
        uniqueRows.push(row);
      }
    });
    
    // Check if there are any duplicates to remove
    if (uniqueRows.length < rows.length) {
      // Clear all cells in the range first
      for (let rowIdx = startRowIdx; rowIdx <= endRowIdx; rowIdx++) {
        for (let colIdx = startColIdx; colIdx <= endColIdx; colIdx++) {
          const colLetter = String.fromCharCode(colIdx + 65);
          const cellId = `${colLetter}${rowIdx}`;
          
          if (state.cells[cellId]) {
            state.cells[cellId] = {
              ...state.cells[cellId],
              value: '',
              displayValue: '',
              type: 'text',
              formula: null
            };
          }
        }
      }
      
      // Restore the header row if needed
      if (hasHeaderRow) {
        Object.entries(headerRow).forEach(([cellId, cell]) => {
          state.cells[cellId] = cell;
        });
      }
      
      // Fill in the unique rows
      uniqueRows.forEach((row, index) => {
        const targetRowIdx = hasHeaderRow ? (startRowIdx + 1 + index) : (startRowIdx + index);
        
        // Copy all cell data from the original row to the new position
        for (let colIdx = startColIdx; colIdx <= endColIdx; colIdx++) {
          const colLetter = String.fromCharCode(colIdx + 65);
          const originalCellId = `${colLetter}${row.index}`;
          const newCellId = `${colLetter}${targetRowIdx}`;
          
          const originalCell = row.originalCells[originalCellId];
          
          if (originalCell) {
            // Create or update the cell with all original data
            state.cells[newCellId] = {
              ...originalCell,
              id: newCellId
            };
          }
        }
      });
      
      // Update dependency graph for formulas
      dependencyGraph.clear();
      Object.entries(state.cells).forEach(([cellId, cell]) => {
        if (cell.type === 'formula' && cell.formula) {
          dependencyGraph.updateDependencies(cellId, cell.formula.dependencies);
        }
      });
    }
  },
    
    // Set cell editing state
    setCellEditing: (state, action: PayloadAction<{ cellId: string, isEditing: boolean }>) => {
      const { cellId, isEditing } = action.payload;
      
      if (state.cells[cellId]) {
        state.cells[cellId].isEditing = isEditing;
      }
    },
    
    // Find and replace in a range
    findAndReplace: (state, action: PayloadAction<{ 
      findText: string, 
      replaceText: string, 
      range?: string,
      matchCase: boolean,
      matchEntireCell: boolean
    }>) => {
      const { findText, replaceText, range, matchCase, matchEntireCell } = action.payload;
      
      if (!findText) return;
      
      // Determine cells to search
      let searchCells: string[] = [];
      
      if (range) {
        // Search in the given range
        const cellIds = expandCellRange(range);
        searchCells = cellIds.filter(id => state.cells[id]?.type !== 'formula');
      } else {
        // Search in all cells
        searchCells = Object.keys(state.cells).filter(id => state.cells[id]?.type !== 'formula');
      }
      
      // Perform find and replace
      searchCells.forEach(cellId => {
        const cell = state.cells[cellId];
        if (!cell) return;
        
        let cellText = cell.value;
        let searchText = findText;
        
        // Handle case sensitivity
        if (!matchCase) {
          cellText = cellText.toLowerCase();
          searchText = searchText.toLowerCase();
        }
        
        // Check for match
        let newValue: string;
        
        if (matchEntireCell) {
          // Match entire cell
          if (cellText === searchText) {
            newValue = replaceText;
          } else {
            return; // No match
          }
        } else {
          // Replace substring
          if (!cellText.includes(searchText)) {
            return; // No match
          }
          
          // Create regex for replacement
          const regex = new RegExp(escapeRegExp(findText), matchCase ? 'g' : 'gi');
          newValue = cell.value.replace(regex, replaceText);
        }
        
        // Update cell
        if (newValue !== cell.value) {
          state.cells[cellId] = {
            ...cell,
            value: newValue,
            displayValue: newValue,
            type: determineCellDataType(newValue),
            formula: null // Clear formula if it was one
          };
        }
      });
    },
    
    // Set entire spreadsheet state - for loading saved data
    setSpreadsheetState: (state, action: PayloadAction<Partial<SpreadsheetState>>) => {
      const { payload } = action;
      
      // Update state with provided values
      if (payload.cells) state.cells = payload.cells;
      if (payload.columns) state.columns = payload.columns;
      if (payload.rows) state.rows = payload.rows;
      if (payload.selection) state.selection = payload.selection;
      if (payload.activeCell) state.activeCell = payload.activeCell;
      
      // Rebuild dependency graph if cells are updated
      if (payload.cells) {
        dependencyGraph.clear();
        Object.entries(payload.cells).forEach(([cellId, cell]) => {
          if (cell.type === 'formula' && cell.formula) {
            dependencyGraph.updateDependencies(cellId, cell.formula.dependencies);
          }
        });
      }
    },
    
    // Update multiple cells at once (for drag and drop operations)
    updateMultipleCells: (state, action: PayloadAction<Record<string, Partial<Cell>>>) => {
      const updates = action.payload;
      const changedCellIds: string[] = [];
      
      // Apply all updates at once
      Object.entries(updates).forEach(([cellId, cellData]) => {
        // Create the cell if it doesn't exist
        if (!state.cells[cellId]) {
          state.cells[cellId] = {
            id: cellId,
            value: '',
            displayValue: '',
            type: 'text',
            formula: null,
            format: {
              bold: false,
              italic: false,
              fontSize: 12,
              fontFamily: 'Arial',
              color: '#000000',
              backgroundColor: null
            },
            ...cellData
          };
        } else {
          // Update existing cell
          state.cells[cellId] = {
            ...state.cells[cellId],
            ...cellData
          };
        }
        
        changedCellIds.push(cellId);
      });
      
      // Update dependency graph for formulas
      Object.entries(updates).forEach(([cellId, cellData]) => {
        if (cellData.type === 'formula' && cellData.formula) {
          dependencyGraph.updateDependencies(cellId, cellData.formula.dependencies);
        }
      });
      
      // Recalculate dependent cells
      recalculateDependentCells(state, changedCellIds);
    }
  }
});

// export const { 
//   setCellValue, 
//   setCellFormat, 
//   setActiveCell, 
//   setSelectionRange,
//   addRow,
//   deleteRow,
//   addColumn,
//   deleteColumn,
//   resizeColumn,
//   resizeRow,
//   removeDuplicates,
//   setCellEditing,
//   findAndReplace,
//   setSpreadsheetState,

export const { 
  setCellValue, 
  setCellFormat, 
  setActiveCell, 
  setSelectionRange,
  addRow,
  deleteRow,
  addColumn,
  deleteColumn,
  resizeColumn,
  resizeRow,
  removeDuplicates,
  setCellEditing,
  findAndReplace,
  setSpreadsheetState,
  updateMultipleCells
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;