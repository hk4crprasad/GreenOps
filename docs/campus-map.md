# Interactive hospital campus

Open **3D campus map** in the Workspace navigation, or `/campus`. The page uses the existing login, facility, world, date filters, and zone grants.

## Jury walkthrough

1. Choose `extended_v1` to display all six reporting zones, then select **Present to jury**.
2. The campus slowly rotates automatically (one revolution every four minutes). Pointing or interacting pauses rotation for five seconds; use **Pause rotation** to hold the view or **Resume rotation** to restart it. Reduced-motion preferences disable automatic rotation initially. Drag the 3D campus to rotate it; use the zoom buttons or mouse wheel. **Reset campus view** restores the starting view.
3. Select **Heat**, **Energy**, **Water**, or **Wastage**. Roofs, facades, and zone footprints use the active map’s color scale. Use **Overlay on/off** to compare the colored view with the original campus. Click a building label, the building itself, or its directory entry to inspect usage, interval coverage, and the observed trend.
4. Adjust the **Reduction assumption** to demonstrate an illustrative before/after comparison. **Observed** returns the map labels to the recorded totals.
5. Review **What we’re fixing**, including persisted action statuses and open alerts for the selected zone. Open the Action centre for the existing action workflow or the What-if studio for saved engineering simulations.
6. Press Escape or **Exit presentation** to return to the workspace.

## Data and interpretation

- Buildings represent ICU, Ward A, Ward B, OPD, Administration, and Services. Positions and architectural geometry are conceptual, inspired by the supplied campus references; they are not a surveyed hospital plan.
- Heat uses the latest permission-scoped `/environment/state` reading per zone at the world clock, including its timestamp. The fixed 20–40 °C palette is a display reference, not a clinical safety classification. Missing or unavailable temperature readings remain gray; the other resource maps remain available if this endpoint fails.
- Energy, water, and wastage use distinct sequential palettes from zero to the highest observed authorized zone total. The range stays fixed when previewing reductions. Wastage means generated waste, not measured avoidable loss. The soft ground shading illustrates zone footprints and does not infer measurements between buildings.
- Consumption comes from the existing `energy.interval_kwh`, `water.interval_l`, and `waste.generated_kg` series APIs. Every response page is retrieved. Totals include valid observations only; missing readings remain unknown, and interval coverage is displayed.
- The selected date window controls energy, water, and waste totals and trends; heat shows a latest-state snapshot and has no reduction slider. Action and alert records reflect the selected world's virtual clock. Only authorized zones have interactive markers or directory entries.
- Waste means generated material. The batch ledger remains separate. Energy and water losses are not measured by this page.
- The adjustable reductions are explicit arithmetic assumptions, not model predictions, saved simulations, actual equipment controls, or verified savings. The campus reduction is the sum of the same assumption over authorized zone usage. Clinical loads require engineering assessment.
- Existing actions marked `verified` or `closed` count as completed improvements; this does not establish a measured amount of resource savings.
- The page performs read-only API requests. A browser without WebGL can still inspect all available data through the building directory.

## Verification

The production Next.js build checks TypeScript. Run the deterministic browser suite with a frontend server on port 3000:

```bash
scripts/ui-tests/.venv/bin/python scripts/test_campus.py
```

The suite intercepts API requests with explicit test fixtures and tests paginated totals, coverage, unknown readings, resource layers, zone selection, reduction calculations, actions, presentation controls, date filtering, world isolation, failure/retry, mobile overflow, and WebGL fallback. It does not write to the database. Screenshots are saved under `.local/campus-tests/`.

The page was also checked with the running backend using demo sign-in and the existing synthetic `extended_v1` records.
