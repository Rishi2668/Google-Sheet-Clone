import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import {
  setCellValue,
  addRow,
  deleteRow,
  addColumn,
  deleteColumn
} from '../../state/slices/spreadsheetSlice';
import {
  hideContextMenu,
  showFindReplace
} from '../../state/slices/uiSlice';

const MenuContainer = styled.div<{ x: number; y: number }>`
  position: fixed;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  min-width: 180px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 8px 0;
  z-index: 1000;
`;

const MenuItem = styled.div<{ disabled?: boolean }>`
  padding: 8px 16px;
  font-size: 14px;
  color: ${props => props.disabled ? '#9aa0a6' : '#202124'};
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: ${props => props.disabled ? 'transparent' : '#f1f3f4'};
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: #e0e0e0;
  margin: 4px 0;
`;

const ContextMenu: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get context menu state from Redux
  const contextMenu = useSelector((state: RootState) => 
    state.ui.contextMenu
  );
  
  // Get active cell
  const activeCell = useSelector((state: RootState) => 
    state.spreadsheet.activeCell
  );
  
  // Close menu when clicking outside
  const handleWindowClick = () => {
    if (contextMenu.visible) {
      dispatch(hideContextMenu());
    }
  };
  
  // Add click handler to window - MUST BE CALLED UNCONDITIONALLY
  useEffect(() => {
    window.addEventListener('click', handleWindowClick);
    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, [contextMenu.visible]); // Add contextMenu.visible as a dependency
  
  // Prevent menu from closing when clicking on it
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // If context menu is not visible, render nothing
  if (!contextMenu.visible) {
    return null;
  }
  
  // Handle menu item click
  const handleMenuItemClick = (action: () => void) => {
    // Hide context menu
    dispatch(hideContextMenu());
    
    // Execute the action
    action();
  };
  
  // Create menu items based on the target
  let menuItems: Array<{
    label: string;
    action: () => void;
    disabled?: boolean;
    divider?: boolean;
  }> = [];
  
  // Check if target is a column header (format: "col:A")
  if (contextMenu.targetId?.startsWith('col:')) {
    const columnLetter = contextMenu.targetId.split(':')[1];
    
    menuItems = [
      {
        label: 'Insert column left',
        action: () => {
          const prevColCode = columnLetter.charCodeAt(0) - 1;
          if (prevColCode >= 65) { // 'A' is 65
            dispatch(addColumn({ afterColumnLetter: String.fromCharCode(prevColCode) }));
          } else {
            // Can't insert before column A
            dispatch(addColumn({ afterColumnLetter: 'A' }));
          }
        }
      },
      {
        label: 'Insert column right',
        action: () => {
          dispatch(addColumn({ afterColumnLetter: columnLetter }));
        }
      },
      {
        label: 'Delete column',
        action: () => {
          dispatch(deleteColumn({ columnLetter }));
        }
      },
      {
        label: 'Hide column',
        action: () => {
          // Would implement visibility toggle in a real app
          console.log('Hide column', columnLetter);
        }
      },
      {
        divider: true,
        label: '',
        action: () => {}
      },
      {
        label: 'Clear column',
        action: () => {
          // Would implement clear column in a real app
          console.log('Clear column', columnLetter);
        }
      }
    ];
  }
  // Check if target is a row header (format: "row:1")
  else if (contextMenu.targetId?.startsWith('row:')) {
    const rowIndex = parseInt(contextMenu.targetId.split(':')[1]);
    
    menuItems = [
      {
        label: 'Insert row above',
        action: () => {
          dispatch(addRow({ afterRowIndex: rowIndex - 1 }));
        }
      },
      {
        label: 'Insert row below',
        action: () => {
          dispatch(addRow({ afterRowIndex: rowIndex }));
        }
      },
      {
        label: 'Delete row',
        action: () => {
          dispatch(deleteRow({ rowIndex }));
        }
      },
      {
        label: 'Hide row',
        action: () => {
          // Would implement visibility toggle in a real app
          console.log('Hide row', rowIndex);
        }
      },
      {
        divider: true,
        label: '',
        action: () => {}
      },
      {
        label: 'Clear row',
        action: () => {
          // Would implement clear row in a real app
          console.log('Clear row', rowIndex);
        }
      }
    ];
  }
  // Otherwise, it's a cell
  else {
    menuItems = [
      {
        label: 'Cut',
        action: () => {
          console.log('Cut action');
          // Would implement cut in a real app
        },
        disabled: !activeCell
      },
      {
        label: 'Copy',
        action: () => {
          console.log('Copy action');
          // Would implement copy in a real app
        },
        disabled: !activeCell
      },
      {
        label: 'Paste',
        action: () => {
          console.log('Paste action');
          // Would implement paste in a real app
        }
      },
      {
        divider: true,
        label: '',
        action: () => {}
      },
      {
        label: 'Insert row above',
        action: () => {
          if (activeCell) {
            const [, , rowStr] = activeCell.match(/([A-Z]+)(\d+)/) || [];
            const rowIndex = parseInt(rowStr);
            dispatch(addRow({ afterRowIndex: rowIndex - 1 }));
          }
        },
        disabled: !activeCell
      },
      {
        label: 'Insert row below',
        action: () => {
          if (activeCell) {
            const [, , rowStr] = activeCell.match(/([A-Z]+)(\d+)/) || [];
            const rowIndex = parseInt(rowStr);
            dispatch(addRow({ afterRowIndex: rowIndex }));
          }
        },
        disabled: !activeCell
      },
      {
        label: 'Insert column left',
        action: () => {
          if (activeCell) {
            const [, col] = activeCell.match(/([A-Z]+)(\d+)/) || [];
            const prevColCode = col.charCodeAt(0) - 1;
            if (prevColCode >= 65) { // 'A' is 65
              dispatch(addColumn({ afterColumnLetter: String.fromCharCode(prevColCode) }));
            }
          }
        },
        disabled: !activeCell
      },
      {
        label: 'Insert column right',
        action: () => {
          if (activeCell) {
            const [, col] = activeCell.match(/([A-Z]+)(\d+)/) || [];
            dispatch(addColumn({ afterColumnLetter: col }));
          }
        },
        disabled: !activeCell
      },
      {
        divider: true,
        label: '',
        action: () => {}
      },
      {
        label: 'Clear contents',
        action: () => {
          if (activeCell) {
            dispatch(setCellValue({ cellId: activeCell, value: '' }));
          }
        },
        disabled: !activeCell
      },
      {
        label: 'Find and replace...',
        action: () => {
          dispatch(showFindReplace());
        }
      }
    ];
  }
  
  return (
    <MenuContainer 
      x={contextMenu.position.x} 
      y={contextMenu.position.y}
      onClick={handleMenuClick}
    >
      {menuItems.map((item, index) => 
        item.divider ? (
          <Divider key={`divider-${index}`} />
        ) : (
          <MenuItem
            key={item.label}
            onClick={() => !item.disabled && handleMenuItemClick(item.action)}
            disabled={item.disabled}
          >
            {item.label}
          </MenuItem>
        )
      )}
    </MenuContainer>
  );
};

export default ContextMenu;