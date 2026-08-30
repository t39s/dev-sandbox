const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../score-model.js");

test("normalization accepts legacy two-counter classic score", () => {
  assert.deepEqual(S.normalizeScore({ algorithm: 3, draws: 4 }), {
    human: 0,
    algorithm: 3,
    draws: 4,
  });
});

test("result counters remain generic for all modes", () => {
  let score = S.createInitialScore();
  score = S.recordResult(score, { gameStatus: "won", winner: "X" });
  score = S.recordResult(score, { gameStatus: "draw", winner: null });
  score = S.recordResult(score, { gameStatus: "won", winner: "O" });
  assert.deepEqual(score, { human: 1, draws: 1, algorithm: 1 });
});
