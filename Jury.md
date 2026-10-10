# GreenOps — jury questions and suggested answers

Preparation for the working hospital prototype, updated 10 October 2026. These are likely questions, not a prediction of every question the jury will ask.

**Read [Project-Understanding.md](Project-Understanding.md) first.** Practise answering in your own words. The answers below distinguish working features, synthetic assumptions, measured prototype results and future plans.

## Start with these 12 questions

Practise Q1, Q2, Q5, Q11, Q21, Q31, Q43, Q55, Q67, Q79, Q91 and Q103 first. They cover the problem, value, data, map, forecasting, simulation, AI, security, limitations and adoption.

## A. Problem, purpose and value

### Q1. What is your project in one sentence?

GreenOps is a hospital operations and sustainability decision-support prototype that connects resource data, a 3D campus view, forecasting, what-if planning, AI-assisted investigation and accountable follow-up.

**Show:** Overview → 3D campus map.

### Q2. What specific problem are you solving?

An administrator may have separate records for electricity, water, waste, equipment and complaints, without a clear connection between a risk, its location and the responsible team. We bring those records into one workflow: understand usage, inspect evidence, plan an intervention and track verification.

### Q3. Why did you choose a hospital?

Hospitals have continuous operations, essential loads, water reserves, waste streams and several operational teams. That makes a hospital a useful demonstration of the institutional-facility problem. Our application manages facility operations; it does not make clinical decisions.

### Q4. Who would use it?

Hospital administrators, operations supervisors, maintenance technicians, waste officers, sustainability officers and auditors. Organization administrators manage the wider organizational scope. Permissions are further limited by facility and zone grants.

### Q5. How is it more than a dashboard?

It connects observation to action. Users can locate a zone, inspect missing data, view tomorrow’s resource estimates, explore disruptions, create or review work, and verify the workflow with evidence. The charts are one part of that process.

### Q6. What is the main innovation?

Our contribution is the integrated, traceable workflow: spatial operations, resource evidence, planning tools and reviewed action management share the same world and permissions. We do not claim to have invented forecasting, 3D rendering or language models.

### Q7. What is your strongest demonstration?

Select Ward A on the map, inspect water readings and coverage, show a recorded risk or explicit presentation drill, explore a planning scenario, then show who owns the follow-up and how it is verified.

### Q8. Could Excel or a reporting dashboard do this?

Spreadsheets can support analysis, and reporting tools can visualize it. Our prototype combines that analysis with zone-level access, interactive spatial context, scoped agent tools, saved simulations and an action lifecycle. Whether a hospital needs that additional workflow would be tested in a pilot.

### Q9. Can it apply to colleges or other campuses?

The organization/facility/zone structure and resource workflows could be adapted. A different facility would need its own equipment, schedules, policies, data mappings and model validation. Renaming the hospital is not enough.

### Q10. How does this meet the problem statement?

It demonstrates sustainability and operations analysis, data ingestion and visualization, forecasts and anomaly evidence, actionable follow-up, role-based usability, explicit assumptions and a working demo. We also cover environment, parking, assets and safety alongside energy, water and waste.

## B. Data, source quality and evaluation integrity

### Q11. Is this real hospital data?

No. This prototype uses synthetic hospital operating data. It demonstrates the complete software workflow, but cannot establish real-hospital accuracy, savings or deployment success.

**Show:** Synthetic source labels, Import quality and model limitations.

### Q12. Where did the data come from?

We use a supplied synthetic starter bundle and an independently generated extended world. The public starter is checksum verified, and the extended generator records its seed, version and configuration provenance.

### Q13. How much data is there?

The imported base world has 17,280 source rows, stress has 8,640, and extended has 25,920: 51,840 source rows across three separate worlds. The extended world represents 180 days across six zones. These are zone/time records, not patient counts.

### Q14. What is a “world”?

A world is an independent demonstration dataset with its own clock and operating records. Base, stress and extended worlds must not be mixed to fill gaps or make a result look better.

### Q15. Why use synthetic data?

