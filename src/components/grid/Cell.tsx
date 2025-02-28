import React, { useRef, useEffect, useState, KeyboardEvent, MouseEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState, AppDispatch } from '../../state/store';
import { 
  setCellValue, 
  setActiveCell, 
  setSelectionRange,
  setCellEditing,
  setCellFormat,
  updateMultipleCells
} from '../../state/slices/spreadsheetSlice';
import { 
  setEditMode, 
  showContextMenu,
} from '../../state/slices/uiSlice';
import { Cell as CellType } from '../../types/spreadsheet';

interface CellProps {
  cellId: string;
}

interface StyledCellProps {
  isActive: boolean;
  isSelected: boolean;
  isEditing: boolean;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string | null;
  columnWidth: number;
  rowHeight: number;
}

const StyledCell = styled.div<StyledCellProps>`
  position: relative;
  width: ${props => props.columnWidth}px;
  height: ${props => props.rowHeight}px;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  padding: 3px 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: ${props => props.bold ? 'bold' : 'normal'};
  font-style: ${props => props.italic ? 'italic' : 'normal'};
  font-size: ${props => props.fontSize || 13}px;
  font-family: ${props => props.fontFamily || 'Arial'}, sans-serif;
  color: ${props => props.color || '#000'};
  background-color: ${props => props.backgroundColor || '#fff'};
  user-select: none;
  
  /* Active and selected states */
  ${props => props.isActive && `
    outline: 2px solid #1a73e8;
    outline-offset: -2px;
    z-index: 2;
  `}
  
  ${props => props.isSelected && !props.isActive && `
    background-color: rgba(26, 115, 232, 0.1);
  `}
  
  /* Hover state */
  &:hover {
    ${props => !props.isActive && !props.isSelected && `
      background-color: rgba(0, 0, 0, 0.02);
    `}
  }
`;

const DragHandle = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 8px;
  height: 8px;
  background-color: #1a73e8;
  cursor: crosshair;
  z-index: 3;
  
  /* Show only on active cell and not in edit mode */
  display: block;
`;

const CellInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 3px 6px;
  border: none;
  outline: none;
  font: inherit;
  background: white;
  z-index: 3;
`;

