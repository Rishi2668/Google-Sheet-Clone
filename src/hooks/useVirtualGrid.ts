import { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface ViewportState {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

interface VirtualGridOptions {
  totalRows: number;
  totalColumns: number;
  defaultRowHeight: number;
  defaultColumnWidth: number;
  rows: { [key: string]: { height: number } };
  columns: { [key: string]: { width: number } };
  overscanCount?: number;
}

function useVirtualGrid({
  totalRows,
  totalColumns,
  defaultRowHeight,
  defaultColumnWidth,
  rows,
  columns,
  overscanCount = 5
}: VirtualGridOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Memoize calculations to prevent unnecessary re-renders
  const rowPositions = useMemo(() => {
    const positions: number[] = [];
    let currentPosition = 0;
    
    for (let i = 0; i < totalRows; i++) {
      positions.push(currentPosition);
      const rowKey = (i + 1).toString();
      const rowHeight = rows[rowKey]?.height || defaultRowHeight;
      currentPosition += rowHeight;
    }
    
    return positions;
  }, [totalRows, rows, defaultRowHeight]);
  
  const columnPositions = useMemo(() => {
    const positions: number[] = [];
    let currentPosition = 0;
    
    for (let i = 0; i < totalColumns; i++) {
      positions.push(currentPosition);
      const colKey = String.fromCharCode(65 + i); // A, B, C, ...
      const colWidth = columns[colKey]?.width || defaultColumnWidth;
      currentPosition += colWidth;
    }
    
    return positions;
  }, [totalColumns, columns, defaultColumnWidth]);
  
  // State for visible viewport with stable initial state
  const [viewportState, setViewportState] = useState<ViewportState>(() => ({
    startRow: 0,
    endRow: Math.min(20, totalRows - 1),
    startCol: 0,
    endCol: Math.min(10, totalColumns - 1)
  }));
  
  // Stable update visible range function
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollLeft, clientHeight, clientWidth } = containerRef.current;
    
    // Find visible row range
    let startRow = 0;
    let endRow = 0;
    
    // Find the first visible row
    for (let i = 0; i < rowPositions.length; i++) {
      if (rowPositions[i] > scrollTop) {
        startRow = Math.max(0, i - 1);
        break;
      }
    }
    
    // Find the last visible row
    for (let i = startRow; i < rowPositions.length; i++) {
      if (rowPositions[i] > scrollTop + clientHeight) {
        endRow = i;
        break;
      }
      
      // If we reach the end
      if (i === rowPositions.length - 1) {
        endRow = i;
      }
    }
    
    // Find visible column range
    let startCol = 0;
    let endCol = 0;
    
    // Find the first visible column
    for (let i = 0; i < columnPositions.length; i++) {
      if (columnPositions[i] > scrollLeft) {
        startCol = Math.max(0, i - 1);
        break;
      }
    }
    
    // Find the last visible column
    for (let i = startCol; i < columnPositions.length; i++) {
      if (columnPositions[i] > scrollLeft + clientWidth) {
        endCol = i;
        break;
      }
      
      // If we reach the end
      if (i === columnPositions.length - 1) {
        endCol = i;
      }
    }
    
    // Add overscan
    startRow = Math.max(0, startRow - overscanCount);
    endRow = Math.min(totalRows - 1, endRow + overscanCount);
    startCol = Math.max(0, startCol - overscanCount);
    endCol = Math.min(totalColumns - 1, endCol + overscanCount);
    
    // Use functional update to prevent unnecessary renders
    setViewportState(prev => {
      // Only update if the values have actually changed
      if (
        prev.startRow !== startRow ||
        prev.endRow !== endRow ||
        prev.startCol !== startCol ||
        prev.endCol !== endCol
      ) {
        return { startRow, endRow, startCol, endCol };
      }
      return prev;
    });
  }, [rowPositions, columnPositions, totalRows, totalColumns, overscanCount]);
  
  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      requestAnimationFrame(updateVisibleRange);
    };
    
    container.addEventListener('scroll', handleScroll);
    updateVisibleRange(); // Initial calculation
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [updateVisibleRange]);
  
  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      updateVisibleRange();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateVisibleRange]);
  
  // Scroll to specific cell
  const scrollTo = useCallback((colIndex: number, rowIndex: number) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Calculate positions
    const rowPosition = rowPositions[rowIndex] || 0;
    const colPosition = columnPositions[colIndex] || 0;
    
    // Get container viewport dimensions
    const { clientHeight, clientWidth, scrollTop, scrollLeft } = container;
    
    // Get the cell dimensions
    const rowKey = (rowIndex + 1).toString();
    const colKey = String.fromCharCode(65 + colIndex);
    const rowHeight = rows[rowKey]?.height || defaultRowHeight;
    const colWidth = columns[colKey]?.width || defaultColumnWidth;
    
    // Check if cell is outside the viewport
    const isRowOutsideViewport = 
      rowPosition < scrollTop || 
      rowPosition + rowHeight > scrollTop + clientHeight;
    
    const isColOutsideViewport = 
      colPosition < scrollLeft || 
      colPosition + colWidth > scrollLeft + clientWidth;
    
    // Scroll if needed
    if (isRowOutsideViewport) {
      if (rowPosition < scrollTop) {
        // Scroll up to show the cell at the top
        container.scrollTop = rowPosition;
      } else {
        // Scroll down to show the cell at the bottom
        container.scrollTop = rowPosition + rowHeight - clientHeight;
      }
    }
    
    if (isColOutsideViewport) {
      if (colPosition < scrollLeft) {
        // Scroll left to show the cell at the left
        container.scrollLeft = colPosition;
      } else {
        // Scroll right to show the cell at the right
        container.scrollLeft = colPosition + colWidth - clientWidth;
      }
    }
  }, [rowPositions, columnPositions, rows, columns, defaultRowHeight, defaultColumnWidth]);
  
  return {
    containerRef,
    viewportState,
    scrollTo
  };
}

export default useVirtualGrid;