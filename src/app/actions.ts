'use server';

import { validateColumnType, type ValidateColumnTypeInput } from '@/ai/flows/validate-column-type';
import type { Selection } from '@/types';

export interface ValidationRequest {
  key: string;
  selection: Selection;
}

export interface ValidationResponse {
  key: string;
  isValid: boolean;
  reason: string;
}

export async function validateSelectionsAction(
  requests: ValidationRequest[]
): Promise<ValidationResponse[]> {
  const validationPromises = requests.map(async (request) => {
    const { key, selection } = request;
    const { columnName, dataType, sampleData } = selection;

    const aiInput: ValidateColumnTypeInput = {
      columnName,
      dataType,
      sampleData: sampleData.join(', '),
    };

    try {
      const result = await validateColumnType(aiInput);
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
        reason: 'An error occurred during validation.',
      };
    }
  });

  return Promise.all(validationPromises);
}
