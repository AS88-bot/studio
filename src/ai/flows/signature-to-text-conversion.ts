'use server';
/**
 * @fileOverview Converts a signature image into editable text.
 *
 * - signatureToTextConversion - A function that converts the signature image to text.
 * - SignatureToTextConversionInput - The input type for the signatureToTextConversion function.
 * - SignatureToTextConversionOutput - The return type for the signatureToTextConversion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SignatureToTextConversionInputSchema = z.object({
  signatureDataUri: z
    .string()
    .describe(
      'A signature image as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' + 
      'Ensure the signature is clear and well-lit for accurate conversion.'
    ),
});
export type SignatureToTextConversionInput = z.infer<typeof SignatureToTextConversionInputSchema>;

const SignatureToTextConversionOutputSchema = z.object({
  signatureText: z
    .string()
    .describe('The text representation of the signature extracted from the image.'),
});
export type SignatureToTextConversionOutput = z.infer<typeof SignatureToTextConversionOutputSchema>;

export async function signatureToTextConversion(
  input: SignatureToTextConversionInput
): Promise<SignatureToTextConversionOutput> {
  return signatureToTextConversionFlow(input);
}

const signatureToTextConversionPrompt = ai.definePrompt({
  name: 'signatureToTextConversionPrompt',
  input: {schema: SignatureToTextConversionInputSchema},
  output: {schema: SignatureToTextConversionOutputSchema},
  prompt: `You are an expert in optical character recognition (OCR) and signature analysis.

  Your task is to analyze the provided signature image and convert it into editable text format.
  Pay close attention to the details of the signature to ensure accurate text representation. 
  If the signature is illegible, provide your best interpretation. Make it as close as possible to the original signature.

  Analyze the following signature image and provide its text representation:
  {{media url=signatureDataUri}}`,
});

const signatureToTextConversionFlow = ai.defineFlow(
  {
    name: 'signatureToTextConversionFlow',
    inputSchema: SignatureToTextConversionInputSchema,
    outputSchema: SignatureToTextConversionOutputSchema,
  },
  async input => {
    const {output} = await signatureToTextConversionPrompt(input);
    return output!;
  }
);
