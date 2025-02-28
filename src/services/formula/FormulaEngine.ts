// import { CellType } from '../../types/spreadsheet';
import { CellType } from '../../types/spreadsheet';

type CellMap = {
  [cellId: string]: {
    value: string;
    displayValue: string;
    type: CellType;
  };
};

/**
 * Parse a formula string into function name and arguments
 */
export const parseFormula = (formula: string) => {
  if (!formula.startsWith('=')) {
    return { error: 'Not a formula' };
  }
  
  // Remove the equals sign
  const formulaText = formula.substring(1).trim();
  
  // Extract function name and arguments string
  const functionMatch = formulaText.match(/^([A-Z]+)\((.*)\)$/i);
  if (!functionMatch) {
    return { error: 'Invalid formula format' };
  }
  
  const [, functionName, argsStr] = functionMatch;
  
  // Parse arguments
  const args = parseArguments(argsStr);
  
  return {
    functionName,
    args
  };
};

/**
 * Parse the arguments string into individual argument strings
 */
const parseArguments = (argsStr: string): string[] => {
  // Split by commas, but handle the case where commas are within quotes
  const args: string[] = [];
  let currentArg = '';
  let inQuotes = false;
  
  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    
    if (char === '"' && argsStr[i-1] !== '\\') {
      inQuotes = !inQuotes;
      currentArg += char;
    } else if (char === ',' && !inQuotes) {
      args.push(currentArg.trim());
      currentArg = '';
    } else {
      currentArg += char;
    }
  }
  
  if (currentArg) {
    args.push(currentArg.trim());
  }
  
  return args;
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
 * Get the value for a cell reference
 */
const getCellValue = (cellRef: string, cells: CellMap): number | string | null => {
  const cell = cells[cellRef];
  if (!cell) return null;
  
  // Return numeric value if possible
  if (cell.type === 'number') {
    return parseFloat(cell.displayValue);
  }
  
  return cell.displayValue;
};

/**
 * Main function to evaluate formula expressions
 */
export const evaluateFormula = (
  formula: string, 
  cells: CellMap, 
  dependencies: Set<string> = new Set()
): string | number => {
  if (!formula.startsWith('=')) {
    return formula; // Not a formula
  }
  
  try {
    const parsed = parseFormula(formula);
    
    if ('error' in parsed) {
        return parsed.error || '#ERROR!';
    }
    
    const { functionName, args } = parsed;
    
    // Process arguments, expanding ranges and tracking dependencies
    const processedArgs = args.map(arg => {
      // Check if argument is a cell reference or range
      if (/^[A-Z]+\d+$/i.test(arg) || /^[A-Z]+\d+:[A-Z]+\d+$/i.test(arg)) {
        // It's a cell reference or range
        const cellRefs = expandCellRange(arg);
        
        // Add to dependencies
        cellRefs.forEach(ref => dependencies.add(ref));
        
        // Return cell values
        return cellRefs.map(ref => getCellValue(ref, cells));
      } else {
        // It's a literal value
        return isNaN(Number(arg)) ? arg : Number(arg);
      }
    });
    
    // Execute the appropriate function
    return executeMathFunction(functionName, processedArgs) || 
           executeDataQualityFunction(functionName, processedArgs, cells) || 
           '#NAME?'; // Unknown function
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return '#ERROR!';
  }
};

/**
 * Execute mathematical functions
 */
const executeMathFunction = (
  functionName: string, 
  args: Array<any>
): number | string | null => {
  switch (functionName.toUpperCase()) {
    case 'SUM': {
      // Flatten args and filter for numbers
      const values = args.flat().filter(val => typeof val === 'number');
      return values.reduce((sum, val) => sum + val, 0);
    }
    
    case 'AVERAGE': {
      const values = args.flat().filter(val => typeof val === 'number');
      if (values.length === 0) return '#DIV/0!';
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    case 'MAX': {
      const values = args.flat().filter(val => typeof val === 'number');
      if (values.length === 0) return 0;
      return Math.max(...values);
    }
    
    case 'MIN': {
      const values = args.flat().filter(val => typeof val === 'number');
      if (values.length === 0) return 0;
      return Math.min(...values);
    }
    
    case 'COUNT': {
      return args.flat().filter(val => typeof val === 'number').length;
    }
    
    default:
      return null; // Not a math function
  }
};

/**
 * Execute data quality functions
 */
const executeDataQualityFunction = (
  functionName: string, 
  args: Array<any>,
  cells: CellMap
): string | null => {
  switch (functionName.toUpperCase()) {
    case 'TRIM': {
      if (args.length !== 1 || args[0].length !== 1) return '#ERROR!';
      const value = args[0][0];
      return typeof value === 'string' ? value.trim() : String(value);
    }
    
    case 'UPPER': {
      if (args.length !== 1 || args[0].length !== 1) return '#ERROR!';
      const value = args[0][0];
      return typeof value === 'string' ? value.toUpperCase() : String(value).toUpperCase();
    }
    
    case 'LOWER': {
      if (args.length !== 1 || args[0].length !== 1) return '#ERROR!';
      const value = args[0][0];
      return typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase();
    }
    
    // FIND_AND_REPLACE handled in a special way in reducer
    // REMOVE_DUPLICATES handled in a special way in reducer
    
    default:
      return null; // Not a data quality function
  }
};

/**
 * Class to track cell dependencies in formulas
 */
export class DependencyGraph {
  // Map of cell ID to the cells that depend on it
  private dependentsMap: Map<string, Set<string>>;
  
  // Map of cell ID to the cells it depends on
  private dependenciesMap: Map<string, Set<string>>;
  
  constructor() {
    this.dependentsMap = new Map();
    this.dependenciesMap = new Map();
  }
  
  /**
   * Update the dependencies for a cell
   */
  updateDependencies(cellId: string, dependencies: string[]): void {
    // Clear old dependencies
    const oldDependencies = this.dependenciesMap.get(cellId) || new Set();
    oldDependencies.forEach(dep => {
      const dependents = this.dependentsMap.get(dep);
      if (dependents) {
        dependents.delete(cellId);
      }
    });
    
    // Set new dependencies
    const newDependencies = new Set(dependencies);
    this.dependenciesMap.set(cellId, newDependencies);
    
    // Update reverse mapping (dependents)
    dependencies.forEach(dep => {
      if (!this.dependentsMap.has(dep)) {
        this.dependentsMap.set(dep, new Set());
      }
      this.dependentsMap.get(dep)!.add(cellId);
    });
  }
  
  /**
   * Get all cells that depend on the given cell
   */
  getDependents(cellId: string): string[] {
    return Array.from(this.dependentsMap.get(cellId) || []);
  }
  
  /**
   * Get all cells that the given cell depends on
   */
  getDependencies(cellId: string): string[] {
    return Array.from(this.dependenciesMap.get(cellId) || []);
  }
  
  /**
   * Get a topological sort of cells to update
   */
  getTopologicalSort(cellIds: string[]): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (cellId: string) => {
      if (visited.has(cellId)) return;
      if (visiting.has(cellId)) {
        // Circular dependency detected
        return;
      }
      
      visiting.add(cellId);
      
      // Visit all dependents
      const dependents = this.getDependents(cellId);
      dependents.forEach(visit);
      
      visiting.delete(cellId);
      visited.add(cellId);
      result.push(cellId);
    };
    
    cellIds.forEach(visit);
    
    return result;
  }
  
  /**
   * Clear the entire dependency graph
   */
  clear(): void {
    this.dependentsMap.clear();
    this.dependenciesMap.clear();
  }
}

// Create a singleton instance of the dependency graph
export const dependencyGraph = new DependencyGraph();