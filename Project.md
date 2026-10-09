# Hospital GreenOps AI — Complete Project Report

**Implementation, completed work, architecture, operating workflows and verification evidence**

Document date: **9 October 2026**. The application verification cited in this report was recorded on **8 October 2026**. This report consolidates the implementation already present in the repository; it does not imply that every historical check was rerun when this document was written.

Hospital GreenOps AI is a working hospital **operations and sustainability** application with authenticated users, permission-scoped domain APIs, persisted operational records, experimental machine learning, deterministic what-if analysis, grounded AI conversations, audited action workflows and downloadable reports. The application is designed around a fictional hospital and explicitly identified synthetic operating data.

The implementation contract is [Hospital_GreenOps_Codex_Build_Plan.md](Hospital_GreenOps_Codex_Build_Plan.md). All **M0–M10 milestones** are recorded as passed in [docs/build-status.md](docs/build-status.md). Follow-up work added verified Supabase PostgreSQL integration, private Azure Blob Storage, seven-role jury sign-in, complete page captures and detailed architecture/scope diagrams.

No clinical patient workflow or public deployment is part of the completed deliverable. Experimental predictions, modeled scenario deltas and illustrative accounting factors are identified as such throughout the product.

## Contents

1. [Project purpose and delivered outcome](#1-project-purpose-and-delivered-outcome)
2. [Completion inventory](#2-completion-inventory)
3. [Technology stack](#3-technology-stack)
4. [Repository and deliverable structure](#4-repository-and-deliverable-structure)
5. [System architecture](#5-system-architecture)
6. [Completed milestones M0–M10](#6-completed-milestones-m0m10)
7. [Users, grants and permissions](#7-users-grants-and-permissions)
8. [Synthetic data, worlds and clock](#8-synthetic-data-worlds-and-clock)
9. [Completed operational modules](#9-completed-operational-modules)
10. [Dashboard pages and frontend behavior](#10-dashboard-pages-and-frontend-behavior)
11. [Database, migrations and RLS](#11-database-migrations-and-rls)
12. [Domain APIs and CRUD](#12-domain-apis-and-crud)
13. [ML foundation and model lifecycle](#13-ml-foundation-and-model-lifecycle)
14. [Deterministic what-if simulations](#14-deterministic-what-if-simulations)
15. [Grounded chatbot and provider integration](#15-grounded-chatbot-and-provider-integration)
16. [Nineteen scoped agent tools](#16-nineteen-scoped-agent-tools)
17. [Investigation, monitoring and permitted actions](#17-investigation-monitoring-and-permitted-actions)
18. [Action lifecycle and independent review](#18-action-lifecycle-and-independent-review)
19. [Durable jobs and failure recovery](#19-durable-jobs-and-failure-recovery)
20. [Reports, exports and evidence storage](#20-reports-exports-and-evidence-storage)
21. [Supabase and Azure follow-up](#21-supabase-and-azure-follow-up)
22. [Security and runtime boundaries](#22-security-and-runtime-boundaries)
23. [Verification results and evidence](#23-verification-results-and-evidence)
24. [Screenshots and presentation assets](#24-screenshots-and-presentation-assets)
25. [Run, seed, generate, infer and check commands](#25-run-seed-generate-infer-and-check-commands)
26. [Offline training and evaluation](#26-offline-training-and-evaluation)
27. [Backup, restore and operating handoff](#27-backup-restore-and-operating-handoff)
28. [Jury demonstration workflow](#28-jury-demonstration-workflow)
29. [Limitations and work not claimed](#29-limitations-and-work-not-claimed)
30. [Source and documentation index](#30-source-and-documentation-index)

## 1. Project purpose and delivered outcome

Hospital operations span energy consumption, water supply, waste handling, infrastructure maintenance, indoor conditions, parking access, safety events and accounting. GreenOps brings these domains into a common operating workspace so that a user can examine current evidence, understand a risk, test a response and track reviewed follow-up work.

The delivered product supports the following complete journey:

1. Authenticate as a real account with a defined role and explicit facility/zone grants.
2. Select an authorized facility and an independent operating world.
3. Inspect operating metrics, source coverage, resource reserves and persisted records at the selected virtual cutoff.
4. Create or update a permitted domain record through the same validated services used by the API and agents.
5. Review experimental forecasts and evidence-backed risks with their limitations.
6. Run deterministic scenarios against a frozen engineering baseline.
7. Ask a grounded chatbot or initiate an authorized investigation.
8. Review an action proposal, assign an eligible owner and progress the permitted action.
9. Have an independent reviewer verify resolution with evidence.
10. Generate and download actual CSV, HTML and PDF reports.
11. Inspect job outcomes, tool activity, usage, errors and audit records.

The system persists the work behind these screens. Charts read domain APIs; CRUD modifies database records; asynchronous operations expose real job states; downloaded artifacts contain actual generated bytes. Provider failures remain visible failures.

## 2. Completion inventory

| Area | Delivered work | Evidence or implementation |
|---|---|---|
| Implementation contract | Sequential M0–M10 delivery and maintained status | [Build status](docs/build-status.md) |
| Frontend | Next.js/TypeScript dashboard with 18 product pages and sign-in | [Web application](apps/web) |
| Backend | FastAPI/Python domain services and scoped HTTP APIs | [API application](services/api/app) |
| Persistence | 72 concrete SQLAlchemy tables, Alembic and FORCE RLS | [Models](services/api/app/core/models.py), [migrations](services/api/alembic/versions) |
| Identity | Argon2 authentication, opaque sessions, CSRF, role/grant checks | [Authentication](services/api/app/core/auth.py) |
| Jury login | Seven real demo-role buttons, account switching and production refusal | [Demo login](services/api/app/core/demo_login.py) |
| Synthetic worlds | Preserved base/stress sources and independent extended operational data | [Importer](services/api/app/domains/importer.py), [generator](services/api/app/domains/generator.py) |
| ML | Six forecast bundles, generic detector, versioned evaluation and serving controls | [Analytics](services/api/app/analytics) |
| Simulations | Thirteen interventions, 15-minute engine, 1–72-hour horizons, saved comparisons | [Simulation engine](services/api/app/simulation/engine.py) |
| AI | Configurable OpenAI-compatible adapter, verified provider and grounded tool loop | [Provider](services/api/app/ai/provider.py), [orchestrator](services/api/app/ai/orchestrator.py) |
| Agent access | Nineteen typed tools across operational domains | [Tool registry](services/api/app/ai/tools.py) |
| Agent workflows | Investigation, opt-in monitoring, policies, budgets and bounded software writes | [Monitoring](services/api/app/ai/monitor.py) |
| Actions | Proposals, administrator approval, owner assignment and independent review | [Action service](services/api/app/domains/actions.py) |
| Jobs | PostgreSQL job/outbox persistence, Celery/Redis, leases and recovery | [Job services](services/api/app/jobs) |
| Reports | Deterministic CSV/HTML/PDF generation and authenticated downloads | [Reports](services/api/app/domains/reports.py) |
| Object storage | S3/MinIO and private Azure Blob adapters | [Object store](services/api/app/core/object_store.py) |
| Cloud configuration | Restricted Supabase runtime, separate migration connection and Azure prefix | [Cloud runbook](docs/cloud-services.md) |
| Reproducibility | Lockfiles, environment example, Docker Compose and offline trainer | [README](README.md), [environment example](.env.example) |
| Verification | Backend, browser, provider, data-boundary, restore and performance evidence | [Verification index](docs/verification/README.md) |
| Screenshots | 39 page-capture PNGs covering desktop pages, sign-in and mobile overview | [Page results](docs/screenshots/pages/page-results.json) |
| Diagrams | Workflow, technology stack and separate user scopes in Mermaid/SVG/PNG | [Workflow](docs/workflow.md), [technology and scopes](docs/techstack-and-scopes.md) |
| Handoff | Runbooks, HTTP demo, generated contracts and production TLS configuration | [Runbook](docs/runbook.md), [demo](docs/demo.md) |

## 3. Technology stack

Versions are resolved by committed lockfiles. The dependency manifests sometimes use broad constraints; installation should use the lockfiles rather than independently selecting newer releases.

| Layer | Technology | Purpose |
|---|---|---|
| Web framework | Next.js, React, TypeScript | Dashboard, navigation, forms and same-origin API proxy |
| Styling | Tailwind CSS and application CSS | Responsive operating workspace |
| UI primitives | Radix UI | Dialogs and tab components |
| Icons | Phosphor Icons | Domain and navigation iconography |
| Charts | Apache ECharts | Resource-series visualization |
| Markdown | React Markdown and remark-gfm | Structured AI answer rendering |
| HTTP API | FastAPI and Uvicorn | Authenticated domain endpoints and OpenAPI |
| Python runtime | Python 3.12 | Backend, worker, analysis and offline training |
| Validation | Pydantic and pydantic-settings | Strict write/tool contracts and server configuration |
| ORM | SQLAlchemy 2 | Typed relational persistence and transactions |
| PostgreSQL driver | Psycopg | Application and migration database connectivity |
| Database | PostgreSQL | Operational records, identity, evidence, jobs and audit |
| Cloud database | Supabase PostgreSQL 17.11 in recorded checks | Restricted hosted database connectivity |
| Local database | PostgreSQL 18 in Compose | Reproducible local database alternative |
| Schema evolution | Alembic | Versioned migrations through revision 0006 |
| Password hashing | Argon2 | Real-account password verification |
| Jobs | Celery and Redis | Asynchronous execution and broker dispatch |
| Azure storage | Official Azure Blob Python SDK | Private reports and evidence artifacts |
| S3 storage | Boto3 and MinIO | Local S3-compatible alternative |
| Provider integration | OpenAI Python SDK and HTTPX | Server-side compatible chat/function calls |
| ML computation | NumPy 2.3.5, pandas 2.2.3 | Preserved starter computation contracts |
| ML models | scikit-learn 1.8.0, joblib 1.5.3 | Forecast/detector execution and trusted bundles |
| PDF output | ReportLab | Actual server-rendered report files |
| Backend tests | pytest and pytest-asyncio | Integration, numerical and failure-path verification |
| Browser tests | Playwright | Actual user workflows and native page capture |
| Containers | Docker Compose; rootless Podman compatibility wrapper | Reproducible local runtime |
| Production proxy configuration | Caddy | TLS configuration for a future deployment |
| Diagrams | Mermaid | Editable workflow and scope documentation |

Lockfiles: [services/api/uv.lock](services/api/uv.lock), [apps/web/package-lock.json](apps/web/package-lock.json), and [scripts/ui-tests/uv.lock](scripts/ui-tests/uv.lock).

## 4. Repository and deliverable structure

```text
Hospital_GreenOps_Codex_Build_Plan.md   Implementation contract
Project.md                            Consolidated project report
README.md                             Startup, verification and screenshot gallery
.env.example                          Secret-free configuration template
apps/web/                             Next.js application and browser workflow tests
services/api/app/                      FastAPI and shared domain services
services/api/alembic/                  Migrations and database policy evolution
services/api/tests/                    Backend and domain verification
services/api/uv.lock                   Reproducible Python dependency lock
packages/contracts/                   Generated OpenAPI and write schemas
hospital_greenops_starter/             Supplied starter directory
research/starter/                     Preserved offline original inputs and truth
research/evaluation/                  Offline evaluation and campaign outputs
data/public/                          Sanitized runtime fixtures and generator config
scripts/                              Setup, data, demo, verification and backup tools
docs/                                 Architecture, status, runbooks and workflows
docs/verification/                    Sanitized actual check results and manifests
docs/screenshots/pages/               Loaded page captures and result JSON
docs/diagrams/                        Editable Mermaid plus SVG/PNG exports
compose.yaml                          Base local services
compose.supabase.yaml                 Hosted database overlay
compose.azure.yaml                    Azure Blob overlay
compose.training.yaml                 Isolated offline trainer
compose.production.yaml               Production TLS configuration
```

The supplied starter directory was used because the requested ZIP was absent from the workspace. Original inputs were preserved, rather than silently replaced by newly generated data.

Generated account passwords, active provider keys, privileged URLs and storage secrets are deliberately outside this report and outside committed public documentation.

## 5. System architecture

The primary request path is **Users → Next.js Dashboard → FastAPI → Scoped Domain/AI Services → Persisted Results → Dashboard**.

The browser uses a same-origin `/api/v1` proxy. FastAPI resolves identity and scope before querying PostgreSQL or invoking a domain service. Celery workers use the same application services and restore the initiating actor's scope. The AI provider is called through the server adapter; it does not receive database credentials or unrestricted backend access.

![System workflow](docs/diagrams/greenops-workflow.png)

[Editable overview Mermaid](docs/diagrams/greenops-workflow.mmd) · [Overview SVG](docs/diagrams/greenops-workflow.svg) · [Detailed technology diagram](docs/diagrams/technology-stack.svg)

### 5.1 Frontend boundary

The frontend handles presentation, selected world/facility state, forms, charts, evidence links, job progress and conversation interaction. The backend remains authoritative for permission decisions, numeric results, write validation and job success.

### 5.2 API and domain boundary

FastAPI applies authentication, allowed-Origin/CSRF checks, organization/facility/world/zone grants, role permissions, record ownership and optimistic versions. Domain services expose explicit CRUD and calculations. Arbitrary table mutation is not granted merely because a generic route exists.

### 5.3 Persistence boundary

PostgreSQL holds canonical observations, ledgers, configurations, actions, simulations, model metadata, conversations, tool results, usage, reports, files, jobs and audits. FORCE RLS and relational scope constraints supplement API checks.

### 5.4 Asynchronous boundary

Requests that require background work commit a job and outbox record first. The scheduler dispatches committed work through Redis. Workers claim leases, restore authorized identity and persist actual outcomes. Duplicate deliveries are checked for idempotency.

### 5.5 Object boundary

Storage keys include application and operating scope. A download passes through the authenticated file API, which rechecks database scope and verifies SHA256. Azure account keys and direct public blob links are not supplied to browsers.

### 5.6 Offline boundary

Private labels and hidden injected-event configuration remain in offline research/evaluation. Runtime receives public allowlisted observations, sanitized facility configuration and checksum-trusted serving artifacts. Agents cannot inspect private truth.

## 6. Completed milestones M0–M10

The milestone names below follow the implementation contract. Detailed exit evidence remains in [docs/build-status.md](docs/build-status.md).

| Milestone | Status | Completed deliverables and exit behavior |
|---|---|---|
| **M0 — Inspect and scaffold** | Passed | Inspected supplied starter and specification; preserved originals; created monorepo, Next.js/Python dependency locks, Compose and environment template; built images and booted fresh volumes; dependency readiness reflected actual services. |
| **M1 — Data and security** | Passed | Implemented schema, migrations, restricted runtime role, FORCE RLS, sessions, CSRF, worlds, virtual clock, canonical observations, importer and quality quarantine; checked exact base/stress counts, repeat imports and populated isolation. |
| **M2 — Operations and resource views** | Passed | Added persisted facility/configuration CRUD, aggregate occupancy/OPD context, resource series, comparisons, coverage and evidence; API totals matched source SQL and interval units. |
| **M3 — ML and risk workflow** | Passed | Integrated six trusted forecast bundles and generic detector; preserved feature contracts and ML pins; implemented registry/evaluation, fallback, model disable/restore, contextual rules and evidence; isolated training and reload checks passed. |
| **M4 — Simulation and actions** | Passed | Added thirteen interventions, deterministic 15-minute engine, 1–72-hour horizons, sensitivity, frozen-baseline comparisons, protected reserves, priority allocation and action state machine; numerical/permission fixtures passed. |
| **M5 — Full domain data and pages** | Passed | Delivered persisted functionality across all twelve contract modules; generated independent extended-world category waste, assets/dependencies, reserves, environment, parking and incidents; checked balances and persistence. |
| **M6 — Grounded chatbot** | Passed | Implemented provider adapter, nineteen scoped tools, frozen snapshots, conversations, results/usage persistence, numeric/citation checks and SSE replay/cancel; actual provider text, tools, streaming and parallel reads passed. |
| **M7 — Agent reactions** | Passed | Added investigation/monitor modes, observable triggers, opt-in versioned policy, cooldown, budgets, permitted writes, retry and recovery; demonstrated evidence → scenario → proposal → administrator-reviewed task. |
| **M8 — Reporting and admin** | Passed | Generated actual CSV/HTML/PDF artifacts; added scoped checksum-verified downloads, policy/tariff/factor/document/model administration and explicit production identity provisioning. |
| **M9 — Verification and operations** | Passed | Completed backend/starter/browser checks, failure recovery, runtime boundary checks, fresh-service restore, migration cycling, demo reset, Redis outage recovery and local performance checks. |
| **M10 — Handoff** | Passed | Delivered README, architecture, runbooks, seed/generate/train/evaluate/infer/check-llm commands, backup/restore, HTTP demo, OpenAPI contracts, screenshots, verification manifests and TLS deployment configuration. |

The initial local milestone verification used PostgreSQL 18 and MinIO. Later cloud verification used Supabase PostgreSQL 17.11, Azure Blob Storage and Alembic revision 0006. These are distinct recorded environments.

## 7. Users, grants and permissions

There are seven demo roles. Each authenticates against a real account and password hash. The login-page shortcuts request normal sessions; they do not bypass authorization.

Effective access is the intersection of **organization membership, facility grants, zone grants, selected world, virtual cutoff, role, ownership and operation-specific checks**. A role title does not grant access to an ungranted facility.

### 7.1 Organization administrator

The organization administrator operates within its organization and explicitly granted facilities. It can administer facility configuration, policies, imports and model serving; perform permitted operational CRUD; approve action proposals and assign eligible owners; and independently review actions when eligible.

This role has no universal bypass of facility/zone grants or RLS.

### 7.2 Hospital administrator

The hospital administrator has the same implemented domain permission set as the organization administrator, restricted by its hospital/facility grants. It manages local configuration, operating ledgers, policies, model settings, imports, proposals and reviewed actions.

The difference in effective scope comes from membership and explicit grants, rather than an invented separate permission implementation.

### 7.3 Operations supervisor

The supervisor can perform permitted assets/maintenance, waste, environment, parking and safety operations; work with actions, simulations and reports; and independently verify/close actions when it is not the resolver. It cannot approve proposals or perform facility/policy/model/import administration.

### 7.4 Maintenance technician

The technician's demo grant is **WARD_A**. It can create permitted zone assets, create self-assigned maintenance orders and maintenance actions, and make ownership-bound updates. It cannot run new what-if simulations, generate reports or independently verify/close actions. Its chatbot tools remain constrained by its actual zone and role.

### 7.5 Waste officer

The waste officer can manage permitted bins, batches and pickup workflows; create waste-category actions; progress owned actions; and run what-if simulations. It cannot generate reports, approve proposals, administer facility settings or independently verify/close actions.

Its facility-wide demo read grant allows authorized operating context beyond waste; domain writes remain narrow.

### 7.6 Sustainability officer

The sustainability officer manages versioned tariffs/emission factors, creates sustainability-category actions, progresses owned actions and generates simulations/reports. It cannot administer facility/policy/model/import settings, approve proposals or independently verify/close actions.

### 7.7 Auditor

The auditor reads granted operating evidence and saved results, downloads authorized files, generates reports and uses ask-mode grounded chat. It cannot perform operating CRUD, create actions/proposals, run new simulations or use investigation mode.

### 7.8 Permission matrix

“Yes” always means within explicit grants and subject to additional evidence, ownership and version checks.

| Capability | Org admin | Hospital admin | Supervisor | Technician | Waste officer | Sustainability | Auditor |
|---|---|---|---|---|---|---|---|
| Scoped operational reads | Yes | Yes | Yes | Granted zones | Yes | Yes | Yes |
| Facility/policy/import/model admin | Yes | Yes | No | No | No | No | No |
| Assets/maintenance CRUD | Yes | Yes | Yes | Zone/owner limited | No | No | No |
| Waste CRUD | Yes | Yes | Yes | No | Yes | No | No |
| Environment/parking/safety CRUD | Yes | Yes | Yes | No | No | No | No |
| Tariff/factor versions | Yes | Yes | No | No | No | Yes | No |
| New simulations | Yes | Yes | Yes | No | Yes | Yes | No |
| Generate reports | Yes | Yes | Yes | No | No | Yes | Yes |
| Ask-mode chatbot | Yes | Yes | Yes | Zone limited | Yes | Yes | Yes |
| Investigate/draft | Yes | Yes | Yes | Tools constrained | Yes | Yes | No |
| Create actions | Yes | Yes | Yes | Maintenance/self | Waste only | Sustainability only | No |
| Approve proposals | Yes | Yes | No | No | No | No | No |
| Independent verify/close | Yes | Yes | Yes | No | No | No | No |
| Inspect other users' runs/jobs | Within scope | Within scope | No | No | No | No | No |

Conversation, run, tool and job records are owner-private for ordinary users. Within-scope administrators can inspect authorized users' records. The monitoring service principal is separate from the seven jury logins and remains subject to policy/grants.

[Separate seven-role diagram](docs/diagrams/user-scopes.svg) · [Detailed scope documentation and source links](docs/techstack-and-scopes.md)

## 8. Synthetic data, worlds and clock

### 8.1 Preserved starter foundation

The original synthetic observations and ML foundation were preserved under the research boundary. Runtime fixtures are prepared from an explicit public allowlist linked to checksums. Hidden injected events are removed from runtime facility configuration.

The importer preserves interval semantics, zone encodings and model feature contracts. Quality errors are recorded without silently replacing missing values or inventing data.

### 8.2 Independent worlds

| World | Source rows / zone-hours | Purpose |
|---|---:|---|
| `base_v1` | 17,280 | Supplied base observations and evaluation context |
| `stress_v1` | 8,640 | Supplied shifted/stress observations, kept independent |
| `extended_v1` | 25,920 | Identified additional synthetic data for missing operating domains |
| **Total** | **51,840** | Across the three independent operating worlds |

The recorded database contains **362,880 normalized observations**. The extended world covers six zones over 180 days. It is additional synthetic operating data, not a claim that the original starter contained those domain records.

Separate world identity is carried through observations, configurations, actions, simulations, agent snapshots, reports and files. The system does not substitute base data when stress data is missing.

### 8.3 Missing-domain generation

The extended generator supplies category waste, movement/pickup/handover metadata, assets and telemetry, dependencies, tank/power reserves, environment readings, parking balances and operational incidents. Source types distinguish these records from imported observations.

Category waste is a separate synthetic ledger. It is not reverse-engineered from the starter's aggregate waste stream.

### 8.4 Missingness and quarantine

Water nulls remain null. A valid energy field is retained even if a different field in the row is invalid. Seventeen invalid stress fill metrics were quarantined without dropping valid source rows. Conflicting canonical world/zone/time records are rejected or recorded as conflicts rather than merged invisibly.

Coverage communicates expected intervals, available samples and valid readings. Missing consumption does not become zero consumption.

### 8.5 Interval units

Hourly readings represent intervals ending at their timestamps. Energy consumption is **kWh per hourly interval**; water consumption is **litres per hourly interval**; power is **kW**; reserves are **litres**; waste mass is **kg**. Consumption sums across disjoint zones; state fields use declared latest/sample-mean semantics.

Occupied inpatient bed-days exclude non-inpatient zones. OPD activity is reported separately. These are aggregate operating measures with no patient identities.

### 8.6 Virtual versus system time

The virtual clock controls observation cutoffs, incident ages, deadlines, risk evaluation and demonstration replay. Administrators can operate the demo clock within authorized worlds.

System time controls session expiry, audit timestamps, scheduling and job leases. Advancing a synthetic operating world does not extend a login session or fabricate an audit timestamp.

### 8.7 Additional offline campaign

A separate two-facility campaign smoke produced **1,152 rows**. Its private truth remains offline. The optional full **630,720-row** campaign has a generation command but was not run and is not counted in the operating database totals.

## 9. Completed operational modules

The implementation contract defines twelve product modules. The dashboard exposes these through eighteen operating, intelligence and management pages.

### 9.1 Facility operations and aggregate context

Facility functionality includes buildings, floors, zones, zone capacities, operating schedules and aggregate snapshots. Permitted administrators create/update persisted configuration through typed contracts. Zone setup supports source encoding and grant resolution.

Aggregate occupancy and OPD context support resource interpretation. The application does not create patient records, clinical encounters or treatment decisions.

### 9.2 Energy

Energy views display interval consumption, time series, comparisons, coverage, operating context and supported experimental forecasts. Values originate from scoped stored observations. The UI separates energy quantities from power and makes unsupported target aggregation unavailable rather than deriving invented totals.

Resource analysis can inform deterministic outage scenarios and illustrative accounting, with the relevant source/factor boundary exposed.

### 9.3 Water and usable reserves

Water views show measured interval consumption and gaps. Potable, process and protected fire reserves are separate engineering records. The reserve service exposes configuration, actual synthetic state and assumptions used by scenario calculations.

Protected fire storage cannot supply routine water demand in the engine. A demand shortfall is reported explicitly.

### 9.4 Waste operations

Waste functionality includes category-specific bins, batches, stock movements, pickups and synthetic handover evidence metadata. Categories include yellow, red, white and blue. Stock/age/fill and pickup deadlines are calculated from authorized ledger data.

Category totals include every positive scoped movement balance even when batch detail is limited. The oldest twenty batch details shown to tools do not cap aggregate stock. Unknown batch age remains unknown. Thresholds are configurable internal demo policy, not asserted legal limits.

### 9.5 Assets and maintenance

Assets include pumps, HVAC, meters, gensets, batteries, bins and gates. Typed modes include operational, degraded, offline and inspection. The system persists dependencies, telemetry and inspection/repair/preventive orders.

Write services enforce zone grants and ownership restrictions. Telemetry indicates recorded conditions; it does not establish an unobserved fault cause. Follow-up can be assigned through an audited maintenance action.

### 9.6 Environment

Environment records expose temperature, humidity, particulate concentration and CO₂ with units and configured thresholds. Views show latest authorized readings and policy context.

Threshold flags are operational evidence. The product does not turn synthetic indoor readings into clinical outcome claims.

### 9.7 Traffic and parking

Parking functionality records areas, arrivals/exits, occupancy, capacity, queue and protected access routes. Balances are derived from persisted synthetic events/snapshots. Unadmitted arrivals remain queued rather than disappearing.

Scenario outputs report capacity/queue effects and rejected arrivals. Access-route risk is a recorded operational condition requiring inspection, not autonomous gate control.

### 9.8 Safety incidents

Safety records capture structured operational incidents. The dashboard reports a thirty-day incident count with observed zone-hours and incidents per thousand zone-hours.

The denominator is visible. This is not a patient safety outcome measure or evidence of comparable real-hospital incident rates.

### 9.9 Resilience and what-if analysis

Resilience spans backup power, battery/fuel, pump dependencies, usable tanks, essential demand, waste deadlines and access capacity. The What-if Studio persists scenario requests/results and makes assumptions, violated limits and modeled deltas inspectable.

### 9.10 Sustainability and cost

Sustainability summaries calculate permitted consumption-based cost, carbon and intensity using versioned factor records. The demonstration uses explicitly illustrative factors, including INR 8/kWh and 0.7 kgCO₂e/kWh.

Periods that cross a factor change require segmentation; unsupported cross-version totals are unavailable. Missing consumption coverage remains part of the result. Modeled scenario savings are not reported as measured operational savings.

### 9.11 Actions and task workflow

The Action Centre supports reviewable proposals, eligible owner assignment, scoped action categories, due dates, reasons, evidence, optimistic versions and lifecycle history. Permission checks apply to both HTTP and agent-initiated changes.

### 9.12 Reports, AI and operational governance

Reports preserve a frozen scope/time/factor boundary. AI conversations use scoped evidence and persisted tools. Management pages expose import quality, model evaluation and versioned operating/agent policies.

Together these capabilities connect observation, interpretation, analysis, reviewed work and evidence export.

## 10. Dashboard pages and frontend behavior

| Route | Page | Implemented purpose |
|---|---|---|
| `/overview` | Overview | Metrics, reserves, context, risks and outstanding work |
| `/facility` | Facility operations | Buildings, floors, zones, capacities, schedules and snapshots |
| `/energy` | Energy | Interval series, coverage, context and forecasts |
| `/water` | Water and reserves | Consumption, null coverage and reserve states |
| `/waste` | Waste operations | Category balances, batches, pickups and handover evidence |
| `/environment` | Environment | Latest readings and threshold context |
| `/assets` | Assets and maintenance | Register, dependencies, telemetry and assigned orders |
| `/parking` | Traffic and parking | Occupancy, capacity, queues and access-route risk |
| `/safety` | Safety incidents | Incident records and denominator-aware rates |
| `/simulations` | What-if Studio | Scenario inputs, jobs, saved results and comparisons |
| `/sustainability` | Sustainability and cost | Factor-based estimates and inpatient intensity |
| `/actions` | Action Centre | Proposals, assignment, transitions and independent review |
| `/reports` | Reports | Persisted briefs and actual artifact downloads |
| `/chat` | Chatbot | Grounded conversation, tools, evidence and progress |
| `/agent` | Agent activity | Runs, tools, monitoring and failure inspection |
| `/imports` | Import quality | Public CSV imports, jobs and quality events |
| `/models` | Model evaluation | Serving state, evaluation and experimental limitations |
| `/settings` | Policy and settings | Versioned policies and permitted administration |

Sign-in is an additional view. Mobile overview is an additional responsive capture of the product.

The shared shell provides facility/world selection, role identity, sign-out, virtual clock, date presets, explicit UTC start/end filters and Refresh. Empty/loading/error states are represented explicitly. Forms derive their fields from authenticated domain contracts.

Account switching clears cached operating scope. Global Refresh now reaches saved simulations, actions/proposals and conversations without discarding the current scenario or conversation. This behavior was fixed after the stricter page checker exposed stale child lists.

The proxy permits a configurable longer upstream wait for remote snapshot capture; the recorded cloud fix uses 180 seconds. Non-JSON proxy failures are converted to explicit errors for the UI. Provider execution/retry budgets remain independent of this proxy timeout.

## 11. Database, migrations and RLS

The schema comprises 72 concrete SQLAlchemy tables. Identity tables are separated from world-bound operational records. Shared typed ledger columns and validated JSONB accommodate domain payloads while retaining relational scope, versions and ownership.

Composite foreign keys bind organization, facility, world and relevant parents. Canonical observation constraints prevent conflicting world/zone/time records from silently coexisting.

| Migration | Delivered role |
|---|---|
| `0001_core.py` | Core schema and initial identity/operational structures |
| `0002_rls_plan.py` | Scoped RLS/security evolution |
| `0003_worker_dispatch.py` | Narrow background dispatch support |
| `0004_write_permissions.py` | Database-side write permission policies |
| `0005_event_identity.py` | Event/identity policy evolution |
| `0006_static_catalog_rls.py` | Read-only static catalog access under hosted automatic RLS |

The runtime login is restricted: non-superuser, NOBYPASSRLS and without database/role creation privileges. The migrator owns schema changes and has the separate privileges required for bootstrap/migration/restore. Its connection is absent from normal API/worker/scheduler environments.

Identity settings use transaction-local PostgreSQL configuration. They reset when a transaction completes, preventing pooled connections from retaining another user's tenant identity.

FORCE RLS applies to scoped operational tables. Read and write policies are distinct. Service checks for ownership, category, zone, versions and workflow evidence operate alongside database policy enforcement.

Migration 0006 grants runtime read-only access to static migration/metric catalogs where hosting automatically enables RLS. It does not replace tenant isolation with unrestricted operational policies.

## 12. Domain APIs and CRUD

API routes use the `/api/v1` prefix. Most operational calls carry the selected `world_id`; identity and grant resolution remain server-side. The complete contract is generated in [packages/contracts/openapi.json](packages/contracts/openapi.json).

| API family | Representative implemented endpoints | Function |
|---|---|---|
| Authentication | `/auth/login`, `/auth/logout`, `/auth/demo-accounts`, `/auth/demo-login`, `/me` | Real identity and session management |
| Authorized selection | `/organizations`, `/facilities`, `/worlds` | Scope-limited available context |
| Clock | `/demo/clock`, `/demo/replay` | Demo-only authorized operating time |
| Metrics | `/metric-catalog`, `/overview`, `/metrics/series`, `/metrics/comparison` | Units, aggregates, series and comparisons |
| Operating state | `/operational-snapshots`, `/reserves`, `/assets/state`, `/waste/state` | Domain state and engineering context |
| Other domains | `/environment/state`, `/parking/state`, `/safety/state`, `/sustainability` | Domain-specific calculations |
| Typed ledgers | `/contracts`, `/records/{table}`, `/records/{table}/{record_id}` | Validated list/create/update/delete where permitted |
| Quality/import | `/quality-events`, `/imports`, `/imports/csv`, `/imports/{record_id}` | Public imports and quality evidence |
| Models/forecasts | `/models`, `/models/{model_id}/evaluation`, `/models/{record_id}/status`, `/forecasts` | Evaluation, serving and inference |
| Simulation | `/simulations`, `/simulations/compare`, `/simulations/{record_id}` | Durable scenario execution and saved comparisons |
| Actions | `/actions`, `/actions/{record_id}/transition`, `/owners` | Permitted work and eligible assignment |
| Proposal review | `/action-proposals/{record_id}/approve` | Administrator approval of reviewed proposals |
| Chat | `/conversations`, `/conversations/{record_id}/messages` | Persisted conversations and submitted requests |
| Agent | `/agent-runs`, `/agent-runs/{record_id}`, `/cancel`, `/events` under a run | Investigation, cancellation and replayable SSE |
| Jobs | `/jobs/{record_id}`, `/jobs/{record_id}/retry` | Actual asynchronous state and bounded retry |
| Reports/files | `/reports`, `/reports/{record_id}`, `/files`, `/files/{record_id}/download` | Artifact generation, evidence and downloads |
| Evidence | `/evidence/{record_id}`, `/alerts/{record_id}/evidence` | Scoped supporting records |

Some collection endpoints are registered from explicit aliases. Generic ledger access is constrained by table allowlists, typed Pydantic contracts and domain permissions. It is not arbitrary SQL access.

Pagination/query bounds prevent unrestricted retrieval. Numeric types and allowed fields are validated; malformed or extra tool/write arguments are rejected. Stale optimistic versions return a conflict rather than overwriting newer state.

HTTP success is sent after transaction commit. An accepted asynchronous request is not described as completed until the job has a successful persisted outcome.

Generated frontend types include action, transition and scenario request contracts. Dynamic record editors fetch the same authenticated domain schemas used by backend services.

## 13. ML foundation and model lifecycle

### 13.1 Completed model serving

The runtime serves six lead-specific forecast bundles: energy and water at **1, 6 and 24 hours**. A generic IsolationForest detector is also integrated. Original feature contracts and supplied dependency pins were preserved.

Serving artifacts are checksum trusted. There is no arbitrary uploaded joblib execution path. Runtime inference uses only authorized public operating inputs.

### 13.2 Evaluation and research outputs

Actual isolated offline training produced six models with versioned artifacts, split manifests, predictions, per-zone errors, baseline comparisons and contextual detection evidence. Chronological split/purge and exact reloaded-prediction checks passed.

Evaluation artifacts are stored under [research/evaluation](research/evaluation), including the recorded `container-training-v1` run. Private labels remain in this offline context.

### 13.3 Forecast contracts

The product exposes the supported lead points rather than pretending they define a full trajectory. It does not infer a daily total from three forecast points. Missing history, unsupported horizons and seasonal fallback are identified.

Extended-world serving can use a stated seasonal baseline fallback. A model serving policy change participates in the inference identity so that new settings do not silently overwrite historical forecast evidence.

### 13.4 Risk workflow

Deterministic rules and contextual quality/persistence checks supplement the generic detector. Risks refer to observable operating conditions and supporting records. Alerts are persisted/deduplicated and remain world/time scoped.

This separation allows engineering risks and reports to work when the LLM is unavailable.

### 13.5 Model administration

Eligible administrators can disable a supplied model or restore experimental serving with a reason and current version. Historical forecasts remain immutable. The interface cannot promote a synthetic-only model to validated real-hospital status.

### 13.6 Honest findings

The energy model loses to a weekly baseline under stress/shift. The generic detector has weak precision/recall. Models are experimental and synthetic-only. These limitations are exposed in the product and retained in the handoff, rather than presented as proven hospital accuracy.

## 14. Deterministic what-if simulations

### 14.1 Engine contract

The engine advances in **15-minute steps** for horizons of **1–72 hours**. It consumes a frozen authorized baseline containing current operating state, engineering demand, capacities, reserve configuration and relevant versions.

It is deterministic for identical inputs. Saved scenario comparisons require the same frozen baseline and horizon. A changed operating state requires a new baseline rather than an invisible comparison substitution.

### 14.2 Implemented interventions

| Intervention | Modeled effect |
|---|---|
| `grid_outage` | Loss of grid supply during the event window |
| `pump_failure` | Loss of pumping availability |
| `supply_interruption` | Interrupted incoming water supply |
| `occupancy_surge` | Increased modeled operating demand |
| `opd_surge` | Increased activity-related demand |
| `heat_increase` | Temperature-related demand adjustment |
| `water_leak` | Added water drain |
| `excess_energy` | Added energy load |
| `delayed_pickup` | Later waste collection timing |
| `earlier_pickup` | Earlier modeled waste collection |
| `schedule_change` | Demand adjustment from schedule changes |
| `asset_restoration` | Restored selected grid/pump availability |
| `rainfall` | Rainfall-related modeled operating effects |

Typed inputs constrain event timing, duration, magnitude and target. The engine rejects invalid values rather than producing unchecked calculations.

### 14.3 Balances and constraints

The simulation tracks usable water, inflow, served demand, unmet demand, overflow/spill, battery energy, generator output, fuel, grid consumption and parking/queue quantities. Essential power is prioritized ahead of pump/nonessential demand according to the implemented allocation rules.

Protected fire storage is excluded from routine demand. Waste service deadlines consider fill and known age; unknown age is not fabricated. Violated constraints and unmet essential demand are explicit result fields.

### 14.4 Sensitivity and modeled deltas

Low, central and high demand paths communicate sensitivity. They are not statistical confidence intervals. Changes in cost, carbon or service shortfall are modeled comparisons under the stated inputs, not measured savings or a claim of real equipment operation.

### 14.5 Verification

Five numerical fixtures and the unknown waste-age case passed. Performance evidence measured the 72-hour engine separately from queue/HTTP dispatch. The browser workflow saved two scenarios, compared them and downloaded actual report artifacts.

## 15. Grounded chatbot and provider integration

### 15.1 Server-side adapter

The OpenAI-compatible adapter reads endpoint, key, model and capability settings from the server environment. The verified configuration used an Azure deployment named `gpt-6-luna`. That is the deployment checked in the supplied environment, not an assertion that every provider exposes the same model or behavior.

Actual capability checks verified text generation, a declared read tool, matching tool results, a final answer, streaming chunks and multiple parallel read calls. [Provider evidence](docs/verification/cloud-provider.json) records the outcome.

### 15.2 Parameter compatibility

The verified configuration uses `max_completion_tokens` and `reasoning_effort=none`. It does not send `temperature` or `max_tokens`. Streaming, parallel calls, strict schema and token-limit parameter support are configurable for other providers and must be checked for the selected deployment.

The product does not verify compatibility solely from a model name. The `check-llm` command performs actual calls.

### 15.3 Grounded conversation flow

1. The authenticated user submits a request in the selected world.
2. The server checks role and mode, creates the run/job and captures authorized snapshots.
3. The provider receives permitted typed tool definitions and the bounded operating context.
4. Arguments are validated against strict schemas.
5. Reads use frozen evidence; permitted mutations recheck current authorization/policy/version.
6. Tool calls, results, usage and ordered events are persisted.
7. Numeric/rounding/citation checks evaluate the proposed answer.
8. Unsupported output is withheld or reported honestly.
9. The final grounded answer and evidence links are returned through the persisted conversation.

### 15.4 Streaming and parallel execution

Provider streaming is supported server-side. Tool progress and lifecycle events reach the UI through reconnectable SSE with ordered replay. Final answer text is released after grounding checks rather than streamed as unchecked factual claims.

Parallel read calls are supported. Authorized mutations execute sequentially with transactional checks. No hidden reasoning is persisted.

### 15.5 Source documents

Operating documents are scoped and searched using PostgreSQL full-text retrieval over frozen authorized chunk IDs. Document content is treated as untrusted data. A document cannot grant a user permission, authorize a tool or override system policy.

### 15.6 Evidence and limitations

Tool envelopes communicate source type, operating scope, world, cutoff, units, coverage, limitations and evidence IDs. The recorded fifteen-question campaign completed grounded responses across operational domains, and 250 distinct authorized evidence URLs returned HTTP 200.

An actual permitted input change changed a refreshed answer; the source was restored afterward. Grounding checks are conservative and do not prove every natural-language assertion.

## 16. Nineteen scoped agent tools

The agent has explicit domain tools rather than SQL, shell, filesystem or arbitrary HTTP access. Available tools vary with role, mode, requested writes and current policy.

| Tool | Authorized purpose |
|---|---|
| `get_facility_snapshot` | Current facility state, clock, capacity, coverage and risks |
| `list_data_catalog` | Available metrics, units, datasets and domains |
| `query_metric_series` | Bounded allowlisted measured series at the pinned cutoff |
| `get_operational_context` | Aggregate occupancy, OPD and schedules |
| `get_assets_and_dependencies` | Assets, telemetry, maintenance and resource dependencies |
| `get_resource_reserves` | Tanks, power resources, assumptions and quality |
| `get_waste_state` | Category balances, age, pickup/handover evidence and policy |
| `get_environment_state` | Indoor/outdoor readings and threshold context |
| `get_parking_and_safety` | Parking balances, queues and denominator-aware incidents |
| `get_forecasts` | Supported forecast points and experimental limitations |
| `get_alert_evidence` | Persisted alert context and supporting evidence |
| `get_actions` | Authorized work, owners, due dates, states and evidence |
| `get_sustainability_summary` | Versioned cost/carbon/intensity estimates and boundaries |
| `search_operating_documents` | Search bounded authorized document evidence |
| `run_what_if` | Save a typed deterministic scenario using a frozen baseline |
| `compare_scenarios` | Compare two to five compatible saved scenarios |
| `draft_action_plan` | Persist a reviewable proposal without assignment |
| `create_action` | Create a permitted software action after current scope/policy checks |
| `transition_action` | Perform an allowed action transition with version/evidence checks |

Auditors lose simulation/draft/action mutation tools. Technicians cannot run what-if tools. Ask mode excludes proposal drafting. Investigation/monitor modes do not expose action-transition execution. Action creation/transition requires explicit eligible write conditions; simply mentioning a desired action in untrusted content does not authorize it.

## 17. Investigation, monitoring and permitted actions

### 17.1 Investigation mode

An authorized investigation freezes operating context, reads relevant domains, interprets observable evidence, can execute an eligible scenario and can save a proposal. Its result is inspectable through persisted run/tool/job records.

An investigation does not secretly expand facility or zone access. The actor's role/grants continue to apply to every tool.

### 17.2 Opt-in monitoring

Monitoring is disabled by default. A versioned facility policy controls triggering, categories/severities, cooldown, budgets and eligible owners. The scheduler evaluates observable high/critical risks and overdue work within authorized scope.

Policies that share a virtual timestamp are deterministically selected with creation-time ordering. Cooldown fixtures isolate virtual-clock changes so repeat tests do not affect unrelated cases.

### 17.3 Autonomous software action conditions

Autonomous task creation requires the server flag `AGENT_AUTONOMOUS_WRITES_ENABLED=true` and an enabling current facility policy. The runtime additionally rechecks current incident eligibility, category/severity, owner grants, duplicates and daily limits.

Advisory-locked daily caps prevent concurrent runs from exceeding policy. Provider/run/tool/time budgets and bounded retries limit execution. Without these conditions the workflow remains investigation/proposal rather than unauthorized task creation.

### 17.4 Completed end-to-end proof

The live HTTP demonstration completed waste evidence → saved six-hour scenario → proposal → administrator review → permitted assigned action. A separate action lifecycle reached closed with independent review.

Mock checks also covered risk triggers, duplicate prevention, malformed arguments, unsupported tools, malicious document content, provider timeout and rate limit. These deterministic checks are distinguished from actual configured-provider evidence.

## 18. Action lifecycle and independent review

The persisted normal progression is:

**open → acknowledged → in_progress → resolved → verified → closed**

Controlled return paths support returning in-progress work to acknowledged, returning resolved/verified work to in-progress, and reopening a closed action. Every transition must be valid from the current state.

Creation checks include a permitted domain/category, granted zone, eligible owner, timezone-aware due date and valid linked alert/scenario when supplied. Creation idempotency keys prevent duplicate effects.

Updates require the current optimistic version. Ordinary operational users can progress owned work; supervisors/admins have the implemented supervisory authority within scope. Waste, maintenance and sustainability action categories remain role limited.

Verification and closure require an eligible reviewer role and evidence note or authorized file. Verification rejects the user who recorded resolution, enforcing an independent reviewer. Events and audit records preserve before/after state, actor, reason and version.

Proposal approval is reserved for the two administrator roles. Supervisors can independently verify actions but cannot approve proposals. Approval checks and action creation share the domain authorization services.

Task creation, acknowledgement or a favorable simulated result is not labeled proof that an operational problem was fixed. Resolution and verification remain separate evidence-bearing workflow steps.

## 19. Durable jobs and failure recovery

Jobs cover imports, inference, simulations, reports and agent execution. PostgreSQL stores durable job/outbox records; Redis carries dispatch messages; Celery performs execution.

The acceptance transaction commits before returning success. Workers claim a lease, restore initiating scope and enforce retry/idempotency conditions. A run lease prevents concurrent execution of the same agent run.

Redis outage does not erase accepted requests. Readiness reports the failed dependency; committed work remains pending. Scheduler dispatch and explicit reconciliation recover eligible pending/expired work after services return.

Provider timeout/rate limit can enter a visible `waiting_provider` state with bounded deferred retry. Exhausted attempts become failure. An eligible owner/admin can retry a failed job using its original snapshot; a newly submitted request captures new state.

Cancellation is checked before tools. It prevents future work but does not undo a transaction already committed. SSE polling uses short separate transactions and persists ordered events for reconnect/replay.

Actual Redis outage recovery was verified: readiness returned 503, a durable request was accepted, and the job completed after Redis recovered. [Recovery evidence](docs/verification/redis-recovery.json).

## 20. Reports, exports and evidence storage

### 20.1 Report generation

Deterministic reports use frozen authorized facts, coverage, configuration/factor versions and explicit limitations. CSV, printable HTML and server-rendered PDF outputs are actual generated files.

Reports and their accounting do not require an LLM. Provider-enabled narrative assistance remains subject to the same source/grounding boundary.

### 20.2 Artifact persistence

Stored-file metadata lives in PostgreSQL and references immutable content addressed/checksummed storage keys. Object scope includes organization, facility and world. Downloads reauthorize the stored-file record and verify content SHA256.

Report views expose the three download formats. Evidence can also be attached to reviewed actions through authorized file references.

### 20.3 Azure Blob and MinIO alternatives

The active follow-up uses a private Azure container with a non-empty `hospital-greenops/` application prefix. Enumeration/backup filters that prefix and does not copy unrelated application objects in the same container.

MinIO remains the reproducible local S3-compatible option. Changing the provider does not silently migrate existing objects; retaining them requires explicit backup/restore.

### 20.4 Verified bytes and denial

Artifact tests checked actual upload/download bytes and hashes, and cross-world access denial. Browser flows downloaded CSV/HTML/PDF successfully. A real local restore checked twelve artifact hashes alongside restored database counts.

## 21. Supabase and Azure follow-up

After the local milestone build, the application was configured and checked with hosted database and object storage while web/API remained local.

| Follow-up | Completed behavior |
|---|---|
| Supabase role provisioning | Generated/preserved a restricted runtime role and verified login |
| Connection modes | Transaction pooler for runtime, separate session connection for DDL |
| Prepared statements | Disabled automatic prepared statements for transaction pooling |
| TLS | Required for hosted database connectivity |
| Static catalogs | Migration 0006 read-only catalog policy adaptation |
| Cloud budgets | Configurable statement/connect budgets; recorded statement timeout 10 seconds |
| Seed/generation | Same 51,840 sources and 362,880 observations retained across independent worlds |
| Azure adapter | Private container checks, application prefix, real bytes and checksum verification |
| Storage isolation | Cross-world downloads denied; unrelated app prefix not enumerated |
| Jury entrance | Seven allowlisted real-account buttons, normal sessions and secure switching |
| Provider | Actual text/tool/streaming/parallel-read capability check passed again |
| Cloud frontend fixes | Longer proxy budget and explicit non-JSON error handling |
| Refresh fixes | Saved simulation/action/proposal/conversation lists reload correctly |

The configuration integrates GreenOps-specific values. Unrelated MediKiosk, clinical, speech or OCR settings were not turned into GreenOps product features. Storage credentials and AI credentials remain distinct server-side concerns.

[Cloud setup and switching instructions](docs/cloud-services.md)

## 22. Security and runtime boundaries

| Boundary | Implemented protection |
|---|---|
| Identity | Argon2 passwords and hashed opaque sessions |
| Browser session | HttpOnly/SameSite session cookies and CSRF token checks |
| Browser writes | Allowed-Origin checks alongside authentication/CSRF |
| Organization/facility/zone | Explicit grants and service-level scope resolution |
| Database | Restricted NOBYPASSRLS runtime, FORCE RLS and composite constraints |
| Pool reuse | Transaction-local identity reset |
| Record writes | Typed contracts, table allowlists, ownership and optimistic versions |
| Actions | Category/owner restrictions, valid transitions, evidence and independent review |
| Agents | Role/mode-specific typed tools and current mutation rechecks |
| Documents | Untrusted source treatment; no instruction-driven permission escalation |
| Models | Public fixture checksums and trusted artifacts only |
| Private truth | Offline research excluded from operating containers |
| Files | Scoped metadata authorization and SHA256 verification |
| Azure | Private container and non-empty application prefix |
| Provider/storage secrets | Server-only environment; no client bundle keys |
| Migration credentials | Separate one-shot migration environment |
| Demo shortcuts | Disabled/refused in production |
| Network | Local web/API binds; private infrastructure network in local Compose |

The agent cannot run arbitrary SQL, execute shell commands, read the filesystem, fetch arbitrary HTTP endpoints or operate hospital equipment. Read scope comes from grants, not invented role-specific silos.

The recorded runtime-image check confirmed that research/private labels/hidden facility events were absent. Secret-bearing environment and credential files are ignored and protected locally; public documentation/evidence excludes their values.

## 23. Verification results and evidence

### 23.1 Recorded results

| Check | Recorded outcome | Evidence |
|---|---|---|
| Original local backend suite | 36 passed in 50.72 seconds | [Backend output](docs/verification/backend-tests.txt) |
| Original starter tests | 8 passed | [Starter output](docs/verification/starter-tests.txt) |
| Original complete browser suite | 5 passed in 1.4 minutes; two affected flows later rerun | [Browser output](docs/verification/browser-tests.txt), [affected flows](docs/verification/browser-affected-tests.txt) |
| Cloud full backend rerun | **41 passed in 1,325.92 seconds** | [Cloud backend](docs/verification/cloud-backend-tests.txt) |
| Cloud browser workflows | **7 distinct scenarios passed across recorded runs** | [Run summary](docs/verification/cloud-browser-tests.txt) |
| Loaded page coverage | **20/20 views passed** | [Page output](docs/verification/all-pages-tests.txt), [JSON](docs/screenshots/pages/page-results.json) |
| Page screenshots | **39 PNG captures** | [Screenshot gallery](README.md#screenshots-and-page-verification) |
| Mermaid diagrams | **15 successfully rendered** | [Render output](docs/verification/mermaid-tests.txt) |
| Real provider | Text, tools, results, final response, chunks and multiple parallel reads passed | [Provider result](docs/verification/cloud-provider.json) |
| Agent domain campaign | Fifteen grounded domain questions completed | [Campaign](docs/verification/agent-campaign.json) |
| Evidence links | 250 authorized distinct evidence URLs returned HTTP 200 | [URLs](docs/verification/evidence-urls.json) |
| Input refresh | Actual permitted change affected refreshed answer; original restored | [Refresh](docs/verification/input-refresh.json) |
| Cloud dataset | 51,840 sources; 362,880 observations; revision 0006 | [Database](docs/verification/cloud-database.json) |
| Azure artifacts | Actual bytes, checksum and cross-world denial passed | [Round trip](docs/verification/cloud-artifact-roundtrip.txt) |
| Model serving controls | Disable, baseline fallback and restore checked | [Model policy](docs/verification/model-policy.json) |
| Redis recovery | Dependency failure and durable request recovery checked | [Redis result](docs/verification/redis-recovery.json) |
| Fresh local restore | Counts, twelve artifact hashes, FORCE RLS and revision 0005 checked | [Restore](docs/verification/recovery.txt) |
| Migration cycle | Disposable 0005 → base → 0005 → repeat cycle checked | [Migration cycle](docs/verification/migration-cycle.txt) |
| Demo reset | Clean reset and production refusal checked | [Reset](docs/verification/demo-reset.txt) |
| Production provisioning | Repeated isolated identity provisioning without invented history | [Provisioning](docs/verification/provisioning.json) |
| Runtime boundary | Actual image excluded private truth | [Boundary](docs/verification/runtime-boundary.txt) |
| Dependency readiness | Database, Redis and storage available at recorded final check | [Readiness](docs/verification/cloud-readiness.json) |

### 23.2 Browser scenario scope

The seven distinct cloud browser scenarios cover real-role switching, mobile role picker, world isolation/navigation, waste/maintenance persistence, two simulations/comparison/report downloads, independent action closure/duplicate import, and live provider chat.

These passed across multiple recorded runs, not one uninterrupted seven-test execution. The first five passed before services stopped; action/import passed after restart; chat passed after the proxy fix. The report preserves that distinction.

### 23.3 Failures found and fixed

An initial concurrent cloud backend run encountered a three-second SQL statement timeout. The affected test passed in isolation, and the full isolated suite passed with the configurable cloud statement budget set to ten seconds. This is timeout handling evidence, not a cloud latency benchmark.

The cloud chat flow initially failed because the frontend upstream proxy closed a long snapshot request. Extending its budget to 180 seconds and handling non-JSON errors allowed the actual live chat flow to pass. No replacement answer was fabricated.

Strict page checking found global Refresh missed saved simulations, actions/proposals and conversation lists. The child refresh wiring was corrected; frontend build/type checks and complete page capture passed afterward.

The final native capture replaced a pending SDK response-finished watcher with a completed JSON-body read, removing shutdown warnings. Loading-state captures were replaced after visual inspection.

Initial failure output is retained in [cloud-backend-initial.txt](docs/verification/cloud-backend-initial.txt), [cloud-browser-initial-remaining.txt](docs/verification/cloud-browser-initial-remaining.txt), and [page-refresh-initial.txt](docs/verification/page-refresh-initial.txt).

### 23.4 What the page checks establish

The native checker verifies loaded domain data, actual refresh responses, available record dialogs, chart/model/scenario/conversation content, console errors and mobile horizontal overflow. It captures all eighteen product pages, sign-in and mobile overview.

This complements backend permission/invariant tests and workflow tests. A passing screenshot capture alone is not claimed as exhaustive proof of every possible field, role and transition.

### 23.5 Local performance measurements

Recorded warm local checks used an AMD Ryzen 5 5600H machine with twelve logical CPUs and approximately 15 GiB RAM.

| Operation | Recorded maximum/measurement | Contract target |
|---|---:|---:|
| Overview across measured worlds | 0.439 seconds | Under 2 seconds |
| Bounded metric queries | 0.0151 seconds | Under 3 seconds |
| 72-hour low/central/high engine plus baseline | 0.0185 seconds | Under 5 seconds |

These numbers describe the earlier local PostgreSQL/MinIO environment. They do not establish equivalent remote Supabase performance, throughput under large concurrency or real-hospital operating scale. Queue completion was observed separately from the pure engine measurement.

[Performance details](docs/verification/performance.json)

### 23.6 Evidence integrity

[manifest.json](docs/verification/manifest.json) records the earlier local evidence. [cloud-manifest.json](docs/verification/cloud-manifest.json) records eighty cloud-follow-up evidence, screenshot, diagram and relevant source hashes at its recorded timestamp.

Those are historical manifests. This subsequently authored `Project.md` is not retroactively part of them. Updating documentation does not imply a new backend/provider verification run.

## 24. Screenshots and presentation assets

The captured screenshot set contains nineteen desktop viewport images, nineteen complete-page images and one mobile overview: thirty-nine PNGs. The nineteenth desktop view is sign-in; the other eighteen are product pages.

| View | Desktop capture | Complete-page capture |
|---|---|---|
| Sign-in | [Login](docs/screenshots/pages/login.png) | [Full](docs/screenshots/pages/login-full.png) |
| Overview | [Overview](docs/screenshots/pages/overview.png) | [Full](docs/screenshots/pages/overview-full.png) |
| Facility | [Facility](docs/screenshots/pages/facility.png) | [Full](docs/screenshots/pages/facility-full.png) |
| Energy | [Energy](docs/screenshots/pages/energy.png) | [Full](docs/screenshots/pages/energy-full.png) |
| Water | [Water](docs/screenshots/pages/water.png) | [Full](docs/screenshots/pages/water-full.png) |
| Waste | [Waste](docs/screenshots/pages/waste.png) | [Full](docs/screenshots/pages/waste-full.png) |
| Environment | [Environment](docs/screenshots/pages/environment.png) | [Full](docs/screenshots/pages/environment-full.png) |
| Assets | [Assets](docs/screenshots/pages/assets.png) | [Full](docs/screenshots/pages/assets-full.png) |
| Parking | [Parking](docs/screenshots/pages/parking.png) | [Full](docs/screenshots/pages/parking-full.png) |
| Safety | [Safety](docs/screenshots/pages/safety.png) | [Full](docs/screenshots/pages/safety-full.png) |
| Simulations | [Simulations](docs/screenshots/pages/simulations.png) | [Full](docs/screenshots/pages/simulations-full.png) |
| Sustainability | [Sustainability](docs/screenshots/pages/sustainability.png) | [Full](docs/screenshots/pages/sustainability-full.png) |
| Actions | [Actions](docs/screenshots/pages/actions.png) | [Full](docs/screenshots/pages/actions-full.png) |
| Reports | [Reports](docs/screenshots/pages/reports.png) | [Full](docs/screenshots/pages/reports-full.png) |
| Chat | [Chat](docs/screenshots/pages/chat.png) | [Full](docs/screenshots/pages/chat-full.png) |
| Agent activity | [Agent](docs/screenshots/pages/agent.png) | [Full](docs/screenshots/pages/agent-full.png) |
| Imports | [Imports](docs/screenshots/pages/imports.png) | [Full](docs/screenshots/pages/imports-full.png) |
| Models | [Models](docs/screenshots/pages/models.png) | [Full](docs/screenshots/pages/models-full.png) |
| Settings | [Settings](docs/screenshots/pages/settings.png) | [Full](docs/screenshots/pages/settings-full.png) |

[Mobile overview](docs/screenshots/pages/overview-mobile.png)

![Loaded overview](docs/screenshots/pages/overview.png)

![Loaded what-if studio](docs/screenshots/pages/simulations.png)

![Grounded conversation](docs/screenshots/pages/chat.png)

### 24.1 Completed diagrams

| Diagram | Editable source | Vector | Raster |
|---|---|---|---|
| Overview workflow | [Mermaid](docs/diagrams/greenops-workflow.mmd) | [SVG](docs/diagrams/greenops-workflow.svg) | [PNG](docs/diagrams/greenops-workflow.png) |
| Complete technology stack | [Mermaid](docs/diagrams/technology-stack.mmd) | [SVG](docs/diagrams/technology-stack.svg) | [PNG](docs/diagrams/technology-stack.png) |
| Seven separate user scopes | [Mermaid](docs/diagrams/user-scopes.mmd) | [SVG](docs/diagrams/user-scopes.svg) | [PNG](docs/diagrams/user-scopes.png) |

[docs/workflow.md](docs/workflow.md) includes the expanded authentication, data preparation, model, simulation, chatbot, proposal, action, job and report workflows. [docs/techstack-and-scopes.md](docs/techstack-and-scopes.md) includes the complete stack and permission matrix.

The separate requested Eraser/PPT diagram is not counted as completed here: Eraser's AI generation returned a free-credit exhaustion error. A team-root destination file was created, but no finished Eraser diagram/export had been verified when this report was authored. The completed Mermaid/SVG/PNG assets above remain available.

## 25. Run, seed, generate, infer and check commands

### 25.1 Restart an existing installation

```bash
./scripts/compose.sh up -d
```

Open **http://localhost:3000**. API documentation is **http://localhost:8000/docs**. Dependency readiness is **http://localhost:8000/api/v1/health/ready**.

These are local addresses. The report does not assert the processes are running at the moment it is read; use readiness and container status to confirm current state.

### 25.2 Initialize a fresh local installation

Requires Docker with Compose v2 supporting the supplied override syntax, initial network access, approximately 12 GB free disk and 8 GB RAM. On the verified machine the native Docker socket denied access; the tested rootless Podman wrapper runs the same Compose configuration.

```bash
cp .env.example .env
python3 scripts/init_env.py
python3 scripts/prepare_starter.py --source-dir hospital_greenops_starter
docker compose up --build -d
docker compose exec api python -m app.cli seed-demo --starter /app/data/public/starter
docker compose exec api python -m app.cli generate-world --config /app/data/public/extended-demo.yaml
for world in base_v1 stress_v1 extended_v1; do
  docker compose exec api python -m app.cli infer --world "$world"
done
docker compose exec api python -m app.cli smoke-test
```

If using rootless Podman on this workspace, replace `docker compose` with `./scripts/compose.sh`. The wrapper starts the local API socket when necessary. Seed/generation is explicit and repeatable; initialization preserves existing initialized environment values.

The alternative ZIP import command is supported when the archive exists:

```bash
python3 scripts/prepare_starter.py --archive Hospital_GreenOps_Synthetic_ML_Starter.zip
```

### 25.3 Demo credentials

The real-account demo buttons are available only in demo mode. For manual login, retrieve the generated credential file locally without committing it:

```bash
mkdir -p .local
docker compose exec -T api cat /app/shared/demo-credentials.json > .local/demo-credentials.json
chmod 600 .local/demo-credentials.json
```

Use hospital administrator for configuration and proposal approval, supervisor for eligible independent review, technician for the Ward A scope, and auditor for read/report/ask-mode restrictions.

### 25.4 Enable and verify the provider

Populate server-side values in the ignored `.env`. The following is a template, not credentials:

```dotenv
LLM_ENABLED=true
OPENAI_BASE_URL=https://YOUR-ENDPOINT/openai/v1
OPENAI_API_KEY=YOUR_SERVER_SIDE_KEY
OPENAI_CHAT_MODEL=YOUR_DEPLOYMENT
OPENAI_AGENT_MODEL=YOUR_DEPLOYMENT
LLM_SUPPORTS_TOOLS=true
LLM_SUPPORTS_STREAMING=true
LLM_SUPPORTS_PARALLEL_TOOL_CALLS=true
LLM_TOKEN_LIMIT_PARAMETER=max_completion_tokens
LLM_REASONING_EFFORT=none
```

Set capabilities to match the actual provider. Do not copy this deployment's settings to another provider without checking them.

```bash
docker compose up -d --force-recreate api worker scheduler
docker compose exec api python -m app.cli check-llm
docker compose exec api python -m app.cli agent-evaluate
docker compose exec api python -m app.cli agent-refresh-evaluate
```

Without a working provider, deterministic metrics/CRUD/rules/simulations/reports remain available. Chat exposes configuration/provider failures honestly.

### 25.5 Cloud database and Azure storage

Follow [docs/cloud-services.md](docs/cloud-services.md) for restricted Supabase role provisioning, pooler URLs, TLS and cloud budgets. Administrator/session credentials belong only to the provisioning/migration process.

```dotenv
OBJECT_STORAGE_PROVIDER=azure
AZURE_STORAGE_CONNECTION_STRING=YOUR_SERVER_SIDE_CONNECTION_STRING
AZURE_STORAGE_CONTAINER=YOUR_PRIVATE_CONTAINER
AZURE_STORAGE_PREFIX=hospital-greenops/
AZURE_STORAGE_CREATE_CONTAINER=false
COMPOSE_FILE=compose.yaml:compose.supabase.yaml:compose.azure.yaml
```

With container creation disabled, provision a private container first. The optional account URL/key configuration is also supported. Do not use a public container or supply storage credentials to the frontend.

### 25.6 Run checks

```bash
docker compose exec api pytest -q
docker compose exec web npm run typecheck
docker compose exec web npm run build
docker compose exec web npm run test:e2e
docker compose exec api python -m app.cli verify-checksums
python3 scripts/check_boundary.py
```

The live browser chat test requires the configured real provider. Tests create identifiable validation records in the demo; a clean demonstration can use the documented demo-only reset and reseed process.

### 25.7 Native page capture and diagram checks

```bash
uv run --frozen --project scripts/ui-tests python -m playwright install chromium
uv run --frozen --project scripts/ui-tests python scripts/test_pages.py
uv run --frozen --project scripts/ui-tests python scripts/validate_workflow.py
```

Diagram validation additionally requires the prepared local Mermaid package used by the supplied script. Page capture expects running seeded services and the real demo data/available saved results described in the README.

### 25.8 HTTP demo and performance

```bash
uv sync --frozen --project services/api
services/api/.venv/bin/python scripts/demo.py \
  --url http://localhost:3000 --credentials .local/demo-credentials.json --llm
services/api/.venv/bin/python scripts/performance.py \
  --url http://localhost:3000 --credentials .local/demo-credentials.json
```

The demo waits for actual job outcomes and checks downloaded artifacts. Repeated runs leave clearly named demonstration work rather than pretending the database is unchanged.

### 25.9 Regenerate contracts

```bash
services/api/.venv/bin/python scripts/export_contracts.py
cd apps/web
npx openapi-typescript ../../packages/contracts/openapi.json -o lib/generated-api.ts
```

These contracts contain schemas, not operating data, secrets or private evaluation truth.

## 26. Offline training and evaluation

Training is an explicit isolated operation. The ordinary API cannot execute arbitrary uploaded models or mount private evaluation truth.

```bash
docker compose -f compose.training.yaml --profile offline build trainer
docker compose -f compose.training.yaml --profile offline run --rm trainer \
  python -m app.cli train --data /workspace/research/starter/data \
  --out /workspace/research/evaluation/local-training-v2
docker compose -f compose.training.yaml --profile offline run --rm trainer \
  python -m app.cli evaluate --data /workspace/research/starter/data \
  --out /workspace/research/evaluation/evaluated-v2
```

Use a new output version directory. The explicit training/evaluation CLI runs the isolated pipeline and produces versioned artifacts/evidence; it does not overwrite the supplied serving bundle automatically.

The corresponding host workflow with the locked Python environment is:

```bash
uv sync --frozen --project services/api
OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 services/api/.venv/bin/python \
  scripts/offline_train.py --data research/starter/data \
  --out research/evaluation/another-immutable-version
```

The optional campaign generator supports seeded multi-facility data and writes beneath offline research. It is available for further experiments but its default large campaign is not part of the recorded operating dataset:

```bash
services/api/.venv/bin/python scripts/generate_campaign.py \
  --days 365 --facilities 6 --zones 12 --seed 11001 \
  --out research/evaluation/campaign-v2
```

## 27. Backup, restore and operating handoff

### 27.1 Backup and restore

The backup tool preserves the application schema and matching artifacts with hashes. Writers should be quiesced for a coordinated snapshot. A dedicated connection must be able to read FORCE RLS data; the restricted runtime connection is not a backup administrator.

```bash
export BACKUP_DATABASE_URL='postgresql://BACKUP_USER:SECRET@HOST:5432/greenops'
services/api/.venv/bin/python scripts/backup.py backup --directory /secure/greenops-backup
services/api/.venv/bin/python scripts/backup.py restore --directory /secure/greenops-backup
```

Supply the corresponding object-storage environment and matching PostgreSQL client tools. Restore requires a fresh empty target with roles provisioned. Supabase restore uses the documented `--restore-role postgres`; local restore defaults to `greenops_migrator`.

Verify readiness, migration revision, source/observation counts, hashes, scope denial and smoke behavior before resuming writes. The recorded fresh-service restore is local PostgreSQL/MinIO evidence, not a claim that a live hosted disaster-recovery exercise was performed.

### 27.2 Job reconciliation

```bash
docker compose exec api python -m app.cli reconcile-jobs
```

Inspect actual attempts, leases, error types and results in job/agent activity. Correct dependency failures before retrying; retry success is only reported after real completion.

### 27.3 Production identity provisioning

The migration-only provisioning command creates reviewed identities/grants and an empty operating world. It does not invent historical hospital operations. Repeat provisioning preserves existing compatible identities and rejects conflicting role changes.

```bash
docker compose run --rm migrate python -m app.provision \
  --input /app/shared/provision.json \
  --credentials-out /app/shared/provisioned-credentials.json
```

[Input example](docs/provision.example.json). Keep the generated password output private.

### 27.4 Production configuration

The production overlay includes TLS Caddy configuration, secure cookies, removal of direct web/API ports and read-only application filesystems. Production disables demo shortcuts and clock/reset operations.

This configuration was parsed with an explicit example hostname. No public deployment, DNS setup or hosted availability verification occurred.

### 27.5 Rollback and monitoring

The runbook covers prior application images, reviewed migration compatibility, tested backups and append-only policy/factor revisions. Model disable/restore is audited; restoring an experimental model does not establish real-world validation.

Operational monitoring should inspect coverage/freshness, SQL duration, request/run IDs, leases/retries, alerts, fallback gaps, scenario failures, provider usage/errors and unresolved/verified actions. Correlation IDs connect requests and evidence without logging keys.

[Full operating runbook](docs/runbook.md)

## 28. Jury demonstration workflow

The following sequence demonstrates the working product with clearly synthetic data.

1. **Entrance and scopes:** Sign in as hospital administrator using the demo account picker. Show selected facility/world and clock. Sign out and demonstrate technician Ward A restrictions or auditor limits, then return to an eligible operating role.
2. **Preserved resources:** In `base_v1`, inspect energy/water interval units, charts, missing coverage and forecast target points. Switch to `stress_v1` to show independent data, quarantine and experimental model limitations.
3. **Full operational domains:** Select `extended_v1`. Inspect facility configuration, category waste, assets/dependencies, usable reserves, environment, parking and safety records.
4. **Persisted CRUD:** Create an authorized asset or inspection and a clearly named waste batch/pickup. Refresh to show actual persisted changes and balanced movements.
5. **Deterministic scenario:** Run a six-hour outage/pump-failure scenario. Explain protected fire storage, essential priorities, sensitivity, unmet demand and assumptions. Save a second intervention with the same baseline and compare.
6. **Grounded AI:** Ask about current reserve state and protected fire storage. Show tool progress, scope, actual numbers/units and evidence links. An eligible user can initiate investigation and draft a proposal.
7. **Reviewed work:** Have an administrator approve the proposal with an eligible owner. Progress the action with reasons, resolve it, then use a different eligible reviewer to verify with evidence and close.
8. **Reports:** Generate a daily brief and download actual CSV, HTML and PDF. Point out coverage and illustrative factor versions.
9. **Audit and failure honesty:** Inspect run/job/tool events and any real failures. Explain that monitoring/task creation is opt-in and no tool controls equipment.
10. **Evidence:** Open the screenshot gallery, verification index and this report for the implementation/test handoff.

The automated [scripts/demo.py](scripts/demo.py) complements the manual flow. [docs/demo.md](docs/demo.md) supplies the concise guided walkthrough.

## 29. Limitations and work not claimed

| Item | Actual boundary |
|---|---|
| Hospital data | Fictional synthetic aggregate operations; no real patient records |
| ML validation | Experimental synthetic-only models; real-hospital accuracy not established |
| Energy under shift | Recorded model loses to weekly baseline under stress |
| Generic detector | Weak precision/recall; contextual rules supplement it |
| Forecast horizon | Only 1/6/24-hour target points; no invented full trajectory/day total |
| Fallback | Extended-world seasonal baseline explicitly identified |
| Scenario uncertainty | Sensitivity paths, not statistical confidence intervals |
| Scenario savings | Modeled deltas, not measured realized savings |
| Cost/carbon | Versioned illustrative factors, not verified production tariff/emission claims |
| Internal thresholds | Demo operating policy, not asserted legal compliance limits |
| Grounding | Conservative guard, not proof of every language assertion |
| Provider compatibility | Actual supplied deployment checked; other deployments require their own check |
| Agent powers | Typed scoped software tools; no physical equipment control |
| Cloud performance | Longer configurable budgets; local timings do not establish remote performance |
| Restore evidence | Fresh local PostgreSQL/MinIO restore verified; hosted disaster recovery not claimed |
| Large campaign | Optional 630,720-row generation not performed |
| Public hosting | Deployment configuration exists; no public deployment performed |
| Live health | Readiness reflects recorded check; confirm current service state when running |
| Eraser/PPT request | AI generation blocked by account credits; finished export not verified |

No required M0–M10 application check remains recorded as blocked. Optional presentation work and future real-world deployment/validation are separate from the completed synthetic application contract.

## 30. Source and documentation index

### 30.1 Product and operating documents

| Document | Purpose |
|---|---|
| [Build plan](Hospital_GreenOps_Codex_Build_Plan.md) | Implementation contract and definition of done |
| [README](README.md) | Run instructions, provider setup and embedded screenshot gallery |
| [Build status](docs/build-status.md) | Milestone outcomes and follow-up verification |
| [Architecture](docs/architecture.md) | Data, identity, worker, agent and offline boundaries |
| [Workflow](docs/workflow.md) | Complete system workflows and jury journey |
| [Technology/scopes](docs/techstack-and-scopes.md) | Stack diagrams, seven-role diagrams and permission matrix |
| [Cloud services](docs/cloud-services.md) | Supabase, Azure and demo sign-in setup |
| [Runbook](docs/runbook.md) | Training, restore, failures, provisioning and rollback |
| [Demo](docs/demo.md) | Guided demonstration |
| [References](docs/references.md) | Researched primary technical references |
| [Verification index](docs/verification/README.md) | Actual sanitized evidence links |
| [Contract documentation](packages/contracts/README.md) | OpenAPI/schema generation instructions |

### 30.2 Principal implementation sources

| Source | Responsibility |
|---|---|
| [Product shell](apps/web/components/product.tsx) | Page navigation, world/filter state and shared refresh |
| [Record editor](apps/web/components/record-editor.tsx) | Typed API-backed editing |
| [Simulation studio](apps/web/components/studio.tsx) | Scenario forms, jobs and comparison |
| [Actions](apps/web/components/actions.tsx) | Action workflow and evidence entry |
| [Proposals](apps/web/components/proposals.tsx) | Review and assignment interface |
| [Chat](apps/web/components/chat.tsx) | Conversation, progress and grounded answers |
| [Routes](services/api/app/routes.py) | Domain HTTP endpoints and authorization entry points |
| [Authentication](services/api/app/core/auth.py) | Identity, grants and role permissions |
| [Models](services/api/app/core/models.py) | Concrete persistence schema |
| [Importer](services/api/app/domains/importer.py) | Public fixture validation and canonical import |
| [Generator](services/api/app/domains/generator.py) | Identified extended synthetic operations |
| [Contracts](services/api/app/domains/contracts.py) | Strict operational write schemas |
| [CRUD](services/api/app/domains/crud.py) | Domain mutations and ownership checks |
| [Metrics](services/api/app/domains/metrics.py) | Interval aggregates, coverage and accounting |
| [State](services/api/app/domains/state.py) | Latest operational states and balances |
| [Analytics](services/api/app/analytics/service.py) | Trusted inference and model serving policies |
| [Simulation engine](services/api/app/simulation/engine.py) | Deterministic balances and interventions |
| [Simulation service](services/api/app/simulation/service.py) | Frozen baselines and saved result comparisons |
| [Action service](services/api/app/domains/actions.py) | Creation, transitions, evidence and independent review |
| [Provider](services/api/app/ai/provider.py) | Actual compatible-provider calls and capability checks |
| [Tools](services/api/app/ai/tools.py) | Nineteen typed scoped tools |
| [Orchestrator](services/api/app/ai/orchestrator.py) | Frozen tool loop, grounding, persistence and cancellation |
| [Monitor](services/api/app/ai/monitor.py) | Triggers, cooldown and opt-in policy |
| [Jobs](services/api/app/jobs/service.py) | Durable requests, leases, retry and recovery |
| [Worker tasks](services/api/app/jobs/tasks.py) | Celery execution and scheduler integration |
| [Reports](services/api/app/domains/reports.py) | Frozen deterministic exports |
| [PDF renderer](services/api/app/domains/report_pdf.py) | Actual PDF output |
| [Object storage](services/api/app/core/object_store.py) | S3/Azure storage abstraction |
| [CLI](services/api/app/cli.py) | Seed/generate/infer/train/evaluate/check commands |
| [Provisioning](services/api/app/provision.py) | Reviewed production identities/grants |
| [Page capture](scripts/test_pages.py) | Complete loaded-route evidence capture |
| [Diagram validation](scripts/validate_workflow.py) | Actual Mermaid rendering/export |

The completed deliverable is the repository, reproducible runtime configuration, preserved synthetic foundation, persisted operational/AI workflows and recorded evidence. This report is the consolidated account of that work and its practical limits.
