# ttScore integration v0.6.0 + v0.12.0 RC2

Product goal: constrained Umpire Team-mode with explicit individual-match lifecycle boundaries.

- Starting baseline: accepted `ttScore 0.6.0 + ttscore_team 0.12.0 RC1`.
- Umpire terminology and one shared Umpire account model.
- `team/umpire.html` is gate/launcher only.
- Explicit `planned → current` from `Начальная расстановка` confirmation.
- Explicit confirmed `current → finished`; next match remains `planned`.
- Team-mode excludes handicap and report/general-menu actions; Live is automatic/self-healing; sound defaults OFF.
- Team Editor distinguishes final-score pending finish from ordinary running state.
- Firebase Rules and shared `/editors/<uid> = true` authorization are unchanged.
- Internal evidence: **254/254 Node PASS**, syntax PASS.
- Final credentialed production/browser E2E is not claimed in executor environment.
- Cycle decision: **ESCALATE** only for owner-controlled acceptance evidence.

Start with `docs/FINAL_CYCLE_REPORT.md`, `docs/CYCLE_RESEARCH.md`, `docs/GENERAL_REVIEW.md`, and `docs/OWNER_ACCEPTANCE_CHECKLIST.md`.
