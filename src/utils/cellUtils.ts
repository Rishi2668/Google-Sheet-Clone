/**
 * Utility functions for cell operations and conversions
 */

/**
 * Convert column letter to index (A -> 0, B -> 1, etc.)
 */
export const colLetterToIndex = (colLetter: string): number => {
    let index = 0;
    for (let i = 0; i < colLetter.length; i++) {
      index = index * 26 + (colLetter.charCodeAt(i) - 64);
    }
    return index - 1; // 0-based index
  };
  
  /**
   * Convert index to column letter (0 -> A, 1 -> B, etc.)
   */
  export const indexToColLetter = (index: number): string => {
    let colLetter = '';
    index += 1; // 1-based for conversion
    
    while (index > 0) {
      const remainder = (index - 1) % 26;
      colLetter = String.fromCharCode(65 + remainder) + colLetter;
      index = Math.floor((index - 1) / 26);
    }
    
    return colLetter;
  };
  
  /**
   * Parse cell ID into column and row components
   */
  export const parseCellId = (cellId: string): [string, number] => {
    const match = cellId.match(/([A-Z]+)(\d+)/);
    if (!match) {
      throw new Error(`Invalid cell ID: ${cellId}`);
    }
    
    const [, colLetter, rowStr] = match;
    return [colLetter, parseInt(rowStr)];
  };
  
  /**
   * Create cell ID from column and row
   */
  export const createCellId = (colLetter: string, row: number): string => {
    return `${colLetter}${row}`;
  };
  
  /**
   * Check if a cell is within a range
   */
  export const isCellInRange = (
    cellId: string, 
    startCell: string, 
    endCell: string
  ): boolean => {
    const [cellCol, cellRow] = parseCellId(cellId);
    const [startCol, startRow] = parseCellId(startCell);
    const [endCol, endRow] = parseCellId(endCell);
    
    const cellColIndex = colLetterToIndex(cellCol);
    const startColIndex = colLetterToIndex(startCol);
    const endColIndex = colLetterToIndex(endCol);
    
    const minColIndex = Math.min(startColIndex, endColIndex);
    const maxColIndex = Math.max(startColIndex, endColIndex);
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    
    return (
      cellColIndex >= minColIndex &&
      cellColIndex <= maxColIndex &&
      cellRow >= minRow &&
      cellRow <= maxRow
    );
  };
  
  /**
   * Expand a cell range (e.g., 'A1:B3') into individual cell references
   */
  export const expandCellRange = (range: string): string[] => {
    // Check if it's a range
    const rangeMatch = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!rangeMatch) {
      return [range]; // Not a range, return the single cell reference
    }
    
    const [, startCol, startRow, endCol, endRow] = rangeMatch;
    
    const startColIndex = colLetterToIndex(startCol);
    const endColIndex = colLetterToIndex(endCol);
    const startRowIndex = parseInt(startRow);
    const endRowIndex = parseInt(endRow);
    
    const cellRefs: string[] = [];
    
    for (let rowIndex = Math.min(startRowIndex, endRowIndex); 
         rowIndex <= Math.max(startRowIndex, endRowIndex); 
         rowIndex++) {
      for (let colIndex = Math.min(startColIndex, endColIndex); 
           colIndex <= Math.max(startColIndex, endColIndex); 
           colIndex++) {
        const colLetter = indexToColLetter(colIndex);
        cellRefs.push(`${colLetter}${rowIndex}`);
      }
    }
    
    return cellRefs;
  };
  
  /**
   * Get the address of a cell relative to another cell
   * @param fromCell The reference cell
   * @param toCell The target cell
   * @param absolute Whether to use absolute references
   */
  export const getRelativeCellAddress = (
    fromCell: string,
    toCell: string,
    absolute = false
  ): string => {
    const [fromCol, fromRow] = parseCellId(fromCell);
    const [toCol, toRow] = parseCellId(toCell);
    
    const fromColIndex = colLetterToIndex(fromCol);
    const toColIndex = colLetterToIndex(toCol);
    
    if (absolute) {
      return `${toCol}${toRow}`;
    }
    
    return `${toCol}${toRow}`;
  };
  
  /**
   * Check if a value is a valid cell reference
   */
  export const isValidCellReference = (value: string): boolean => {
    return /^[A-Z]+\d+$/.test(value);
  };
  
  /**
   * Check if a value is a valid cell range
   */
  export const isValidCellRange = (value: string): boolean => {
    return /^[A-Z]+\d+:[A-Z]+\d+$/.test(value);
  };
  
  /**
   * Get the cell address displayed in the formula
   */
  export const getDisplayCellAddress = (cellId: string, absolute = false): string => {
    if (absolute) {
      const [col, row] = parseCellId(cellId);
      return `${col}${row}`;
    }
    return cellId;
  };