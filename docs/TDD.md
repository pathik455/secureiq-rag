# SecureIQ RAG — Technical Design Document (TDD)

**Version:** 1.0.0  
**Date:** November 2026  
**Author:** pathik455  
**Repository:** https://github.com/pathik455/secureiq-rag  
**Status:** Draft

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Database Design](#4-database-design)
5. [Authentication Design](#5-authentication-design)
6. [RAG System & Agent Design](#6-rag-system--agent-design)
7. [Skills System](#7-skills-system)
8. [Frontend Design & UI Specifications](#8-frontend-design--ui-specifications)
9. [API Design](#9-api-design)
10. [Effort Estimation](#10-effort-estimation)
11. [Development Roadmap](#11-development-roadmap)
12. [Risk Register](#12-risk-register)

---

## 1. Project Overview

### 1.1 Purpose

**SecureIQ RAG** is an AI-powered security intelligence platform that manages **vulnerabilities** and **remediation tasks** using a Retrieval-Augmented Generation (RAG) architecture. The platform enables security teams to:

- Track and manage security vulnerabilities in a structured table view
- Manage remediation tasks linked to vulnerabilities
- Run AI-powered **Skills** (agents) that mine historical vulnerability patterns
- Auto-suggest and create remediation tasks backed by cached historical intelligence
- Schedule automated skill executions for continuous security posture improvement

### 1.2 Core Problem Statement

Security teams face two key challenges:
1. **Reactive Remediation** — Teams only remediate after a vulnerability appears, without leveraging historical data.
2. **Manual Linking** — Linking vulnerabilities to remediation tasks is time-consuming and error-prone.

SecureIQ RAG solves this by running an **Agent Pipeline** that:
1. Reads historical vulnerability data → stores patterns in a **Cache Table**
2. Uses cached patterns to **auto-generate and link** remediation tasks to vulnerabilities

### 1.3 Scope

| In Scope | Out of Scope |
|---|---|
| Next.js 14 web application | Mobile application |
| Google OAuth login | Enterprise SSO (SAML/LDAP) |
| Vulnerability CRUD | CVE auto-import pipelines |
| Remediation CRUD | Ticketing system integration (Jira) |
| RAG Agent with 2 skills | Multi-model LLM switching |
| Skill scheduler | Real-time threat feeds |
| Cache table from skill output | Automated patch deployment |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                       │
│          Next.js 14 (App Router) + Tailwind CSS         │
│                                                         │
│  ┌──────────┐ ┌────────────┐ ┌───────────┐ ┌────────┐  │
│  │  Login   │ │Dashboard   │ │  Skills   │ │Schedule│  │
│  │  Google  │ │Vuln/Remed  │ │  Runner   │ │  Tab   │  │
│  └──────────┘ └────────────┘ └───────────┘ └────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / Server Actions
┌──────────────────────────▼──────────────────────────────┐
│                    API LAYER (Next.js)                   │
│          Route Handlers + Server Actions                 │
│                                                         │
│  /api/vulnerabilities  /api/remediations                │
│  /api/skills           /api/cache                       │
│  /api/agents/run       /api/schedule                    │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    SERVICE LAYER                         │
│                                                         │
│  ┌─────────────────┐    ┌──────────────────────────┐   │
│  │  RAG Engine      │    │    Skills Executor        │   │
│  │  (LangChain.js)  │    │   ┌────────────────────┐ │   │
│  │                  │    │   │ Skill 1: Historical │ │   │
│  │  ┌────────────┐  │    │   │ Data Analyzer      │ │   │
│  │  │ Vector     │  │    │   └────────────────────┘ │   │
│  │  │ Embeddings │  │    │   ┌────────────────────┐ │   │
│  │  │ (OpenAI /  │  │    │   │ Skill 2: Remed     │ │   │
│  │  │  Cohere)   │  │    │   │ Linker Agent       │ │   │
│  │  └────────────┘  │    │   └────────────────────┘ │   │
│  └─────────────────┘    └──────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   DATABASE LAYER                         │
│              Supabase (PostgreSQL + pgvector)            │
│                                                         │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │ vulnerabilities│ │  remediations │  │ vul_remed   │  │
│  │              │  │               │  │ (link table)│  │
│  └──────────────┘  └───────────────┘  └─────────────┘  │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │  skill_cache  │  │    skills     │  │  schedules  │  │
│  │  (+ vectors) │  │               │  │             │  │
│  └──────────────┘  └───────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14.x (App Router) | Full-stack React framework |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | Latest | Accessible UI components |
| Tanstack Table | v8 | Data tables with sorting/filtering |
| Tanstack Query | v5 | Server state management |
| Zustand | 4.x | Client state management |
| Recharts | 2.x | Dashboard charts/analytics |
| Lucide React | Latest | Icon library |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation |
| date-fns | 3.x | Date utilities |
| next-auth | 5.x (beta) | Authentication (Google OAuth) |

### 3.2 Backend / API

| Technology | Version | Purpose |
|---|---|---|
| Next.js Route Handlers | 14.x | API endpoints |
| Prisma | 5.x | ORM for Supabase PostgreSQL |
| LangChain.js | 0.3.x | RAG & agent orchestration |
| OpenAI SDK | 4.x | LLM + embeddings (gpt-4o-mini) |
| node-cron | 3.x | Skill scheduler |
| Zod | 3.x | API request validation |
| jose | 5.x | JWT handling |

### 3.3 Database

| Service | Plan | Limits | Use |
|---|---|---|---|
| **Supabase** (PostgreSQL) | Free Tier | 500MB DB, 2GB bandwidth | Primary DB + vector store (pgvector) |
| Supabase Auth | Free | 50,000 MAU | Google OAuth provider |
| Supabase Realtime | Free | 200 concurrent connections | Live skill run updates |

> **Why Supabase over MongoDB?**
> - Native `pgvector` extension for embeddings storage (critical for RAG)
> - Row-level security (RLS) for multi-user isolation
> - Supabase's built-in Auth integrates with next-auth
> - Relational integrity for vulnerability → remediation linking
> - Free tier: 500MB PostgreSQL (sufficient for security data up to millions of records)

### 3.4 AI / LLM

| Service | Plan | Use |
|---|---|---|
| OpenAI API | Pay-per-use (gpt-4o-mini ~$0.15/1M tokens) | Agent reasoning |
| OpenAI Embeddings | text-embedding-3-small | Vector embeddings for RAG |
| **Alternative (Free):** Groq API | Free tier (14,400 req/day) | LLM for agents |
| **Alternative (Free):** Cohere | Free tier (1000 req/month) | Embeddings |

### 3.5 Infrastructure

| Service | Use |
|---|---|
| Vercel | Next.js deployment (free hobby tier) |
| GitHub Actions | CI/CD pipeline |
| Supabase | Managed PostgreSQL |

---

## 4. Database Design

### 4.1 Entity Relationship Diagram

```
┌──────────────────┐         ┌──────────────────────┐
│  vulnerabilities  │         │     remediations      │
├──────────────────┤         ├──────────────────────┤
│ id (uuid) PK     │         │ id (uuid) PK         │
│ cve_id           │         │ title                │
│ title            │         │ description          │
│ description      │         │ status               │
│ severity         │◄───┐    │ priority             │
│ cvss_score       │    │    │ assigned_to          │
│ affected_system  │    │    │ due_date             │
│ status           │    │    │ resolution_notes     │
│ discovered_at    │    │    │ created_at           │
│ created_at       │    │    │ updated_at           │
│ updated_at       │    └────┤ cache_id (FK, NULL)  │
└──────────────────┘         └──────────────────────┘
        │                              │
        │    ┌──────────────────┐      │
        └───►│  vul_remed_links  │◄─────┘
             ├──────────────────┤
             │ id (uuid) PK     │
             │ vulnerability_id │
             │ remediation_id   │
             │ link_type        │
             │ confidence_score │
             │ created_by_agent │
             │ created_at       │
             └──────────────────┘

┌──────────────────┐         ┌──────────────────────┐
│   skill_cache    │         │       skills          │
├──────────────────┤         ├──────────────────────┤
│ id (uuid) PK     │         │ id (uuid) PK         │
│ skill_id (FK)    │         │ name                 │
│ vulnerability_id │         │ description          │
│ pattern_summary  │         │ type                 │
│ embedding vector │         │ config (jsonb)       │
│ raw_context      │         │ is_active            │
│ metadata (jsonb) │         │ version              │
│ created_at       │         │ created_at           │
│ expires_at       │         │ updated_at           │
└──────────────────┘         └──────────────────────┘

┌──────────────────────────────┐
│          schedules            │
├──────────────────────────────┤
│ id (uuid) PK                  │
│ skill_id (FK)                 │
│ cron_expression               │
│ is_active                     │
│ last_run_at                   │
│ last_run_status               │
│ next_run_at                   │
│ run_history (jsonb[])         │
│ created_at                    │
└──────────────────────────────┘
```

### 4.2 Schema Definitions

#### vulnerabilities
```sql
CREATE TABLE vulnerabilities (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cve_id        VARCHAR(50) UNIQUE,
  title         TEXT NOT NULL,
  description   TEXT,
  severity      VARCHAR(20) CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW','INFO')),
  cvss_score    DECIMAL(4,1) CHECK (cvss_score BETWEEN 0 AND 10),
  affected_system TEXT,
  affected_versions TEXT[],
  tags          TEXT[],
  status        VARCHAR(30) DEFAULT 'OPEN'
                CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','FALSE_POSITIVE','DEFERRED')),
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID REFERENCES auth.users(id)
);

-- Enable pgvector for semantic search on descriptions
ALTER TABLE vulnerabilities ADD COLUMN embedding vector(1536);
CREATE INDEX ON vulnerabilities USING ivfflat (embedding vector_cosine_ops);
```

#### remediations
```sql
CREATE TABLE remediations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  status          VARCHAR(30) DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','CANCELLED','DEFERRED')),
  priority        VARCHAR(20) CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  assigned_to     UUID REFERENCES auth.users(id),
  due_date        TIMESTAMPTZ,
  resolution_notes TEXT,
  cache_id        UUID REFERENCES skill_cache(id),  -- Link to AI-generated cache
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id)
);
```

#### vul_remed_links (Junction/Relation Table)
```sql
CREATE TABLE vul_remed_links (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vulnerability_id UUID NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE,
  remediation_id   UUID NOT NULL REFERENCES remediations(id) ON DELETE CASCADE,
  link_type        VARCHAR(30) DEFAULT 'MANUAL'
                   CHECK (link_type IN ('MANUAL','AI_GENERATED','IMPORTED')),
  confidence_score DECIMAL(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
  created_by_agent VARCHAR(100),  -- Which agent/skill created this link
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vulnerability_id, remediation_id)
);
```

#### skills
```sql
CREATE TABLE skills (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  type        VARCHAR(50) CHECK (type IN ('HISTORICAL_ANALYZER','REMEDIATION_LINKER','CUSTOM')),
  config      JSONB DEFAULT '{}',
  is_active   BOOLEAN DEFAULT TRUE,
  version     VARCHAR(20) DEFAULT '1.0.0',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### skill_cache
```sql
-- Enable pgvector extension first
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE skill_cache (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id         UUID NOT NULL REFERENCES skills(id),
  vulnerability_id UUID REFERENCES vulnerabilities(id),
  pattern_summary  TEXT NOT NULL,
  raw_context      TEXT,
  embedding        vector(1536),     -- OpenAI text-embedding-3-small
  metadata         JSONB DEFAULT '{}',
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, vulnerability_id)
);

-- Vector similarity search index
CREATE INDEX ON skill_cache USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

#### schedules
```sql
CREATE TABLE schedules (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id        UUID NOT NULL REFERENCES skills(id),
  name            VARCHAR(100) NOT NULL,
  cron_expression VARCHAR(100) NOT NULL,  -- e.g. "0 2 * * *" (2am daily)
  is_active       BOOLEAN DEFAULT TRUE,
  last_run_at     TIMESTAMPTZ,
  last_run_status VARCHAR(20) CHECK (last_run_status IN ('SUCCESS','FAILED','RUNNING','TIMEOUT')),
  next_run_at     TIMESTAMPTZ,
  run_history     JSONB[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id)
);
```

---

## 5. Authentication Design

### 5.1 Flow

```
User → /login → "Sign in with Google" →
  → Google OAuth Consent Screen →
  → Callback to /api/auth/callback →
  → next-auth creates session →
  → Supabase auth.users synced →
  → Redirect to /dashboard
```

### 5.2 Protected Routes

All routes under `/(dashboard)/` are protected via Next.js middleware.

```typescript
// middleware.ts
export const config = {
  matcher: ['/(dashboard)/:path*', '/api/:path*']
}
```

### 5.3 next-auth Configuration

- Provider: `GoogleProvider`
- Session strategy: `jwt` (stateless)
- Adapter: `PrismaAdapter` (stores sessions in Supabase)
- Callbacks: Sync user to Supabase `auth.users` on first login

---

## 6. RAG System & Agent Design

### 6.1 RAG Pipeline Overview

```
Query / Trigger
     │
     ▼
┌─────────────────────────┐
│   Agent Orchestrator    │  (LangChain.js AgentExecutor)
│   "Run Full Pipeline"   │
└────────────┬────────────┘
             │ spawns
    ┌────────┴────────┐
    ▼                 ▼
┌────────────┐   ┌─────────────────────┐
│  Skill 1   │   │     Skill 2         │
│ Historical │   │ Remediation Linker  │
│ Analyzer   │   │ Agent               │
└─────┬──────┘   └──────────┬──────────┘
      │                     │
      ▼                     ▼
┌──────────────┐    ┌──────────────────────┐
│ Reads vuln   │    │ Reads skill_cache     │
│ table (all   │    │ embeddings via        │
│ historical   │    │ vector similarity     │
│ records)     │    │ search                │
└──────┬───────┘    └───────────┬──────────┘
       │                        │
       ▼                        ▼
┌──────────────┐    ┌──────────────────────┐
│ Generates    │    │ Creates remediations  │
│ pattern      │    │ linked via            │
│ summaries +  │    │ vul_remed_links with  │
│ embeddings   │    │ confidence score      │
│              │    │                      │
│ Writes to    │    │ Sets is_ai_generated  │
│ skill_cache  │    │ = TRUE, cache_id ref  │
└──────────────┘    └──────────────────────┘
```

### 6.2 Skill 1 — Historical Data Analyzer

**Purpose:** Read all historical vulnerabilities, generate LLM summaries of patterns (e.g., "Recurring SQL injection in auth module"), embed them, and store in `skill_cache`.

**Algorithm:**
```
1. Fetch all vulnerabilities WHERE status != 'FALSE_POSITIVE'
2. Group by: severity, affected_system, tags
3. For each group (or individual vulnerability):
   a. Build a context string: title + description + affected_system + cvss_score
   b. Call LLM: "Summarize the vulnerability pattern and suggest remediation categories"
   c. Generate embedding vector for the summary
   d. UPSERT into skill_cache (skill_id, vulnerability_id, pattern_summary, embedding)
4. Log execution result to schedules.run_history
```

**LangChain Tool Definition:**
```typescript
const historicalAnalyzerTool = new DynamicStructuredTool({
  name: "analyze_historical_vulnerabilities",
  description: "Fetches all historical vulnerability records and generates pattern summaries stored in cache",
  schema: z.object({ batch_size: z.number().default(50) }),
  func: async ({ batch_size }) => { /* ... implementation */ }
})
```

### 6.3 Skill 2 — Remediation Linker Agent

**Purpose:** For each unresolved vulnerability, use vector similarity search on `skill_cache` to find matching historical patterns, then auto-create remediation tasks linked via `vul_remed_links`.

**Algorithm:**
```
1. Fetch open vulnerabilities (status = 'OPEN') with no remediation link
2. For each vulnerability:
   a. Generate embedding of vulnerability description
   b. Vector search skill_cache for top-3 similar patterns
   c. If similarity score > 0.75:
      - Call LLM: "Generate a specific remediation plan for this vulnerability based on: {cached_pattern}"
      - INSERT into remediations (title, description, is_ai_generated=true, cache_id)
      - INSERT into vul_remed_links (vulnerability_id, remediation_id, link_type='AI_GENERATED', confidence_score)
3. Return summary of remediations created
```

### 6.4 Agent Invocation API

```
POST /api/agents/run
Body: { skillIds: ['skill1', 'skill2'], options: { batchSize: 50, confidenceThreshold: 0.75 } }

Response (streaming via SSE):
{ event: 'skill_start', data: { skillId: 'skill1', name: 'Historical Analyzer' } }
{ event: 'progress', data: { processed: 25, total: 100 } }
{ event: 'skill_complete', data: { skillId: 'skill1', cacheEntriesCreated: 100 } }
{ event: 'skill_start', data: { skillId: 'skill2' } }
{ event: 'progress', data: { processed: 10, remediationsCreated: 8 } }
{ event: 'complete', data: { summary: { cacheEntries: 100, remediationsCreated: 8 } } }
```

---

## 7. Skills System

### 7.1 Skill Registry

Skills are stored in the `skills` table and versioned. Each skill has a `config` JSONB field:

```json
{
  "id": "skill_historical_analyzer_v1",
  "name": "Historical Vulnerability Analyzer",
  "type": "HISTORICAL_ANALYZER",
  "config": {
    "batchSize": 50,
    "llmModel": "gpt-4o-mini",
    "embeddingModel": "text-embedding-3-small",
    "cacheExpiryDays": 30,
    "groupBy": ["severity", "affected_system"]
  }
}
```

### 7.2 Scheduler Design

The scheduler uses `node-cron` running in a Next.js API route (`/api/schedule/tick`) triggered by Vercel Cron Jobs (free tier: up to 1 cron/day on hobby plan).

```
Vercel Cron → GET /api/schedule/tick →
  → Query schedules WHERE is_active=true AND next_run_at <= NOW() →
  → For each due schedule, call /api/agents/run →
  → Update last_run_at, last_run_status, next_run_at, run_history
```

**Cron config (`vercel.json`):**
```json
{
  "crons": [
    { "path": "/api/schedule/tick", "schedule": "0 2 * * *" }
  ]
}
```

---

## 8. Frontend Design & UI Specifications

### 8.1 Login Page (`/login`)

**Layout:** Centered card on dark gradient background

```
┌─────────────────────────────────────────────┐
│                                             │
│          🔒 SecureIQ RAG                    │
│     AI-Powered Security Intelligence        │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │          Sign in to continue          │  │
│  │                                       │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  🔵  Sign in with Google       │  │  │
│  │  └─────────────────────────────────┘  │  │
│  │                                       │  │
│  │  By signing in, you agree to our      │  │
│  │  Terms of Service & Privacy Policy    │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  "Powered by AI · Secured by Design"        │
└─────────────────────────────────────────────┘
```

**Colors:** Dark navy (#0F172A) background, glass-morphism card, blue accent (#3B82F6)

---

### 8.2 Dashboard Layout

**Layout:** Sidebar navigation + top header + tabbed content area

```
┌─────────────────────────────────────────────────────────────┐
│ ≡  SecureIQ RAG    🔴 4 Critical  🟡 12 High    👤 Avatar  │
├───────────┬─────────────────────────────────────────────────┤
│           │  [Vulnerabilities] [Remediations] [Skills]      │
│ ⊞ Dashboard│  [Cache Data] [Schedule]                       │
│           ├─────────────────────────────────────────────────┤
│ 🔍 Vulns  │                                                 │
│ 🔧 Remed  │           TAB CONTENT AREA                     │
│ 🤖 Skills │                                                 │
│ 🗄 Cache  │                                                 │
│ ⏰ Schedule│                                                │
│           │                                                 │
│ ─────── │                                                   │
│ ⚙ Settings│                                                │
│ 🚪 Logout │                                                 │
└───────────┴─────────────────────────────────────────────────┘
```

**Header KPIs (always visible):**
- 🔴 Critical vulnerabilities count
- 🟡 High vulnerabilities count  
- ✅ Resolved this week
- 🤖 AI remediations created

---

### 8.3 Tab 1 — Vulnerabilities Table

**Features:**
- Sortable/filterable data table (Tanstack Table)
- Columns: CVE ID, Title, Severity (badge), CVSS Score, Affected System, Status (badge), Discovered At, Actions
- Filter bar: severity multi-select, status filter, date range picker, search
- Row actions: View details, Edit, Create Remediation (manual), Delete
- Detail drawer (right slide-in): Full vulnerability info + linked remediations + AI suggestions
- Bulk actions: Export CSV, Delete selected, Bulk link to remediation
- Stats strip: Total | Critical | High | Medium | Low | Resolved

```
┌─────────────────────────────────────────────────────────────┐
│ Vulnerabilities (247)    [+ Add Vulnerability] [Export CSV] │
├─────────────────────────────────────────────────────────────┤
│ 🔍 Search...  Severity▼  Status▼  System▼  Date Range       │
├──────┬─────────┬──────┬───────┬──────────┬──────────┬──────┤
│ ☐  │ CVE ID  │Title │Sev   │ CVSS │Status│  Date  │  ⋮  │
├──────┼─────────┼──────┼───────┼──────────┼──────────┼──────┤
│ ☐  │CVE-2024 │SQL..│🔴 CRI│ 9.8  │🔴OPEN │2024-01│  ⋮  │
│ ☐  │CVE-2024 │XSS..│🟡 HIG│ 7.2  │🟢RESV │2024-02│  ⋮  │
└──────┴─────────┴──────┴───────┴──────────┴──────────┴──────┘
│ ← 1 2 3 ... 12 →                         25 per page ▼     │
└─────────────────────────────────────────────────────────────┘
```

---

### 8.4 Tab 2 — Remediations Table

**Features:**
- Columns: Title, Priority (badge), Status, Assigned To, Due Date, Linked Vulns count, AI Generated (icon), Actions
- Link indicator: Shows how many vulnerabilities this remediation covers
- AI badge: 🤖 icon on AI-generated remediations with cache link
- Progress bar: % completed tasks
- Kanban view toggle (Board view: Pending | In Progress | Completed)

---

### 8.5 Tab 3 — Skills

**Features:**
- Skill cards (not a table) showing each skill's name, description, type, last run status
- "Run Now" button on each card → triggers agent execution with live progress modal
- Live streaming log output using SSE (Server-Sent Events)
- Skill config editor (JSON editor with Monaco) for advanced users
- Run history timeline

```
┌─────────────────────────────────────────────────────────────┐
│ Skills                                    [+ Create Skill]  │
├──────────────────────────┬──────────────────────────────────┤
│  🔬 Historical Analyzer  │  🔗 Remediation Linker           │
│  Analyzes vuln history   │  Links vulns to remediations     │
│  ─────────────────────   │  ────────────────────────────    │
│  Type: HISTORICAL        │  Type: REMEDIATION_LINKER        │
│  Last run: 2h ago ✅     │  Last run: 2h ago ✅             │
│  Cache entries: 247      │  Links created: 189              │
│                          │                                  │
│  [▶ Run Now] [⚙ Config] │  [▶ Run Now] [⚙ Config]         │
├──────────────────────────┴──────────────────────────────────┤
│  [▶ Run Full Pipeline]  ← Runs both skills in sequence      │
└─────────────────────────────────────────────────────────────┘
```

**Agent Progress Modal (during run):**
```
┌────────────────────────────────────────────────────┐
│  🤖 Running: Historical Analyzer                   │
│  ─────────────────────────────────────────────     │
│  ████████████░░░░░░░░  62% (155/247 processed)     │
│                                                    │
│  [LIVE LOG]                                        │
│  > Fetching vulnerabilities batch 3/5...          │
│  > Generating embeddings for 50 records...        │
│  > Stored 50 cache entries                        │
│  > Processing batch 4/5...                        │
│                                                    │
│  [Cancel]                                          │
└────────────────────────────────────────────────────┘
```

---

### 8.6 Tab 4 — Cache Data

**Features:**
- Table of `skill_cache` entries
- Columns: Vulnerability (linked), Skill, Pattern Summary (truncated), Confidence, Created At, Expires At
- Expandable rows: Show full raw_context and metadata JSON
- Semantic search: Search cache by natural language query (vector similarity)
- Filter: By skill, by vulnerability, by date range
- Cache stats: Total entries | Expired | Avg confidence | Storage used

---

### 8.7 Tab 5 — Schedule

**Features:**
- Schedule cards per skill
- Cron expression editor with human-readable preview ("Every day at 2:00 AM")
- Toggle enable/disable
- Run history timeline (last 10 runs with status + duration)
- Next run countdown
- Manual trigger button

```
┌─────────────────────────────────────────────────────────────┐
│ Schedules                                [+ Add Schedule]   │
├─────────────────────────────────────────────────────────────┤
│  📅 Daily Historical Analysis              🟢 Active  [⏸]  │
│  Skill: Historical Analyzer                               │
│  Cron: 0 2 * * *  → "Every day at 2:00 AM"               │
│  Next run: in 13h 42m  |  Last: ✅ SUCCESS (2m 14s)       │
│  ─────────────────────────────────────────────────────     │
│  RUN HISTORY: ✅✅✅✅❌✅✅✅✅✅  (10 most recent)         │
│                          [▶ Run Now]  [✏️ Edit]  [🗑 Delete]│
└─────────────────────────────────────────────────────────────┘
```

---

## 9. API Design

### 9.1 REST Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/vulnerabilities` | ✅ | List with pagination & filters |
| POST | `/api/vulnerabilities` | ✅ | Create vulnerability |
| GET | `/api/vulnerabilities/:id` | ✅ | Get single vulnerability |
| PUT | `/api/vulnerabilities/:id` | ✅ | Update vulnerability |
| DELETE | `/api/vulnerabilities/:id` | ✅ | Delete vulnerability |
| GET | `/api/remediations` | ✅ | List remediations |
| POST | `/api/remediations` | ✅ | Create remediation |
| PUT | `/api/remediations/:id` | ✅ | Update remediation |
| DELETE | `/api/remediations/:id` | ✅ | Delete remediation |
| GET | `/api/vul-remed-links` | ✅ | Get all links |
| POST | `/api/vul-remed-links` | ✅ | Create link manually |
| DELETE | `/api/vul-remed-links/:id` | ✅ | Remove link |
| GET | `/api/skills` | ✅ | List skills |
| POST | `/api/skills/:id/run` | ✅ | Trigger single skill |
| GET | `/api/cache` | ✅ | List cache entries |
| POST | `/api/cache/search` | ✅ | Semantic search in cache |
| GET | `/api/schedules` | ✅ | List schedules |
| POST | `/api/schedules` | ✅ | Create schedule |
| PUT | `/api/schedules/:id` | ✅ | Update schedule |
| DELETE | `/api/schedules/:id` | ✅ | Delete schedule |
| POST | `/api/agents/run` | ✅ | Run full agent pipeline (SSE) |
| GET | `/api/schedule/tick` | 🔑 cron | Internal cron tick |

### 9.2 Request/Response Example

**POST /api/agents/run**
```typescript
// Request
{
  "skillIds": ["historical_analyzer", "remediation_linker"],
  "options": {
    "batchSize": 50,
    "confidenceThreshold": 0.75,
    "dryRun": false
  }
}

// Response: Server-Sent Events stream
data: {"event":"start","data":{"totalSkills":2}}
data: {"event":"skill_start","data":{"skillId":"historical_analyzer","name":"Historical Analyzer"}}
data: {"event":"progress","data":{"skillId":"historical_analyzer","processed":50,"total":247}}
data: {"event":"skill_complete","data":{"skillId":"historical_analyzer","cacheCreated":247,"duration":45000}}
data: {"event":"skill_start","data":{"skillId":"remediation_linker"}}
data: {"event":"progress","data":{"skillId":"remediation_linker","processed":10,"remediationsCreated":8}}
data: {"event":"complete","data":{"summary":{"cacheEntries":247,"remediationsCreated":8,"linksCreated":8}}}
```

---

## 10. Effort Estimation

### 10.1 Team Assumption

| Role | Count |
|---|---|
| Full-Stack Developer (Next.js, TypeScript) | 1 (solo) |
| AI/ML Integration | Same developer |

### 10.2 Sprint-by-Sprint Breakdown

#### Phase 1 — Foundation (Week 1–2) — ~40 hours

| Task | Effort | Priority |
|---|---|---|
| Project setup (Next.js 14, TypeScript, Tailwind, shadcn) | 4h | P0 |
| Supabase project setup + pgvector extension | 2h | P0 |
| Prisma schema + migrations | 4h | P0 |
| Google OAuth with next-auth v5 | 6h | P0 |
| Login page UI | 3h | P0 |
| Middleware (route protection) | 2h | P0 |
| Dashboard layout (sidebar + tabs) | 8h | P0 |
| Base API structure + Zod validation | 4h | P0 |
| CI/CD GitHub Actions setup | 3h | P1 |
| Environment config + secrets management | 2h | P1 |
| **Subtotal** | **38h** | |

#### Phase 2 — Core Data (Week 3–4) — ~40 hours

| Task | Effort | Priority |
|---|---|---|
| Vulnerabilities CRUD API | 6h | P0 |
| Vulnerabilities table UI (Tanstack Table) | 8h | P0 |
| Vuln detail drawer + forms | 4h | P0 |
| Remediations CRUD API | 5h | P0 |
| Remediations table UI | 6h | P0 |
| vul_remed_links API (manual linking) | 4h | P0 |
| Link management UI in vuln detail | 3h | P0 |
| Seed data scripts (realistic dummy data) | 2h | P1 |
| Dashboard KPI header stats | 2h | P1 |
| **Subtotal** | **40h** | |

#### Phase 3 — RAG & Skills (Week 5–7) — ~60 hours

| Task | Effort | Priority |
|---|---|---|
| LangChain.js setup + OpenAI integration | 4h | P0 |
| Skill 1: Historical Analyzer implementation | 12h | P0 |
| Skill 2: Remediation Linker implementation | 12h | P0 |
| Agent orchestrator (run both skills in sequence) | 6h | P0 |
| SSE streaming API for agent progress | 6h | P0 |
| Skills tab UI (cards + run button + modal) | 8h | P0 |
| Live progress streaming UI | 6h | P0 |
| Skills CRUD (config editor) | 4h | P1 |
| Cache table UI | 4h | P1 |
| Semantic search in cache | 4h | P1 |
| **Subtotal** | **66h** | |

#### Phase 4 — Scheduler & Polish (Week 8–9) — ~30 hours

| Task | Effort | Priority |
|---|---|---|
| Schedule CRUD API | 4h | P0 |
| Cron tick endpoint + Vercel cron config | 4h | P0 |
| Schedule tab UI (cards, cron editor) | 8h | P0 |
| Run history timeline | 4h | P1 |
| Dashboard charts (Recharts) | 4h | P1 |
| Toast notifications + error handling | 3h | P1 |
| Export CSV | 2h | P2 |
| Dark/light mode | 1h | P2 |
| **Subtotal** | **30h** | |

#### Phase 5 — Testing & Deployment (Week 10) — ~20 hours

| Task | Effort | Priority |
|---|---|---|
| Unit tests (Jest) for services | 6h | P0 |
| API integration tests | 6h | P0 |
| E2E tests (Playwright) for auth + table flows | 4h | P0 |
| Vercel deployment + environment setup | 2h | P0 |
| README + documentation | 2h | P1 |
| **Subtotal** | **20h** | |

### 10.3 Total Effort Summary

| Phase | Hours |
|---|---|
| Phase 1 — Foundation | 38h |
| Phase 2 — Core Data | 40h |
| Phase 3 — RAG & Skills | 66h |
| Phase 4 — Scheduler & Polish | 30h |
| Phase 5 — Testing & Deployment | 20h |
| **Total** | **~194 hours** |
| At 4h/day (solo) | ~7 weeks |
| At 6h/day (solo) | ~5 weeks |

### 10.4 Cost Estimate (Monthly, Production)

| Service | Plan | Monthly Cost |
|---|---|---|
| Supabase | Free | $0 |
| Vercel | Hobby | $0 |
| OpenAI (gpt-4o-mini + embeddings) | Pay-per-use | ~$2–10 |
| GitHub | Free | $0 |
| **Total** | | **~$2–10/month** |

---

## 11. Development Roadmap

```
Week 1-2:  Foundation
  ├── Project init, DB schema, Auth, Layout

Week 3-4:  Core Data  
  ├── Vulnerabilities + Remediations CRUD
  └── Manual linking UI

Week 5-7:  AI/RAG System (Highest Complexity)
  ├── LangChain.js + Skill 1 + Skill 2
  └── Streaming agent execution

Week 8-9:  Scheduler + Polish
  ├── Cron scheduling, charts, UX polish

Week 10:   Testing + Deploy
  └── Jest, Playwright, Vercel
```

---

## 12. Risk Register

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| OpenAI API costs spike | Medium | Low | Rate limiting, use gpt-4o-mini, Groq fallback |
| Supabase free tier storage exhausted | Low | Low | Monitor storage, archive old cache entries |
| pgvector embedding latency | Medium | Medium | Batch embeddings, async processing |
| Google OAuth config errors | High | Low | Test with separate dev OAuth app |
| Vercel timeout on agent runs (60s limit) | High | Medium | Background job queue (use Supabase Edge Functions) |
| Skill producing hallucinated remediations | High | Medium | Confidence threshold + human review flag |

---

## Appendix A — File Structure

```
secureiq-rag/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx               # Dashboard shell
│   │   │   ├── page.tsx                 # /dashboard redirect
│   │   │   ├── vulnerabilities/page.tsx
│   │   │   ├── remediations/page.tsx
│   │   │   ├── skills/page.tsx
│   │   │   ├── cache/page.tsx
│   │   │   └── schedule/page.tsx
│   │   ├── login/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── vulnerabilities/route.ts
│   │   │   ├── vulnerabilities/[id]/route.ts
│   │   │   ├── remediations/route.ts
│   │   │   ├── skills/route.ts
│   │   │   ├── skills/[id]/run/route.ts
│   │   │   ├── cache/route.ts
│   │   │   ├── cache/search/route.ts
│   │   │   ├── schedules/route.ts
│   │   │   ├── agents/run/route.ts       # SSE streaming
│   │   │   └── schedule/tick/route.ts    # Vercel cron
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                           # shadcn components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── DashboardTabs.tsx
│   │   ├── tables/
│   │   │   ├── VulnerabilityTable.tsx
│   │   │   ├── RemediationTable.tsx
│   │   │   └── CacheTable.tsx
│   │   ├── agents/
│   │   │   ├── AgentRunModal.tsx
│   │   │   ├── SkillCard.tsx
│   │   │   └── ProgressStream.tsx
│   │   └── charts/
│   │       └── SecurityOverview.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── prisma.ts                 # Prisma client singleton
│   │   │   └── supabase.ts              # Supabase client
│   │   ├── auth/
│   │   │   └── config.ts                # next-auth config
│   │   ├── rag/
│   │   │   ├── embeddings.ts            # OpenAI embedding helper
│   │   │   └── vectorSearch.ts          # pgvector search
│   │   └── agents/
│   │       ├── orchestrator.ts          # Agent pipeline runner
│   │       ├── skill1-historical.ts     # Skill 1 implementation
│   │       └── skill2-remediation.ts   # Skill 2 implementation
│   ├── types/
│   │   ├── vulnerability.ts
│   │   ├── remediation.ts
│   │   ├── skill.ts
│   │   └── cache.ts
│   └── hooks/
│       ├── useVulnerabilities.ts
│       ├── useRemediations.ts
│       └── useAgentStream.ts           # SSE hook for live updates
├── prisma/
│   └── schema.prisma
├── tests/
│   ├── unit/
│   │   ├── skill1.test.ts
│   │   └── skill2.test.ts
│   ├── integration/
│   │   └── api.test.ts
│   └── e2e/
│       └── auth.spec.ts
├── scripts/
│   └── seed.ts                          # Seed dummy security data
├── docs/
│   └── TDD.md                           # This document
├── .github/
│   └── workflows/
│       └── ci.yml
├── vercel.json
├── .env.example
└── README.md
```