It lets us demonstrate resource behavior, missing readings, disruptions and permission-controlled workflows without requiring patient information or access to a hospital. It also provides reproducible cases. The limitation is that simulated patterns may differ from real facilities.

### Q16. What does coverage mean?

Coverage is the proportion of expected interval readings that are valid for the selected metric and reporting scope. A partial total sums the valid readings; it does not mean the unobserved consumption was zero.

### Q17. How do you handle missing or invalid readings?

Missing water remains null and is shown as a gap. Invalid fields are quarantined rather than silently treated as valid. A bad field does not automatically discard the other valid measurements in the same source row.

### Q18. How do you avoid duplicate data and double counting?

Imports check canonical world/zone/time identity and reject conflicting duplicates. Resource totals use disjoint reporting zones. The prototype does not claim to solve arbitrary overlapping real-world parent/submeter hierarchies without a meter-boundary configuration.

### Q19. Did you give the models the hidden injected fault labels?

No. Private labels and injection configuration are kept in the offline research/evaluation branch. Runtime fixtures use a sanitized public allowlist, and extended injection truth is not written into operating ledgers. This separation reduces evaluation leakage.

### Q20. Can you ingest actual hospital data?

There is an aggregate CSV import path with an allowlisted contract and validation. A real pilot would still need approved source mappings, units, meter boundaries, data permissions and quality checks. Live hospital sensor integration is not currently demonstrated.

## C. 3D campus, heatmaps and spatial interpretation

### Q21. Is this a real digital twin of a hospital?

It is a conceptual 3D campus linked to zone data, not a surveyed digital twin. Building geometry and positions are illustrative, inspired by the campus references. A real twin would require an accurate site plan, asset mapping and validated operational connections.

**Show:** `/campus`, building directory and a selected zone.

### Q22. Why use 3D instead of only charts?

It helps an administrator locate a reporting zone and connect its usage, risks and actions to a spatial view. Charts remain necessary for trends and exact quantities. We retain the directory and data panels so users do not depend on the 3D view alone.

### Q23. What do the four map layers mean?

Heat shows the latest available temperature reading. Energy and water show consumption totals over the selected window. Wastage shows generated waste. Each layer has its own units and scale.

### Q24. Does a red building prove there is a fault?

No. A high color intensity can mean a high reading or high consumption relative to the displayed scale. Interpretation also needs occupancy, operating hours, equipment, weather and data quality. It is an inspection cue, not a diagnosis.

### Q25. Are you measuring heat between buildings?

No. Color and soft ground shading represent reporting zones; they do not interpolate physical measurements across the campus. A building without an available temperature reading remains unknown.

### Q26. Is the map’s temperature scale a safety standard?

No. The 20–40 °C palette is a display reference. Clinical and engineering safety thresholds must come from approved facility policies, not from a color scale.

### Q27. What does “Wastage” mean on this map?

It means generated waste material in kilograms. It does not measure water leaks, electricity inefficiency or the avoidable portion of solid waste. We explain the meaning when demonstrating the layer.

### Q28. Do the reduction sliders show achieved savings?

No. They apply an explicitly selected arithmetic reduction to observed usage. They preview an assumption; they are not a trained forecast, a physical repair or verified resource savings.

### Q29. What does “What we’re fixing” show?

It links the selected zone to recorded alerts and action statuses. An action being verified or closed shows completion of the software review workflow; it does not quantify measured water or energy savings.

### Q30. Does the map work on mobile or without WebGL?

The interface has responsive layouts and a data directory fallback. Automatic rotation can be paused, and reduced-motion preferences are respected. Browser checks have covered the map’s controls, resource layers and fallback behavior.

## D. Tomorrow forecasting and experimental ML

### Q31. How do you forecast tomorrow’s energy, water and waste?

For each authorized zone and hourly bucket, the Tomorrow forecast page uses the median of matching weekday/hour readings from the last 28 days. If there are fewer than three weekday samples, it falls back to same-hour history. It sums the zone forecasts into hourly and daily facility estimates.

**Show:** `/tomorrow`, hourly chart, zone breakdown and Forecast evidence.

