const test = require("node:test");
const assert = require("node:assert/strict");

const G = require("../game-model.js");
const A = require("../ai-model.js");

function playOptimalHumanBranches(state, rules, strategy, outcomes) {
  if (state.gameStatus !== G.GAME_STATUS.PLAYING) {
    outcomes.push(state.winner ?? "draw");
    return;
  }

  if (state.currentPlayer === G.PLAYERS.O) {
    const move = A.getBestMove(state, rules, strategy, G.PLAYERS.O);
    playOptimalHumanBranches(G.makeMove(state, rules, move), rules, strategy, outcomes);
    return;
  }

  for (const move of A.getAvailableMoves(state.board, rules)) {
    playOptimalHumanBranches(G.makeMove(state, rules, move), rules, strategy, outcomes);
  }
}

test("3x3 exact algorithm never loses against any human line", () => {
  const rules = G.createRules(3, 3);
  const outcomes = [];
  A.clearExactCache();
  playOptimalHumanBranches(G.createInitialState(rules), rules, "exact", outcomes);
  assert.ok(outcomes.length > 0);
  assert.equal(outcomes.includes(G.PLAYERS.X), false);
});

test("4x4 / 3 exact solver confirms the first player can force a win", () => {
  const rules = G.createRules(4, 3);
  A.clearExactCache();
  assert.equal(A.solveExact(G.createInitialState(rules), rules), 1);
});

test("4x4 / 4 alpha-beta blocks immediate threat", () => {
  const rules = G.createRules(4, 4);
  const board = [
    "X", "X", "X", null,
    "O", null, null, null,
    null, null, null, null,
    null, null, null, null,
  ];
  const state = {
    board,
    currentPlayer: G.PLAYERS.O,
    gameStatus: G.GAME_STATUS.PLAYING,
    winner: null,
    winningCombination: null,
  };
  assert.equal(A.getBestMove(state, rules, "alpha-beta", G.PLAYERS.O), 3);
});

test("strategy router rejects unknown strategy", () => {
  const rules = G.createRules(3, 3);
  let state = G.createInitialState(rules);
  state = G.makeMove(state, rules, 0);
  assert.equal(A.getBestMove(state, rules, "unknown", G.PLAYERS.O), null);
});

test("4x4 / 4 preserves the heuristic weights from the developed variant", () => {
  assert.deepEqual(A.getLineWeights(4), [0, 2, 18, 180, 20_000]);
  const rules = G.createRules(4, 4);
  assert.equal(A.getSearchDepth(14, rules), 5);
  assert.equal(A.getSearchDepth(13, rules), 6);
  assert.equal(A.getSearchDepth(11, rules), 7);
  assert.equal(A.getSearchDepth(9, rules), 9);
});

test("4x4 / 3 exact value remains losing for O after every X opening", () => {
  const rules = G.createRules(4, 3);
  A.clearExactCache();
  for (let first = 0; first < 16; first += 1) {
    let state = G.createInitialState(rules);
    state = G.makeMove(state, rules, first);
    assert.equal(A.solveExact(state, rules), -1);
  }
});
