import { z } from 'zod';

export const createNoteSchema = z.object({
  content: z.string().trim().min(1, 'Note cannot be empty').max(2000),
});
