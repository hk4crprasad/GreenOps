# GreenOps: understand the project before the jury round

Read this first, then practise the questions in [Jury.md](Jury.md). This guide describes the working prototype, including Tomorrow forecast and the extra-visitors calculator.

## 1. What is our project?

**GreenOps helps a hospital operations team understand resource use, find issues, plan for tomorrow, and track corrective work.**

Hospitals use electricity and water, generate waste, maintain equipment, and manage indoor conditions and parking. Those activities are often tracked separately. GreenOps brings them into one dashboard with a 3D campus view, forecasts, alerts, simulations, an AI assistant, and an action workflow.

We chose a hospital to demonstrate the wider facility-sustainability problem. The same approach could be adapted to a college or another institutional campus, with different zones, policies and equipment.

**The current hospital is fictional. The operating data is synthetic. We have not connected live hospital meters or proved real hospital savings.**

## 2. The problem, in a simple example

Imagine Ward A uses unusually high water. An administrator needs to know:

1. How much water was recorded, and are readings missing?
2. Did occupancy or activity increase, or does this require inspection?
3. Which building and team are affected?
4. What happens if demand increases or the pump fails?
5. Who will inspect the issue, and who will verify the work?

GreenOps helps answer those questions in one workflow. A high reading is a reason to investigate; it is not automatic proof of a leak.

## 3. Remember this project flow

**Read data → understand usage → identify a risk → estimate or simulate → assign work → verify with evidence → report.**

The dashboard supports a decision. A person still decides what physical work to perform.

## 4. What each important screen does

| Screen | What to say to the jury |
|---|---|
| Overview | “This summarizes resource consumption, coverage, risks and pending work.” |
| 3D campus map | “This shows which reporting zones use resources and where recorded issues and actions belong.” |
| Energy | “This shows electricity consumption over time, with data quality and experimental forecast targets.” |
| Water & reserves | “This separates water consumed from water available in tanks.” |
| Waste operations | “This shows waste stock, batches, aging, pickups and recorded handover information.” |
| Environment | “This shows temperature, humidity, PM2.5 and CO₂ readings where available.” |
| Tomorrow forecast | “This estimates tomorrow’s electricity, water and generated waste using recent patterns.” |
| What-if Studio | “This explores changed conditions, such as extra visitors, a grid outage or a pump failure.” |
| Notifications | “This brings recorded risks and due work to attention; presentation drills rehearse a response.” |
| Action centre | “This assigns work and records progress, evidence and independent verification.” |
| Chatbot / Agent activity | “This answers operational questions through authorized tools and records the investigation.” |
| Sustainability & reports | “This estimates cost and emissions with declared factors and exports the operating evidence.” |

Assets, parking, safety, imports, model evaluation and policy screens support these workflows.

## 5. Where does the data come from?

We use a supplied synthetic starter dataset and an independently generated extended world. A **world** is a separate demonstration dataset with its own clock and records.

| World | What it contains |
|---|---|
| `base_v1` | Starter operating history: 17,280 source rows. |
| `stress_v1` | Changed/stressed starter history: 8,640 source rows. |
| `extended_v1` | 180 days across six zones: 25,920 source rows, plus operational ledgers such as waste batches, reserves and environment readings. |

Use **`extended_v1`** for the main demonstration. The six reporting zones are ICU, Ward A, Ward B, OPD, Services and Administration. OPD means outpatient department.

Missing readings stay missing. **Coverage** tells you how many expected readings are valid. A total with partial coverage may understate the actual consumption; missing data does not mean zero consumption.

The **virtual clock** decides which records the demo can see. “Tomorrow” means the day after this selected clock in the hospital timezone, not necessarily tomorrow on your laptop’s calendar.

## 6. Understand the three different prediction/planning features

### Tomorrow forecast: “What may happen with existing patterns?”

This page uses the last 28 days of authorized readings. For each zone and hour, it takes the median from the same weekday and hour. If there are fewer than three matching weekday samples, it uses the available same-hour history instead.

It adds the zone forecasts to show tomorrow’s energy, water and generated waste. It also shows hourly estimates, historical variation and coverage. Insufficient or stale history makes complete totals unavailable.

**This is a historical baseline forecast. It does not use the language model, future readings, a weather forecast or your extra-visitors input.** Its range describes historical variation, not a guaranteed confidence interval.

### Extra-visitors calculator: “What if 1,000 additional visitors arrive?”

This instant calculator is at the top of What-if Studio. It repeats the last 24-hour baseline and adds editable per-visitor allowances:

| Resource | Default allowance | Extra demand for 1,000 visitors |
|---|---:|---:|
| Water | 2.5 L per visitor | 2,500 L |
| Electricity | 0.15 kWh per visitor | 150 kWh |
| Generated waste | 0.025 kg per visitor | 25 kg |

The defaults follow coefficients in our synthetic generator. Applying them to visitors is a planning assumption, not a model trained on real visitor data.

**Additional demand is not automatically wastage.** Enter a water-loss or avoidable-energy percentage to estimate those portions. For example, assuming 10% of the extra water is wasted gives 250 L; assuming 20% of the extra electricity is avoidable gives 30 kWh.