### Q32. Does the language model generate those forecast numbers?

No. The new daily forecasts are calculated directly from historical observations. They do not need a language-model call or a queued inference job.

### Q33. Why use a historical baseline instead of a complex model?

It is fast, explainable and works across the extended world without claiming that the starter models generalize there. A more complex model should only replace it after beating the baseline on relevant held-out data.

### Q34. What exactly does “tomorrow” mean?

The next calendar day after the selected virtual clock, using the configured facility timezone. This demo uses Asia/Kolkata. Forecasts cover that full local day, rather than simply the next 24 hours from the current time.

### Q35. Are future observations used to improve the forecast?

No. The query and calculation restrict history to timestamps at or before the selected cutoff. Focused tests check that adding a future observation cannot change the forecast.

### Q36. What happens if there is insufficient history?

Each hourly bucket needs at least three valid historical samples, and the latest valid reading must be within 48 hours of the cutoff. If a required zone/hour is unavailable, the full facility total remains unavailable instead of being filled with zero.

### Q37. What do the forecast ranges represent?

They sum the historical 10th–90th percentile hourly values used by the baseline. They are planning variation bands, not calibrated confidence intervals or a promised probability of tomorrow falling inside them.

### Q38. What is the accuracy of this new daily forecast?

We verified its implementation, date boundaries, scope, totals and missing-data behavior. We have not yet measured daily forecast accuracy on independent real hospital data or completed a rolling backtest of this new page. That evaluation is a next step.

### Q39. What other ML models are included?

The starter includes experimental HistGradientBoostingRegressor models for energy and water at 1, 6 and 24-hour leads, plus a generic Isolation Forest anomaly detector. These are separate from the new historical daily forecast.

### Q40. Is a 24-hour-lead prediction the whole next day’s consumption?

No. The starter’s 24-hour-lead model predicts one hourly target 24 hours ahead. Tomorrow forecast produces a full-day total by adding its hourly zone estimates. The two results have different meanings.

### Q41. What do your recorded ML results show?

On synthetic held-out test data, the 1-hour energy model improved MAE by 39.93% against its weekly baseline, but was 33.62% worse under stress. The 1-hour water model improved by 51.43% on test and 21.10% under stress. These are model-error comparisons, not savings or universal accuracy percentages.

**Evidence:** [Recorded starter results](data/public/starter/RESULTS.md).

### Q42. Why not claim the anomaly detector is highly accurate?

Its recorded base test precision is about 2.27% and recall about 3.57%, which are weak. We keep it experimental and distinguish contextual risk rules from proven fault detection. Better calibration and real observations would be needed before operational use.

## E. What-if Studio and extra visitors

### Q43. How do you handle 1,000 more people tomorrow?

The quick calculator multiplies the extra visitors by editable resource allowances and adds those amounts to the last 24-hour baseline. At the defaults, 1,000 visitors add 2,500 L of water, 150 kWh of electricity and 25 kg of generated waste.

**Show:** Top of `/simulations`.

### Q44. Where do those visitor allowances come from?

The default water, energy and waste values match per-OPD-visit coefficients in the synthetic generator. Applying them to general visitors is an illustrative planning assumption, not a visitor model trained on actual hospital measurements.

### Q45. Are the 1,000 people visitors, patients or staff?

The quick calculator assumes additional visitors. Different populations and lengths of stay can have different resource needs. A real deployment would require separate calibrated profiles rather than applying one allowance to everyone.

### Q46. Is all extra water or energy wasted?

No. Additional people need legitimate resources. Wastage is estimated only when a user supplies a water-loss or avoidable-energy percentage. Those losses are portions of additional consumption and are not added to the total a second time.

### Q47. Give a simple wastage example.

For 1,000 visitors, the default extra water is 2,500 L. If we explicitly assume a 10% loss, the modeled wasted portion is 250 L. For 150 kWh extra energy, a 20% avoidable assumption gives 30 kWh. Those percentages are inputs, not measured facts.

### Q48. How do you estimate the additional air requirement?

