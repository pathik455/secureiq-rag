export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type VulnerabilityStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'FALSE_POSITIVE' | 'DEFERRED'
export type RemediationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DEFERRED'
export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type LinkType = 'MANUAL' | 'AI_GENERATED' | 'IMPORTED'
export type SkillType = 'HISTORICAL_ANALYZER' | 'REMEDIATION_LINKER' | 'VULNERABILITY_REMEDIATION' | 'DOCUMENT_ANALYSIS' | 'CUSTOM'
export type SourceType = 'VULNERABILITY' | 'DOCUMENT'
export type RunStatus = 'SUCCESS' | 'FAILED' | 'RUNNING' | 'TIMEOUT' | 'CANCELLED'

export interface UserProfile {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  username?: string | null
  bio?: string | null
  role?: string | null
  department?: string | null
  phone?: string | null
  githubUsername?: string | null
  linkedinUrl?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Vulnerability {
  id: string
  cveId?: string | null
  title: string
  description?: string | null
  severity: Severity
  cvssScore?: number | string | null
  affectedSystem?: string | null
  affectedVersions: string[]
  tags: string[]
  status: VulnerabilityStatus
  discoveredAt: Date | string
  createdAt: Date | string
  updatedAt: Date | string
  createdById?: string | null
  vulRemedLinks?: VulRemedLinkWithRemediation[]
}

export interface Remediation {
  id: string
  title: string
  description?: string | null
  status: RemediationStatus
  priority?: Priority | null
  dueDate?: Date | string | null
  resolutionNotes?: string | null
  isAiGenerated: boolean
  cacheId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  assignedToId?: string | null
  createdById?: string | null
  vulRemedLinks?: VulRemedLinkWithVulnerability[]
}

export interface VulRemedLink {
  id: string
  vulnerabilityId: string
  remediationId: string
  linkType: LinkType
  confidenceScore?: number | string | null
  createdByAgent?: string | null
  notes?: string | null
  createdAt: Date | string
}

export interface VulRemedLinkWithRemediation extends VulRemedLink {
  remediation: Remediation
}

export interface VulRemedLinkWithVulnerability extends VulRemedLink {
  vulnerability: Vulnerability
}

export interface Skill {
  id: string
  name: string
  description?: string | null
  type: SkillType
  prompt?: string | null
  config: Record<string, unknown>
  isActive: boolean
  version: string
  createdAt: Date | string
  updatedAt: Date | string
  _count?: {
    skillCaches?: number
    schedules?: number
  }
}

export interface SkillCache {
  id: string
  skillId: string
  sourceType?: SourceType
  vulnerabilityId?: string | null
  documentId?: string | null
  patternSummary: string
  rawContext?: string | null
  metadata: Record<string, unknown>
  expiresAt?: Date | string | null
  createdAt: Date | string
  similarity?: number
  skill?: Skill
  vulnerability?: Vulnerability | null
}

export interface SecurityDocument {
  id: string
  skillId: string
  filename: string
  fileUrl?: string | null
  content?: string | null
  status: string
  uploadedAt: Date | string
  processedAt?: Date | string | null
  createdAt: Date | string
}

export interface AgentRun {
  id: string
  skillId: string
  status: RunStatus
  batchSize: number
  totalItems: number
  processedItems: number
  results: Record<string, unknown>
  startedAt: Date | string
  completedAt?: Date | string | null
  createdAt: Date | string
}

export interface Schedule {
  id: string
  skillId: string
  name: string
  cronExpression: string
  isActive: boolean
  lastRunAt?: Date | string | null
  lastRunStatus?: RunStatus | null
  nextRunAt?: Date | string | null
  runHistory: Array<{
    status: RunStatus
    timestamp: string
    durationMs?: number
    message?: string
  }>
  createdAt: Date | string
  updatedAt: Date | string
  skill?: Skill
}

export interface ApiResponse<T> {
  data?: T
  error?: string | Record<string, unknown>
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AgentRunOptions {
  skillIds?: string[]
  options?: {
    batchSize?: number
    confidenceThreshold?: number
    dryRun?: boolean
  }
}

export interface SSEMessage {
  event: 'start' | 'skill_start' | 'progress' | 'skill_complete' | 'complete' | 'error'
  data: {
    totalSkills?: number
    skillId?: string
    name?: string
    type?: string
    processed?: number
    total?: number
    cacheCreated?: number
    remediationsCreated?: number
    linksCreated?: number
    duration?: number
    message?: string
    summary?: {
      cacheEntries: number
      remediationsCreated: number
      linksCreated: number
    }
    [key: string]: unknown
  }
}
