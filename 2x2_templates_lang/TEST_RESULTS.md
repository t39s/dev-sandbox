# Test results — 2x2 prototype

Дата: 2026-09-19

## Source baseline

- Repository: `t39s/2x2`
- Branch: `gh-pages`
- Commit checked before implementation: `7da35e81e484051f0b9bb4936cc55190bf34023d`
- Repository/publication modified: no

## Automated core tests

Command:

```bash
node tests/core.test.js
```

Result:

```text
17 passed, 0 failed
```

Covered: language arithmetic, precedence, exact division/remainder semantics, structural rejection, dependency cycle, pool generation, pool shortage/empty pool, and the complete 64-expression legacy regression set.

## JSON Schema validation

Validator: Python `jsonschema`, Draft 2020-12.

- `data/templates.json`: PASS
- `data/demo-templates.json`: PASS

## Static safety checks

- `core.js` syntax: PASS (`node -c`)
- `app.js` syntax: PASS (`node -c`)
- runtime search for `eval(` / `Function(`: no matches

## Not executed here

- Real browser end-to-end interaction.
- Real Safari/iPhone acceptance.
- Performance measurement for the maximum permitted pool on target hardware.

Those claims are intentionally not marked as verified.