Fresh-air planning volume equals visitors × average stay × an editable airflow allowance. With 1,000 visitors, a two-hour stay and the illustrative 30 m³/person-hour allowance, it gives 60,000 m³. This is not a validated ventilation design or a hospital standard.

### Q49. Can you predict indoor CO₂, PM2.5 or temperature from that count?

Not with the current visitor calculator. Those predictions need room volume, ventilation, outdoor conditions, source behavior and other inputs. We show the allowance and state that indoor pollutant concentrations and temperature remain unpredicted.

### Q50. How does the engineering simulation differ from the visitor calculator?

The visitor calculator is instant arithmetic with editable allowances. The saved engineering simulation evolves a frozen resource baseline through events such as outages, leaks and pickup changes, in 15-minute steps over 1–72 hours.

### Q51. What protects essential hospital loads in the simulation?

The engine distinguishes essential and nonessential demand, models available supply and records unmet demand. Protected fire reserves cannot supply routine demand. These engineering assumptions still need approval and calibration for a real facility.

### Q52. What do the low/high simulation results mean?

They vary the demand assumption by the selected sensitivity percentage, normally ±20%. They show how sensitive the modeled result is to that input; they are not statistical confidence intervals.

### Q53. Can users compare any two saved simulations?

Comparison requires the same immutable baseline and horizon. Otherwise a difference might come from different starting conditions rather than the intervention, so the application rejects that comparison.

### Q54. Does a favorable simulation prove the proposed action will save resources?

No. It shows what the model predicts under declared assumptions. A real action must be reviewed, performed safely and measured afterward with an appropriate baseline before claiming achieved savings.

## F. AI assistant, agent behavior and explainability

### Q55. What makes your assistant an agent rather than a normal chatbot?

It can request defined operational tools, use their authorized results, run permitted planning workflows, and save reviewable proposals in investigation mode. Tool activity, evidence, timing and failures are recorded. It does not have unrestricted system access.

**Show:** Chatbot and Agent activity.

### Q56. Which language model do you use?

The application uses a configurable OpenAI-compatible provider; this installation is configured with an Azure endpoint. Model deployments and capabilities are server configuration. We can change the provider without rebuilding the resource calculations.

### Q57. What information does the AI receive?

An authorized frozen operating snapshot and results from typed tools, including resource data, context, assets, waste, policies and actions within the initiating user’s grants. It does not receive unrestricted access to the database or private offline truth labels.

### Q58. Can it execute SQL or control pumps and HVAC?

No. Its tools do not expose arbitrary SQL, shell commands, filesystem access or equipment control. It may perform permitted software workflows such as saving simulations or drafting proposals; physical changes remain outside the application.

### Q59. Does the AI automatically read the new Tomorrow forecast page?

The new page calculates daily forecasts through its own API. The existing agent forecast tool exposes the supported experimental target forecasts. Adding a page does not automatically add a new agent tool, so we should not claim daily forecast tool integration unless we implement and verify it.

### Q60. How do you reduce hallucinations?

We constrain the available tools and inputs, provide scoped evidence, and check numeric claims and supplied evidence references before presenting a final answer. These controls reduce unsupported answers but do not guarantee every natural-language assertion is correct.

### Q61. What happens when the model produces an unsupported answer?

The grounding workflow can reject or flag an answer that fails its checks, and provider/verification failures remain visible. The presenter should inspect evidence and limitations rather than repeat unsupported claims.

### Q62. How do you handle malicious instructions in operating documents?

Retrieved documents are treated as untrusted data, not instructions granting authority. Tool contracts, current permissions and write checks still apply. We have tested malicious-document cases, but do not claim that prompt injection is completely solved.

### Q63. Why is the agent sometimes slower than the dashboard?

It performs queueing, evidence capture, provider calls, tool rounds and final checks. Remote database round trips previously added substantial delay; the remote language model still adds latency even with a local database.

### Q64. What changed to make it more responsive?

Requests return a queued run before evidence capture, the worker publishes progress events, database reads were batched, and jobs dispatch promptly after commit. The UI shows submission and operating stages instead of leaving an unexplained blank screen. This improves responsiveness without promising instant completion.

