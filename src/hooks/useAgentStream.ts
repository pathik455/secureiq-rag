'use client'

import { useState, useCallback, useRef } from 'react'
import { SSEMessage } from '@/types'

export function useAgentStream() {
  const [isRunning, setIsRunning] = useState(false)
  const [events, setEvents] = useState<SSEMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const stopPipeline = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsRunning(false)
  }, [])

  const startPipeline = useCallback(
    async (options: {
      skillIds?: string[]
      batchSize?: number
      confidenceThreshold?: number
      dryRun?: boolean
    } = {}) => {
      setIsRunning(true)
      setEvents([])
      setError(null)
      setSummary(null)

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const response = await fetch('/api/agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skillIds: options.skillIds,
            options: {
              batchSize: options.batchSize ?? 50,
              confidenceThreshold: options.confidenceThreshold ?? 0.7,
              dryRun: options.dryRun ?? false,
            },
          }),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          throw new Error(`Failed to initiate agent stream: ${response.statusText}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('data: ')) {
              try {
                const json: SSEMessage = JSON.parse(trimmed.slice(6))
                setEvents((prev) => [...prev, json])

                if (json.event === 'complete' && json.data?.summary) {
                  setSummary(json.data.summary)
                }
                if (json.event === 'error') {
                  setError(String(json.data.message || 'Error occurred during agent run'))
                }
              } catch (parseErr) {
                console.error('Failed to parse SSE payload:', parseErr)
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Stream connection failed')
        }
      } finally {
        setIsRunning(false)
        abortControllerRef.current = null
      }
    },
    []
  )

  return {
    isRunning,
    events,
    error,
    summary,
    startPipeline,
    stopPipeline,
  }
}
