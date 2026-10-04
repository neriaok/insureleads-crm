import type { z } from 'zod';
import { ApiError } from './apiError.js';

// Parses input with a Zod schema, or throws a 400 with the first problem found.
export function validate<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue && issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    throw new ApiError(400, `${field}${issue?.message ?? 'Invalid input'}`);
  }
  return result.data;
}
