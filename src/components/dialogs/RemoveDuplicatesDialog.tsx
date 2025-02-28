import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '../../state/store';
import { removeDuplicates } from '../../state/slices/spreadsheetSlice';

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: 450px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
`;

const DialogHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DialogTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
`;

const DialogBody = styled.div`
  padding: 16px;
`;

const ColumnSelectionArea = styled.div`
  margin-bottom: 16px;
`;

const CheckboxContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
`;

const OptionRow = styled.div`
  margin-bottom: 12px;
`;

const DialogFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #1a73e8;
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: #1765cc;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: transparent;
  color: #1a73e8;
  border: 1px solid #dadce0;
  
  &:hover:not(:disabled) {
    background-color: rgba(26, 115, 232, 0.04);
  }
`;

interface RemoveDuplicatesDialogProps {
  onClose: () => void;
}

const RemoveDuplicatesDialog: React.FC<RemoveDuplicatesDialogProps> = ({ onClose }) => {
  const dispatch = useDispatch();
  const selection = useSelector((state: RootState) => state.spreadsheet.selection);
  
  // Get column headers from the first row in selection
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({});
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  
  useEffect(() => {
    // Get column headers from first row, or generate default headers (A, B, C, etc)
    const headers: string[] = [];
    
    if (selection.ranges && selection.ranges.length > 0) {
      const { start, end } = selection.ranges[0];
      
      // Parse the range boundaries
      const startMatch = start.match(/([A-Z]+)(\d+)/);
      const endMatch = end.match(/([A-Z]+)(\d+)/);
      
      if (startMatch && endMatch) {
        const [, startCol] = startMatch;
        const [, endCol] = endMatch;
        
        // Convert letters to codes for iteration
        const startColCode = startCol.charCodeAt(0);
        const endColCode = endCol.charCodeAt(0);
        
        // Generate headers for each column in the selection
        for (let colCode = startColCode; colCode <= endColCode; colCode++) {
          const columnLetter = String.fromCharCode(colCode);
          headers.push(columnLetter);
        }
      }
    }
    
    setColumnHeaders(headers);
    
    // Initialize all columns as selected
    const initialSelection: Record<string, boolean> = {};
    headers.forEach(header => {
      initialSelection[header] = true;
    });
    
    setSelectedColumns(initialSelection);
  }, [selection]);
  
  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };
  
  const handleSelectAll = () => {
    const allSelected = Object.values(selectedColumns).every(Boolean);
    
    // Toggle: If all are selected, deselect all; otherwise select all
    const newState = !allSelected;
    
    const updatedSelection: Record<string, boolean> = {};
    columnHeaders.forEach(header => {
      updatedSelection[header] = newState;
    });
    
    setSelectedColumns(updatedSelection);
  };
  
  const handleRemoveDuplicates = () => {
    // Get the columns that are selected for duplicate checking
    const columnsToCheck = Object.entries(selectedColumns)
      .filter(([_, isSelected]) => isSelected)
      .map(([columnId]) => columnId);
    
    if (columnsToCheck.length > 0 && selection.ranges && selection.ranges.length > 0) {
      // Call your removeDuplicates action with the complete payload
      const range = `${selection.ranges[0].start}:${selection.ranges[0].end}`;
      
      dispatch(removeDuplicates({
        range,
        columnsToCheck,
        hasHeaderRow
      }));
      
      onClose();
    }
  };
  
  const atLeastOneColumnSelected = Object.values(selectedColumns).some(Boolean);
  
  return (
    <DialogOverlay onClick={onClose}>
      <DialogContainer onClick={e => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Remove Duplicates</DialogTitle>
        </DialogHeader>
        
        <DialogBody>
          <OptionRow>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={hasHeaderRow}
                onChange={() => setHasHeaderRow(!hasHeaderRow)}
              />
              My data has headers
            </CheckboxLabel>
          </OptionRow>
          
          <ColumnSelectionArea>
            <div>Select columns to analyze:</div>
            
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={Object.values(selectedColumns).every(Boolean)}
                onChange={handleSelectAll}
              />
              Select All
            </CheckboxLabel>
            
            <CheckboxContainer>
              {columnHeaders.map(column => (
                <CheckboxLabel key={column}>
                  <input
                    type="checkbox"
                    checked={selectedColumns[column] || false}
                    onChange={() => handleColumnToggle(column)}
                  />
                  Column {column}
                </CheckboxLabel>
              ))}
            </CheckboxContainer>
          </ColumnSelectionArea>
        </DialogBody>
        
        <DialogFooter>
          <SecondaryButton onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={handleRemoveDuplicates}
            disabled={!atLeastOneColumnSelected}
          >
            Remove Duplicates
          </PrimaryButton>
        </DialogFooter>
      </DialogContainer>
    </DialogOverlay>
  );
};

export default RemoveDuplicatesDialog;