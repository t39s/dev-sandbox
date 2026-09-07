# Next Cycle Brief — RC9

## Current state

RC8 was production-tested: its false same-client finalization conflict is fixed. Owner testing then exposed a separate recovery defect after a legitimate administrator reorder of future matches. RC9 implements explicit safe pending-result rebase after `Перечитать Team`.

## Evidence

Team Node 215/215, `ttScore` Node 11/11, normal Team browser 19/19, new pending-rebase browser 10/10, autonomous browser 6/6, realtime editor PASS, external revision guard PASS, same-client write race PASS. Rules and `firebase-source.mjs` are byte-identical RC8.

## Known limitations

Production owner acceptance of the new explicit recovery path is still required. RC9 does not introduce Judge/Admin authorization roles or Team-level Undo.

## Gap

Confirm in production that after an administrator reorders future planned matches, finalization first blocks stale publication and `Перечитать Team` then completes the pending result using the new order without leaving `ttScore`.

## Recommended next target

Owner acceptance RC9. If accepted, freeze `ttScore 0.4.0` / `ttscore_team 0.9.0` as the integration baseline before starting the separately agreed Judge/Admin capability split and Team-level one-step Undo design.

## Decision

STABILIZE

## Reason

The reported defect is locally corrected with targeted evidence and unchanged concurrency protections; the remaining uncertainty is production acceptance, not architecture or implementation.
