import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting SecureIQ RAG database seeding...')

  // 1. Create or ensure Demo Security User
  const demoUser = await prisma.user.upsert({
    where: { email: 'analyst@secureiq.ai' },
    update: {},
    create: {
      email: 'analyst@secureiq.ai',
      name: 'Elena Rostova',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    },
  })
  console.log('👤 Demo user verified:', demoUser.email)

  // 2. Create the 2 Core AI Skills
  const historicalSkill = await prisma.skill.upsert({
    where: { name: 'Historical Vulnerability Analyzer' },
    update: {},
    create: {
      name: 'Historical Vulnerability Analyzer',
      description: 'Mines resolved and historical security incident advisories, synthesizes pattern abstractions, and publishes 1536-dim vector embeddings into skill_cache.',
      type: 'HISTORICAL_ANALYZER',
      version: '1.2.0',
      isActive: true,
      config: { batchSize: 50, model: 'gpt-4o-mini', temperature: 0.1 },
    },
  })

  const linkerSkill = await prisma.skill.upsert({
    where: { name: 'Remediation Linker Agent' },
    update: {},
    create: {
      name: 'Remediation Linker Agent',
      description: 'Executes pgvector cosine similarity search against cached historical threat vectors, automatically linking or formulating tailored mitigation work orders.',
      type: 'REMEDIATION_LINKER',
      version: '1.4.0',
      isActive: true,
      config: { confidenceThreshold: 0.75, maxMatches: 3 },
    },
  })
  console.log('🤖 Skills initialized.')

  // 3. Create Sample Vulnerabilities (20 items across severities and systems)
  const sampleVulns = [
    {
      cveId: 'CVE-2024-3094',
      title: 'XZ Utils Upstream Supply Chain Backdoor',
      description: 'Malicious code embedded in liblzma upstream tarballs enabling unauthorized remote SSH authentication bypass via modified systemd hooks.',
      severity: 'CRITICAL',
      cvssScore: 10.0,
      affectedSystem: 'base-os-images',
      affectedVersions: ['5.6.0', '5.6.1'],
      tags: ['supply-chain', 'rce', 'ssh', 'os'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2021-44228',
      title: 'Apache Log4j2 JNDI Remote Code Execution (Log4Shell)',
      description: 'JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints.',
      severity: 'CRITICAL',
      cvssScore: 10.0,
      affectedSystem: 'audit-logging-pipeline',
      affectedVersions: ['2.0-beta9', '2.14.1'],
      tags: ['jndi', 'rce', 'java', 'logging'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2024-21626',
      title: 'runc Container Breakout via Leaked File Descriptor',
      description: 'An internal file descriptor leak within runc allows an attacker to gain write access to the host filesystem during container spawn.',
      severity: 'CRITICAL',
      cvssScore: 8.6,
      affectedSystem: 'k8s-node-worker',
      affectedVersions: ['1.1.0', '1.1.11'],
      tags: ['container', 'escape', 'kubernetes', 'runc'],
      status: 'IN_PROGRESS',
    },
    {
      cveId: 'CVE-2023-44487',
      title: 'HTTP/2 Rapid Reset Denial of Service Flaw',
      description: 'Exploitation of HTTP/2 stream multiplexing with RST_STREAM frames induces severe CPU exhaustion and service outage.',
      severity: 'HIGH',
      cvssScore: 7.5,
      affectedSystem: 'api-gateway-ingress',
      affectedVersions: ['1.21.0'],
      tags: ['http2', 'dos', 'networking', 'gateway'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2024-23897',
      title: 'Jenkins CLI Arbitrary File Read via args4j Parser',
      description: 'An unauthenticated attacker can replace command arguments with arbitrary file contents using @ character syntax in Jenkins CLI commands.',
      severity: 'CRITICAL',
      cvssScore: 9.8,
      affectedSystem: 'ci-cd-jenkins',
      affectedVersions: ['2.441'],
      tags: ['jenkins', 'lfi', 'ci-cd'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2023-38606',
      title: 'Apple iOS/macOS Kernel Memory Manipulation',
      description: 'Hardware memory register manipulation allows local attackers to bypass page table protections.',
      severity: 'HIGH',
      cvssScore: 7.8,
      affectedSystem: 'macos-builder-agents',
      affectedVersions: ['macOS 13.5'],
      tags: ['kernel', 'privilege-escalation', 'macos'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2024-6387',
      title: 'OpenSSH regreSSHion Signal Handler Race Condition',
      description: 'Signal handler race condition in OpenSSH server (sshd) allows unauthenticated remote code execution as root on glibc Linux systems.',
      severity: 'CRITICAL',
      cvssScore: 9.8,
      affectedSystem: 'production-bastion-hosts',
      affectedVersions: ['8.5p1', '9.7p1'],
      tags: ['openssh', 'rce', 'linux', 'glibc'],
      status: 'OPEN',
    },
    {
      cveId: 'CVE-2024-21413',
      title: 'Microsoft Outlook Preview Pane RCE Moniker Vulnerability',
      description: 'Parsing of specific file:// URLs in Outlook messages allows arbitrary code execution without warning dialogues.',
      severity: 'CRITICAL',
      cvssScore: 9.8,
      affectedSystem: 'office-endpoint-fleet',
      affectedVersions: ['365 Apps'],
      tags: ['outlook', 'email', 'windows'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2023-4863',
      title: 'libwebp Heap Buffer Overflow via Huffman Coding',
      description: 'OOB write in libwebp decoding allows remote code execution when rendering malicious WebP images in browsers and rendering services.',
      severity: 'CRITICAL',
      cvssScore: 8.8,
      affectedSystem: 'media-transcoder-svc',
      affectedVersions: ['0.2.0', '1.3.1'],
      tags: ['webp', 'overflow', 'graphics'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2024-4577',
      title: 'PHP-CGI Windows Argument Injection RCE',
      description: 'Character encoding conversion bug (Best-Fit feature) bypasses argument protection in PHP-CGI installations on Windows platforms.',
      severity: 'CRITICAL',
      cvssScore: 9.8,
      affectedSystem: 'legacy-partner-portal',
      affectedVersions: ['8.1.0', '8.3.7'],
      tags: ['php', 'injection', 'windows'],
      status: 'OPEN',
    },
    {
      cveId: 'CVE-2024-27198',
      title: 'JetBrains TeamCity Authentication Bypass',
      description: 'Alternative path traversal in TeamCity web controller permits creating administrative tokens without existing credentials.',
      severity: 'CRITICAL',
      cvssScore: 9.8,
      affectedSystem: 'build-teamcity-cluster',
      affectedVersions: ['2023.11.3'],
      tags: ['auth-bypass', 'ci-cd', 'teamcity'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2024-23334',
      title: 'aiohttp Directory Traversal via Follow Symlinks',
      description: 'Static file handler in aiohttp allows unauthorized file traversal when follow_symlinks is enabled.',
      severity: 'HIGH',
      cvssScore: 7.5,
      affectedSystem: 'async-python-telemetry',
      affectedVersions: ['3.9.1'],
      tags: ['python', 'traversal', 'aiohttp'],
      status: 'OPEN',
    },
    {
      cveId: 'CVE-2023-34362',
      title: 'MOVEit Transfer SQL Injection Vulnerability',
      description: 'SQL injection flaw in MOVEit Transfer web application leads to unauthorized database modification and exfiltration.',
      severity: 'CRITICAL',
      cvssScore: 9.8,
      affectedSystem: 'secure-file-transfer',
      affectedVersions: ['2023.0.0'],
      tags: ['sqli', 'file-transfer', 'data-leak'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2024-3400',
      title: 'Palo Alto GlobalProtect Command Injection',
      description: 'Command injection vulnerability in the GlobalProtect gateway feature enables unauthenticated remote root execution.',
      severity: 'CRITICAL',
      cvssScore: 10.0,
      affectedSystem: 'corporate-vpn-concentrator',
      affectedVersions: ['PAN-OS 10.2'],
      tags: ['vpn', 'pan-os', 'command-injection'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2024-1709',
      title: 'ConnectWise ScreenConnect Authentication Bypass',
      description: 'Path manipulation flaw allows threat actors to access the initial setup wizard and configure new system administrators.',
      severity: 'CRITICAL',
      cvssScore: 10.0,
      affectedSystem: 'remote-desktop-gateway',
      affectedVersions: ['23.9.7'],
      tags: ['connectwise', 'auth-bypass', 'remote-mgmt'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2024-24919',
      title: 'Check Point Quantum Security Gateway Sensitive Information Disclosure',
      description: 'Arbitrary file disclosure via crafted HTTP requests on Check Point VPN interfaces allowing extraction of password hashes.',
      severity: 'HIGH',
      cvssScore: 8.6,
      affectedSystem: 'perimeter-firewall-cluster',
      affectedVersions: ['R81.20'],
      tags: ['checkpoint', 'vpn', 'disclosure'],
      status: 'OPEN',
    },
    {
      cveId: 'CVE-2023-22515',
      title: 'Atlassian Confluence Server Broken Access Control',
      description: 'Externally exposed Confluence instances allow attackers to trigger setup recovery keys and take over administrative instances.',
      severity: 'CRITICAL',
      cvssScore: 10.0,
      affectedSystem: 'internal-wiki-confluence',
      affectedVersions: ['8.0.0', '8.5.1'],
      tags: ['atlassian', 'confluence', 'broken-auth'],
      status: 'RESOLVED',
    },
    {
      cveId: 'CVE-2024-0012',
      title: 'PAN-OS Management Interface Authentication Bypass',
      description: 'Allows unauthenticated administrator access on the management web interface through improper session token validation.',
      severity: 'HIGH',
      cvssScore: 8.2,
      affectedSystem: 'firewall-mgmt-interface',
      affectedVersions: ['PAN-OS 11.0'],
      tags: ['pan-os', 'auth', 'management'],
      status: 'OPEN',
    },
    {
      cveId: 'CVE-2024-21887',
      title: 'Ivanti Connect Secure Command Injection',
      description: 'Command injection in web components of Ivanti Connect Secure allows authenticated administrators to execute arbitrary commands.',
      severity: 'HIGH',
      cvssScore: 7.3,
      affectedSystem: 'partner-ssl-vpn',
      affectedVersions: ['9.1R14'],
      tags: ['ivanti', 'vpn', 'injection'],
      status: 'OPEN',
    },
    {
      cveId: 'CVE-2023-4911',
      title: 'glibc ld.so Buffer Overflow (Looney Tunables)',
      description: 'Buffer overflow in the GNU C Library dynamic loader handling of GLIBC_TUNABLES environment variable enabling root privilege escalation.',
      severity: 'HIGH',
      cvssScore: 7.8,
      affectedSystem: 'production-app-servers',
      affectedVersions: ['glibc 2.34', 'glibc 2.38'],
      tags: ['glibc', 'privilege-escalation', 'linux'],
      status: 'RESOLVED',
    },
  ]

  const createdVulns: any[] = []
  for (const v of sampleVulns) {
    const vuln = await prisma.vulnerability.upsert({
      where: { cveId: v.cveId },
      update: {},
      create: {
        ...v,
        severity: v.severity as any,
        status: v.status as any,
        createdById: demoUser.id,
      },
    })
    createdVulns.push(vuln)
  }
  console.log(`🛡️ Seeded ${createdVulns.length} vulnerabilities.`)

  // 4. Create Sample Remediations (Manual + AI Generated)
  const sampleRemediations = [
    {
      title: 'Patch & Rebuild Linux AMI with liblzma 5.6.4+',
      description: 'Rebuild all production base AMI gold images using verified debian/alpine packages containing sanitized XZ upstream sources.',
      priority: 'CRITICAL',
      status: 'COMPLETED',
      isAiGenerated: true,
      resolutionNotes: 'Verified checksums against Debian security team mirrors and completed fleet rolling rollout.',
    },
    {
      title: 'Enforce formatMsgNoLookups and update Log4j to 2.17.1',
      description: 'Deploy JVM system property -Dlog4j2.formatMsgNoLookups=true and update all dependencies to Log4j2 v2.17.1 across microservices.',
      priority: 'CRITICAL',
      status: 'COMPLETED',
      isAiGenerated: false,
      resolutionNotes: 'Updated parent pom.xml and gradle scripts. Rescanned with trivy scanner.',
    },
    {
      title: 'Upgrade Kubernetes node runtime runc to 1.1.12',
      description: 'Coordinate rolling worker node upgrades in EKS/GKE cluster to prevent container host escape via leaked descriptors.',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      isAiGenerated: true,
      resolutionNotes: null,
    },
    {
      title: 'Configure Ingress RST_STREAM rate limits',
      description: 'Set max_concurrent_streams to 100 and enforce ngx_http_v2_module rapid reset rate limits at HAProxy / Nginx boundary.',
      priority: 'HIGH',
      status: 'COMPLETED',
      isAiGenerated: true,
      resolutionNotes: 'Applied through terraform ingress module v3.2.0.',
    },
    {
      title: 'Update Jenkins Master & Disable CLI over Remoting',
      description: 'Upgrade Jenkins LTS to 2.440.3 and disable the embedded CLI remoting channel via system property.',
      priority: 'CRITICAL',
      status: 'COMPLETED',
      isAiGenerated: false,
      resolutionNotes: 'Applied update and verified anon access is blocked.',
    },
    {
      title: 'Harden SSHD configuration and backport OpenSSH patch',
      description: 'Deploy LoginGraceTime 0 workaround in sshd_config and patch OpenSSH packages across all bastion hosts immediately.',
      priority: 'CRITICAL',
      status: 'PENDING',
      isAiGenerated: true,
      resolutionNotes: null,
    },
    {
      title: 'Decommission or patch legacy Windows PHP-CGI handler',
      description: 'Migrate legacy reporting scripts to modern FastCGI runner and block URL queries containing unencoded hyphens.',
      priority: 'CRITICAL',
      status: 'PENDING',
      isAiGenerated: true,
      resolutionNotes: null,
    },
    {
      title: 'Enforce follow_symlinks=False on all aiohttp endpoints',
      description: 'Audit Python codebase for static asset mounts and explicitly configure follow_symlinks=False to prevent traversal.',
      priority: 'HIGH',
      status: 'PENDING',
      isAiGenerated: false,
      resolutionNotes: null,
    },
    {
      title: 'Restrict Check Point Gateway management to VPN bastion',
      description: 'Apply security gateway hotfix for CVE-2024-24919 and disallow any management interfaces on public IP ranges.',
      priority: 'HIGH',
      status: 'PENDING',
      isAiGenerated: true,
      resolutionNotes: null,
    },
    {
      title: 'Upgrade GLIBC libraries to patched revision',
      description: 'Run apt-get update && apt-get install libc6 across all Ubuntu instances to neutralize Looney Tunables exploit vector.',
      priority: 'HIGH',
      status: 'COMPLETED',
      isAiGenerated: false,
      resolutionNotes: 'Fleet updated on 2024-02-14.',
    },
  ]

  const createdRemeds: any[] = []
  for (const r of sampleRemediations) {
    const rem = await prisma.remediation.create({
      data: {
        ...r,
        priority: r.priority as any,
        status: r.status as any,
        createdById: demoUser.id,
      },
    })
    createdRemeds.push(rem)
  }
  console.log(`🔧 Seeded ${createdRemeds.length} remediations.`)

  // 5. Create Links (M:M connections)
  const linkMappings = [
    { vulnIdx: 0, remedIdx: 0, score: 0.96, type: 'AI_GENERATED', notes: 'Identified supply chain payload signature' },
    { vulnIdx: 1, remedIdx: 1, score: 0.99, type: 'MANUAL', notes: 'Verified against Apache advisories' },
    { vulnIdx: 2, remedIdx: 2, score: 0.89, type: 'AI_GENERATED', notes: 'Auto-linked via container runtime pattern' },
    { vulnIdx: 3, remedIdx: 3, score: 0.92, type: 'AI_GENERATED', notes: 'Matches HTTP/2 stream exhaustion patterns' },
    { vulnIdx: 4, remedIdx: 4, score: 0.88, type: 'MANUAL', notes: 'Jenkins LTS advisory link' },
    { vulnIdx: 6, remedIdx: 5, score: 0.94, type: 'AI_GENERATED', notes: 'OpenSSH signal handler mitigation' },
    { vulnIdx: 9, remedIdx: 6, score: 0.87, type: 'AI_GENERATED', notes: 'PHP CGI parameter injection rule' },
    { vulnIdx: 11, remedIdx: 7, score: 0.85, type: 'MANUAL', notes: 'Python directory traversal protection' },
    { vulnIdx: 15, remedIdx: 8, score: 0.91, type: 'AI_GENERATED', notes: 'Security gateway exposure filter' },
    { vulnIdx: 19, remedIdx: 9, score: 0.95, type: 'MANUAL', notes: 'Kernel & Glibc patch sync' },
  ]

  for (const m of linkMappings) {
    const vuln = createdVulns[m.vulnIdx]
    const rem = createdRemeds[m.remedIdx]
    if (vuln && rem) {
      await prisma.vulRemedLink.upsert({
        where: {
          vulnerabilityId_remediationId: {
            vulnerabilityId: vuln.id,
            remediationId: rem.id,
          },
        },
        create: {
          vulnerabilityId: vuln.id,
          remediationId: rem.id,
          linkType: m.type as any,
          confidenceScore: m.score,
          createdByAgent: m.type === 'AI_GENERATED' ? 'Skill 2: Remediation Linker' : 'Security Analyst',
          notes: m.notes,
        },
        update: {},
      })
    }
  }
  console.log('🔗 Seeded vulnerability-remediation links.')

  // 6. Seed Sample Skill Cache Entries
  for (let i = 0; i < 5; i++) {
    const vuln = createdVulns[i]
    if (vuln) {
      const existing = await prisma.skillCache.findFirst({
        where: {
          skillId: historicalSkill.id,
          vulnerabilityId: vuln.id,
        },
      })
      if (!existing) {
        await prisma.skillCache.create({
          data: {
            skillId: historicalSkill.id,
            vulnerabilityId: vuln.id,
            patternSummary: `Pattern extracted for ${vuln.title}: Threat vector exploits ${vuln.tags.join(', ')} in ${vuln.affectedSystem}. Mitigation requires upstream binary verification, defense-in-depth isolation, and rate-limiting.`,
            rawContext: JSON.stringify({ title: vuln.title, severity: vuln.severity, system: vuln.affectedSystem }),
            metadata: { cveId: vuln.cveId, vectorModel: 'text-embedding-3-small', dims: 1536 },
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        })
      }
    }
  }
  console.log('📦 Seeded skill cache patterns.')

  // 7. Seed automated schedules
  await prisma.schedule.createMany({
    data: [
      {
        skillId: historicalSkill.id,
        name: 'Nightly Vulnerability Vector Mining',
        cronExpression: '0 2 * * *',
        isActive: true,
        lastRunAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
        lastRunStatus: 'SUCCESS',
        runHistory: [
          { status: 'SUCCESS', timestamp: new Date(Date.now() - 14 * 3600000).toISOString(), durationMs: 2450, message: 'Extracted 12 patterns' },
          { status: 'SUCCESS', timestamp: new Date(Date.now() - 38 * 3600000).toISOString(), durationMs: 3120, message: 'Extracted 15 patterns' },
          { status: 'SUCCESS', timestamp: new Date(Date.now() - 62 * 3600000).toISOString(), durationMs: 1980, message: 'Extracted 8 patterns' },
        ],
        createdById: demoUser.id,
      },
      {
        skillId: linkerSkill.id,
        name: 'Hourly Remediation Auto-Linker',
        cronExpression: '0 * * * *',
        isActive: true,
        lastRunAt: new Date(Date.now() - 45 * 60 * 1000),
        lastRunStatus: 'SUCCESS',
        runHistory: [
          { status: 'SUCCESS', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), durationMs: 1420, message: 'Linked 3 remediations' },
          { status: 'SUCCESS', timestamp: new Date(Date.now() - 105 * 60000).toISOString(), durationMs: 1610, message: 'Linked 2 remediations' },
        ],
        createdById: demoUser.id,
      },
    ],
    skipDuplicates: true,
  })
  console.log('⏰ Seeded cron schedules.')

  console.log('✅ Database seeding finished successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
