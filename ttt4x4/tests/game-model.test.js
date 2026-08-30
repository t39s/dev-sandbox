const test = require("node:test");
const assert = require("node:assert/strict");

const G = require("../game-model.js");

const cases = [
  { size: 3, win: 3, lines: 8 },
  { size: 4, win: 4, lines: 10 },
  { size: 4, win: 3, lines: 24 },
];

for (const item of cases) {
  test(`${item.size}x${item.size} / ${item.win} builds expected lines`, () => {
    const rules = G.createRules(item.size, item.win);
    assert.equal(rules.boardCells, item.size ** 2);
    assert.equal(rules.winningCombinations.length, item.lines);
    assert.equal(new Set(rules.winningCombinations.map((line) => line.join(","))).size, item.lines);
  });

  test(`${item.size}x${item.size} / ${item.win} detects every winning line`, () => {
    const rules = G.createRules(item.size, item.win);
    for (const line of rules.winningCombinations) {
      const board = Array(rules.boardCells).fill(null);
      line.forEach((index) => { board[index] = G.PLAYERS.X; });
      assert.deepEqual(G.getWinningCombination(board, rules), line);
    }
  });
}

test("rules objects are cached and invalid rules are rejected", () => {
  assert.strictEqual(G.createRules(4, 3), G.createRules(4, 3));
  assert.equal(G.createRules(2, 2), null);
  assert.equal(G.createRules(4, 5), null);
});

test("makeMove uses the supplied rules rather than global board assumptions", () => {
  const r3 = G.createRules(3, 3);
  const r4 = G.createRules(4, 4);
  let s3 = G.createInitialState(r3);
  let s4 = G.createInitialState(r4);

  s3 = G.makeMove(s3, r3, 8);
  s4 = G.makeMove(s4, r4, 15);

  assert.equal(s3.board.length, 9);
  assert.equal(s4.board.length, 16);
  assert.equal(s3.board[8], "X");
  assert.equal(s4.board[15], "X");
});
