import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import { findAndReplace } from '../../state/slices/spreadsheetSlice';
import { 
  hideFindReplace, 
  setFindReplaceOptions, 
  setFindResults,
  navigateToNextResult,
  navigateToPrevResult,
  displayToast
} from '../../state/slices/uiSlice';

// Define styled components
const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: 600px;
  overflow: hidden;
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
`;

const DialogTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #202124;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #5f6368;
  cursor: pointer;
  padding: 0;
  line-height: 1;
`;

const DialogContent = styled.div`
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #5f6368;
`;

const Input = styled.input`
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  color: #202124;
  
  &:focus {
    outline: none;
    border-color: #1a73e8;
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const Checkbox = styled.input`
  margin-right: 8px;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: #202124;
`;

const ResultsInfo = styled.div`
  margin-top: 16px;
  font-size: 14px;
  color: #5f6368;
  height: 20px;
`;

const DialogActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center; // Changed from flex-end to center
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  gap: 8px; // Added to create space between buttons
`;

const Button = styled.button<{ primary?: boolean }>`
  height: 36px;
  padding: 0 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  /* Primary button */
  background-color: ${props => props.primary ? '#1a73e8' : 'white'};
  color: ${props => props.primary ? 'white' : '#5f6368'};
  border: ${props => props.primary ? 'none' : '1px solid #dadce0'};
  
  &:hover {
    background-color: ${props => props.primary ? '#1765cc' : '#f1f3f4'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FindReplaceDialog: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get find/replace state from Redux
  const findReplace = useSelector((state: RootState) => state.ui.findReplace);
  const selection = useSelector((state: RootState) => state.spreadsheet.selection);
  const cells = useSelector((state: RootState) => state.spreadsheet.cells);
  
  // Local state for form inputs
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchEntireCell, setMatchEntireCell] = useState(false);
  
  // Update local state when Redux state changes
  useEffect(() => {
    setFindText(findReplace.findText);
    setReplaceText(findReplace.replaceText);
    setMatchCase(findReplace.matchCase);
    setMatchEntireCell(findReplace.matchEntireCell);
  }, [findReplace]);
  
  // Handle dialog close
  const handleClose = () => {
    dispatch(hideFindReplace());
  };
  
  // Prevent clicks on dialog from closing it
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // Handle find button click
  const handleFind = () => {
    if (!findText.trim()) {
      dispatch(displayToast("Please enter text to find", "warning"));
      return;
    }
    
    // Update options in Redux
    dispatch(setFindReplaceOptions({
      findText,
      replaceText,
      matchCase,
      matchEntireCell
    }));
    
    // Perform search
    let cellIds: string[] = [];
    let searchRange: string | undefined;
    
    // Get the current selection range if available
    if (selection.ranges.length > 0) {
      const { start, end } = selection.ranges[0];
      searchRange = `${start}:${end}`;
    }
    
    // Search all cells or just the selection
    Object.keys(cells).forEach(cellId => {
      // Skip if cell is outside selection range (if we have one)
      if (searchRange) {
        // TODO: Implement check if cell is in range
      }
      
      const cell = cells[cellId];
      
      // Skip formula cells
      if (cell.type === 'formula') return;
      
      let cellText = cell.value;
      let searchText = findText;
      
      // Handle case sensitivity
      if (!matchCase) {
        cellText = cellText.toLowerCase();
        searchText = searchText.toLowerCase();
      }
      
      // Check if cell matches search criteria
      if (matchEntireCell) {
        if (cellText === searchText) {
          cellIds.push(cellId);
        }
      } else {
        if (cellText.includes(searchText)) {
          cellIds.push(cellId);
        }
      }
    });
    
    // Update results in Redux
    dispatch(setFindResults(cellIds));
    
    // Show results message
    dispatch(displayToast(`Found ${cellIds.length} matches`, "info"));
  };
  
  // Handle replace button click
// Handle replace button click
const handleReplace = () => {
    if (findReplace.results.length === 0 || findReplace.currentResultIndex === -1) {
      dispatch(displayToast("No matches to replace", "warning"));
      return;
    }
    
    // Get the specific cell ID of the current match
    const cellId = findReplace.results[findReplace.currentResultIndex];
    
    // Dispatch find and replace with a specific range (the current match's cell)
    dispatch(findAndReplace({
      findText,
      replaceText,
      range: cellId, // Use the specific cell ID as the range
      matchCase,
      matchEntireCell
    }));
    
    // Move to next result
    dispatch(navigateToNextResult());
    
    // Show success message
    dispatch(displayToast("Replaced 1 occurrence", "success"));
  };
  
  // Handle replace all button click
  const handleReplaceAll = () => {
    if (findReplace.results.length === 0) {
      dispatch(displayToast("No matches to replace", "warning"));
      return;
    }
    
    // Replace all matches
    dispatch(findAndReplace({
      findText,
      replaceText,
      matchCase,
      matchEntireCell
    }));
    
    // Show success message
    dispatch(displayToast(`Replaced ${findReplace.results.length} occurrences`, "success"));
    
    // Clear results
    dispatch(setFindResults([]));
  };
  
  // Handle previous button click
  const handlePrevious = () => {
    dispatch(navigateToPrevResult());
  };
  
  // Handle next button click
  const handleNext = () => {
    dispatch(navigateToNextResult());
  };
  
  // If dialog is not visible, don't render anything
  if (!findReplace.visible) {
    return null;
  }
  
  return (
    <DialogOverlay onClick={handleClose}>
      <DialogContainer onClick={handleDialogClick}>
        <DialogHeader>
          <DialogTitle>Find and replace</DialogTitle>
          <CloseButton onClick={handleClose}>×</CloseButton>
        </DialogHeader>
        
        <DialogContent>
          <FormGroup>
            <Label htmlFor="find-text">Find</Label>
            <Input
              id="find-text"
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="replace-text">Replace with</Label>
            <Input
              id="replace-text"
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
            />
          </FormGroup>
          
          <CheckboxGroup>
            <Checkbox
              type="checkbox"
              id="match-case"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
            />
            <CheckboxLabel htmlFor="match-case">Match case</CheckboxLabel>
          </CheckboxGroup>
          
          <CheckboxGroup>
            <Checkbox
              type="checkbox"
              id="match-entire-cell"
              checked={matchEntireCell}
              onChange={(e) => setMatchEntireCell(e.target.checked)}
            />
            <CheckboxLabel htmlFor="match-entire-cell">Match entire cell contents</CheckboxLabel>
          </CheckboxGroup>
          
          <ResultsInfo>
            {findReplace.results.length > 0 && (
              <>
                Match {findReplace.currentResultIndex + 1} of {findReplace.results.length}
              </>
            )}
          </ResultsInfo>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleFind} primary>
            Find
          </Button>
          <Button 
            onClick={handlePrevious}
            disabled={findReplace.results.length === 0}
          >
            Previous
          </Button>
          <Button 
            onClick={handleNext}
            disabled={findReplace.results.length === 0}
          >
            Next
          </Button>
          <Button 
            onClick={handleReplace}
            disabled={findReplace.results.length === 0}
          >
            Replace
          </Button>
          <Button 
            onClick={handleReplaceAll}
            disabled={findReplace.results.length === 0}
          >
            Replace all
          </Button>
        </DialogActions>
      </DialogContainer>
    </DialogOverlay>
  );
};

export default FindReplaceDialog;