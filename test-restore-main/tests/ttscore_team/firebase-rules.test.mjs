import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rules = JSON.parse(readFileSync(new URL("../../firebase-database-rules.json", import.meta.url), "utf8"));
const matchRules = rules.rules.teamMatches["$matchId"];
const revisionValidate = matchRules._writeRevision[".validate"];

function leaf(value, exists = value !== null && value !== undefined) {
  return {
    exists: () => exists,
    isNumber: () => exists && typeof value === "number" && Number.isFinite(value),
    val: () => exists ? value : null
  };
}

function objectSnapshot(value) {
  return {
    exists: () => value !== null && value !== undefined,
    child: key => leaf(value?.[key])
  };
}

function rootSnapshot(editors) {
  return {
    child(key) {
      assert.equal(key, "editors");
      return {
        child(uid) { return leaf(editors[uid]); }
      };
    }
  };
}

function evaluate(expression, names, values) {
  return Function(...names, `return (${expression});`)(...values);
}

test("RC6: create authorization остаётся совместимой с allowlist trust boundary", () => {
  assert.equal(
    matchRules[".write"],
    "auth != null && root.child('editors').child(auth.uid).val() === true && newData.exists()"
  );
  assert.doesNotMatch(matchRules[".write"], /_writeRevision|data\.exists\(\)/);

  const expr = matchRules[".write"];
  assert.equal(evaluate(expr, ["auth", "root", "newData"], [{ uid: "u1" }, rootSnapshot({ u1: true }), objectSnapshot({ id: "x" })]), true);
  assert.equal(evaluate(expr, ["auth", "root", "newData"], [{ uid: "u1" }, rootSnapshot({ u1: false }), objectSnapshot({ id: "x" })]), false);
  assert.equal(evaluate(expr, ["auth", "root", "newData"], [null, rootSnapshot({ u1: true }), objectSnapshot({ id: "x" })]), false);
});

test("RC6: transport revision валидируется на leaf, а не смешивается с parent write authorization", () => {
  assert.match(matchRules[".validate"], /'_writeRevision'/);
  assert.match(revisionValidate, /newData\.isNumber\(\)/);
  assert.match(revisionValidate, /newData\.val\(\) % 1 === 0/);
  assert.match(revisionValidate, /!data\.exists\(\) && newData\.val\(\) === 1/);
  assert.match(revisionValidate, /data\.isNumber\(\) && newData\.val\(\) === data\.val\(\) \+ 1/);
});

test("RC6: exact revision expression разрешает create/legacy migration и только N→N+1", () => {
  const allowed = (oldValue, newValue, oldExists = oldValue !== null) => evaluate(
    revisionValidate,
    ["data", "newData"],
    [leaf(oldValue, oldExists), leaf(newValue)]
  );

  assert.equal(allowed(null, 1, false), true, "create / legacy missing revision → 1");
  assert.equal(allowed(null, 2, false), false, "missing revision cannot jump to 2");
  assert.equal(allowed(1, 2), true, "1 → 2");
  assert.equal(allowed(9, 10), true, "9 → 10");
  assert.equal(allowed(1, 1), false, "stale same revision rejected");
  assert.equal(allowed(1, 3), false, "skipped revision rejected");
  assert.equal(allowed(2, 1), false, "rollback revision rejected");
  assert.equal(allowed(1, 2.5), false, "fractional revision rejected");
});

test("RC6: deletion Team node остаётся fail-closed", () => {
  assert.match(matchRules[".write"], /newData\.exists\(\)/);
  const expr = matchRules[".write"];
  assert.equal(evaluate(expr, ["auth", "root", "newData"], [{ uid: "u1" }, rootSnapshot({ u1: true }), objectSnapshot(null)]), false);
});
