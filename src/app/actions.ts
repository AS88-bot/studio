'use server';

import { enhanceNoteFormatting } from '@/ai/flows/enhance-note-formatting';
import { signatureToTextConversion } from '@/ai/flows/signature-to-text-conversion';
import { textToHandwritingConversion } from '@/ai/flows/text-to-handwriting-conversion';
import { z } from 'zod';

// Helper function to convert file to data URI
async function fileToDataUri(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  return `data:${file.type};base64,${base64}`;
}

const signatureSchema = z.object({
  signature: z.instanceof(File).refine((file) => file.size > 0, "File is required."),
});

export async function convertSignatureAction(formData: FormData) {
  try {
    const validatedFields = signatureSchema.safeParse({
      signature: formData.get('signature'),
    });

    if (!validatedFields.success) {
      return { error: 'Invalid input. Please upload a signature image.' };
    }

    const { signature } = validatedFields.data;
    const signatureDataUri = await fileToDataUri(signature);

    const result = await signatureToTextConversion({ signatureDataUri });
    return { success: result.signatureText };
  } catch (error) {
    console.error('Error in convertSignatureAction:', error);
    return { error: 'Failed to convert signature. Please try again.' };
  }
}

const noteSchema = z.object({
  note: z.string().min(1, 'Note content cannot be empty.'),
});

export async function enhanceNoteAction(noteContent: string) {
  try {
    const validatedFields = noteSchema.safeParse({ note: noteContent });

    if (!validatedFields.success) {
      return { error: 'Note content is invalid.' };
    }
    
    const result = await enhanceNoteFormatting({ noteContent });
    return { success: result.formattedNote };
  } catch (error) {
    console.error('Error in enhanceNoteAction:', error);
    return { error: 'Failed to enhance note. Please try again.' };
  }
}

const handwritingSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty.'),
  handwritingSample: z.instanceof(File).refine((file) => file.size > 0, "File is required."),
});

export async function generateHandwritingAction(formData: FormData) {
  try {
    const validatedFields = handwritingSchema.safeParse({
      text: formData.get('text'),
      handwritingSample: formData.get('handwritingSample'),
    });

    if (!validatedFields.success) {
      return { error: 'Invalid input for handwriting generation. Ensure text and a sample are provided.' };
    }

    const { text, handwritingSample } = validatedFields.data;
    const handwritingSampleDataUri = await fileToDataUri(handwritingSample);
    
    const result = await textToHandwritingConversion({ text, handwritingSampleDataUri });
    
    return { success: result.handwritingDataUri };
  } catch (error) {
    console.error('Error in generateHandwritingAction:', error);
    return { error: 'Failed to generate handwriting. Please try again.' };
  }
}
