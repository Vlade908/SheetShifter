'use server';

import type { Selection, DataType } from '@/types';

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
    if (!sample) return true; // Treat empty/null samples as valid for any type

    switch (dataType) {
        case 'text':
            return true;
        case 'number':
            // Check if it's a valid number, allowing for decimals.
            return !isNaN(parseFloat(sample)) && isFinite(Number(sample));
        case 'date':
            // Check if it's a valid date string.
            // This will handle formats like "2023-07-15", "07/21/2023", "July 5, 2023", "2023/07/10"
            return !isNaN(new Date(sample).getTime());
        case 'currency':
            // Simple check for common currency formats.
            // Removes currency symbols and commas, then checks if it's a number.
            const cleanedSample = sample.replace(/[\$,€£¥]/g, '').replace(/,/g, '').trim();
            if (cleanedSample === '') return true; // Allow empty values
            return !isNaN(parseFloat(cleanedSample)) && isFinite(Number(cleanedSample));
        default:
            return false;
    }
}


function localValidate(selection: Selection): { isValid: boolean; reason: string } {
    const { dataType, sampleData, columnName } = selection;

    if (sampleData.length === 0) {
        return { isValid: true, reason: 'Nenhum dado de amostra para validar.' };
    }

    // Check if all samples match the data type
    const allValid = sampleData.every(sample => validateSample(sample, dataType));

    if (allValid) {
        return { isValid: true, reason: `O tipo de dados '${dataType}' é uma boa opção para a coluna '${columnName}'.` };
    }

    // Find the first invalid sample to provide a more specific reason
    const firstInvalidSample = sampleData.find(sample => !validateSample(sample, dataType));

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
    
    // Simulate a short delay to make the loading spinner visible
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
