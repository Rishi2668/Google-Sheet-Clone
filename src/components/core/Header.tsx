import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import {
  toggleFormulaBar,
  toggleGridlines,
  toggleHeaders,
  setZoom,
  displayToast
} from '../../state/slices/uiSlice';
import { setSpreadsheetState } from '../../state/slices/spreadsheetSlice';

import SaveLoadDialog from '../dialogs/SaveLoadDialog';
import StorageManager from '../../services/persistence/StorageManager';

// Styled Components
const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 16px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  margin-right: 32px;
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background-color: #0f9d58;
  border-radius: 4px;
  margin-right: 8px;
`;

const LogoText = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #202124;
`;

const MenuBar = styled.div`
  display: flex;
  flex: 1;
`;

const MenuItem = styled.div`
  position: relative;
  padding: 8px 12px;
  font-size: 14px;
  color: #5f6368;
  cursor: pointer;
  border-radius: 4px;
  
  &:hover {
    background-color: #f1f3f4;
  }
`;

const Dropdown = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 180px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 8px 0;
  z-index: 1000;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const DropdownItem = styled.div<{ checked?: boolean }>`
  padding: 8px 16px;
  font-size: 14px;
  color: #202124;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: #f1f3f4;
  }
  
  &:before {
    content: ${props => props.checked ? '"✓"' : '""'};
    margin-right: 8px;
    width: 16px;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: #e0e0e0;
  margin: 4px 0;
`;

const ZoomControls = styled.div`
  display: flex;
  align-items: center;
  margin-right: 16px;
`;

const ZoomButton = styled.button`
  background-color: #f1f3f4;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const ZoomText = styled.div`
  margin: 0 8px;
  font-size: 14px;
  color: #5f6368;
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
`;

const ShareButton = styled.button`
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background-color: #1765cc;
  }
