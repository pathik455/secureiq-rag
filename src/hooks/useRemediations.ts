'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Remediation, PaginatedResponse } from '@/types'

export interface RemediationFilters {
  page?: number
  limit?: number
  status?: string
  priority?: string
  search?: string
  sort?: string
  sortDir?: string
}

export function useRemediations(filters: RemediationFilters = {}) {
  const queryClient = useQueryClient()
  const {
    page = 1,
    limit = 20,
    status = 'ALL',
    priority = 'ALL',
    search = '',
    sort = 'createdAt',
    sortDir = 'desc',
  } = filters

  const query = useQuery<PaginatedResponse<Remediation>>({
    queryKey: ['remediations', { page, limit, status, priority, search, sort, sortDir }],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', page.toString())
      sp.set('limit', limit.toString())
      if (status && status !== 'ALL') sp.set('status', status)
      if (priority && priority !== 'ALL') sp.set('priority', priority)
      if (search) sp.set('search', search)
      if (sort) sp.set('sort', sort)
      if (sortDir) sp.set('sortDir', sortDir)

      const res = await fetch(`/api/remediations?${sp.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch remediations')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Remediation> & { vulnerabilityId?: string }) => {
      const res = await fetch('/api/remediations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create remediation')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Remediation> }) => {
      const res = await fetch(`/api/remediations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update remediation')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/remediations/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete remediation')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })

  return {
    ...query,
    createRemediation: createMutation.mutateAsync,
    updateRemediation: updateMutation.mutateAsync,
    deleteRemediation: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