### Q65. Does token streaming show unchecked provider text directly?

The adapter supports provider streaming, while the user sees recorded progress stages and a checked final answer. We should not describe that as unrestricted token-by-token publication of unverified model output.

### Q66. Can the agent assign work autonomously?

Only the supported software task path, with both the server flag and a narrow facility policy enabled, plus role, owner, category, duplicate and budget checks. The current configuration disables autonomous writes. Human-reviewed proposals remain the appropriate demonstration.

## G. Notifications, actions and practical follow-up

### Q67. What does the notification system do?

It surfaces recorded open risks and work due within the next 24 virtual-clock hours, including overdue work. Administrators and supervisors can also create explicitly labeled water, energy and waste presentation drills.

**Show:** Notification bell → a risk/drill → location or Action centre.

### Q68. Are these alerts sent by SMS or email?

No. The implemented demo notifications are in the application. Email, SMS, external escalation and delivery guarantees would require additional integrations; they should not be claimed as working features.

### Q69. How often do notifications update?

The feed checks every 30 seconds while the page is visible, and refresh signals can request an immediate update. The unread count is local to the current browser session, not a shared delivery receipt.

### Q70. Is the leak presentation drill a detected real leak?

No. It is a user-triggered synthetic scenario for demonstrating response. Its context uses actual scoped synthetic readings and coverage, but the drill itself does not prove a leak exists.

### Q71. What does “Simulate containment” actually change?

It records a simulated drill-response transition and audit history. It does not operate equipment, rewrite meter readings, physically repair a leak or establish savings.

### Q72. How do you turn a recommendation into accountable work?

An authorized action records a category, reporting zone, eligible owner, due date and evidence links. Its progress follows controlled state transitions rather than a free-text “fixed” label.

### Q73. Why require independent verification?

The person performing work should not automatically certify its success. The workflow requires an eligible independent reviewer and evidence at verification. In a pilot, the evidence would need a suitable operating measurement or inspection record.

### Q74. Can two users overwrite each other’s changes?

Updates and transitions use expected record versions. A stale version is rejected instead of silently replacing newer changes. Users can then refresh and review the current state.

### Q75. How do you avoid duplicate jobs or actions after a retry?

The system uses idempotency keys and operation-specific duplicate checks, with persisted job/outbox state. Monitoring also has cooldown and daily-budget controls. That aims for safe repeated requests, not a blanket claim of exactly-once execution in every failure case.

### Q76. Can a closed action be used as proof of savings?

It proves the recorded workflow reached closure with its required review, not that a particular number of liters or kWh was saved. Measured savings need separate before/after evidence and appropriate adjustment for activity and conditions.

### Q77. How does waste forecasting relate to waste pickups?

Tomorrow forecast predicts generated waste in kilograms. Existing waste stock, batch age, pickup scheduling and handover records are separate operational questions. A generated-waste forecast alone does not determine bin overflow or pickup success.

### Q78. Is the synthetic handover record proof of licensed disposal?

No. It is demonstration metadata. A real deployment would need genuine operator details, applicable policy checks and authentic handover evidence.

## H. Architecture, access and deployment

### Q79. Explain the architecture simply.

The Next.js website sends same-origin API requests to FastAPI. PostgreSQL stores data and permissions. Celery workers use Redis for background execution, while files go to the selected object store. The configured remote AI provider is called only for AI workflows.

**Evidence:** [Architecture](docs/architecture.md) and [technology/scopes](docs/techstack-and-scopes.md).

### Q80. Why PostgreSQL instead of storing everything in CSV files?

We need relationships, transactions, scoped queries, concurrent updates, versions and durable audit/job records. CSV remains useful for validated imports and exports, but is not the runtime authority for multi-user workflows.

### Q81. Why use a background worker?

Longer simulations, report generation and AI investigations should not block the request interface. A durable job can be accepted, tracked and retried while the user sees progress. Fast deterministic reads, including Tomorrow forecast, run directly through the API.

### Q82. What happens if Redis is unavailable?

