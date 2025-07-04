'use server';

import type { Selection, DataType, DetailedReport, DetailedValidationRow } from '@/types';

export interface ValidationRequest {
  key: string;
  selection: Selection;
}

export interface ValidationResponse {
  key: string;
  isValid: boolean;
  reason: string;
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


function runComparisonValidation(requests: ValidationRequest[]): DetailedReport[] {
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

    // Usar o primeiro par como fonte de verdade
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
    
    // Comparar todos os outros pares com a fonte
    for (let i = 1; i < worksheetPairs.length; i++) {
        const targetWs = worksheetPairs[i];
        const targetKeyCol = targetWs.keys[0];
        const targetValueCol = targetWs.values[0];

        let validRows = 0;
        const results: DetailedValidationRow[] = targetValueCol.fullData.map((value, index) => {
            const targetKey = targetKeyCol.fullData[index];
            const sourceValue = sourceMap.get(targetKey);
            const isValid = (targetKey && sourceValue !== undefined) ? sourceValue === value : false;
            
            if (isValid) {
                validRows++;
            }
            return {
                rowIndex: index,
                value: value,
                sourceValue: sourceValue,
                isValid,
            };
        });

        const totalRows = targetValueCol.fullData.length;
        const invalidRows = totalRows - validRows;

        reports.push({
            key: `${targetValueCol.worksheetName}-${targetValueCol.columnName}`,
            columnName: `${targetValueCol.columnName} (vs ${sourceValueCol.columnName})`,
            worksheetName: targetValueCol.worksheetName,
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
  requests: ValidationRequest[]
): Promise<DetailedReport[]> {
    const hasRoles = requests.some(r => r.selection.role);
    if (hasRoles) {
        return runComparisonValidation(requests);
    }
    return runDataTypeValidation(requests);
}
