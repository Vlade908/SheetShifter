export type DataType = 'text' | 'number' | 'date' | 'currency';

export interface Column {
  name: string;
  sampleData: string[];
  fullData: string[];
}

export interface Worksheet {
  name:string;
  columns: Column[];
  headerRow: number;
  data: any[][];
}

export interface SpreadsheetData {
  fileName: string;
  worksheets: Worksheet[];
}

export interface Selection {
  worksheetName: string;
  columnName: string;
  dataType: DataType;
  sampleData: string[];
  fullData: string[];
}

export interface ValidationResult {
  isValid: boolean;
  reason: string;
}

export interface SelectionWithValidation extends Selection {
  validationResult?: ValidationResult;
  isValidating: boolean;
}
