export type CellType = 'text' | 'number' | 'formula' | 'date' | 'error';

export type CellValue = string | number | null;

export interface CellFormat {
  bold: boolean;
  italic: boolean;
  fontSize: number;
  fontFamily: string; // Added font family support
  color: string;
  backgroundColor: string | null;
}

export interface FormulaData {
  expression: string;
  dependencies: string[];
  functionName: string;
}

export interface Cell {
  id: string;
  value: string;
  displayValue: string;
  type: CellType;
  formula: FormulaData | null;
  format: CellFormat;
  isEditing?: boolean;
}

export interface ColumnConfig {
  width: number;
  visible: boolean;
}

export interface RowConfig {
  height: number;
  visible: boolean;
}

export interface SelectionRange {
  start: string;
  end: string;
}

export type SelectionMode = 'cell' | 'range' | 'row' | 'column';

export interface Selection {
  active: string | null;
  ranges: SelectionRange[];
  mode: SelectionMode;
}

export interface SpreadsheetState {
  cells: { [cellId: string]: Cell };
  columns: { [colId: string]: ColumnConfig };
  rows: { [rowId: string]: RowConfig };
  selection: Selection;
  activeCell: string | null;
  history: {
    past: Array<any>;
    future: Array<any>;
    isBatching: boolean;
  };
}