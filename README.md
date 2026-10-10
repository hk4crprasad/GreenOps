# Hospital GreenOps AI

A working, local operations and sustainability application for a fictional hospital. Next.js/TypeScript, FastAPI/Python 3.12, PostgreSQL with Alembic and FORCE RLS, Celery/Redis and object storage (MinIO or private Azure Blob Storage). The local database image is PostgreSQL 18; the configured Supabase database is PostgreSQL 17. All displayed hospital data is synthetic. There are no patient workflows.

The implementation contract is [Hospital_GreenOps_Codex_Build_Plan.md](Hospital_GreenOps_Codex_Build_Plan.md). Verification and limitations are recorded in [docs/build-status.md](docs/build-status.md).

[Complete project report — implemented modules, M0–M10, architecture, user scopes, workflows and verification](Project.md).

## Quick start — two commands

For this initialized workspace, run these from the project folder with the existing `.env` and seeded data. The wrapper uses Docker when available, or rootless Podman, and respects the configured local or Supabase/Azure services.

**1. Start the backend** — API, worker, scheduler and their required infrastructure/migrations:

```bash
./scripts/compose.sh up -d api worker scheduler
```

**2. Start the frontend** — run after the backend command:

```bash
./scripts/compose.sh up -d web
```

Open **http://localhost:3000**. Backend docs: **http://localhost:8000/docs**. Both commands run in the background; repeat them to start stopped services. For first-time installation, use the setup instructions under [Start](#start).

To inspect startup status or logs:

```bash
./scripts/compose.sh ps
./scripts/compose.sh logs --tail=50 api worker scheduler web
```

## Windows PowerShell — start everything

Start Docker Desktop with Linux containers, then run this from the project folder for the initialized Supabase/Azure configuration:

```powershell
docker compose -f compose.yaml -f compose.supabase.yaml -f compose.azure.yaml up -d --build
```

Or use the Windows launcher, which finds the project folder automatically:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-windows.ps1
```

The launcher builds and starts the web app, API, worker, scheduler, Redis, and required migrations. It uses the existing `.env` and passes each Compose file explicitly. Windows uses `;` for `COMPOSE_FILE` by default, while this project's shared examples use `:`; explicit `-f` arguments avoid that mismatch without editing credentials. The execution-policy option applies only to this PowerShell process.

Open **http://localhost:3000** or **http://localhost:3000/campus**. Inspect status and logs with:

```powershell
docker compose -f compose.yaml -f compose.supabase.yaml -f compose.azure.yaml ps
docker compose -f compose.yaml -f compose.supabase.yaml -f compose.azure.yaml logs --tail=50
```

For the fully local PostgreSQL/MinIO setup, configure `.env` for local services and run `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-windows.ps1 -ComposeFiles compose.yaml`.

## How the system works

```mermaid
flowchart LR
    Users["Users<br/>Admins, supervisors, technicians,<br/>waste and sustainability officers, auditors"]
    Dashboard["Dashboard<br/>Next.js and TypeScript<br/>18 operational and management pages"]
    FastAPI["FastAPI backend<br/>Login, role and zone permissions<br/>Domain APIs, CRUD and audit"]
    AI["AI services<br/>Experimental ML forecasts<br/>Grounded chatbot and scoped agents"]
    Analysis["Deterministic analysis<br/>What-if simulations<br/>Risk rules, cost and carbon estimates"]
    Outputs["Outputs shown in dashboard<br/>Metrics, forecasts and evidence<br/>Scenario results, reviewed actions and reports"]
    DB[("PostgreSQL / Supabase<br/>World-scoped data and FORCE RLS")]
    Queue["Celery and Redis<br/>Durable asynchronous jobs"]
    Blob["Private Azure Blob Storage<br/>Reports and evidence files"]
    Users --> Dashboard --> FastAPI
    FastAPI --> AI --> Outputs
    FastAPI --> Analysis --> Outputs
    FastAPI --> Outputs
    FastAPI <--> DB
    FastAPI --> Queue
    Queue --> AI
    Queue --> Analysis
    FastAPI <--> Blob
    Outputs --> Dashboard
    classDef app fill:#e8f3ed,stroke:#176448,color:#153c2e
    classDef intelligence fill:#eeeafa,stroke:#67539a,color:#352856
    classDef infrastructure fill:#f1f3f4,stroke:#687979,color:#263c3c
    class Users,Dashboard,FastAPI,Outputs app
    class AI,Analysis intelligence
    class DB,Queue,Blob infrastructure
