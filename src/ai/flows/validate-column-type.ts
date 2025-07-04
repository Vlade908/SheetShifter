//ValidateColumnType: src/ai/flows/validate-column-type.ts
'use server';
/**
 * @fileOverview Validates if the selected column type is appropriate for the data.
 *
 * - validateColumnType - A function that validates the column type.
 * - ValidateColumnTypeInput - The input type for the validateColumnType function.
 * - ValidateColumnTypeOutput - The return type for the validateColumnType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateColumnTypeInputSchema = z.object({
  columnName: z.string().describe('The name of the column to validate.'),
  dataType: z.enum(['date', 'currency', 'text', 'number']).describe('The data type selected for the column.'),
  sampleData: z.string().describe('A representative sample of data from the column.'),
});
export type ValidateColumnTypeInput = z.infer<typeof ValidateColumnTypeInputSchema>;

const ValidateColumnTypeOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the selected data type is appropriate for the sample data.'),
  reason: z.string().describe('The reason why the data type is or is not appropriate.'),
});
export type ValidateColumnTypeOutput = z.infer<typeof ValidateColumnTypeOutputSchema>;

export async function validateColumnType(input: ValidateColumnTypeInput): Promise<ValidateColumnTypeOutput> {
  return validateColumnTypeFlow(input);
}

const validateColumnTypePrompt = ai.definePrompt({
  name: 'validateColumnTypePrompt',
  input: {schema: ValidateColumnTypeInputSchema},
  output: {schema: ValidateColumnTypeOutputSchema},
  prompt: `You are an AI assistant that validates if a selected data type is appropriate for a column of data.

  Column Name: {{{columnName}}}
  Data Type: {{{dataType}}}
  Sample Data: {{{sampleData}}}

  Determine if the selected data type is appropriate for the sample data provided.  If the data type is not appropriate, explain why.
  Return a JSON object with the following format:
  {
    "isValid": true or false,
    "reason": "A brief explanation of why the data type is (or is not) appropriate."
  }`,
});

const validateColumnTypeFlow = ai.defineFlow(
  {
    name: 'validateColumnTypeFlow',
    inputSchema: ValidateColumnTypeInputSchema,
    outputSchema: ValidateColumnTypeOutputSchema,
  },
  async input => {
    const {output} = await validateColumnTypePrompt(input);
    return output!;
  }
);
