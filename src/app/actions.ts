'use server';

import type { Selection, DataType, DetailedReport, DetailedValidationRow, SpreadsheetData } from '@/types';
import * as XLSX from 'xlsx';

export interface ValidationRequest {
  key: string;
  selection: Selection;
}

export interface ReportOptions {
    filterLessThan?: number;
}

export interface ValidationResponse {
  key: string;
  isValid: boolean;
  reason: string;
}

export interface CorrectedFile {
    fileName: string;
    content: string; // base64 encoded
}

function validateSample(sample: string, dataType: DataType): boolean {
    if (sample === null || sample === undefined || sample === '') return true;

    switch (dataType) {
        case 'text':
            return true;
        case 'number':
            return !isNaN(parseFloat(sample)) && isFinite(Number(sample));
        case 'date':
            return !isNaN(new Date(sample).getTime());
        case 'currency':
            const cleanedSample = sample.replace(/[\$,€£¥]/g, '').replace(/,/g, '').trim();
            if (cleanedSample === '') return true;
            return !isNaN(parseFloat(cleanedSample)) && isFinite(Number(cleanedSample));
        default:
            return false;
    }
}


function localValidate(selection: Selection): { isValid: boolean; reason: string } {
    const { dataType, fullData, columnName } = selection;

    if (fullData.length === 0) {
        return { isValid: true, reason: 'Nenhum dado de amostra para validar.' };
    }

    const allValid = fullData.every(sample => validateSample(sample, dataType));

    if (allValid) {
        return { isValid: true, reason: `O tipo de dados '${dataType}' é uma boa opção para a coluna '${columnName}'.` };
    }

    const firstInvalidSample = fullData.find(sample => !validateSample(sample, dataType));

    return {
        isValid: false,
        reason: `O tipo de dados '${dataType}' não é apropriado. Por exemplo, o valor '${firstInvalidSample}' não corresponde.`
    };
}


export async function validateSelectionsAction(
  requests: ValidationRequest[]
): Promise<ValidationResponse[]> {
  const validationPromises = requests.map(async (request) => {
    const { key, selection } = request;
    
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const result = localValidate(selection);
      return {
        key,
        isValid: result.isValid,
        reason: result.reason,
      };
    } catch (error) {
      console.error('Error validating column:', error);
      return {
        key,
        isValid: false,
        reason: 'Ocorreu um erro durante a validação.',
      };
    }
  });

  return Promise.all(validationPromises);
}


function runComparisonValidation(requests: ValidationRequest[], options: ReportOptions): DetailedReport[] {
    const selections = requests.map(r => r.selection);
    
    const selectionsByWorksheet = selections.reduce((acc, sel) => {
        if (!acc[sel.worksheetName]) {
            acc[sel.worksheetName] = { keys: [], values: [] };
        }
        if (sel.role === 'key') acc[sel.worksheetName].keys.push(sel);
        if (sel.role === 'value') acc[sel.worksheetName].values.push(sel);
        return acc;
    }, {} as Record<string, { keys: Selection[], values: Selection[] }>);

    const worksheetPairs = Object.values(selectionsByWorksheet).filter(ws => ws.keys.length > 0 && ws.values.length > 0);

    if (worksheetPairs.length < 2) {
        throw new Error("Para comparação, selecione colunas Chave e Valor em pelo menos duas planilhas.");
    }

    const sourceWs = worksheetPairs[0];
    const sourceKeyCol = sourceWs.keys[0];
    const sourceValueCol = sourceWs.values[0];
    const sourceMap = new Map<string, string>();
    for (let i = 0; i < sourceKeyCol.fullData.length; i++) {
        const key = sourceKeyCol.fullData[i];
        if (key) {
            sourceMap.set(key, sourceValueCol.fullData[i]);
        }
    }
    
    const reports: DetailedReport[] = [];
    
    for (let i = 1; i < worksheetPairs.length; i++) {
        const targetWs = worksheetPairs[i];
        const targetKeyCol = targetWs.keys[0];
        const targetValueCol = targetWs.values[0];

        const allResults = targetValueCol.fullData.map((value, index) => {
            const targetKey = targetKeyCol.fullData[index];
            const sourceValue = sourceMap.get(targetKey);
            const isValid = (targetKey && sourceValue !== undefined) ? sourceValue === value : false;
            
            return {
                rowIndex: index,
                value: value,
                sourceValue: sourceValue,
                isValid,
            };
        });

        const results = allResults.filter(row => {
            if (options.filterLessThan !== undefined) {
                if (row.sourceValue === undefined) return false;
                const numericSourceValue = parseFloat(row.sourceValue);
                return !isNaN(numericSourceValue) && numericSourceValue < options.filterLessThan;
            }
            return true;
        });

        const validRows = results.filter(r => r.isValid).length;
        const totalRows = results.length;
        const invalidRows = totalRows - validRows;

        reports.push({
            key: `${targetValueCol.worksheetName}-${targetValueCol.columnName}`,
            columnName: targetValueCol.columnName,
            worksheetName: targetValueCol.worksheetName,
            sourceWorksheetName: sourceValueCol.worksheetName,
            sourceColumnName: sourceValueCol.columnName,
            results,
            summary: {
                totalRows,
                validRows,
                invalidRows,
            },
        });
    }

    return reports;
}