Jobs/outbox requests are persisted in PostgreSQL before dispatch. The reconciler can recover dispatch after Redis returns. Readiness reports the dependency failure, and the interface should show the job’s actual state rather than pretending it completed.

### Q83. How do users log in?

The application authenticates real accounts, verifies Argon2 password hashes and issues opaque sessions. Demo role buttons authenticate against allowlisted demo accounts. Production mode refuses those demo login paths.

### Q84. Is access control only enforced in the frontend?

No. The API checks permissions, grants, owners and versions, while the database uses FORCE row-level security under a restricted runtime role. Transaction-local identity avoids leaving a previous user’s scope on a pooled connection.

### Q85. Can a hospital administrator see every organization?

No. An administrator role does not bypass organization and facility grants. Every request still has an authorized scope, and agent tools inherit the initiating user’s scope.

### Q86. How do you protect keys, sessions and files?

Provider and storage keys stay server-side and out of the frontend bundle. Session cookies are HttpOnly/SameSite, and writes require CSRF validation and allowed-origin checks. File downloads recheck scope and content hashes; object storage is private and scoped.

### Q87. Are you certified for healthcare/privacy compliance?

No certification or real clinical deployment is established by this prototype. It avoids patient workflows and uses synthetic data. A real hospital rollout would need a separate security, privacy, legal and operational review appropriate to that installation.

### Q88. Is FastDemo completely offline?

No. FastDemo uses a local PostgreSQL database and Redis, which removes remote database latency. This PC still uses Azure storage and a remote AI provider. Fully offline operation would need local storage and a compatible local AI configuration, plus verification.

### Q89. Does it work on Windows and Linux?

The current Linux Podman FastDemo has been started and checked. The Windows PowerShell launcher handles Compose files, Docker Desktop readiness, local role-password synchronization and migration diagnostics; its parsing and mocked startup scenarios were checked. Real Windows execution depends on the target machine’s Docker and environment state.

### Q90. Is this publicly deployed or ready for hospital production?

It is running locally, not established as a public or real-hospital deployment. There is deployment configuration, but a production rollout still needs hosting, TLS, source integration, monitoring, backups, validation and operating ownership.

## I. Evidence, limitations and difficult questions

### Q91. What is the biggest limitation?

The system demonstrates the workflow with synthetic data. Real resource behavior, visitor allowances, model generalization, alert usefulness and savings still need independent hospital observations and pilot validation.

### Q92. What have you actually tested?

Recorded checks cover backend domains and security, jobs, AI grounding, reports and browser flows. The recent forecast addition passed four focused calculation tests and a live browser/API check for authentication, totals, tabs, export, mobile layout and world switching. The visitor calculator passed focused browser checks too; we have not claimed a new full-suite rerun after every small change.

### Q93. What performance can you prove?

On the current local FastDemo, one forecast API read took 138 ms and one lightweight resource summary read took 63 ms. These are individual measurements, not percentile guarantees or AI response times. They should not be generalized to cloud or production load.

### Q94. Why was localhost previously slow?

The website was local while the database and AI provider were remote. Sequential database calls, broad page reads and large frontend bundles increased wait time. Local database mode, lighter queries, batching and lazy-loaded components addressed major causes.

### Q95. Have you measured actual electricity or water savings?

No. We have observed synthetic consumption, modeled reductions and recorded software actions. We have not verified an actual hospital’s physical savings.

### Q96. Why do you show models that perform poorly under stress?

Because evaluation should reveal failure modes. The results help justify keeping a useful baseline, retaining experimental status and requiring new-facility validation instead of making a universal accuracy claim.

### Q97. Are your new forecast ranges validated uncertainty estimates?

No. They describe historical hourly variation and are clearly labeled planning bands. A calibrated interval would require held-out coverage evaluation appropriate to the target facility and forecasting horizon.

### Q98. How do you estimate cost and carbon?

Electricity consumption is multiplied by the recorded applicable tariff and emission factor, with scope and factor limitations shown. The seeded ₹8/kWh and 0.7 kgCO₂e/kWh factors are illustrative demo assumptions, not claimed current official values. Demand charges and broader emissions boundaries are not included.

