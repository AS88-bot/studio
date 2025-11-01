'use server';

/**
 * @fileOverview Enhances the formatting of text notes for a clean and professional look.
 *
 * - enhanceNoteFormatting - A function that enhances the formatting of text notes.
 * - EnhanceNoteFormattingInput - The input type for the enhanceNoteFormatting function.
 * - EnhanceNoteFormattingOutput - The return type for the enhanceNoteFormatting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceNoteFormattingInputSchema = z.object({
  noteContent: z
    .string()
    .describe('The content of the note to be formatted.'),
});

export type EnhanceNoteFormattingInput = z.infer<
  typeof EnhanceNoteFormattingInputSchema
>;

const EnhanceNoteFormattingOutputSchema = z.object({
  formattedNote: z
    .string()
    .describe('The formatted content of the note.'),
});

export type EnhanceNoteFormattingOutput = z.infer<
  typeof EnhanceNoteFormattingOutputSchema
>;

export async function enhanceNoteFormatting(
  input: EnhanceNoteFormattingInput
): Promise<EnhanceNoteFormattingOutput> {
  return enhanceNoteFormattingFlow(input);
}

const enhanceNoteFormattingPrompt = ai.definePrompt({
  name: 'enhanceNoteFormattingPrompt',
  input: {schema: EnhanceNoteFormattingInputSchema},
  output: {schema: EnhanceNoteFormattingOutputSchema},
  prompt: `You are an expert in formatting text notes for a professional and clean look. Please evaluate the context of the following note content and format it accordingly. This may include adding headings, bullet points, line breaks, and other formatting elements to improve readability and visual appeal. Return the formatted note content.

Note Content:
{{{noteContent}}}`,
});

const enhanceNoteFormattingFlow = ai.defineFlow(
  {
    name: 'enhanceNoteFormattingFlow',
    inputSchema: EnhanceNoteFormattingInputSchema,
    outputSchema: EnhanceNoteFormattingOutputSchema,
  },
  async input => {
    const {output} = await enhanceNoteFormattingPrompt(input);
    return output!;
  }
);
