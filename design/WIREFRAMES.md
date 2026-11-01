# SecureIQ RAG — UI Screen Wireframes & Specs

---

## 1. Authentication Screen (`/login`)

```
+-----------------------------------------------------------------------+
|                                                                       |
|                          * (Ambient Cyan Glow) *                      |
|                                                                       |
|                 +-----------------------------------+                 |
|                 |         [🛡️ SecureIQ RAG]         |                 |
|                 |  Autonomous Security Intelligence |                 |
|                 |                                   |                 |
|                 | +-------------------------------+ |                 |
|                 | | ✓ Historical pattern extraction| |                 |
|                 | | ✓ pgvector semantic search    | |                 |
|                 | | ✓ Automated remediation links | |                 |
|                 | +-------------------------------+ |                 |
|                 |                                   |                 |
|                 | [ G  Continue with Google OAuth ] |                 |
|                 | ----------------- OR ------------ |                 |
|                 | [ ⚡ Quick Demo Analyst Login -> ] |                 |
|                 |                                   |                 |
|                 | ISO/IEC 27001 • Threat Intelligence|                 |
|                 +-----------------------------------+                 |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 2. Global Dashboard Shell Layout

```
+---------------------------------------------------------------------------------------------+
| [🛡️ SecureIQ RAG]  | Posture: Protected [●]          [⚡ Trigger Agent] [🔔] [👤 Elena R. v] |
+--------------------+------------------------------------------------------------------------+
|                    |                                                                        |
| [⚡ Run Pipeline]  | BREADCRUMB / TAB VIEW                                                  |
|                    |                                                                        |
| 🐛 Vulnerabilities |                                                                        |
| 🔧 Remediations    |                          MAIN CONTENT CANVAS                           |
| 🤖 Skills & Agents |                                                                        |
| 🗄️ Pattern Cache   |                                                                        |
| 📅 Scheduler       |                                                                        |
|                    |                                                                        |
| ------------------ |                                                                        |
| ● Vector: pgvector |                                                                        |
+--------------------+------------------------------------------------------------------------+
```

---

## 3. Vulnerabilities Dashboard & Slide-Over Drawer

```
+---------------------------------------------------------------------------------------------+
| Vulnerabilities [20 Total]               [Hide Visuals] [✨ RAG Linker] [+ Add Vulnerability]|
| Manage tracked security threats, CVSS metrics, and AI-linked remediation items             |
|                                                                                             |
| [ Total: 20 ]       [ 🔴 Critical: 4 ]      [ 🟡 Open: 14 ]         [ 🟢 Resolved: 6 ]       |
+---------------------------------------------------------------------------------------------+
| [🔍 Search by CVE, title, system...]  | Severity: [All v]  Status: [All v]                  |
+---------------------------------------------------------------------------------------------+
| CVE ID       | Vulnerability Title        | Sev   | CVSS | System       | Status | Links    |
|--------------+----------------------------+-------+------+--------------+--------+----------|
| CVE-2024-3094| XZ Utils Supply Chain RCE  | CRIT  | 10.0 | base-os      | RESV   | 🔗 1 (AI)|
| CVE-2021-44228| Log4j2 JNDI RCE (Log4Shell)| CRIT  | 10.0 | audit-log    | RESV   | 🔗 1     |
| CVE-2024-6387| OpenSSH regreSSHion race   | CRIT  |  9.8 | bastion-host | OPEN   | 🔗 1 (AI)|
| CVE-2024-21626| runc Container Escape     | CRIT  |  8.6 | k8s-worker   | IN_PRG | 🔗 1 (AI)|
| CVE-2023-44487| HTTP/2 Rapid Reset DoS     | HIGH  |  7.5 | api-gateway  | RESV   | 🔗 1 (AI)|
+---------------------------------------------------------------------------------------------+
```

### Right Slide-Over Detail Drawer (When row clicked):
```
                                                        +-------------------------------------+
                                                        | [CRITICAL] CVE-2024-3094            |
                                                        | XZ Utils Supply Chain Backdoor      |
                                                        | Discovered: Mar 2024 • System: os   |
                                                        |-------------------------------------|
                                                        | TECHNICAL DETAILS                   |
                                                        | Malicious code embedded in upstream |
                                                        | liblzma tarballs enabling unauth SSH|
                                                        | authentication bypass.              |
                                                        |-------------------------------------|
                                                        | 🔗 LINKED REMEDIATIONS (1)          |
                                                        | +---------------------------------+ |
                                                        | | Patch & Rebuild Linux AMI       | |
                                                        | | [96% match] • By: Skill 2 AI    | |
                                                        | | Rebuild production AMI gold     | |
                                                        | | images with sanitized source.   | |
                                                        | +---------------------------------+ |
                                                        +-------------------------------------+
