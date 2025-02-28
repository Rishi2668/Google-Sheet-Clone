import React, { useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import { setActiveCell, setSelectionRange } from '../../state/slices/spreadsheetSlice';
import { setEditMode, hideContextMenu } from '../../state/slices/uiSlice';
import Cell from './Cell';
import ColumnHeader from './ColumnHeader';
import RowHeader from './RowHeader';
import CornerCell from './CornerCell';
import useVirtualGrid from '../../hooks/useVirtualGrid';

const GridContainer = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
  background-color: #f8f9fa;
`;

const GridContent = styled.div`
  display: grid;
  position: relative;
  background-color: white;
`;

const RowContainer = styled.div`
  display: flex;
  height: 25px; // Default height
`;

const ColumnHeadersContainer = styled.div`
  display: flex;
  position: sticky;
  top: 0;
  z-index: 3;
  background-color: #f8f9fa;
`;

const RowHeadersContainer = styled.div`
  position: sticky;
  left: 0;
  z-index: 2;
  background-color: #f8f9fa;
`;

const Grid: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const gridRef = useRef<HTMLDivElement>(null);

  // Get state from Redux
  const columns = useSelector((state: RootState) => state.spreadsheet.columns);
  const rows = useSelector((state: RootState) => state.spreadsheet.rows);
  const activeCell = useSelector((state: RootState) => state.spreadsheet.activeCell);
  const showHeaders = useSelector((state: RootState) => state.ui.viewOptions.showHeaders);
  const zoom = useSelector((state: RootState) => state.ui.viewOptions.zoom);

  // Get visible columns and rows
  const visibleColumns = Object.keys(columns)
    .filter(col => columns[col].visible)
    .sort();

  const visibleRows = Object.keys(rows)
    .filter(row => rows[row].visible)
    .sort((a, b) => parseInt(a) - parseInt(b));

  // Use virtual grid hook to optimize rendering
  const { 
    containerRef, 
    viewportState,
    scrollTo
  } = useVirtualGrid({
    totalRows: visibleRows.length,
    totalColumns: visibleColumns.length,
    defaultRowHeight: 25,
    defaultColumnWidth: 100,
    rows,
    columns
  });

  // Handle grid click to deselect
  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle direct clicks on the grid container (not its children)
    if (e.target === e.currentTarget) {
      dispatch(setActiveCell(null));
      dispatch(hideContextMenu());
    }
  };

  // Scroll to active cell when it changes
  useEffect(() => {
    if (activeCell && gridRef.current) {
      const [, col, row] = activeCell.match(/([A-Z]+)(\d+)/) || [];
      
      if (col && row) {
        // Find the column and row index
        const colIndex = visibleColumns.indexOf(col);
        const rowIndex = visibleRows.indexOf(row);
        
        if (colIndex >= 0 && rowIndex >= 0) {
          scrollTo(colIndex, rowIndex);
        }
      }
    }
  }, [activeCell, scrollTo, visibleColumns, visibleRows]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!activeCell) return;
    
    // Get current coordinates
    const [, col, row] = activeCell.match(/([A-Z]+)(\d+)/) || [];
    if (!col || !row) return;
    
    const colIndex = visibleColumns.indexOf(col);
    const rowIndex = visibleRows.indexOf(row);
    
    if (colIndex < 0 || rowIndex < 0) return;
    
    let newColIndex = colIndex;
    let newRowIndex = rowIndex;
    
    // Handle arrow keys
    switch (e.key) {
      case 'ArrowUp':
        newRowIndex = Math.max(0, rowIndex - 1);
        e.preventDefault();
        break;
      case 'ArrowDown':
        newRowIndex = Math.min(visibleRows.length - 1, rowIndex + 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        newColIndex = Math.max(0, colIndex - 1);
        e.preventDefault();
        break;
      case 'ArrowRight':
        newColIndex = Math.min(visibleColumns.length - 1, colIndex + 1);
        e.preventDefault();
        break;
      case 'Tab':
        if (e.shiftKey) {
          newColIndex = Math.max(0, colIndex - 1);
        } else {
          newColIndex = Math.min(visibleColumns.length - 1, colIndex + 1);
        }
        e.preventDefault();
        break;
      case 'Enter':
        if (e.shiftKey) {
          newRowIndex = Math.max(0, rowIndex - 1);
        } else {
          newRowIndex = Math.min(visibleRows.length - 1, rowIndex + 1);
        }
        e.preventDefault();
        break;
      case 'Escape':
        dispatch(hideContextMenu());
        dispatch(setEditMode(false));
        break;
      default:
        return; // Let other keys pass through
    }
    
    // Update active cell if coordinates changed
    if (newColIndex !== colIndex || newRowIndex !== rowIndex) {
      const newCol = visibleColumns[newColIndex];
      const newRow = visibleRows[newRowIndex];
      const newCellId = `${newCol}${newRow}`;
      
      if (e.shiftKey && e.altKey === false && e.ctrlKey === false) {
        // Extend selection with Shift
        dispatch(setSelectionRange({
          start: activeCell,
          end: newCellId
        }));
      } else {
        // Move active cell
        dispatch(setActiveCell(newCellId));
      }
      
      // Scroll into view if needed
      scrollTo(newColIndex, newRowIndex);
    }
  }, [activeCell, dispatch, visibleColumns, visibleRows, scrollTo]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Compute styles for the grid container
  const gridStyle = {
    '--grid-zoom': `${zoom}%`,
  } as React.CSSProperties;

  // Calculate the range of rows and columns to render
  const { startRow, endRow, startCol, endCol } = viewportState;
  
  // Create visible rows and columns
  const visibleRowsToRender = visibleRows.slice(startRow, endRow + 1);
  const visibleColsToRender = visibleColumns.slice(startCol, endCol + 1);

  return (
    <GridContainer
      ref={containerRef}
      style={gridStyle}
      onClick={handleGridClick}
    >
      <GridContent>
        {/* Corner cell (top-left) */}
        {showHeaders && <CornerCell />}
        
        {/* Column headers */}
        {showHeaders && (
          <ColumnHeadersContainer>
            {visibleColsToRender.map(col => (
              <ColumnHeader
                key={col}
                column={col}
                width={columns[col].width}
              />
            ))}
          </ColumnHeadersContainer>
        )}
        
        {/* Rows and cells */}
        <div>
          {visibleRowsToRender.map(row => (
            <RowContainer key={row} style={{ height: rows[row].height }}>
              {/* Row header */}
              {showHeaders && (
                <RowHeader
                  row={row}
                  height={rows[row].height}
                />
              )}
              
              {/* Cells in the row */}
              {visibleColsToRender.map(col => (
                <Cell
                  key={`${col}${row}`}
                  cellId={`${col}${row}`}
                />
              ))}
            </RowContainer>
          ))}
        </div>
      </GridContent>
    </GridContainer>
  );
};

export default Grid;