Fresh-air allowance = visitors × average stay × editable airflow allowance. The default airflow is an illustrative assumption. Indoor CO₂, PM2.5 and temperature are not predicted by this calculator.

### Saved engineering simulation: “What happens during a disruption?”

The other part of What-if Studio simulates events such as a grid outage, pump failure, water leak or delayed pickup. It uses a frozen baseline and updates resource balances in 15-minute steps over 1–72 hours.

It can show tank levels, unmet essential demand, energy balance and parking queues. Its sensitivity range changes demand assumptions; it is not a statistical confidence interval. It does not operate equipment.

The project also includes **experimental ML models** for energy and water at 1, 6 and 24-hour leads. Those predict individual hourly targets. A 24-hour-lead target is not the same as tomorrow’s full-day total.

## 7. What does the AI agent actually do?

The AI assistant can inspect authorized resource information, operational context, risks, documents, actions and supported forecast evidence through defined tools. Investigation mode can use permitted simulation and proposal workflows.

The important idea is: **the model asks our tools for facts; it does not get unrestricted database or equipment access.**

The worker captures evidence for the requested virtual clock before calling the configured remote provider. Progress events show stages such as queueing, evidence capture and tool activity. Final answers are checked against available evidence, but these checks cannot guarantee every sentence is correct.

The current AI provider is remote. The dashboard’s calculations, tomorrow forecast, saved simulations and deterministic reports do not need a language-model response.

## 8. How the software works

| Part | Simple meaning |
|---|---|
| Next.js + TypeScript | The website users interact with. |
| Three.js | The interactive 3D hospital view. |
| FastAPI + Python | The backend that validates requests and performs calculations. |
| PostgreSQL | Stores operating readings, users, actions and evidence. |
| Celery + Redis | Runs longer jobs in the background. |
| Azure Blob / MinIO | Stores report files and evidence objects. |
| Configured AI provider | Produces tool-assisted explanations and investigations. |

The current **FastDemo** uses local PostgreSQL and Redis. Storage follows `.env`; this PC uses Azure storage. The AI provider remains remote. Therefore FastDemo is not a completely offline deployment.

## 9. Why is it more than a dashboard?

A chart tells you what happened. GreenOps also helps identify the reporting zone, inspect the evidence, estimate tomorrow’s requirements, explore alternatives, and assign follow-up work.

Actions move through stages such as open, acknowledged, in progress, resolved, verified and closed. Verification needs an authorized independent reviewer and evidence. A completed software action does not by itself prove resource savings.

Roles and grants limit what each person can see and change. For example, the demo maintenance technician is restricted to Ward A. The AI agent follows the initiating user’s permissions too.

## 10. A 30-second introduction to practise

> GreenOps is a hospital operations and sustainability decision-support prototype. It brings energy, water, waste, indoor conditions and operational risks into one dashboard and interactive 3D campus view. Administrators can forecast tomorrow’s demand, test changed conditions, investigate through an evidence-based AI assistant, and track corrective work. We demonstrate the complete workflow using synthetic hospital data; real-world savings and accuracy would need a hospital pilot.

## 11. A five-minute demonstration

| Time | Show | Say |
|---|---|---|
| 0:00–0:30 | Overview, `extended_v1` | Explain the problem and identify the synthetic data and virtual clock. |
| 0:30–1:30 | 3D map | Switch energy, water, waste and heat layers. Select Ward A and show coverage. |
| 1:30–2:15 | Tomorrow forecast | Show daily totals, an hourly chart and zone breakdown. Explain the historical method. |
| 2:15–3:00 | What-if Studio | Show 1,000 extra visitors. Explain additional demand and editable wastage assumptions. |
| 3:00–4:00 | Bell / Action centre | Show a presentation drill or recorded risk, then ownership and verification. |
| 4:00–5:00 | Chat or report | Show a short grounded question if the provider is responsive; demonstrate a report or saved result if it is unavailable. |

Start services before the round. First-time image builds, migrations and data seeding take time. The Windows FastDemo launcher is documented in [README.md](README.md); the current Linux app is at `http://localhost:3000`.

## 12. Facts to remember without looking

1. We support hospital **operations**, not diagnosis or patient treatment.
2. Our data is **synthetic**, and the 3D geometry is conceptual.
3. Tomorrow forecast uses **28 days of historical readings**, with no LLM call.
4. **Demand, wastage, a forecast and a simulation are different things.**
5. Extra visitors use **editable assumptions**, not validated hospital visitor rates.
6. An alert suggests investigation; it does not prove a leak or equipment failure.
7. A presentation drill does not physically fix anything.
8. Model performance is mixed under stress; we show the recorded limitations.
9. Permissions apply in both the backend and database, and also to agent tools.
10. We have working prototype evidence, but no proven real-hospital deployment or savings.

If you do not know an answer, say: **“That has not been validated yet. In a pilot we would measure it using hospital data.”** Then explain the next step. Do not invent a result.

Continue with [Jury.md](Jury.md) for detailed questions and answers.