### Q99. Is lower consumption always better in a hospital?

No. Essential service availability and approved operating requirements come first. A reduction should target verified avoidable use, while occupancy, service activity and safety constraints are considered. The prototype cannot approve a physical change.

### Q100. Have you measured the AI system’s own energy or carbon footprint?

No. We record provider usage where available but have not measured end-to-end computing emissions. A sustainability assessment should include the software’s own footprint as well as any verified operational benefit.

### Q101. What do you do if the live AI demo fails?

Show the actual failure/progress state and continue with the working map, historical forecasts, saved simulations, actions or deterministic reports when their dependencies are available. Do not present a scripted answer as a live provider response.

### Q102. How much of this was built with AI assistance?

Describe your actual contribution honestly: which parts you designed, implemented, understood and verified, and which tools or supplied starter assets helped. Do not invent a team-development history. Be ready to explain one API path, one forecast calculation and one permission check yourself.

## J. Pilot, usefulness and business feasibility

### Q103. What would your first hospital pilot look like?

Start with a small set of approved, non-patient operational sources and clearly mapped zones. Validate meter units and coverage, run forecasts in observation mode, have staff review alerts, and track a few approved actions. Evaluate usefulness and safety before introducing automation.

### Q104. What would you measure in that pilot?

Data coverage, forecast MAE against a seasonal baseline, false-alert burden, time to acknowledge and resolve issues, staff usability and verified resource changes. Adjust comparisons for occupancy, service activity, weather and schedule changes where relevant.

### Q105. How would you prove savings fairly?

Agree on the measurement boundary and baseline before intervention, record the work, and compare suitable periods with relevant operating adjustments. A simulation, raw consumption drop or closed ticket alone is not sufficient evidence.

### Q106. What is the revenue model?

An institutional subscription with onboarding/integration support is a possible business model. Pricing, procurement fit, willingness to pay and support costs have not been validated, so there is no established revenue claim.

### Q107. How much would deployment cost?

We do not yet have a validated production cost estimate. It depends on existing meters, integration work, hosting, storage, AI usage and support. Separate software operating cost from additional sensor/installation cost when preparing a pilot proposal.

### Q108. Why would a hospital adopt it?

The hypothesis is that a common operating view with location, evidence and accountable follow-up reduces coordination work and helps prioritize inspection. Adoption depends on useful alerts, trustworthy data and staff workflow fit; a pilot must demonstrate those benefits.

### Q109. Who are your customers or partners today?

The repository and local demo do not establish a signed hospital customer or integration partnership. Mention only relationships your team actually has and can substantiate. Otherwise say that pilot outreach is a next step.

### Q110. What would you improve next?

Prioritize a real aggregate-data pilot, meter-boundary mapping, rolling forecast backtesting, better contextual anomaly calibration, staff feedback and production observability. Real source integration and validated action outcomes matter more than adding another visual effect.

## K. Rapid technical follow-ups

### Q111. What is the difference between kW and kWh?

kW is power at a moment or average load; kWh is energy over time. A constant 10 kW load for two hours uses 20 kWh. Our consumption summaries report energy in kWh, not power in kW.

### Q112. What is MAE?

Mean absolute error: the average absolute difference between prediction and observation, in the target’s units. For hourly water forecasts it is liters per hourly zone target. A lower MAE is better, but must be compared on the same held-out data and horizon.

### Q113. What is precision versus recall for alerts?

Precision asks how many flagged cases are actually positive; recall asks how many positive cases were found. A useful alert system must consider both and the workload caused by false alarms. Our synthetic detector results are recorded rather than hidden.

### Q114. What is distribution shift?

It is a change between training and deployment conditions, such as different activity, weather, equipment or faults. Our stress results show why a model that performs well on one synthetic world cannot be assumed to work equally well elsewhere.

### Q115. What is a frozen baseline?

It is the captured set of starting facts and versions used for a simulation or investigation. It lets us explain what a result was based on instead of silently mixing readings from different moments.

### Q116. When does an AI snapshot get captured?

