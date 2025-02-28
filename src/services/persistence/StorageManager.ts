import { SpreadsheetState } from '../../types/spreadsheet';

// Local storage key prefix
const STORAGE_KEY_PREFIX = 'sheets_clone_';

/**
 * Service to manage saving and loading spreadsheets
 */
class StorageManager {
  /**
   * Save a spreadsheet to localStorage
   * @param name Spreadsheet name
   * @param data Spreadsheet data
   */
  saveSpreadsheet(name: string, data: SpreadsheetState): void {
    try {
      // Create a JSON string representation of the spreadsheet
      const serializedData = JSON.stringify(data);
      
      // Save to localStorage with the specified name
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${name}`, serializedData);
    } catch (error) {
      console.error('Error saving spreadsheet:', error);
      throw new Error('Failed to save spreadsheet');
    }
  }
  
  /**
   * Load a spreadsheet from localStorage
   * @param name Spreadsheet name
   * @returns Spreadsheet data
   */
  loadSpreadsheet(name: string): SpreadsheetState {
    try {
      // Get data from localStorage
      const serializedData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${name}`);
      
      if (!serializedData) {
        throw new Error(`Spreadsheet '${name}' not found`);
      }
      
      // Parse the data
      return JSON.parse(serializedData) as SpreadsheetState;
    } catch (error) {
      console.error('Error loading spreadsheet:', error);
      throw new Error('Failed to load spreadsheet');
    }
  }
  
  /**
   * Get a list of all saved spreadsheets
   * @returns Array of spreadsheet names
   */
  getSavedSpreadsheets(): string[] {
    const spreadsheets: string[] = [];
    
    // Iterate through localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Check if the key belongs to our application
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        // Extract the name
        const name = key.substring(STORAGE_KEY_PREFIX.length);
        spreadsheets.push(name);
      }
    }
    
    return spreadsheets;
  }
  
  /**
   * Delete a saved spreadsheet
   * @param name Spreadsheet name
   */
  deleteSpreadsheet(name: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${name}`);
    } catch (error) {
      console.error('Error deleting spreadsheet:', error);
      throw new Error('Failed to delete spreadsheet');
    }
  }
  
  /**
   * Export spreadsheet data to a file
   * @param name Spreadsheet name
   * @param data Spreadsheet data
   */
  exportToFile(name: string, data: SpreadsheetState): void {
    try {
      // Create a JSON blob
      const serializedData = JSON.stringify(data, null, 2);
      const blob = new Blob([serializedData], { type: 'application/json' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.json`;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting spreadsheet:', error);
      throw new Error('Failed to export spreadsheet');
    }
  }
  
  /**
   * Import spreadsheet data from a file
   * @param file File object containing spreadsheet data
   * @returns Promise resolving to the imported spreadsheet data
   */
  importFromFile(file: File): Promise<SpreadsheetState> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (!event.target?.result) {
            throw new Error('Failed to read file');
          }
          
          // Parse the file contents
          const data = JSON.parse(event.target.result as string) as SpreadsheetState;
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid spreadsheet file format'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Export spreadsheet as CSV
   * @param data Spreadsheet data
   * @returns CSV string
   */
  exportToCSV(data: SpreadsheetState): string {
    // Find the used range in the spreadsheet
    let maxRow = 0;
    let maxCol = 0;
    
    Object.keys(data.cells).forEach(cellId => {
      const [, col, row] = cellId.match(/([A-Z]+)(\d+)/) || [];
      const colCode = col.charCodeAt(0) - 65; // A = 0, B = 1, etc.
      const rowNum = parseInt(row);
      
      maxCol = Math.max(maxCol, colCode);
      maxRow = Math.max(maxRow, rowNum);
    });
    
    // Create CSV content
    let csvContent = '';
    
    for (let row = 1; row <= maxRow; row++) {
      const rowValues = [];
      
      for (let col = 0; col <= maxCol; col++) {
        const colLetter = String.fromCharCode(col + 65);
        const cellId = `${colLetter}${row}`;
        const cellValue = data.cells[cellId]?.displayValue || '';
        
        // Escape values with commas
        if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
          rowValues.push(`"${cellValue.replace(/"/g, '""')}"`);
        } else {
          rowValues.push(cellValue);
        }
      }
      
      csvContent += rowValues.join(',') + '\n';
    }
    
    return csvContent;
  }
  
  /**
   * Download spreadsheet as CSV
   * @param name Spreadsheet name
   * @param data Spreadsheet data
   */
  downloadCSV(name: string, data: SpreadsheetState): void {
    try {
      const csvContent = this.exportToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      throw new Error('Failed to download CSV');
    }
  }
}

// Export singleton instance
export default new StorageManager();