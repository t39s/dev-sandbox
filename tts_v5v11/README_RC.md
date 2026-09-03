# ttScore integration v0.6.0 + v0.12.0 RC1

Product goal: **Judge / Administrator — Trusted-Role Model**.

- Start baseline: accepted `ttScore 0.5.0 + ttscore_team 0.11.0 RC1`.
- `ttScore 0.6.0`: Team Judge presentation via `role=judge`; scoring/operational semantics preserved.
- `ttscore_team 0.12.0`: explicit Administrator UI + separate minimal Judge entrypoint.
- Firebase Team Auth: session/tab scoped for practical separate Judge/Admin accounts.
- Authorization: unchanged shared `/editors/<uid> = true`.
- Firebase Rules, CAS, report backup, Team transitions and Team-level Undo: unchanged by architecture.
- Internal evidence: **252/252 Node PASS**, syntax/integrity PASS.
- Browser/credentialed production E2E: not claimed in executor environment.
- Cycle decision: **ESCALATE** only for owner-controlled production acceptance.

Start with `docs/FINAL_CYCLE_REPORT.md`, `docs/TRUSTED_ROLE_MODEL.md`, and `docs/OWNER_ACCEPTANCE_CHECKLIST.md`.
