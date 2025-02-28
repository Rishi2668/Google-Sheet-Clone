import React, { useRef } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import { setSelectionRange, resizeColumn, addColumn, deleteColumn } from '../../state/slices/spreadsheetSlice';
import { showContextMenu } from '../../state/slices/uiSlice';

interface ColumnHeaderProps {
  column: string;
  width: number;
}

interface StyledHeaderProps {
  width: number;
}

const HeaderCell = styled.div<StyledHeaderProps>`
  width: ${props => props.width}px;
  height: 25px;
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 12px;
  color: #5f6368;
  position: relative;
  user-select: none;
  
  &:hover {
    background-color: #eee;
  }
`;

const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 2;
  
  &:hover {
    background-color: #1a73e8;
  }
`;

const ColumnHeader: React.FC<ColumnHeaderProps> = ({ column, width }) => {
  const dispatch = useDispatch<AppDispatch>();
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  
  // Get visible rows to select entire column
  const visibleRows = useSelector((state: RootState) => 
    Object.keys(state.spreadsheet.rows)
      .filter(row => state.spreadsheet.rows[row].visible)
      .sort((a, b) => parseInt(a) - parseInt(b))
  );
  
  // Handle click to select entire column
  const handleClick = () => {
    if (visibleRows.length > 0) {
      const startCell = `${column}${visibleRows[0]}`;
      const endCell = `${column}${visibleRows[visibleRows.length - 1]}`;
      
      dispatch(setSelectionRange({
        start: startCell,
        end: endCell
      }));
    }
  };
  
  // Handle right-click for context menu
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    dispatch(showContextMenu({
      position: { x: e.clientX, y: e.clientY },
      targetId: `col:${column}`
    }));
  };
  
  // Handle column resize
  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = width;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(30, startWidth + deltaX); // Minimum width of 30px
      
      dispatch(resizeColumn({ columnLetter: column, width: newWidth }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Double-click to auto-size column (in a real app, would calculate based on content)
  const handleResizeDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    dispatch(resizeColumn({ columnLetter: column, width: 100 })); // Reset to default
  };
  
  return (
    <HeaderCell
      width={width}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={`Column ${column}`}
    >
      {column}
      <ResizeHandle
        ref={resizeHandleRef}
        onMouseDown={handleResizeMouseDown}
        onDoubleClick={handleResizeDoubleClick}
      />
    </HeaderCell>
  );
};

export default React.memo(ColumnHeader);