function runDataTypeValidation(requests: ValidationRequest[]): DetailedReport[] {
    const reports: DetailedReport[] = requests.map(request => {
      const { key, selection } = request;
      const { columnName, worksheetName, dataType, fullData } = selection;
  
      let validRows = 0;
      const results: DetailedValidationRow[] = fullData.map((value, index) => {
        const isValid = validateSample(value, dataType);
        if (isValid) {
          validRows++;
        }
        return {
          rowIndex: index,
          value,
          isValid,
        };
      });
  
      const totalRows = fullData.length;
      const invalidRows = totalRows - validRows;
  
      return {
        key,
        columnName,
        worksheetName,
        results,
        summary: {
          totalRows,
          validRows,
          invalidRows,
        },
      };
    });
  
    return reports;
}

export async function getDetailedValidationReportAction(
  requests: ValidationRequest[],
  options: ReportOptions = {}
): Promise<DetailedReport[]> {
    const hasRoles = requests.some(r => r.selection.role);
    if (hasRoles) {
        return runComparisonValidation(requests, options);
    }
    return runDataTypeValidation(requests);
}

export async function compareAndCorrectAction(
  spreadsheetData: SpreadsheetData,
  selections: Selection[],
  primaryWorksheetName: string,
  targetWorksheetName?: string
): Promise<CorrectedFile[]> {
  const primarySelections = selections.filter(s => s.worksheetName === primaryWorksheetName);
  const primaryKeyCol = primarySelections.find(s => s.role === 'key');
  const primaryValueCol = primarySelections.find(s => s.role === 'value');

  if (!primaryKeyCol || !primaryValueCol) {
    throw new Error(`A planilha principal '${primaryWorksheetName}' deve ter uma coluna Chave e uma Valor selecionadas.`);
  }

  const sourceMap = new Map<string, string>();
  for (let i = 0; i < primaryKeyCol.fullData.length; i++) {
    const key = primaryKeyCol.fullData[i];
    if (key) {
      sourceMap.set(key, primaryValueCol.fullData[i]);
    }
  }

  const correctedFiles: CorrectedFile[] = [];
  const secondaryWorksheetNames = targetWorksheetName
    ? [targetWorksheetName]
    : [...new Set(
        selections
          .filter(s => s.worksheetName !== primaryWorksheetName && s.role)
          .map(s => s.worksheetName)
      )];


  for (const wsName of secondaryWorksheetNames) {
    const targetWorksheet = spreadsheetData.worksheets.find(ws => ws.name === wsName);
    if (!targetWorksheet) continue;

    const targetSelections = selections.filter(s => s.worksheetName === wsName);
    const targetKeyCol = targetSelections.find(s => s.role === 'key');
    const targetValueCol = targetSelections.find(s => s.role === 'value');

    if (!targetKeyCol || !targetValueCol) continue;

    const headerRowArray = targetWorksheet.data[targetWorksheet.headerRow - 1] as string[];
    const keyColIndex = headerRowArray.findIndex(h => h === targetKeyCol.columnName);
    const valueColIndex = headerRowArray.findIndex(h => h === targetValueCol.columnName);

    if (keyColIndex === -1 || valueColIndex === -1) {
      console.warn(`Não foi possível encontrar as colunas Chave/Valor na planilha ${wsName}`);
      continue;
    }

    const correctedData = JSON.parse(JSON.stringify(targetWorksheet.data));
    let hasCorrections = false;

    for (let i = targetWorksheet.headerRow; i < correctedData.length; i++) {
      const row = correctedData[i];
      const key = row[keyColIndex];
      const currentValue = row[valueColIndex];

      if (key && sourceMap.has(key)) {
        const correctValue = sourceMap.get(key);
        if (currentValue !== correctValue) {
          row[valueColIndex] = correctValue;
          hasCorrections = true;
        }
      }
    }

    if (hasCorrections) {
      const newWs = XLSX.utils.aoa_to_sheet(correctedData);
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, newWs, wsName);
      
      const fileContent = XLSX.write(newWb, { bookType: 'xlsx', type: 'base64' });
      
      correctedFiles.push({
        fileName: `${spreadsheetData.fileName.replace(/\.[^/.]+$/, "")}_${wsName}_corrigido.xlsx`,
        content: fileContent
      });
    }
  }

  return correctedFiles;
}
