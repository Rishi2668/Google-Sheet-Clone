import React, { useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import { 
  setCellFormat,
  removeDuplicates
} from '../../state/slices/spreadsheetSlice';
import {
  showFindReplace,
  displayToast
} from '../../state/slices/uiSlice';

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  padding: 0 8px;
`;

const ToolbarSection = styled.div`
  display: flex;
  align-items: center;
  margin-right: 16px;
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background-color: #e0e0e0;
  margin: 0 8px;
`;

const ToolbarButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border: none;
  background-color: ${props => props.active ? '#e8f0fe' : 'transparent'};
  color: ${props => props.active ? '#1a73e8' : '#5f6368'};
  border-radius: 4px;
  margin: 0 2px;
  cursor: pointer;
  padding: 0 8px;
  
  &:hover {
    background-color: ${props => props.active ? '#d2e3fc' : '#f1f3f4'};
  }
  
  &:disabled {
    color: #bdc1c6;
    cursor: not-allowed;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const Select = styled.select`
  height: 32px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0 8px;
  color: #5f6368;
  background-color: white;
  min-width: 80px;
  
  &:focus {
    outline: none;
    border-color: #1a73e8;
  }
`;

const FontSelect = styled(Select)`
  min-width: 150px;
  font-size: 13px;
`;

const ColorSwatch = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background-color: ${props => props.color};
  border: 1px solid #e0e0e0;
`;

const PopoverContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 8px;
  margin-top: 4px;
`;

// Available fonts
const AVAILABLE_FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Cambria', label: 'Cambria' },
  { value: 'Century Gothic', label: 'Century Gothic' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Verdana', label: 'Verdana' }
];

// SVG icons (simplified for brevity)
const BoldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.6 11.8c1-.7 1.6-1.8 1.6-2.8 0-2.8-2.2-4-4.4-4H7v14h7.3c2.3 0 4.7-1.3 4.7-4.3 0-2-1.2-3.4-3.4-3.8v-.1zM10 7.5h3c.8 0 1.7.5 1.7 1.5 0 1.1-.7 1.5-1.7 1.5h-3V7.5zm3.3 9H10v-3.5h3.3c1.1 0 2 .5 2 1.8 0 1.2-.8 1.7-2 1.7z" />
  </svg>
);

const ItalicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z" />
  </svg>
);

const TextColorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 2L5.5 16h2.25l1.12-3h6.25l1.12 3h2.25L13 2h-2zm-1.38 9L12 5.67 14.38 11H9.62z" />
  </svg>
);

const BgColorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z" />
    <path d="M0 20h24v4H0z" fillOpacity=".36" />
  </svg>
);

const FindIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const Toolbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get active cell and selection from Redux
  const activeCell = useSelector((state: RootState) => 
    state.spreadsheet.activeCell
  );
  
  const activeCellData = useSelector((state: RootState) => 
    state.spreadsheet.activeCell 
      ? state.spreadsheet.cells[state.spreadsheet.activeCell] 
      : null
  );
  
  const selection = useSelector((state: RootState) => 
    state.spreadsheet.selection
  );
  
  // Local state for color pickers
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  
  // Get current formatting for active cell
  const format = activeCellData?.format || {
    bold: false,
    italic: false,
    fontSize: 12,
    fontFamily: 'Arial',
    color: '#000000',
    backgroundColor: null
  };
  
  // Toggle bold formatting
  const toggleBold = () => {
    if (!activeCell) return;
    
    dispatch(setCellFormat({ 
      cellId: activeCell, 
      format: { bold: !format.bold } 
    }));
  };
  
  // Toggle italic formatting
  const toggleItalic = () => {
    if (!activeCell) return;
    
    dispatch(setCellFormat({ 
      cellId: activeCell, 
      format: { italic: !format.italic } 
    }));
  };
  
  // Handle font family change
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!activeCell) return;
    
    dispatch(setCellFormat({ 
      cellId: activeCell, 
      format: { fontFamily: e.target.value } 
    }));
  };
  
  // Handle font size change
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!activeCell) return;
    
    dispatch(setCellFormat({ 
      cellId: activeCell, 
      format: { fontSize: parseInt(e.target.value) } 
    }));
  };
  
  // Handle text color change
  const handleTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeCell) return;
    
    dispatch(setCellFormat({ 
      cellId: activeCell, 
      format: { color: e.target.value } 
    }));
    
    setShowTextColorPicker(false);
  };
  
  // Handle background color change
  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeCell) return;
    
    dispatch(setCellFormat({ 
      cellId: activeCell, 
      format: { backgroundColor: e.target.value } 
    }));
    
    setShowBgColorPicker(false);
  };
  
  // Open find and replace dialog
  const handleFindReplace = () => {
    dispatch(showFindReplace());
  };
  
  // Remove duplicates from selection
  const handleRemoveDuplicates = () => {
    if (selection.ranges.length > 0) {
      const { start, end } = selection.ranges[0];
      const range = `${start}:${end}`;
      
        // Create a default payload that checks all columns
        const columnsInRange = [];
        const startMatch = start.match(/([A-Z]+)(\d+)/);
        const endMatch = end.match(/([A-Z]+)(\d+)/);

        if (startMatch && endMatch) {
        const [, startCol] = startMatch;
        const [, endCol] = endMatch;

        // Generate all column letters in the range
      for (let colCode = startCol.charCodeAt(0); colCode <= endCol.charCodeAt(0); colCode++) {
            columnsInRange.push(String.fromCharCode(colCode));
        }
        }

      dispatch(removeDuplicates({ 
        range,
        columnsToCheck: columnsInRange,
        hasHeaderRow: true // Default to assuming there's a header
        }));
      dispatch(displayToast("Duplicate rows removed", "success"));
    } else {
      dispatch(displayToast("Please select a range first", "warning"));
    }
  };
  
  // Check if toolbar buttons should be disabled
  const isDisabled = !activeCell;
  
  return (
    <ToolbarContainer>
      {/* Font Family Section */}
      <ToolbarSection>
        <FontSelect
          value={format.fontFamily}
          onChange={handleFontFamilyChange}
          disabled={isDisabled}
          style={{ fontFamily: format.fontFamily }}
        >
          {AVAILABLE_FONTS.map(font => (
            <option 
              key={font.value} 
              value={font.value}
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </option>
          ))}
        </FontSelect>
      </ToolbarSection>
      
      {/* Font Size Section */}
      <ToolbarSection>
        <Select
          value={format.fontSize}
          onChange={handleFontSizeChange}
          disabled={isDisabled}
        >
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="24">24</option>
          <option value="36">36</option>
        </Select>
      </ToolbarSection>
      
      <Divider />
      
      {/* Text Formatting Section */}
      <ToolbarSection>
        <ToolbarButton 
          onClick={toggleBold} 
          disabled={isDisabled}
          active={format.bold}
          title="Bold (Ctrl+B)"
        >
          <BoldIcon />
        </ToolbarButton>
        
        <ToolbarButton 
          onClick={toggleItalic} 
          disabled={isDisabled}
          active={format.italic}
          title="Italic (Ctrl+I)"
        >
          <ItalicIcon />
        </ToolbarButton>
      </ToolbarSection>
      
      {/* Color Section */}
      <ToolbarSection>
        <div style={{ position: 'relative' }}>
          <ToolbarButton 
            onClick={() => setShowTextColorPicker(!showTextColorPicker)} 
            disabled={isDisabled}
            title="Text color"
          >
            <TextColorIcon />
            <ColorSwatch color={format.color} />
          </ToolbarButton>
          
          {showTextColorPicker && (
            <PopoverContainer>
              <input 
                type="color" 
                value={format.color} 
                onChange={handleTextColorChange}
              />
            </PopoverContainer>
          )}
        </div>
        
        <div style={{ position: 'relative' }}>
          <ToolbarButton 
            onClick={() => setShowBgColorPicker(!showBgColorPicker)} 
            disabled={isDisabled}
            title="Fill color"
          >
            <BgColorIcon />
            <ColorSwatch color={format.backgroundColor || 'transparent'} />
          </ToolbarButton>
          
          {showBgColorPicker && (
            <PopoverContainer>
              <input 
                type="color" 
                value={format.backgroundColor || '#ffffff'} 
                onChange={handleBgColorChange}
              />
            </PopoverContainer>
          )}
        </div>
      </ToolbarSection>
      
      <Divider />
      
      {/* Tools Section */}
      <ToolbarSection>
        <ToolbarButton 
          onClick={handleFindReplace}
          title="Find and replace (Ctrl+H)"
        >
          <FindIcon />
        </ToolbarButton>
        
        <ToolbarButton 
          onClick={handleRemoveDuplicates}
          disabled={selection.ranges.length === 0}
          title="Remove duplicates"
        >
          Remove Duplicates
        </ToolbarButton>
      </ToolbarSection>
    </ToolbarContainer>
  );
};

export default Toolbar;