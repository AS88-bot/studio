'use server';

/**
 * @fileOverview Converts text notes into realistic-looking handwriting based on a user-provided sample.
 *
 * - textToHandwritingConversion - A function that handles the text-to-handwriting conversion process.
 * - TextToHandwritingConversionInput - The input type for the textToHandwritingConversion function.
 * - TextToHandwritingConversionOutput - The return type for the textToHandwritingConversion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TextToHandwritingConversionInputSchema = z.object({
  text: z.string().describe('The text to convert to handwriting.'),
  handwritingSampleDataUri: z
    .string()
    .describe(
      'An image of a handwriting sample as a data URI. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});

export type TextToHandwritingConversionInput = z.infer<
  typeof TextToHandwritingConversionInputSchema
>;

const TextToHandwritingConversionOutputSchema = z.object({
  handwritingDataUri: z
    .string()
    .describe(
      'The generated handwriting image as a data URI. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
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

const textToHandwritingConversionFlow = ai.defineFlow(
  {
    name: 'textToHandwritingConversionFlow',
    inputSchema: TextToHandwritingConversionInputSchema,
    outputSchema: TextToHandwritingConversionOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {
          media: {
            url: input.handwritingSampleDataUri,
          },
        },
        {
          text: `You are an AI that converts text into realistic-looking handwriting.
Use the handwriting style from the provided image to write out the following text.
The output should be an image containing only the new text in the requested handwriting style.
Ensure the background of the output image is clean and white.

Text to convert: "${input.text}"`,
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media) {
      throw new Error('Image generation failed.');
    }
    
    return { handwritingDataUri: media.url };
  }
);