const Cell: React.FC<CellProps> = ({ cellId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  
  // Parse the cell ID to get column and row
  const [, columnLetter, rowIndex] = cellId.match(/([A-Z]+)(\d+)/) || [];
  
  // Get cell data from Redux
  const cell = useSelector((state: RootState) => 
    state.spreadsheet.cells[cellId]
  );
  
  const activeCell = useSelector((state: RootState) => 
    state.spreadsheet.activeCell
  );
  
  const selection = useSelector((state: RootState) => 
    state.spreadsheet.selection
  );
  
  const editMode = useSelector((state: RootState) => 
    state.ui.editMode
  );
  
  const columnWidth = useSelector((state: RootState) => 
    state.spreadsheet.columns[columnLetter]?.width || 100
  );
  
  const rowHeight = useSelector((state: RootState) => 
    state.spreadsheet.rows[rowIndex]?.height || 25
  );

  // All cells in the spreadsheet - needed for selection operations
  const allCells = useSelector((state: RootState) => 
    state.spreadsheet.cells
  );
  
  // Local state for input value during editing
  const [inputValue, setInputValue] = useState('');
  
  // State for drag operation
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<string | null>(null);
  
  // Check if this cell is part of the current selection
  const isInSelection = React.useMemo(() => {
    if (selection.ranges.length === 0) return false;
    
    for (const range of selection.ranges) {
      const { start, end } = range;
      
      // Parse the range boundaries
      const startMatch = start.match(/([A-Z]+)(\d+)/);
      const endMatch = end.match(/([A-Z]+)(\d+)/);
      
      if (!startMatch || !endMatch) continue;
      
      const [, startCol, startRow] = startMatch;
      const [, endCol, endRow] = endMatch;
      
      // Convert letters to codes for comparison
      const startColCode = startCol.charCodeAt(0);
      const endColCode = endCol.charCodeAt(0);
      const colCode = columnLetter.charCodeAt(0);
      
      // Convert row strings to numbers
      const startRowNum = parseInt(startRow);
      const endRowNum = parseInt(endRow);
      const rowNum = parseInt(rowIndex);
      
      // Check if cell is within range bounds
      if (colCode >= Math.min(startColCode, endColCode) && 
          colCode <= Math.max(startColCode, endColCode) &&
          rowNum >= Math.min(startRowNum, endRowNum) && 
          rowNum <= Math.max(startRowNum, endRowNum)) {
        return true;
      }
    }
    
    return false;
  }, [selection.ranges, columnLetter, rowIndex]);
  
  // Determine if the cell is active
  const isActive = activeCell === cellId;
  
  // Effect to focus input when entering edit mode
  useEffect(() => {
    if (isActive && editMode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectionStart = inputRef.current.value.length;
      inputRef.current.selectionEnd = inputRef.current.value.length;
    }
  }, [isActive, editMode]);
  
  // Update input value when the active cell changes
  useEffect(() => {
    if (cell) {
      setInputValue(cell.value);
    } else {
      setInputValue('');
    }
  }, [cell, isActive]);
  
  // Handle cell click
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    // If shift key is held, extend selection
    if (e.shiftKey && activeCell) {
      dispatch(setSelectionRange({
        start: activeCell,
        end: cellId
      }));
    } else {
      // Otherwise just select this cell
      dispatch(setActiveCell(cellId));
      
      // If already in edit mode, keep it active
      if (!editMode && e.detail === 2) {
        // Double click
        dispatch(setEditMode(true));
        
        // Ensure the cell has a value in the store
        if (!cell) {
          dispatch(setCellValue({ 
            cellId, 
            value: '' 
          }));
        }
        
        dispatch(setCellEditing({ 
          cellId, 
          isEditing: true 
        }));
      }
    }
  };
  
  // Handle keydown in view mode
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isActive || editMode) return;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter edit mode
      dispatch(setEditMode(true));
      dispatch(setCellEditing({ 
        cellId, 
        isEditing: true 
      }));
      e.preventDefault();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Start editing with the pressed key
      dispatch(setEditMode(true));
      dispatch(setCellEditing({ 
        cellId, 
        isEditing: true 
      }));
      setInputValue(e.key);
      e.preventDefault();
    }
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  // Handle input blur (finish editing)
  const handleInputBlur = () => {
    finishEditing();
  };
  
  // Handle keydown in edit mode
  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      finishEditing();
      e.preventDefault();
      
      // Move to next row
      const nextCellId = `${columnLetter}${parseInt(rowIndex) + 1}`;
      dispatch(setActiveCell(nextCellId));
    } else if (e.key === 'Escape') {
      // Cancel editing
      cancelEditing();
      e.preventDefault();
    } else if (e.key === 'Tab') {
      finishEditing();
      e.preventDefault();
      
      // Move to next column
      const nextColCode = columnLetter.charCodeAt(0) + 1;
      const nextColumnLetter = String.fromCharCode(nextColCode);
      const nextCellId = `${nextColumnLetter}${rowIndex}`;
      dispatch(setActiveCell(nextCellId));
    }
  };
  
  // Finish editing and save the value
  const finishEditing = () => {
    dispatch(setCellValue({ 
      cellId, 
      value: inputValue 
    }));
    dispatch(setEditMode(false));
    dispatch(setCellEditing({ 
      cellId, 
      isEditing: false 
    }));
  };
  
  // Cancel editing and revert to the original value
  const cancelEditing = () => {
    setInputValue(cell?.value || '');
    dispatch(setEditMode(false));
    dispatch(setCellEditing({ 
      cellId, 
      isEditing: false 
    }));
  };
  
  // Handle right-click for context menu
  const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Select the cell if it's not already active
    if (!isActive) {
      dispatch(setActiveCell(cellId));
    }
    
    // Fixed: Show context menu at mouse position with correct parameter structure
    dispatch(showContextMenu({
      position: {
        x: e.clientX,
        y: e.clientY
      },
      targetId: cellId
    }));
  };
  
  // IMPROVED FILL HANDLE FUNCTIONALITY
  // Drag handle mouse down handler
  const handleDragHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Ensure the cell is active
    if (!isActive) {
      dispatch(setActiveCell(cellId));
    }
    
    // Start fill drag operation
    setIsDragging(true);
    setDragStartCell(cellId);
    
    // Visual indicator for the selection during dragging
    dispatch(setSelectionRange({
      start: cellId,
      end: cellId
    }));
    
    // Fixed: Properly type the event handlers for global mouse events
    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      if (!isDragging) return;
      
      // Find the cell element under the current mouse position
      const elemBelow = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const cellBelow = elemBelow?.closest('[data-cell-id]') as HTMLElement | null;
      
      if (cellBelow) {
        const targetCellId = cellBelow.getAttribute('data-cell-id');
        
        if (targetCellId) {
          // Update selection to show the fill range
          dispatch(setSelectionRange({
            start: cellId,
            end: targetCellId
          }));
        }
      }
    };
    
    const handleMouseUp = (upEvent: globalThis.MouseEvent) => {
      if (!isDragging) return;
      
      // Find the cell element under the current mouse position for the final drop
      const elemBelow = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
      const cellBelow = elemBelow?.closest('[data-cell-id]') as HTMLElement | null;
      
      if (cellBelow && dragStartCell) {
        const targetCellId = cellBelow.getAttribute('data-cell-id');
        
        if (targetCellId) {
          // Apply the fill operation to the entire range
          fillRange(dragStartCell, targetCellId);
        }
      }
      
      // Clean up
      setIsDragging(false);
      setDragStartCell(null);
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Fixed: Add the event listeners with correct typing
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Helper to fill a range of cells with the content from the source cell
  const fillRange = (sourceCellId: string, targetCellId: string) => {
    // Parse source and target cells
    const sourceMatch = sourceCellId.match(/([A-Z]+)(\d+)/);
    const targetMatch = targetCellId.match(/([A-Z]+)(\d+)/);
    
    if (!sourceMatch || !targetMatch) return;
    
    const [, sourceCol, sourceRow] = sourceMatch;
    const [, targetCol, targetRow] = targetMatch;
    
    const sourceColCode = sourceCol.charCodeAt(0);
    const targetColCode = targetCol.charCodeAt(0);
    const sourceRowNum = parseInt(sourceRow);
    const targetRowNum = parseInt(targetRow);
    
    // Get the source cell data
    const sourceCell = allCells[sourceCellId];
    if (!sourceCell) return;
    
    // Calculate the range for filling
    const startColCode = Math.min(sourceColCode, targetColCode);
    const endColCode = Math.max(sourceColCode, targetColCode);
    const startRowNum = Math.min(sourceRowNum, targetRowNum);
    const endRowNum = Math.max(sourceRowNum, targetRowNum);
    
    // Determine fill direction
    const fillDown = targetRowNum > sourceRowNum;
    const fillRight = targetColCode > sourceColCode;
    
    // Batch updates for better performance
    const updates: Record<string, Partial<CellType>> = {};
    
    // If filling down (vertically)
    if (fillDown && startColCode === endColCode) {
      // Apply source cell to all cells in the column
      for (let row = startRowNum + 1; row <= endRowNum; row++) {
        const targetCellId = `${sourceCol}${row}`;
        
        // Copy all properties from source cell
        updates[targetCellId] = {
          value: sourceCell.value,
          displayValue: sourceCell.displayValue,
          type: sourceCell.type,
          format: { ...sourceCell.format },
          formula: sourceCell.formula ? { ...sourceCell.formula } : null
        };
      }
    } 
    // If filling right (horizontally)
    else if (fillRight && startRowNum === endRowNum) {
      // Apply source cell to all cells in the row
      for (let colCode = startColCode + 1; colCode <= endColCode; colCode++) {
        const col = String.fromCharCode(colCode);
        const targetCellId = `${col}${sourceRow}`;
        
        // Copy all properties from source cell
        updates[targetCellId] = {
          value: sourceCell.value,
          displayValue: sourceCell.displayValue,
          type: sourceCell.type,
          format: { ...sourceCell.format },
          formula: sourceCell.formula ? { ...sourceCell.formula } : null
        };
      }
    }
    // If filling in both directions (area)
    else {
      // Apply source cell to all cells in the area
      for (let colCode = startColCode; colCode <= endColCode; colCode++) {
        const col = String.fromCharCode(colCode);
        
        for (let row = startRowNum; row <= endRowNum; row++) {
          const cellId = `${col}${row}`;
          
          // Skip the source cell
          if (cellId === sourceCellId) continue;
          
          // Copy all properties from source cell
          updates[cellId] = {
            value: sourceCell.value,
            displayValue: sourceCell.displayValue,
            type: sourceCell.type,
            format: { ...sourceCell.format },
            formula: sourceCell.formula ? { ...sourceCell.formula } : null
          };
        }
      }
    }
    
    // Apply all updates at once
    if (Object.keys(updates).length > 0) {
      dispatch(updateMultipleCells(updates));
    }
    
    // Maintain the selection to show what was filled
    dispatch(setSelectionRange({
      start: sourceCellId,
      end: targetCellId
    }));
  };
  
  // Format properties
  const format = cell?.format || {
    bold: false,
    italic: false,
    fontSize: 13,
    fontFamily: 'Arial',
    color: '#000000',
    backgroundColor: null
  };
  
  return (
    <StyledCell
      ref={cellRef}
      id={`cell-${cellId}`}
      isActive={isActive}
      isSelected={isInSelection}
      isEditing={Boolean(cell?.isEditing)}
      bold={format.bold}
      italic={format.italic}
      fontSize={format.fontSize}
      fontFamily={format.fontFamily}
      color={format.color}
      backgroundColor={format.backgroundColor}
      columnWidth={columnWidth}
      rowHeight={rowHeight}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
      tabIndex={isActive && !editMode ? 0 : -1}
      data-cell-id={cellId}
    >
      {isActive && editMode ? (
        <CellInput
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          autoFocus
        />
      ) : (
        cell?.displayValue || ''
      )}
      
      {/* Drag handle for fill (only visible on active cell) */}
      {isActive && !editMode && (
        <DragHandle 
          onMouseDown={handleDragHandleMouseDown} 
          title="Fill handle: drag to fill adjacent cells"
        />
      )}
    </StyledCell>
  );
};

export default React.memo(Cell);