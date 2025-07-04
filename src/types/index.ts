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
  fileName: string;
  worksheetName: string;
  columnName: string;
  dataType: DataType;
  role?: 'key' | 'value' | 'cpf';
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

export interface DetailedValidationRow {
  rowIndex: number;
  keyValue?: string;
  value: string;
  sourceValue?: string;
  isValid: boolean;
}

export interface DetailedReport {
  key: string;
  fileName: string;
  columnName: string;
  worksheetName: string;
  keyColumnName?: string;
  sourceWorksheetName?: string;
  sourceColumnName?: string;
  sourceKeyColumnName?: string;
  valueDataType?: DataType;
  sourceValueDataType?: DataType;
  results: DetailedValidationRow[];
  duplicateKeyList: string[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateKeys: number;
  };
}