The request records the requested virtual cutoff and queues the run. The worker then captures authorized evidence and records the capture audit time before calling the provider. That is not a promise that every database record was physically captured at the instant the user clicked Send.

### Q117. Why distinguish consumption from reserves?

Consumption is a quantity used over an interval. Reserve is a stored quantity at a point in time. Water used today cannot simply be subtracted from an unrelated tank snapshot without also accounting for inflow, outflow, timing and storage boundaries.

### Q118. What is an idempotency key?

It identifies a logical request so retrying that request can reuse its result instead of creating another effect. It is useful when a client loses the response or a job is retried.

### Q119. What makes a source/model checksum useful?

It checks whether the file bytes match the trusted manifest. The build accepts original starter bytes and a narrowly verified Windows line-ending restoration, but rejects modified content. A checksum establishes file integrity against that manifest, not real-world truth or model quality.

### Q120. What evidence should a judge inspect instead of trusting your slides?

The running scoped pages, source coverage, export contents, saved simulation assumptions, action verification records, model evaluation and recorded test outputs. We can show the forecast method in [tomorrow.py](services/api/app/analytics/tomorrow.py), planning calculations in [visitor-impact.tsx](apps/web/components/visitor-impact.tsx), and security boundaries in [architecture.md](docs/architecture.md).

## Match your demonstration to the evaluation rubric

The repository’s [problem statement](Problem_Statement_4.md) gives these weights:

| Criterion | Weight | Best evidence to show |
|---|---:|---|
| Sustainability and operations relevance | 20% | Hospital resource/reserve workflows and essential-load constraints. |
| Data engineering and visualization | 20% | Scoped readings, coverage, import quality, 3D layers and time series. |
| AI/ML, forecasting or anomaly detection | 20% | Tomorrow forecast method, experimental ML results and scoped agent tools. |
| Actionability | 15% | Owners, due dates, proposals, state transitions and independent verification. |
| Usability | 10% | Clear navigation, role views, zone selection and mobile presentation. |
| Explainability and assumptions | 10% | Source labels, forecast evidence, simulation assumptions and visible failures. |
| Demo quality | 5% | A prepared short workflow with services and data ready before evaluation. |

## Claim carefully

| Avoid saying | Say instead |
|---|---|
| “We already saved 30% electricity.” | “This slider previews an assumed reduction; measured savings need a pilot.” |
| “We have live hospital sensors.” | “The current prototype uses synthetic operating readings.” |
| “The agent physically fixed the leak.” | “The software records a drill or a reviewed work item; staff perform physical work.” |
| “This is an exact hospital digital twin.” | “This is conceptual 3D geometry linked to reporting-zone data.” |
| “Our AI is 99% accurate.” | “We show task-specific recorded results, including failures under stress.” |
| “The air forecast predicts tomorrow’s CO₂.” | “The visitor calculator provides an editable fresh-air allowance, not pollutant concentration.” |
| “Everything works without internet.” | “FastDemo uses a local database; this installation still uses remote storage and AI.” |
| “The new daily forecast is the trained 24-hour ML model.” | “It is a separate hourly historical baseline summed over the next local day.” |
| “It is certified for hospital production.” | “It is a working prototype requiring security and operational review before a pilot.” |

## Last-minute rehearsal

1. Say the 30-second introduction from [Project-Understanding.md](Project-Understanding.md).
2. Explain **data → forecast/planning → investigation → assigned action → verification** without reading.
3. Demonstrate `/campus`, `/tomorrow` and the top of `/simulations` in `extended_v1`.
4. Practise explaining 1,000 visitors: **2,500 L, 150 kWh, 25 kg**, with editable assumptions.
5. Practise saying: **“That is not validated yet; here is how we would measure it in a pilot.”**
6. Do not memorise forecast totals as permanent facts: they change with world, scope and virtual date.

Further evidence: [Jury demo walkthrough](docs/jury-demo.md), [architecture](docs/architecture.md), [role scopes](docs/techstack-and-scopes.md), [recorded model results](data/public/starter/RESULTS.md), and [build status](docs/build-status.md).
