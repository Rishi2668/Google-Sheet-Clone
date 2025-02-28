import React from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import { setSelectionRange } from '../../state/slices/spreadsheetSlice';

const StyledCornerCell = styled.div`
  width: 50px;
  height: 25px;
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
  
  &:hover {
    background-color: #eee;
  }
`;

const CornerCell: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get all visible columns and rows to select the entire sheet
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
  
  // Handle click to select all cells
  const handleClick = () => {
    if (visibleColumns.length > 0 && visibleRows.length > 0) {
      const startCell = `${visibleColumns[0]}${visibleRows[0]}`;
      const endCell = `${visibleColumns[visibleColumns.length - 1]}${visibleRows[visibleRows.length - 1]}`;
      
      dispatch(setSelectionRange({
        start: startCell,
        end: endCell
      }));
    }
  };
  
  return (
    <StyledCornerCell
      onClick={handleClick}
      title="Select all cells"
    />
  );
};

export default React.memo(CornerCell);