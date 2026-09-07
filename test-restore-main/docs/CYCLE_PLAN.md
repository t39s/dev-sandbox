# Stabilization cycle — RC6 plan and completion

## Trigger

RC5 owner acceptance produced Firebase `permission-denied` on legal Team writes, including create.

## Plan

1. Compare RC5 Rules with accepted v0.8.12/RC4 Rules.
2. Preserve the established `/editors/<uid> === true` trust boundary.
3. Isolate the newly introduced `_writeRevision` policy from authorization.
4. Keep JavaScript/domain/scoring behavior unchanged unless evidence requires otherwise.
5. Add Rules-structure regression tests for create authorization, revision validation and delete protection.
6. Repeat Team, ttScore, browser E2E, realtime, revision-conflict and autonomous smoke suites.
7. Package a full reproducible RC while documenting the minimal production diff.

## Implemented

- Parent `.write` now performs only auth/allowlist/non-delete checks.
- `_writeRevision` transition moved to child `.validate`.
- Parent schema/id validation retained.
- No JavaScript runtime change.

## Result

- Team 211/211 PASS.
- ttScore 10/10 PASS.
- Team browser E2E 19/19 PASS.
- Realtime editor PASS.
- Revision-conflict browser regression PASS.
- Autonomous smoke 6/6 PASS.

## Decision

STOP and submit RC6 for owner acceptance.
