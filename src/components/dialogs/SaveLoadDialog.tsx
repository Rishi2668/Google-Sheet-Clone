import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import StorageManager from '../../services/persistence/StorageManager';
import { displayToast } from '../../state/slices/uiSlice';

interface SaveLoadDialogProps {
  isOpen: boolean;
  mode: 'save' | 'load' | 'export';
  onClose: () => void;
  onSave?: (name: string) => void;
  onLoad?: (name: string) => void;
  onExport?: (name: string, format: string) => void;
}

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
  width: 400px;
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

const Select = styled.select`
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

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: block;
  width: 100%;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #dadce0;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #f1f3f4;
  }
`;

const SpreadsheetList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dadce0;
  border-radius: 4px;
  margin-bottom: 16px;
`;

const SpreadsheetItem = styled.div<{ selected: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  
  background-color: ${props => props.selected ? '#e8f0fe' : 'white'};
  
  &:hover {
    background-color: ${props => props.selected ? '#d2e3fc' : '#f8f9fa'};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #e0e0e0;
  }
`;

const DialogActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
`;

const Button = styled.button<{ primary?: boolean }>`
  height: 36px;
  padding: 0 24px;
  margin-left: 8px;
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

const SaveLoadDialog: React.FC<SaveLoadDialogProps> = ({
  isOpen,
  mode,
  onClose,
  onSave,
  onLoad,
  onExport
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const spreadsheetState = useSelector((state: RootState) => state.spreadsheet);
  
  // State for form inputs
  const [spreadsheetName, setSpreadsheetName] = useState('');
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState('');
  const [savedSpreadsheets, setSavedSpreadsheets] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState('json');
  const [file, setFile] = useState<File | null>(null);
  
  // Load saved spreadsheets list
  useEffect(() => {
    if (isOpen && (mode === 'load' || mode === 'export')) {
      const sheets = StorageManager.getSavedSpreadsheets();
      setSavedSpreadsheets(sheets);
      
      if (sheets.length > 0) {
        setSelectedSpreadsheet(sheets[0]);
      }
    }
  }, [isOpen, mode]);
  
  // Handle save button click
  const handleSave = () => {
    if (!spreadsheetName.trim()) {
      dispatch(displayToast('Please enter a spreadsheet name', 'warning'));
      return;
    }
    
    try {
      // Save to localStorage
      StorageManager.saveSpreadsheet(spreadsheetName, spreadsheetState);
      
      // Notify parent component
      if (onSave) {
        onSave(spreadsheetName);
      }
      
      // Close dialog
      onClose();
      
      // Show success message
      dispatch(displayToast(`Spreadsheet "${spreadsheetName}" saved successfully`, 'success'));
    } catch (error) {
      dispatch(displayToast('Failed to save spreadsheet', 'error'));
    }
  };
  
  // Handle load button click
  const handleLoad = () => {
    if (!selectedSpreadsheet) {
      dispatch(displayToast('Please select a spreadsheet to load', 'warning'));
      return;
    }
    
    try {
      // Notify parent component
      if (onLoad) {
        onLoad(selectedSpreadsheet);
      }
      
      // Close dialog
      onClose();
      
      // Show success message
      dispatch(displayToast(`Spreadsheet "${selectedSpreadsheet}" loaded successfully`, 'success'));
    } catch (error) {
      dispatch(displayToast('Failed to load spreadsheet', 'error'));
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  // Handle file import
  const handleImport = async () => {
    if (!file) {
      dispatch(displayToast('Please select a file to import', 'warning'));
      return;
    }
    
    try {
      // Import from file
      const data = await StorageManager.importFromFile(file);
      
      // Notify parent component
      if (onLoad) {
        // Generate a name from the file name, removing extension
        const name = file.name.replace(/\.[^/.]+$/, '');
        
        // Save imported data to localStorage
        StorageManager.saveSpreadsheet(name, data);
        
        // Load the imported spreadsheet
        onLoad(name);
      }
      
      // Close dialog
      onClose();
      
      // Show success message
      dispatch(displayToast(`Spreadsheet imported successfully`, 'success'));
    } catch (error) {
      dispatch(displayToast('Failed to import spreadsheet', 'error'));
    }
  };
  
  // Handle export button click
  const handleExport = () => {
    if (!selectedSpreadsheet) {
      dispatch(displayToast('Please select a spreadsheet to export', 'warning'));
      return;
    }
    
    try {
      // Load the spreadsheet data
      const data = StorageManager.loadSpreadsheet(selectedSpreadsheet);
      
      // Export based on format
      if (exportFormat === 'json') {
        StorageManager.exportToFile(selectedSpreadsheet, data);
      } else if (exportFormat === 'csv') {
        StorageManager.downloadCSV(selectedSpreadsheet, data);
      }
      
      // Notify parent component
      if (onExport) {
        onExport(selectedSpreadsheet, exportFormat);
      }
      
      // Close dialog
      onClose();
      
      // Show success message
      dispatch(displayToast(`Spreadsheet exported as ${exportFormat.toUpperCase()}`, 'success'));
    } catch (error) {
      dispatch(displayToast('Failed to export spreadsheet', 'error'));
    }
  };
  
  // Prevent clicks on dialog from closing it
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // Render different content based on mode
  const renderContent = () => {
    switch (mode) {
      case 'save':
        return (
          <>
            <FormGroup>
              <Label htmlFor="spreadsheet-name">Spreadsheet Name</Label>
              <Input
                id="spreadsheet-name"
                type="text"
                value={spreadsheetName}
                onChange={(e) => setSpreadsheetName(e.target.value)}
                placeholder="Enter a name for your spreadsheet"
                autoFocus
              />
            </FormGroup>
            
            <DialogActions>
              <Button onClick={onClose}>Cancel</Button>
              <Button primary onClick={handleSave}>Save</Button>
            </DialogActions>
          </>
        );
      
      case 'load':
        return (
          <>
            {savedSpreadsheets.length > 0 ? (
              <>
                <Label>Select a spreadsheet to load</Label>
                <SpreadsheetList>
                  {savedSpreadsheets.map(name => (
                    <SpreadsheetItem
                      key={name}
                      selected={name === selectedSpreadsheet}
                      onClick={() => setSelectedSpreadsheet(name)}
                    >
                      {name}
                    </SpreadsheetItem>
                  ))}
                </SpreadsheetList>
                
                <DialogActions>
                  <Button onClick={onClose}>Cancel</Button>
                  <Button primary onClick={handleLoad}>Load</Button>
                </DialogActions>
              </>
            ) : (
              <>
                <p>No saved spreadsheets found.</p>
                
                <FormGroup>
                  <Label>Import from file</Label>
                  <FileInputLabel htmlFor="import-file">
                    {file ? file.name : 'Choose a file...'}
                  </FileInputLabel>
                  <FileInput
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                  />
                </FormGroup>
                
                <DialogActions>
                  <Button onClick={onClose}>Cancel</Button>
                  <Button primary onClick={handleImport} disabled={!file}>
                    Import
                  </Button>
                </DialogActions>
              </>
            )}
          </>
        );
      
      case 'export':
        return (
          <>
            {savedSpreadsheets.length > 0 ? (
              <>
                <FormGroup>
                  <Label>Select a spreadsheet to export</Label>
                  <SpreadsheetList>
                    {savedSpreadsheets.map(name => (
                      <SpreadsheetItem
                        key={name}
                        selected={name === selectedSpreadsheet}
                        onClick={() => setSelectedSpreadsheet(name)}
                      >
                        {name}
                      </SpreadsheetItem>
                    ))}
                  </SpreadsheetList>
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="export-format">Export Format</Label>
                  <Select
                    id="export-format"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                  </Select>
                </FormGroup>
                
                <DialogActions>
                  <Button onClick={onClose}>Cancel</Button>
                  <Button primary onClick={handleExport}>Export</Button>
                </DialogActions>
              </>
            ) : (
              <>
                <p>No saved spreadsheets found.</p>
                <DialogActions>
                  <Button onClick={onClose}>Close</Button>
                </DialogActions>
              </>
            )}
          </>
        );
    }
  };
  
  // If dialog is not open, don't render anything
  if (!isOpen) {
    return null;
  }
  
  // Get title based on mode
  const getTitle = () => {
    switch (mode) {
      case 'save': return 'Save Spreadsheet';
      case 'load': return savedSpreadsheets.length > 0 ? 'Load Spreadsheet' : 'Import Spreadsheet';
      case 'export': return 'Export Spreadsheet';
      default: return '';
    }
  };
  
  return (
    <DialogOverlay onClick={onClose}>
      <DialogContainer onClick={handleDialogClick}>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </DialogHeader>
        
        <DialogContent>
          {renderContent()}
        </DialogContent>
      </DialogContainer>
    </DialogOverlay>
  );
};

export default SaveLoadDialog;