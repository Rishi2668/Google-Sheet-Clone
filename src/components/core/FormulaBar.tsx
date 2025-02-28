import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import { setCellValue } from '../../state/slices/spreadsheetSlice';
// import { setFormulaBarFocus } from '../../state/slices/uiSlice';
import { setFormulaBarFocused } from '../../state/slices/uiSlice';

const FormulaBarContainer = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  padding: 0 8px;
`;

const CellReference = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 0 8px;
  height: 24px;
  border-right: 1px solid #e0e0e0;
  font-size: 12px;
  color: #5f6368;
  margin-right: 8px;
`;

const FormulaEquals = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  color: #5f6368;
  font-weight: bold;
`;

const FormulaInput = styled.input`
  flex: 1;
  height: 24px;
  border: none;
  outline: none;
  font-size: 13px;
  padding: 0 8px;
  background-color: transparent;
  
  &:focus {
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const FunctionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 8px;
  border: none;
  background-color: transparent;
  color: #5f6368;
  cursor: pointer;
  margin-left: 8px;
  font-size: 20px;
  
  &:hover {
    background-color: #f1f3f4;
    border-radius: 4px;
  }
`;

const FormulaBar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get active cell from Redux
  const activeCell = useSelector((state: RootState) => 
    state.spreadsheet.activeCell
  );
  
  const activeCellData = useSelector((state: RootState) => 
    state.spreadsheet.activeCell 
      ? state.spreadsheet.cells[state.spreadsheet.activeCell] 
      : null
  );
  
  // Get UI state
  const formulaBarFocused = useSelector((state: RootState) => 
    state.ui.formulaBarFocused
  );
  
  // Local state for formula editing
  const [formula, setFormula] = useState('');
  
  // Update formula when active cell changes
  useEffect(() => {
    if (activeCellData) {
      setFormula(activeCellData.value || '');
    } else {
      setFormula('');
    }
  }, [activeCell, activeCellData]);
  
  // Focus the input when formula bar is focused
  useEffect(() => {
    if (formulaBarFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [formulaBarFocused]);
  
  // Handle input changes
  const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormula(e.target.value);
  };
  
  // Handle formula submission
  const handleFormulaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeCell) {
      dispatch(setCellValue({ 
        cellId: activeCell, 
        value: formula 
      }));
      dispatch(setFormulaBarFocused(false));
    }
  };
  
  // Handle key presses in the formula input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      // Cancel editing and revert to original value
      if (activeCellData) {
        setFormula(activeCellData.value || '');
      } else {
        setFormula('');
      }
      dispatch(setFormulaBarFocused(false));
      e.preventDefault();
    }
  };
  
  // Handle focus changes
  const handleFocus = () => {
    dispatch(setFormulaBarFocused(true));
  };
  
  const handleBlur = () => {
    dispatch(setFormulaBarFocused(false));
    
    // Apply the formula on blur
    if (activeCell && formula !== (activeCellData?.value || '')) {
      dispatch(setCellValue({ 
        cellId: activeCell, 
        value: formula 
      }));
    }
  };
  
  // Function to open function selector (would be implemented in a real app)
  const handleFunctionSelect = () => {
    // This would open a dialog to select functions
    console.log('Open function selector');
  };
  
  return (
    <FormulaBarContainer>
      <CellReference>
        {activeCell || ''}
      </CellReference>
      
      <FormulaEquals>=</FormulaEquals>
      
      <form onSubmit={handleFormulaSubmit} style={{ display: 'flex', flex: 1 }}>
        <FormulaInput
          ref={inputRef}
          type="text"
          value={formula}
          onChange={handleFormulaChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Enter formula or value"
          disabled={!activeCell}
        />
      </form>
      
      <FunctionButton 
        onClick={handleFunctionSelect}
        title="Insert function"
      >
        ƒx
      </FunctionButton>
    </FormulaBarContainer>
  );
};

export default FormulaBar;