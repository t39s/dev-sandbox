const test = require("node:test");
const assert = require("node:assert/strict");

const { modes, getMode } = require("../modes.js");

test("catalog contains exactly the three developed variants", () => {
  assert.equal(modes.length, 3);
  assert.deepEqual(
    modes.map(({ boardSize, winLength }) => [boardSize, winLength]),
    [[3, 3], [4, 4], [4, 3]],
  );
  assert.equal(new Set(modes.map((mode) => mode.id)).size, 3);
});

test("each mode has its own persisted score key", () => {
  assert.equal(new Set(modes.map((mode) => mode.storageKey)).size, 3);
  assert.equal(getMode("classic-3x3").storageKey, "ttt_score_v3");
  assert.equal(getMode("four-4x4").storageKey, "ttt_score_4x4_v1");
  assert.equal(getMode("three-4x4").storageKey, "ttt_score_4x4_k3_v1");
});
