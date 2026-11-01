# 🔒 SecureIQ RAG

> AI-Powered Security Vulnerability & Remediation Platform with RAG Agents

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

SecureIQ RAG is an AI-powered security intelligence platform that manages **vulnerabilities** and **remediation tasks** using a Retrieval-Augmented Generation (RAG) architecture. It automatically analyzes historical vulnerability patterns and creates AI-linked remediation tasks.

## ✨ Features

- 🔐 **Google OAuth Login** via next-auth v5
- 📊 **5-Tab Dashboard**: Vulnerabilities, Remediations, Skills, Cache, Schedule
- 🤖 **RAG Agent Pipeline**: 2 AI skills that analyze and remediate vulnerabilities
- 🔗 **Smart Linking**: Auto-creates vulnerability → remediation links with confidence scores
- 🗄️ **Vector Cache**: pgvector-powered semantic search over historical data
- ⏰ **Scheduler**: Cron-based skill execution with run history
- 📡 **Live Updates**: SSE streaming for real-time agent progress

## 🏗️ Architecture

```
Next.js 14 (App Router) → API Routes → LangChain.js Agents → Supabase (PostgreSQL + pgvector)
```

See [docs/TDD.md](docs/TDD.md) for the full Technical Design Document.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Supabase account (free)
- OpenAI API key (or Groq free tier)
- Google Cloud Console OAuth credentials

### 1. Clone & Install

```bash
git clone https://github.com/pathik455/secureiq-rag.git
cd secureiq-rag
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Fill in your credentials (see .env.example for details)
```

### 3. Database Setup

```bash
# Push Prisma schema to Supabase
pnpm db:push

# Seed with sample security data
pnpm db:seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
secureiq-rag/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (dashboard)/   # Protected dashboard routes
│   │   ├── login/         # Login page
│   │   └── api/           # API route handlers
│   ├── components/        # React components
│   ├── lib/               # Core libraries
│   │   ├── agents/        # LangChain RAG agents
│   │   ├── rag/           # Embeddings & vector search
│   │   └── db/            # Prisma + Supabase clients
│   └── types/             # TypeScript types
├── prisma/                # Database schema
├── scripts/               # Seed & utility scripts
├── tests/                 # Jest + Playwright tests
└── docs/                  # Documentation (TDD, ADRs)
```

## 🤖 RAG Agent Pipeline

```
[Run Pipeline] →
  Skill 1: Historical Analyzer
    → Reads all vulnerabilities
    → Generates LLM pattern summaries
    → Stores embeddings in skill_cache table
  ↓
  Skill 2: Remediation Linker
    → Fetches open vulnerabilities
    → Vector similarity search against cache
    → Auto-creates remediation tasks (confidence > 0.75)
    → Links via vul_remed_links table
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Tanstack Table, Recharts |
| Auth | next-auth v5, Google OAuth |
| Database | Supabase (PostgreSQL + pgvector) |
| ORM | Prisma 5 |
| AI/RAG | LangChain.js, OpenAI gpt-4o-mini |
| Deployment | Vercel (free hobby) |

## 📜 Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run Jest tests
pnpm test:e2e     # Run Playwright tests
pnpm db:push      # Push Prisma schema
pnpm db:seed      # Seed sample data
pnpm db:studio    # Open Prisma Studio
```

## 📊 Database Schema

5 core tables:
- `vulnerabilities` — Security vulnerabilities with CVE IDs
- `remediations` — Remediation tasks (manual + AI-generated)
- `vul_remed_links` — M:M junction table linking vulns ↔ remediations
- `skills` — Agent skill registry
- `skill_cache` — LLM-generated pattern cache with vector embeddings
- `schedules` — Cron job configurations for skill execution

## 🔐 Environment Variables

See [.env.example](.env.example) for all required variables.

## 📖 Documentation

- [Technical Design Document](docs/TDD.md) — Full architecture, DB schema, API design, effort estimation
- [UI Specifications](docs/TDD.md#8-frontend-design--ui-specifications) — Wireframes & design guide

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by [pathik455](https://github.com/pathik455)**
