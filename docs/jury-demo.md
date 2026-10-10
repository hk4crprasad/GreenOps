# Jury demonstration

Use `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-windows.ps1 -FastDemo` on Windows, then open `http://localhost:3000/campus`. Start it before the presentation: first-time image downloads, builds, migrations and data seeding take time. FastDemo uses a separate local database volume, using `LOCAL_DATABASE_URL` and `LOCAL_MIGRATION_DATABASE_URL` and PostgreSQL passwords from `.env`. Storage follows `.env`; Azure mode automatically excludes MinIO. It leaves the Supabase database intact. Reports may create new objects in the configured storage, without deleting existing objects. Returning to the default launcher selects the cloud setup again. The AI provider remains remote in either mode.

## The data you can show

The starter is a checksummed **synthetic** hospital operations dataset. The independent extended world generates 180 days across six reporting zones, using a recorded seed and version. Normal consumption, temperatures, coverage, accounting assumptions and recorded actions come from the permission-scoped API. The 3D geometry is illustrative. Neither the campus image nor the university reference provides building measurements or real hospital telemetry.

Notifications show recorded open alerts and actions due within 24 virtual-clock hours, including overdue actions. Due dates and reading windows use the world clock; response acknowledgements use system audit time. The badge's unread count refers to the current browser session. The feed checks every 30 seconds while the page is visible; use Refresh signals for an immediate check.

Drills are explicitly user-triggered synthetic scenarios. Their consumption context is calculated from the selected zone's actual records for the preceding 24 hours, including missing intervals and coverage. A leak drill does not establish that a leak actually occurred. Acknowledgement and simulated containment create an auditable drill history; they do not operate equipment, alter meter readings or establish measured savings. Production mode disables drill creation and transitions; auditor/technician roles cannot run them.

## A five-minute walkthrough

1. Enter as Hospital admin and choose `extended_v1`. Show energy, water, waste and heat layers. Click a building and explain the interval coverage and reading window.
2. Open the notification bell. Select Ward A and start a leak drill. Show the source label, recorded water total and valid-interval count.
3. Select Locate on 3D map. The map opens on Ward A with the water layer. Point to its alert indicator and recorded consumption.
4. Reopen the bell, acknowledge the drill, then select Simulate containment. Show all three audit stages. Explain that this rehearses the response workflow.
5. Open What-if studio to run a saved outage/intervention against a frozen baseline. Show modeled deltas and their assumptions. Use the Action centre to show actual software work ownership and verification states.
6. Ask a short facility question in Ask mode. The UI distinguishes snapshot capture, queueing, provider analysis and evidence checks, and shows snapshot/queue/provider timing after completion. Requests return a queued run before evidence capture; the worker freezes evidence at the requested virtual clock and records the capture audit time before calling the provider. Provider failures remain visible.
7. Switch to Maintenance technician to demonstrate zone restrictions. Generate a deterministic report if required; it does not depend on a successful AI response.

## A strong, accurate pitch

“GreenOps connects a spatial view of hospital operations with traceable resource data, alert response, what-if planning and accountable follow-up. This working prototype uses synthetic hospital operations data to demonstrate the complete workflow. AI reads authorized evidence and drafts decisions for review; physical changes and real savings require a hospital pilot.”

Show working capability instead of invented accuracy, deployment or savings claims. Do not describe simulated containment as a physical repair, illustrative reductions as achieved savings, the concept campus as a surveyed digital twin, or synthetic readings as connected live hospital sensors. The model evaluation page already records limits under stress; use those results as evidence of honest validation.

## Why it was slow and what changed

In the current cloud-backed configuration, measured sequential domain reads before the change were: overview 13.347 s / 39 SQL statements, environment 2.106 s / 8 statements, and a complete AI frozen snapshot plus baseline 44.771 s / 150 statements. After batching latest-state queries and reusing reads only during the same authorized snapshot: overview 6.936 s / 27 statements, environment 0.895 s / 3 statements, and snapshot 12.479 s / 44 statements. These are single-run wall-clock measurements, not percentile guarantees; the optimized measurement ran from the host, while the baseline ran in the existing API container against the same cloud database.

Initial document JavaScript, measured uncompressed from a production build, fell from 2,091,151 bytes to 780,218 bytes (about 63%). Energy and water pages use a lightweight metric summary instead of loading the full Overview, including unrelated waste, assets and sustainability. Chat, campus and charts load on demand, and charts import only the components they use. Workspace authentication now uses one endpoint and survives client navigation. Recently loaded top-level page data is reused for up to 30 seconds in memory, scoped to user/world/version/clock/window; Refresh and mutations through the workspace clear it. Nothing is cached across users on disk.

