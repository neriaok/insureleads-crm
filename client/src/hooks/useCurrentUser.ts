import { useGetMeQuery } from '../features/auth/authApi';

// The logged-in user, or null when the session is missing or expired.
export function useCurrentUser() {
  const { data, isLoading, isError } = useGetMeQuery();
  return { user: isError ? null : (data ?? null), isLoading };
}
