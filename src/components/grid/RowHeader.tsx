import React, { useRef } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import { setSelectionRange, resizeRow, addRow, deleteRow } from '../../state/slices/spreadsheetSlice';
import { showContextMenu } from '../../state/slices/uiSlice';

interface RowHeaderProps {
  row: string;
  height: number;
}

interface StyledHeaderProps {
  height: number;
}

const HeaderCell = styled.div<StyledHeaderProps>`
  width: 50px;
  height: ${props => props.height}px;
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
  left: 0;
  bottom: -3px;
  width: 100%;
  height: 6px;
  cursor: row-resize;
  z-index: 2;
  
  &:hover {
    background-color: #1a73e8;
  }
`;

const RowHeader: React.FC<RowHeaderProps> = ({ row, height }) => {
  const dispatch = useDispatch<AppDispatch>();
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  
  // Get visible columns to select entire row
  const visibleColumns = useSelector((state: RootState) => 
    Object.keys(state.spreadsheet.columns)
      .filter(col => state.spreadsheet.columns[col].visible)
      .sort()
  );
  
  // Handle click to select entire row
  const handleClick = () => {
    if (visibleColumns.length > 0) {
      const startCell = `${visibleColumns[0]}${row}`;
      const endCell = `${visibleColumns[visibleColumns.length - 1]}${row}`;
      
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
      targetId: `row:${row}`
    }));
  };
  
  // Handle row resize
  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    const startY = e.clientY;
    const startHeight = height;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(20, startHeight + deltaY); // Minimum height of 20px
      
      dispatch(resizeRow({ rowIndex: parseInt(row), height: newHeight }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Double-click to auto-size row (in a real app, would calculate based on content)
  const handleResizeDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    dispatch(resizeRow({ rowIndex: parseInt(row), height: 25 })); // Reset to default
  };
  
  return (
    <HeaderCell
      height={height}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={`Row ${row}`}
    >
      {row}
      <ResizeHandle
        ref={resizeHandleRef}
        onMouseDown={handleResizeMouseDown}
        onDoubleClick={handleResizeDoubleClick}
      />
    </HeaderCell>
  );
};

export default React.memo(RowHeader);