Jobs publish immediately after the outer database transaction commits, in a background thread. The durable ten-second outbox reconciler remains as recovery if publication fails. Worker concurrency defaults to two. AI event polling runs synchronous database access off the async event loop and retrieves events/status rather than the entire frozen run payload. Evidence checks remain in place; unchecked provider text is not displayed as a final answer.

An isolated local PostgreSQL run measured overview at 0.542 s / 27 SQL statements, environment at 0.091 s / 3 statements, and the complete frozen snapshot at 4.628 s / 43 statements. These are individual measurements against the seeded local world; provider response time is additional.

Localhost still used a remote Supabase database and remote AI model. Database network round trips remain the first-load limit in cloud mode. FastDemo brings the database into Docker locally; storage follows the selected `.env` provider. Provider time still depends on the configured model, endpoint, prompt size and tool rounds. This installation already uses a low-latency model with reasoning disabled, streaming enabled and parallel function calls enabled; changing those flags alone would not fix the database bottleneck.

For deployment, place the API/worker near the database, keep connection pools bounded, measure Server-Timing and per-run timings, and use the production web build. Do not promise a universal subsecond AI answer or validated hospital savings from these measurements.

## Verification and remaining limits

The API production image passed the original 47 backend tests, including scoped access, drill lifecycle, snapshot caching, job recovery, SSE resumption, AI grounding, domain balances and report artifacts. The two focused follow-up checks passed for lightweight resource totals and deferred evidence capture with progress events. The rebuilt API, worker, scheduler and web were restarted on the existing localhost stack; web and API readiness returned HTTP 200. The production web build passed TypeScript checking. The 3D browser suite passed all four resource layers, comparison scales, rotation controls, mobile layout, missing-data handling and WebGL fallback. PowerShell parsing and nine mocked Docker Desktop startup scenarios passed, including FastDemo; a real Windows machine was not available for execution.

The default MinIO image is exactly `quay.io/minio/minio`, with no tag or source-build fallback. This environment denied that registry pull. Local database/API/UI verification used an explicit temporary test override with existing private Azure storage, so MinIO startup itself remains unverified here.

The Windows FastDemo launcher now resolves the configured storage provider before startup. With Azure selected in `.env`, it adds the Azure overlay automatically, so the denied MinIO image is not pulled. Local PostgreSQL URL/password selection and Azure exclusion were checked against resolved Compose configuration; mocked Windows startup also covered both Azure and S3 selections.

FastDemo now validates the two local URLs against the PostgreSQL settings and synchronizes the local runtime/migrator role passwords before migration, preserving tables and volumes. This role setup was executed on the existing isolated local PostgreSQL volume; both roles authenticated over TCP afterward. Windows startup mocks passed with this synchronization step. Migration failures now print their traceback automatically.

The API build also verifies all 16 starter files and restores Windows CRLF text only when the original manifest hash matches the restored LF bytes. Git attributes preserve exact public bundle bytes. A focused check verified original files and simulated Windows CRLF conversion, and rejected modified text/model content; checksum verification remains enforced.

## Extra visitors tomorrow

At the top of What-if Studio, enter additional visitors (default 1,000). The instant planning calculator repeats the selected world’s last 24-hour consumption baseline and adds editable per-visitor allowances. Defaults match the synthetic generator’s OPD-visit coefficients: 2.5 L water, 0.15 kWh electricity and 0.025 kg waste. Applying those coefficients to visitors is an illustrative assumption, not a calibrated prediction. Thus 1,000 extra visitors add 2,500 L, 150 kWh and 25 kg before any changes to allowances. Partial observation coverage remains visible.

Fresh-air volume is visitors × average stay × an editable fresh-air allowance; average concurrent extra visitors assumes uniform arrivals. The default 30 m³ per person-hour is a planning assumption, not a hospital ventilation standard. Electricity emissions use the world’s latest applicable recorded factor, assumed unchanged tomorrow. Indoor CO₂, PM2.5 and temperature remain unpredicted without room, ventilation and weather inputs. Water losses and avoidable energy require a user-entered percentage, and are portions of additional consumption rather than another load. Export preserves the baseline, assumptions and calculated additions as JSON.