```

All operating data is synthetic. AI reads permission-scoped evidence; action writes require current permissions and policy checks. Reports and simulations run deterministically without an LLM. [Complete workflow with detailed Mermaid diagrams and jury walkthrough](docs/workflow.md).

[Editable Mermaid](docs/diagrams/greenops-workflow.mmd) · [SVG diagram](docs/diagrams/greenops-workflow.svg) · [PNG diagram](docs/diagrams/greenops-workflow.png)

[Detailed technology stack, separate user scopes and permission matrix](docs/techstack-and-scopes.md)

[Interactive 3D hospital campus — jury walkthrough, resource overlays, and improvement estimates](docs/campus-map.md). Open **3D campus map** in Workspace navigation or visit `/campus` after sign-in.

<details><summary>Complete technology stack</summary>

[![Technology stack](docs/diagrams/technology-stack.png)](docs/diagrams/technology-stack.svg)

</details>

<details><summary>Separate scopes for all seven user roles</summary>

[![User scopes](docs/diagrams/user-scopes.png)](docs/diagrams/user-scopes.svg)

</details>

## Start

This workspace is initialized. Use the two commands above to start it; generated login credentials are in `.local/demo-credentials.json`. The commands below initialize a fresh installation.

Requires podman with Compose v2 (supporting `!reset`/`!override`), network access for the initial image/dependency build, approximately 12 GB free disk and 8 GB RAM. The initial MinIO build compiles its pinned official source release; browser dependencies are included in the web image.

```bash
cp .env.example .env
python3 scripts/init_env.py
python3 scripts/prepare_starter.py --source-dir hospital_greenops_starter
# Alternative supplied ZIP: --archive Hospital_GreenOps_Synthetic_ML_Starter.zip

podman compose up --build -d
podman compose exec api python -m app.cli seed-demo --starter /app/data/public/starter
podman compose exec api python -m app.cli generate-world --config /app/data/public/extended-demo.yaml
for world in base_v1 stress_v1 extended_v1; do
  podman compose exec api python -m app.cli infer --world "$world"
