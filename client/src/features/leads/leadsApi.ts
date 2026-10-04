import type { InsuranceType, Lead, LeadNote, LeadStatus } from '../../types/models';
import { baseApi } from '../api/baseApi';

export interface CreateLeadBody {
  fullName: string;
  phone: string;
  email: string;
  insuranceType: InsuranceType;
  consent: boolean;
}

interface UpdateStatusArgs {
  id: number;
  status: LeadStatus;
  callbackAt?: string;
}

export const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createLead: builder.mutation<{ duplicate: boolean }, CreateLeadBody>({
      query: (body) => ({ url: '/leads', method: 'POST', body }),
    }),
    listLeads: builder.query<Lead[], { status?: LeadStatus }>({
      query: ({ status }) => ({ url: '/leads', params: status ? { status } : undefined }),
      providesTags: (result) => [
        { type: 'Lead', id: 'LIST' },
        ...(result ?? []).map((lead) => ({ type: 'Lead' as const, id: lead.id })),
      ],
    }),
    getLead: builder.query<Lead, number>({
      query: (id) => `/leads/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Lead', id }],
    }),
    updateLeadStatus: builder.mutation<Lead, UpdateStatusArgs>({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
      ],
    }),
    assignLead: builder.mutation<Lead, { id: number; agentId: number | null }>({
      query: ({ id, agentId }) => ({ url: `/leads/${id}/assign`, method: 'PATCH', body: { agentId } }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
      ],
    }),
    listNotes: builder.query<LeadNote[], number>({
      query: (leadId) => `/leads/${leadId}/notes`,
      providesTags: (_result, _error, leadId) => [{ type: 'Note', id: leadId }],
    }),
    createNote: builder.mutation<LeadNote, { leadId: number; content: string }>({
      query: ({ leadId, content }) => ({ url: `/leads/${leadId}/notes`, method: 'POST', body: { content } }),
      invalidatesTags: (_result, _error, { leadId }) => [{ type: 'Note', id: leadId }],
    }),
  }),
});

export const {
  useCreateLeadMutation,
  useListLeadsQuery,
  useGetLeadQuery,
  useUpdateLeadStatusMutation,
  useAssignLeadMutation,
  useListNotesQuery,
  useCreateNoteMutation,
} = leadsApi;
