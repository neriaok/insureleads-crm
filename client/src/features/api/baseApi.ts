import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs } from '@reduxjs/toolkit/query/react';
import type { ApiResponse } from '../../types/models';

export interface ApiError {
  status: number | 'NETWORK_ERROR';
  message: string;
}

const rawBaseQuery = fetchBaseQuery({ baseUrl: '/api', credentials: 'include' });

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return typeof value === 'object' && value !== null && 'success' in value;
}

// Unwraps the server's { success, data } envelope so endpoints receive `data` directly,
// and turns failures into { status, message }.
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const { status, data } = result.error;
    if (typeof status !== 'number') {
      return { error: { status: 'NETWORK_ERROR', message: 'לא ניתן להתחבר לשרת' } };
    }
    const message = isApiResponse(data) && !data.success ? data.error : 'אירעה שגיאה';
    return { error: { status, message } };
  }

  if (isApiResponse(result.data) && result.data.success) {
    return { data: result.data.data };
  }
  // 204 No Content has no body.
  return { data: null };
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Me', 'Lead', 'Note', 'User'],
  endpoints: () => ({}),
});