done
podman compose exec api python -m app.cli smoke-test
```

Open **http://localhost:3000**. API documentation: **http://localhost:8000/docs**. Readiness: **http://localhost:8000/api/v1/health/ready**. Ports bind to loopback. PostgreSQL, Redis and object storage remain on the private Compose network.

If the podman socket is unavailable and rootless Podman is installed, replace `podman compose` in these commands with `./scripts/compose.sh`. The wrapper starts a local Podman API socket and uses the same Compose configuration. It was checked on this workspace.

Retrieve generated credentials locally; they are deliberately excluded from version control:

```bash
mkdir -p .local
podman compose exec -T api cat /app/shared/demo-credentials.json > .local/demo-credentials.json
chmod 600 .local/demo-credentials.json
```

Use `hospital_admin` to explore and configure the demo; `operations_supervisor` can independently review actions. Other generated roles demonstrate zone and domain restrictions. Migration runs automatically before the API starts. Repeat seed/generation is idempotent. `scripts/init_env.py` preserves an initialized environment; do not change database passwords without rotating the database roles too.

## Cloud database/storage and jury login

[Cloud setup and switching runbook](docs/cloud-services.md) covers Supabase runtime role provisioning, session/transaction pooling, Azure private containers and provider-aware backups. In demo mode, the login page displays all seven real accounts with email/password, a direct **Sign in** button and **Fill credentials** for the manual form. Sign out to switch roles. Credentials are loaded dynamically from the demo-only API; production returns no demo accounts or passwords. Startup preserves the credential file. If that file is lost while the database remains, demo bootstrap regenerates only the missing account credentials without deleting users, grants or operating data.

## Enable the LLM

Set these **server-side** values in `.env`, then recreate API, worker and scheduler. The frontend receives no provider key.

```dotenv
LLM_ENABLED=true
OPENAI_BASE_URL=https://YOUR-ENDPOINT/openai/v1
OPENAI_API_KEY=YOUR-SERVER-SIDE-KEY
OPENAI_CHAT_MODEL=YOUR-DEPLOYMENT
OPENAI_AGENT_MODEL=YOUR-DEPLOYMENT
LLM_SUPPORTS_TOOLS=true
LLM_SUPPORTS_STREAMING=true
LLM_SUPPORTS_PARALLEL_TOOL_CALLS=true
LLM_TOKEN_LIMIT_PARAMETER=max_completion_tokens
LLM_REASONING_EFFORT=none
```

The supplied Azure endpoint with `gpt-6-luna` was actually verified for text, streamed chunks, function calling, matching tool results and multiple parallel read calls. Its Chat Completions function calling required `reasoning_effort=none`. The adapter does not send `temperature`; `max_tokens` is not sent in this configuration. Capabilities are configurable for other compatible providers and must be checked against the selected deployment.

```bash
podman compose up -d --force-recreate api worker scheduler
podman compose exec api python -m app.cli check-llm
podman compose exec api python -m app.cli agent-evaluate
podman compose exec api python -m app.cli agent-refresh-evaluate
```

Without credentials, metrics, CRUD, simulations, rules and deterministic reports work. Chat records configuration/provider failures honestly. Monitoring is disabled by default; enable a versioned facility agent policy in Settings. Autonomous software task creation additionally requires the server flag and the policy's category, severity, owner and daily limits. No tool operates equipment.

## Validate and demonstrate

```bash
podman compose exec api pytest -q
podman compose exec web npm run test:e2e
python3 scripts/check_boundary.py
podman compose exec api python -m app.cli verify-checksums
# Host Python dependencies, if running the HTTP demo outside the containers:
cd services/api && uv sync --frozen && cd ../..
services/api/.venv/bin/python scripts/demo.py --url http://localhost:3000 --credentials .local/demo-credentials.json --llm
services/api/.venv/bin/python scripts/performance.py --url http://localhost:3000 --credentials .local/demo-credentials.json
```

The browser suite expects the seeded/generated worlds. Its explicit live chat test requires a configured provider; deterministic backend tests use mocked providers. Reports are real CSV, printable HTML and server-rendered PDF files in scoped object storage.

See [docs/runbook.md](docs/runbook.md) for offline train/evaluate, clean demo reset, backup/restore, production configuration, failure recovery and rollback. See [docs/demo.md](docs/demo.md) for the guided walkthrough, [docs/architecture.md](docs/architecture.md) for boundaries and [docs/references.md](docs/references.md) for researched primary references.

The synthetic models remain experimental: only 1/6/24-hour target predictions; energy loses to a weekly baseline under stress; generic anomaly detection has weak precision/recall. Estimates use explicitly illustrative versioned factors. Simulation deltas are modeled results, not measured savings or validated real-hospital performance.

## Screenshots and page verification

Actual captures from the running synthetic demonstration, using Supabase PostgreSQL and private Azure Blob Storage. The checks cover all 18 product pages, demo sign-in and mobile overview: loaded domain APIs, refresh, role scope, chart rendering and available record dialogs. Click an image to open the complete page.

[Page check results](docs/screenshots/pages/page-results.json) · [Cloud runbook](docs/cloud-services.md) · [Verification evidence](docs/verification/README.md)

Reproduce the captures after starting the services:

```bash
./scripts/compose.sh exec -T web npm run test:e2e -- --timeout=180000
uv run --frozen --project scripts/ui-tests python -m playwright install chromium
uv run --frozen --project scripts/ui-tests python scripts/test_pages.py
```

The workflow suite creates clearly named browser fixtures, saved scenarios and reports, and a real provider conversation. The page-capture script verifies the loaded screens and selects that conversation for the chatbot image. Cloud SQL round trips take longer than the local checks recorded in the original build evidence.

<details><summary>Demo sign-in</summary>

[![Demo sign-in](docs/screenshots/pages/login.png)](docs/screenshots/pages/login-full.png)

</details>

<details><summary>Overview</summary>

[![Overview](docs/screenshots/pages/overview.png)](docs/screenshots/pages/overview-full.png)

</details>

<details><summary>Facility operations</summary>

[![Facility operations](docs/screenshots/pages/facility.png)](docs/screenshots/pages/facility-full.png)

</details>

<details><summary>Energy</summary>

[![Energy](docs/screenshots/pages/energy.png)](docs/screenshots/pages/energy-full.png)

</details>

<details><summary>Water &amp; reserves</summary>

[![Water & reserves](docs/screenshots/pages/water.png)](docs/screenshots/pages/water-full.png)

</details>

<details><summary>Waste operations</summary>

[![Waste operations](docs/screenshots/pages/waste.png)](docs/screenshots/pages/waste-full.png)

</details>

<details><summary>Environment</summary>

[![Environment](docs/screenshots/pages/environment.png)](docs/screenshots/pages/environment-full.png)

</details>

<details><summary>Assets &amp; maintenance</summary>

[![Assets & maintenance](docs/screenshots/pages/assets.png)](docs/screenshots/pages/assets-full.png)

</details>

<details><summary>Traffic &amp; parking</summary>

[![Traffic & parking](docs/screenshots/pages/parking.png)](docs/screenshots/pages/parking-full.png)

</details>

<details><summary>Safety incidents</summary>

[![Safety incidents](docs/screenshots/pages/safety.png)](docs/screenshots/pages/safety-full.png)

</details>

<details><summary>What-if studio</summary>

[![What-if studio](docs/screenshots/pages/simulations.png)](docs/screenshots/pages/simulations-full.png)

</details>

<details><summary>Sustainability &amp; cost</summary>

[![Sustainability & cost](docs/screenshots/pages/sustainability.png)](docs/screenshots/pages/sustainability-full.png)

</details>

<details><summary>Action centre</summary>

[![Action centre](docs/screenshots/pages/actions.png)](docs/screenshots/pages/actions-full.png)

</details>

<details><summary>Reports</summary>

[![Reports](docs/screenshots/pages/reports.png)](docs/screenshots/pages/reports-full.png)

</details>

<details><summary>Chatbot</summary>

[![Chatbot](docs/screenshots/pages/chat.png)](docs/screenshots/pages/chat-full.png)

</details>

<details><summary>Agent activity</summary>

[![Agent activity](docs/screenshots/pages/agent.png)](docs/screenshots/pages/agent-full.png)

</details>

<details><summary>Import quality</summary>

[![Import quality](docs/screenshots/pages/imports.png)](docs/screenshots/pages/imports-full.png)

</details>

<details><summary>Model evaluation</summary>

[![Model evaluation](docs/screenshots/pages/models.png)](docs/screenshots/pages/models-full.png)

</details>

<details><summary>Policy &amp; settings</summary>

[![Policy & settings](docs/screenshots/pages/settings.png)](docs/screenshots/pages/settings-full.png)

</details>

<details><summary>Mobile overview</summary>

![Mobile overview](docs/screenshots/pages/overview-mobile.png)

</details>
