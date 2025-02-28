# Google Sheets Clone

## Overview
The Google Sheets Clone is a web-based spreadsheet application designed to replicate the core functionalities of Google Sheets. It provides users with an intuitive interface, powerful mathematical functions, data quality tools, and seamless file export capabilities. Built using modern web technologies, this tool offers a smooth and responsive experience for managing and analyzing data.

## Features

### **1. Spreadsheet Interface:**

- **Mimic Google Sheets UI:** Designed to closely resemble Google Sheets, including the toolbar, formula bar, and structured cell layout.
- **Drag Functions:** Supports dragging functionality for cell content, formulas, and selections, mimicking Google Sheets' behavior.
- **Cell Dependencies:** Ensures accurate formula calculations with automatic updates when related cells change.
- **Cell Formatting:** Provides support for basic formatting such as bold, italics, font size, and color customization.
- **Row and Column Management:** Users can add, delete, and resize rows and columns.

### **2. Mathematical Functions:**

- **SUM:** Calculates the sum of a selected range of cells.
- **AVERAGE:** Computes the average value within a range.
- **MAX:** Retrieves the maximum value from a given range.
- **MIN:** Returns the minimum value from a selected range.
- **COUNT:** Counts the number of numerical values in a specified range.

### **3. Data Quality Functions:**

- **TRIM:** Removes leading and trailing whitespace from a cell.
- **UPPER:** Converts text within a cell to uppercase.
- **LOWER:** Converts text within a cell to lowercase.
- **REMOVE\_DUPLICATES:** Identifies and eliminates duplicate rows within a selected range.
- **FIND\_AND\_REPLACE:** Enables users to search and replace specific text across a range of cells.

### **4. Data Entry and Validation:**

- **Flexible Data Input:** Supports entry of various data types, including numbers, text, and dates.
- **Validation Checks:** Ensures numeric cells contain only valid numerical data.

### **5. File Export and Saving:**

- **CSV Export:** Users can save and export their spreadsheets in CSV format.
- **File Persistence:** Allows saving of data within the application for future access.

## Tech Stack
- **Frontend:** React, TypeScript
- **State Management:** React Context API / Redux
- **Styling:** Tailwind CSS / Styled Components

## Installation & Running the Project

To run the project, follow these steps:

```sh
git clone <repo name>
cd google-sheets-clone
npm install
npm start
```

This implementation provides a fully functional Google Sheets-like experience with robust features for data manipulation, formatting, and export capabilities.

