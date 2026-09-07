# ttScore + ttScore Team integration release candidate — RC9

> RC9 fixes reconciliation after a legitimate external reorder of future Team matches. The first stale write is still blocked. After explicit `Перечитать Team`, a pending finished result can be safely rebound to the latest operational revision of the same current individual match and retried.

## Pair

- `ttScore v0.4.0` — release candidate; accepted baseline remains v0.3.5 until owner acceptance.
- `ttscore_team v0.9.0` — release candidate; accepted baseline remains v0.8.12 until owner acceptance.

## Runtime diff from RC8

Only:

- `ttScore_0.4.0.html`
- `team/assets/0.9.0/team-integration-contract.mjs`
- `team/assets/0.9.0/ttscore-team-adapter.mjs`

Unchanged from RC8:

- `team/assets/0.9.0/firebase-source.mjs`
- `firebase-database-rules.json`

## Recovery semantics

1. External administrative reorder while a personal match is active changes operational revision.
2. Final publication from the stale binding is rejected and the result remains in `pendingRelease`.
3. Realtime/reconnect does not silently rebase the pending result.
4. Explicit `Перечитать Team` reads the latest assignment.
5. If the same individual match identity is still current, the pending binding is persisted with the latest revision and retried.
6. The transition is then calculated from the latest Team order, so the administrator's reordered next match becomes `current`.
7. Any additional external change after the refresh is rejected again.

## Deployment over RC8

Replace the three runtime files listed above. Do not change Firebase Database Rules. Hard reload open `ttScore` pages before acceptance testing.

## Verification

- Team Node: **215/215 PASS**.
- `ttScore` Node: **11/11 PASS**.
- Team browser E2E: **19/19 PASS**.
- pending-rebase browser E2E: **10/10 PASS**.
- autonomous browser smoke: **6/6 PASS**.
- realtime editor: **PASS**.
- external revision guard: **PASS**.
- same-client write race: **PASS**.

See `docs/RC9_PENDING_RELEASE_REBASE.md` and `docs/OWNER_ACCEPTANCE_CHECKLIST.md`.