`;

const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get UI state from Redux
  const viewOptions = useSelector((state: RootState) => 
    state.ui.viewOptions
  );
  
  // Local state for dropdowns
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // State for save/load dialog
  const [saveLoadDialog, setSaveLoadDialog] = useState<{
    isOpen: boolean;
    mode: 'save' | 'load' | 'export';
  }>({
    isOpen: false,
    mode: 'save'
  });
  
  // Toggle dropdown menus
  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };
  
  // Close all menus
  const closeMenus = () => {
    setActiveMenu(null);
  };

  // FIXED: Improved zoom handling function that tries multiple approaches
  const applyZoom = useCallback((zoom: number) => {
    try {
      // First approach: Try using CSS variables on GridContainer
      const gridContainer = document.querySelector('.GridContainer') || 
                             document.querySelector('[class*="GridContainer"]');
      
      if (gridContainer) {
        console.log('Found GridContainer, applying zoom');
        
        // Apply the zoom directly to the GridContainer
        const element = gridContainer as HTMLElement;
        element.style.setProperty('--zoom-level', `${zoom / 100}`);
        return true;
      }
      
      // Second approach: Find the grid content directly
      const gridContent = document.querySelector('.GridContent') || 
                          document.querySelector('[class*="GridContent"]');
      
      if (gridContent) {
        console.log('Found GridContent, applying zoom');
        
        // Apply transform to the grid content
        const element = gridContent as HTMLElement;
        element.style.transform = `scale(${zoom / 100})`;
        element.style.transformOrigin = 'top left';
        
        // Make sure parent handles overflow
        if (element.parentElement) {
          element.parentElement.style.overflow = 'auto';
        }
        
        return true;
      }
      
      // Third approach: Try using parent elements of cells
      const anyCell = document.querySelector('[data-cell-id]');
      if (anyCell && anyCell.parentElement && anyCell.parentElement.parentElement) {
        console.log('Found cells, applying zoom to parent element');
        
        // Go up to the grid container (usually 2 levels up from a cell)
        const gridElement = anyCell.parentElement.parentElement as HTMLElement;
        gridElement.style.transform = `scale(${zoom / 100})`;
        gridElement.style.transformOrigin = 'top left';
        
        // Make sure parent handles overflow
        if (gridElement.parentElement) {
          gridElement.parentElement.style.overflow = 'auto';
        }
        
        return true;
      }
      
      // Fourth approach: Apply zoom to the main app container
      const appContainer = document.getElementById('root') || 
                           document.querySelector('main') ||
                           document.querySelector('.App');
      
      if (appContainer) {
        console.log('Found app container, applying zoom to grid children');
        
        // Find all grid-like elements inside the app
        const gridElements = appContainer.querySelectorAll('div[style*="display: grid"], div[class*="grid"], div[class*="Grid"]');
        
        if (gridElements.length > 0) {
          // Apply zoom to each grid element found
          gridElements.forEach((element) => {
            const gridElem = element as HTMLElement;
            gridElem.style.transform = `scale(${zoom / 100})`;
            gridElem.style.transformOrigin = 'top left';
          });
          
          return true;
        }
      }
      
      // Last resort: Create a style element and add a global CSS rule
      console.log('Using global CSS approach for zoom');
      
      // Find or create style element
      let styleElement = document.getElementById('spreadsheet-zoom-styles');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'spreadsheet-zoom-styles';
        document.head.appendChild(styleElement);
      }
      
      // Add zoom CSS rule
      styleElement.textContent = `
        /* Global zoom styles */
        .GridContent, [class*="GridContent"], 
        div[style*="display: grid"], 
        [data-cell-id] {
          transform: scale(${zoom / 100}) !important;
          transform-origin: top left !important;
        }
        
        /* Ensure overflow handling in parents */
        .GridContainer, [class*="GridContainer"] {
          overflow: auto !important;
        }
      `;
      
      return true;
    } catch (error) {
      console.error('Error applying zoom:', error);
      return false;
    }
  }, []);
  
  // Zoom in function with min/max limits
  const handleZoomIn = () => {
    const newZoom = Math.min(viewOptions.zoom + 25, 200);
    dispatch(setZoom(newZoom));
    
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      applyZoom(newZoom);
    }, 0);
  };

  // Zoom out function with min/max limits
  const handleZoomOut = () => {
    const newZoom = Math.max(viewOptions.zoom - 25, 25);
    dispatch(setZoom(newZoom));
    
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      applyZoom(newZoom);
    }, 0);
  };

  // Apply zoom when component mounts and when zoom value changes
  useEffect(() => {
    // Add CSS variable to document root for zoom
    document.documentElement.style.setProperty('--zoom-level', `${viewOptions.zoom / 100}`);
    
    // Attempt to apply zoom with a slight delay to ensure DOM is ready
    const zoomTimer = setTimeout(() => {
      const success = applyZoom(viewOptions.zoom);
      
      if (!success) {
        console.warn('Initial zoom application failed, will retry after DOM fully loads');
        
        // Retry after a longer delay
        setTimeout(() => {
          applyZoom(viewOptions.zoom);
        }, 1000);
      }
    }, 300);

    // Cleanup timer
    return () => clearTimeout(zoomTimer);
  }, [viewOptions.zoom, applyZoom]);

  // FIXED: Add a CSS class directly to Grid component on mount
  useEffect(() => {
    // This adds a global CSS class to help identify the grid
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Add classes for zoom targeting */
      .GridContainer, .GridContent {
        --zoom-level: ${viewOptions.zoom / 100};
      }
      
      /* Define CSS variable based transform */
      .use-zoom-transform {
        transform: scale(var(--zoom-level, 1));
        transform-origin: top left;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Set CSS variable for zoom on document
    document.documentElement.style.setProperty('--zoom-level', `${viewOptions.zoom / 100}`);
    
    return () => {
      // Clean up on unmount
      document.head.removeChild(styleElement);
    };
  }, []);

  // Handle save/load operations
  const handleSave = () => {
    setSaveLoadDialog({
      isOpen: true,
      mode: 'save'
    });
    closeMenus();
  };
  
  const handleLoad = () => {
    setSaveLoadDialog({
      isOpen: true,
      mode: 'load'
    });
    closeMenus();
  };
  
  const handleExport = () => {
    setSaveLoadDialog({
      isOpen: true,
      mode: 'export'
    });
    closeMenus();
  };
  
  // Handle load spreadsheet
  const handleLoadSpreadsheet = (name: string) => {
    try {
      // Load the spreadsheet from storage
      const loadedState = StorageManager.loadSpreadsheet(name);
      
      // Replace the current state with the loaded state
      dispatch(setSpreadsheetState(loadedState));
      
      // Show a success message
      dispatch(displayToast(`Spreadsheet "${name}" loaded successfully`, 'success'));
    } catch (error) {
      dispatch(displayToast('Failed to load spreadsheet', 'error'));
    }
  };
  
  // Handle share button
  const handleShare = () => {
    dispatch(displayToast("Sharing is not implemented in this demo", "info"));
  };
  
  // Close save/load dialog
  const handleCloseDialog = () => {
    setSaveLoadDialog({
      ...saveLoadDialog,
      isOpen: false
    });
  };

  // Set zoom level handlers
  const handleSetZoom = (zoom: number) => {
    dispatch(setZoom(zoom));
    closeMenus();
    
    // Update CSS variable in document root
    document.documentElement.style.setProperty('--zoom-level', `${zoom / 100}`);
    
    // Use setTimeout to ensure the DOM is updated before applying zoom
    setTimeout(() => {
      applyZoom(zoom);
    }, 0);
  };

  return (
    <HeaderContainer>
      <Logo>
        <LogoIcon />
        <LogoText>Sheets Clone</LogoText>
      </Logo>
      
      <MenuBar>
        <MenuItem 
          onClick={() => toggleMenu('file')}
          onMouseEnter={() => activeMenu && toggleMenu('file')}
        >
          File
          <Dropdown visible={activeMenu === 'file'}>
            <DropdownItem onClick={handleSave}>Save...</DropdownItem>
            <DropdownItem onClick={handleLoad}>Open...</DropdownItem>
            <Divider />
            <DropdownItem onClick={handleExport}>Export...</DropdownItem>
            <Divider />
            <DropdownItem onClick={() => {}}>Print</DropdownItem>
          </Dropdown>
        </MenuItem>
        
        <MenuItem 
          onClick={() => toggleMenu('edit')}
          onMouseEnter={() => activeMenu && toggleMenu('edit')}
        >
          Edit
          <Dropdown visible={activeMenu === 'edit'}>
            <DropdownItem onClick={() => {}}>Undo</DropdownItem>
            <DropdownItem onClick={() => {}}>Redo</DropdownItem>
            <Divider />
            <DropdownItem onClick={() => {}}>Cut</DropdownItem>
            <DropdownItem onClick={() => {}}>Copy</DropdownItem>
            <DropdownItem onClick={() => {}}>Paste</DropdownItem>
          </Dropdown>
        </MenuItem>
        
        <MenuItem 
          onClick={() => toggleMenu('view')}
          onMouseEnter={() => activeMenu && toggleMenu('view')}
        >
          View
          <Dropdown visible={activeMenu === 'view'}>
            <DropdownItem 
              checked={viewOptions.showFormulaBar}
              onClick={() => dispatch(toggleFormulaBar())}
            >
              Formula Bar
            </DropdownItem>
            <DropdownItem 
              checked={viewOptions.showGridlines}
              onClick={() => dispatch(toggleGridlines())}
            >
              Gridlines
            </DropdownItem>
            <DropdownItem 
              checked={viewOptions.showHeaders}
              onClick={() => dispatch(toggleHeaders())}
            >
              Headers
            </DropdownItem>
            <Divider />
            <DropdownItem onClick={() => handleSetZoom(50)}>50%</DropdownItem>
            <DropdownItem onClick={() => handleSetZoom(75)}>75%</DropdownItem>
            <DropdownItem onClick={() => handleSetZoom(100)}>100%</DropdownItem>
            <DropdownItem onClick={() => handleSetZoom(125)}>125%</DropdownItem>
            <DropdownItem onClick={() => handleSetZoom(150)}>150%</DropdownItem>
            <DropdownItem onClick={() => handleSetZoom(200)}>200%</DropdownItem>
          </Dropdown>
        </MenuItem>
        
        <MenuItem 
          onClick={() => toggleMenu('insert')}
          onMouseEnter={() => activeMenu && toggleMenu('insert')}
        >
          Insert
          <Dropdown visible={activeMenu === 'insert'}>
            <DropdownItem onClick={() => {}}>Row Above</DropdownItem>
            <DropdownItem onClick={() => {}}>Row Below</DropdownItem>
            <DropdownItem onClick={() => {}}>Column Left</DropdownItem>
            <DropdownItem onClick={() => {}}>Column Right</DropdownItem>
            <Divider />
            <DropdownItem onClick={() => {}}>Function...</DropdownItem>
          </Dropdown>
        </MenuItem>
        
        <MenuItem 
          onClick={() => toggleMenu('format')}
          onMouseEnter={() => activeMenu && toggleMenu('format')}
        >
          Format
          <Dropdown visible={activeMenu === 'format'}>
            <DropdownItem onClick={() => {}}>Number</DropdownItem>
            <DropdownItem onClick={() => {}}>Text</DropdownItem>
            <Divider />
            <DropdownItem onClick={() => {}}>Bold</DropdownItem>
            <DropdownItem onClick={() => {}}>Italic</DropdownItem>
            <Divider />
            <DropdownItem onClick={() => {}}>Clear Formatting</DropdownItem>
          </Dropdown>
        </MenuItem>
        
        <MenuItem 
          onClick={() => toggleMenu('data')}
          onMouseEnter={() => activeMenu && toggleMenu('data')}
        >
          Data
          <Dropdown visible={activeMenu === 'data'}>
            <DropdownItem onClick={() => {}}>Sort Sheet</DropdownItem>
            <DropdownItem onClick={() => {}}>Sort Range</DropdownItem>
            <Divider />
            <DropdownItem onClick={() => {}}>Remove Duplicates</DropdownItem>
          </Dropdown>
        </MenuItem>
        
        <MenuItem 
          onClick={() => toggleMenu('help')}
          onMouseEnter={() => activeMenu && toggleMenu('help')}
        >
          Help
          <Dropdown visible={activeMenu === 'help'}>
            <DropdownItem onClick={() => {}}>Function List</DropdownItem>
            <DropdownItem onClick={() => {}}>Keyboard Shortcuts</DropdownItem>
            <Divider />
            <DropdownItem onClick={() => {}}>About</DropdownItem>
          </Dropdown>
        </MenuItem>
      </MenuBar>
      
      {/* Zoom Controls */}
      <ZoomControls>
        <ZoomButton onClick={handleZoomOut}>−</ZoomButton>
        <ZoomText>{viewOptions.zoom}%</ZoomText>
        <ZoomButton onClick={handleZoomIn}>+</ZoomButton>
      </ZoomControls>
      
      <UserActions>
        <ShareButton onClick={handleShare}>
          Share
        </ShareButton>
      </UserActions>
      
      {/* Save/Load Dialog */}
      <SaveLoadDialog
        isOpen={saveLoadDialog.isOpen}
        mode={saveLoadDialog.mode}
        onClose={handleCloseDialog}
        onSave={(name) => {
          dispatch(displayToast(`Spreadsheet "${name}" saved successfully`, 'success'));
        }}
        onLoad={handleLoadSpreadsheet}
        onExport={(name, format) => {
          dispatch(displayToast(`Spreadsheet exported as ${format.toUpperCase()}`, 'success'));
        }}
      />
    </HeaderContainer>
  );
};

export default Header;