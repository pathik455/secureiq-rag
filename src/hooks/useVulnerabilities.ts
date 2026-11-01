'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Vulnerability, PaginatedResponse } from '@/types'

export interface VulnerabilityFilters {
  page?: number
  limit?: number
  severity?: string
  status?: string
  search?: string
  sort?: string
  sortDir?: string
}

export function useVulnerabilities(filters: VulnerabilityFilters = {}) {
  const queryClient = useQueryClient()
  const {
    page = 1,
    limit = 20,
    severity = 'ALL',
    status = 'ALL',
    search = '',
    sort = 'createdAt',
    sortDir = 'desc',
  } = filters

  const query = useQuery<PaginatedResponse<Vulnerability>>({
    queryKey: ['vulnerabilities', { page, limit, severity, status, search, sort, sortDir }],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', page.toString())
      sp.set('limit', limit.toString())
      if (severity && severity !== 'ALL') sp.set('severity', severity)
      if (status && status !== 'ALL') sp.set('status', status)
      if (search) sp.set('search', search)
      if (sort) sp.set('sort', sort)
      if (sortDir) sp.set('sortDir', sortDir)

      const res = await fetch(`/api/vulnerabilities?${sp.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch vulnerabilities')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Vulnerability>) => {
      const res = await fetch('/api/vulnerabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create vulnerability')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vulnerability> }) => {
      const res = await fetch(`/api/vulnerabilities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update vulnerability')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vulnerabilities/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete vulnerability')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] })
    },
  })

  return {
    ...query,
    createVulnerability: createMutation.mutateAsync,
    updateVulnerability: updateMutation.mutateAsync,
    deleteVulnerability: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
