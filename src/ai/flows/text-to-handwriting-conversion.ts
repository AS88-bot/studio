'use server';

/**
 * @fileOverview Converts text notes into realistic-looking handwriting with customizable styles.
 *
 * - textToHandwritingConversion - A function that handles the text-to-handwriting conversion process.
 * - TextToHandwritingConversionInput - The input type for the textToHandwritingConversion function.
 * - TextToHandwritingConversionOutput - The return type for the textToHandwritingConversion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TextToHandwritingConversionInputSchema = z.object({
  text: z.string().describe('The text to convert to handwriting.'),
  font: z.string().optional().describe('The handwriting font style (e.g., cursive, print).'),
  slant: z.string().optional().describe('The slant of the handwriting (e.g., normal, italic).'),
  thickness: z.string().optional().describe('The thickness of the handwriting (e.g., light, bold).'),
});

export type TextToHandwritingConversionInput = z.infer<
  typeof TextToHandwritingConversionInputSchema
>;

const TextToHandwritingConversionOutputSchema = z.object({
  handwritingDataUri: z
    .string()
    .describe(
      'The handwriting image as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected description
    ),
});

export type TextToHandwritingConversionOutput = z.infer<
  typeof TextToHandwritingConversionOutputSchema
>;

export async function textToHandwritingConversion(
  input: TextToHandwritingConversionInput
): Promise<TextToHandwritingConversionOutput> {
  return textToHandwritingConversionFlow(input);
}

const textToHandwritingConversionPrompt = ai.definePrompt({
  name: 'textToHandwritingConversionPrompt',
  input: {schema: TextToHandwritingConversionInputSchema},
  output: {schema: TextToHandwritingConversionOutputSchema},
  prompt: `You are an AI that converts text into realistic-looking handwriting.

  The user will provide text, and optionally a font, slant and thickness.

  Generate an image of the text in the specified handwriting style. Return the image as a data URI.

  Text: {{{text}}}
  Font: {{{font}}}
  Slant: {{{slant}}}
  Thickness: {{{thickness}}}

  Ensure the data URI includes the MIME type and uses Base64 encoding.
  `,
});

const textToHandwritingConversionFlow = ai.defineFlow(
  {
    name: 'textToHandwritingConversionFlow',
    inputSchema: TextToHandwritingConversionInputSchema,
    outputSchema: TextToHandwritingConversionOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `generate an image of text in handwriting style. Text: ${input.text}, Font: ${input.font}, Slant: ${input.slant}, Thickness: ${input.thickness}`,
    });
    return { handwritingDataUri: media!.url };
  }
);
