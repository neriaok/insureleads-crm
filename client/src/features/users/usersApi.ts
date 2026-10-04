import type { User, UserRole } from '../../types/models';
import { baseApi } from '../api/baseApi';

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    createUser: builder.mutation<User, CreateUserBody>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useListUsersQuery, useCreateUserMutation } = usersApi;
