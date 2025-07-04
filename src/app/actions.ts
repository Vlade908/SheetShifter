'use server';

import type { Selection, DataType, DetailedReport, DetailedValidationRow, SpreadsheetData, CorrectedFile } from '@/types';
import * as XLSX from 'xlsx';
import { parseCurrency } from '@/lib/utils';

export interface ValidationRequest {
  key: string;
  selection: Selection;
}

export interface ReportOptions {
    filterGreaterThan?: number;
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
            return !isNaN(parseCurrency(sample)) && isFinite(Number(sample));
        case 'date':
            return !isNaN(new Date(sample).getTime());
        case 'currency':
            const numericValue = parseCurrency(sample);
            return !isNaN(numericValue) && isFinite(numericValue);
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
        
        const targetKeyCounts = new Map<string, number>();
        for (const key of targetKeyCol.fullData) {
            if (key) {
                targetKeyCounts.set(key, (targetKeyCounts.get(key) || 0) + 1);
            }
        }

        const duplicateKeyList = Array.from(targetKeyCounts.entries())
            .filter(([_, count]) => count > 1)
            .map(([key, _]) => key);

        const allResults = targetValueCol.fullData.map((value, index) => {
            const targetKey = targetKeyCol.fullData[index];
            const sourceValue = sourceMap.get(targetKey);
            
            const isMatch = (targetKey && sourceValue !== undefined) 
              ? parseCurrency(sourceValue) === parseCurrency(value)
              : false;
            
            return {
                rowIndex: index,
                keyValue: targetKey || '',
                value: value,
                sourceValue: sourceValue,
                isValid: isMatch,
            };
        });

        const results = allResults.filter(row => {
            if (options.filterGreaterThan !== undefined) {
                if (row.sourceValue === undefined) return false;
                const numericSourceValue = parseCurrency(row.sourceValue);
                return !isNaN(numericSourceValue) && numericSourceValue >= options.filterGreaterThan;
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
            keyColumnName: targetKeyCol.columnName,
            sourceWorksheetName: sourceValueCol.worksheetName,
            sourceColumnName: sourceValueCol.columnName,
            sourceKeyColumnName: sourceKeyCol.columnName,
            valueDataType: targetValueCol.dataType,
            sourceValueDataType: sourceValueCol.dataType,
            results,
            duplicateKeyList,
            summary: {
                totalRows,
                validRows,
                invalidRows,
                duplicateKeys: duplicateKeyList.length,
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
        duplicateKeyList: [],
        summary: {
          totalRows,
          validRows,
          invalidRows,
          duplicateKeys: 0,
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
  targetWorksheetName?: string,
  options: ReportOptions = {}
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
    
    const originalData = targetWorksheet.data;
    const dataRows = originalData.slice(targetWorksheet.headerRow);

    // Group rows by key to handle duplicates
    const groupedRows = new Map<string, { row: any[] }[]>();
    dataRows.forEach((row) => {
        const key = row[keyColIndex];
        if (key) {
            const group = groupedRows.get(key) || [];
            group.push({ row });
            groupedRows.set(key, group);
        }
    });

    const finalRows: any[][] = [];

    for (const [key, group] of groupedRows.entries()) {
        const correctValueStr = sourceMap.get(key);
        if (correctValueStr === undefined) continue;

        const numericSourceValue = parseCurrency(correctValueStr);
        if (options.filterGreaterThan !== undefined) {
            if (isNaN(numericSourceValue) || numericSourceValue < options.filterGreaterThan) {
                continue;
            }
        }
        
        const isValueCurrency = targetValueCol.dataType === 'currency';
        const currencyFormat = 'R$ #,##0.00';
        
        const correctedValue = isValueCurrency && !isNaN(numericSourceValue)
            ? { t: 'n', v: numericSourceValue, z: currencyFormat }
            : correctValueStr;

        if (group.length === 1) { // Not a duplicate
            const singleRowItem = group[0];
            const correctedRow = [...singleRowItem.row];
            correctedRow[valueColIndex] = correctedValue;
            finalRows.push(correctedRow);
        } else { // Duplicates found
            const existingCorrectRow = group.find(item => {
                const itemValue = item.row[valueColIndex];
                return parseCurrency(itemValue) === numericSourceValue;
            });

            if (existingCorrectRow) {
                finalRows.push(existingCorrectRow.row);
            } else {
                group.sort((a, b) => {
                    const valA = parseCurrency(a.row[valueColIndex]);
                    const valB = parseCurrency(b.row[valueColIndex]);
                    if (isNaN(valA)) return -1;
                    if (isNaN(valB)) return 1;
                    return valA - valB;
                });

                const rowToKeep = group[group.length - 1]; 
                const correctedRow = [...rowToKeep.row];
                correctedRow[valueColIndex] = correctedValue;
                finalRows.push(correctedRow);
            }
        }
    }

    if (finalRows.length > 0) {
      const correctedSheetData = [headerRowArray, ...finalRows];
      const newWs = XLSX.utils.aoa_to_sheet(correctedSheetData, { cellDates: true });
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

export async function generatePaymentSheetAction(
  selections: Selection[],
  primaryWorksheetName: string,
): Promise<CorrectedFile | null> {
  const primarySelections = selections.filter(s => s.worksheetName === primaryWorksheetName);

  const nomeCol = primarySelections.find(s => s.role === 'key');
  const cpfCol = primarySelections.find(s => s.role === 'cpf');
  const valorCol = primarySelections.find(s => s.role === 'value');

  if (!nomeCol || !cpfCol || !valorCol) {
    throw new Error('As colunas "Nome (Chave)", "CPF" e "Valor" devem ser selecionadas na planilha principal.');
  }

  const paymentData: (string | number)[][] = [['Nome', 'CPF', 'Valor']];

  for (let i = 0; i < nomeCol.fullData.length; i++) {
    const valorStr = valorCol.fullData[i];
    const valorNum = parseCurrency(valorStr);

    if (!isNaN(valorNum) && valorNum > 0) {
      const nome = nomeCol.fullData[i];
      const cpf = cpfCol.fullData[i];
      paymentData.push([nome, cpf, valorNum]);
    }
  }

  if (paymentData.length <= 1) {
    return null; // No rows with value > 0
  }

  const ws = XLSX.utils.aoa_to_sheet(paymentData);

  // Apply currency format to the 'Valor' column
  const currencyFormat = 'R$ #,##0.00';
  Object.keys(ws).forEach(cellAddress => {
    // Check if the cell is in the third column (C) and not the header
    if (cellAddress.startsWith('C') && cellAddress !== 'C1') {
      if (ws[cellAddress]?.v !== undefined) {
        ws[cellAddress].t = 'n';
        ws[cellAddress].z = currencyFormat;
      }
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pagamento');

  const date = new Date();
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const fileName = `Pagamento ${month} - ${year}.xlsx`;

  const fileContent = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

  return {
    fileName,
    content: fileContent,
  };
}