```

---

## 4. Skills & Live SSE Orchestrator Modal

```
+---------------------------------------------------------------------------------------------+
| Skills & Agents                                                 [✨ Run Full Pipeline]       |
| Autonomous agent pipeline for mining vulnerability pattern vectors and forging remediation  |
|                                                                                             |
| [1. Historical Analyzer]  =======(embeddings)=======>  [2. Remediation Linker Agent]         |
+---------------------------------------------------------------------------------------------+
| +---------------------------------------+  +---------------------------------------+        |
| | 🗄️ Historical Vulnerability Analyzer  |  | 🔗 Remediation Linker Agent           |        |
| | v1.2.0 • HISTORICAL_ANALYZER [Active] |  | v1.4.0 • REMEDIATION_LINKER [Active]  |        |
| | Mines resolved CVE records & vectors  |  | Cosine vector search & link generator |        |
| | Engine: gpt-4o-mini | Dims: 1536      |  | Match threshold: 0.70                 |        |
| | Cache count: 247 patterns             |  | Target: Open & In-Progress threats    |        |
| | [▶ Run Single Skill]                  |  | [▶ Run Single Skill]                  |        |
| +---------------------------------------+  +---------------------------------------+        |
+---------------------------------------------------------------------------------------------+
```

### Live SSE Progress Modal:
```
+---------------------------------------------------------------------+
| 🤖 RAG Agent Pipeline Orchestrator                   [Running... ●] |
|---------------------------------------------------------------------|
| Batch Size: [===== 50 =====]        Cosine Threshold: [==== 0.70 ==]|
| Dry Run Mode: [ OFF ]                                               |
|---------------------------------------------------------------------|
| Execution Progress: [██████████████████████░░░░░░] 78%              |
|                                                                     |
| [1] START: Initiating pipeline with 2 skills                        |
| [2] SKILL_START: Launching Historical Vulnerability Analyzer        |
| [3] PROGRESS: Processed 50/50 vulnerabilities                       |
| [4] SKILL_COMPLETE: Cached 50 patterns (1,450ms)                    |
| [5] SKILL_START: Launching Remediation Linker Agent                 |
| [6] PROGRESS: Linked 8 remediations via cosine semantic search      |
|                                                                     |
| Summary: [ 50 Patterns Cached ]  [ 8 Remediations ]  [ 8 Links ]    |
|---------------------------------------------------------------------|
| Powered by LangChain.js & pgvector              [ Stop ]  [ Close ] |
+---------------------------------------------------------------------+
```

---

## 5. Pattern Cache & Semantic Search Tester

```
+---------------------------------------------------------------------------------------------+
| Pattern Cache & Vectors [50 Stored Vectors]                                                 |
| Semantic intelligence extracted by Skill 1 and indexed via pgvector embeddings              |
|                                                                                             |
| +-----------------------------------------------------------------------------------------+ |
| | ✨ Semantic Search Tester (Vector Similarity)                                           | |
| | [🔍 Enter natural threat description (e.g., 'unauthorized ssh bypass')...] [Vector Search]| |
| +-----------------------------------------------------------------------------------------+ |
|                                                                                             |
| Source CVE    | Extracted Pattern Summary                       | Cosine Match | Indexed    |
|---------------+-------------------------------------------------+--------------+------------|
| CVE-2024-3094 | Malicious code in liblzma upstream tarballs...  | 96.2%        | 2h ago     |
| CVE-2024-6387 | Race condition in OpenSSH signal handler...     | 91.8%        | 3h ago     |
| CVE-2021-44228| LDAP/JNDI injection in message string parser... | 87.5%        | 1d ago     |
+---------------------------------------------------------------------------------------------+
```

---

## 6. Automated Scheduler UI

```
+---------------------------------------------------------------------------------------------+
| Automated Schedule [2 Jobs Configured]             [Trigger Cron Tick] [+ Add Schedule]     |
| Continuous background evaluation of security posture via cron execution hooks               |
+---------------------------------------------------------------------------------------------+
| +-----------------------------------------------------------------------------------------+ |
| | ⏰ Nightly Vulnerability Vector Mining                      [0 2 * * *] [Toggle: ON] [🗑]| |
| | Target Skill: Historical Vulnerability Analyzer                                         | |
| | Run History: 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 (10 most recent) • Last: 2:00 AM (2,450ms)   | |
| +-----------------------------------------------------------------------------------------+ |
| | ⏰ Hourly Remediation Auto-Linker                           [0 * * * *] [Toggle: ON] [🗑]| |
| | Target Skill: Remediation Linker Agent                                                  | |
| | Run History: 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 🟢 (10 most recent) • Last: 45m ago (1,420ms)   | |
| +-----------------------------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------------+
```


---

## 7. GitHub Repository Scanner UI (`/scanner`)

```
+---------------------------------------------------------------------------------------------+
| GitHub Repository Scanner                                 [View Vuln Table] [✨ Run RAG]     |
| Scan source manifests, extract CVE vulnerabilities, and automatically ingest into platform   |
+---------------------------------------------------------------------------------------------+
| +-----------------------------------------------------------------------------------------+ |
| | 🐙 Target Repository Specification             [+ Add GitHub Token (Private Repos)]     | |
| | [ ⎇ https://github.com/expressjs/express                                 ] [🔍 Scan]    | |
| |                                                                                         | |
| | Quick Examples: [Express.js]  [Apache Log4j2]  [Flask (Python)]  [React]                | |
| +-----------------------------------------------------------------------------------------+ |
|                                                                                             |
| Scan Result: expressjs/express (⭐ 64,200 • JavaScript)                                    |
| [ Manifests: package.json ]  [ +1 Added to Table ]  [ 0 Existing ]                         |
|                                                                                             |
| CVE / Advisory | Threat Title & Overview               | Severity | CVSS | Ingestion Status |
|----------------+---------------------------------------+----------+------+------------------|
| CVE-2024-29041 | Express.js Open Redirect Vulnerability| MEDIUM   | 6.5  | [✓ Ingested]     |
+---------------------------------------------------------------------------------------------+
```
