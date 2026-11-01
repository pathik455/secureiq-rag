'use client'

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Vulnerability } from '@/types'

interface SecurityOverviewProps {
  vulnerabilities: Vulnerability[]
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#00FF29',
  INFO: '#38BDF8',
}

export function SecurityOverview({ vulnerabilities }: SecurityOverviewProps) {
  const severityCounts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0,
  }

  const statusCounts: Record<string, number> = {
    OPEN: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    DEFERRED: 0,
  }

  vulnerabilities.forEach((v) => {
    if (severityCounts[v.severity] !== undefined) severityCounts[v.severity]++
    if (statusCounts[v.status] !== undefined) statusCounts[v.status]++
  })

  const pieData = Object.entries(severityCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: SEVERITY_COLORS[name] || '#64748B',
    }))

  const barData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.replace('_', ' '),
    count,
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Severity Donut */}
      <div className="p-4 rounded-lg bg-surface border border-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            Severity Distribution
          </h4>
          <span className="text-[11px] text-text-muted font-mono">
            {vulnerabilities.length} Total
          </span>
        </div>
        <div className="h-44 flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0D0A',
                    borderColor: '#1F2E23',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#FFFFFF',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <span className="text-xs text-text-muted">No severity data available</span>
          )}
        </div>
        <div className="flex justify-center gap-3 mt-2 flex-wrap text-[11px]">
          {pieData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-text-secondary">{d.name}</span>
              <span className="font-mono text-white font-bold">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lifecycle Status Bar */}
      <div className="p-4 rounded-lg bg-surface border border-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
            Vulnerability Status Lifecycle
          </h4>
          <span className="text-[11px] text-accent font-mono">Active Pipeline</span>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="status" stroke="#9CA3AF" fontSize={10} tickLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0D0A',
                  borderColor: '#1F2E23',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#FFFFFF',
                }}
              />
              <Bar dataKey="count" fill="#00FF29" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center text-[11px] text-text-muted mt-2 pt-2 border-t border-border/40 font-mono">
          <span>edocode synchronized</span>
          <span>RAG target: &gt;75%</span>
        </div>
      </div>
    </div>
  )
}
