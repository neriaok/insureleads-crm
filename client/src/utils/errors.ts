import type { SerializedError } from '@reduxjs/toolkit';
import type { ApiError } from '../features/api/baseApi';

// RTK Query errors are either our ApiError or a SerializedError; both carry a message.
export function getErrorMessage(error: ApiError | SerializedError | undefined): string | null {
  if (!error) return null;
  return error.message ?? 'אירעה שגיאה';
}
