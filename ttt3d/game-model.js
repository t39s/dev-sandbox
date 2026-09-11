(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TTT3DGame = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PLAYERS = Object.freeze({ X: "X", O: "O" });
  const GAME_STATUS = Object.freeze({
    PLAYING: "playing",
    WON: "won",
    DRAW: "draw",
  });

  const DIRECTIONS = Object.freeze((() => {
    const result = [];
    for (let dl = -1; dl <= 1; dl += 1) {
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (dl === 0 && dr === 0 && dc === 0) continue;
          const first = [dl, dr, dc].find((v) => v !== 0);
          if (first > 0) result.push(Object.freeze([dl, dr, dc]));
        }
      }
    }
    return result;
  })());

  function cellCount(rules) {
    return rules.size ** 3;
  }

  function validRules(rules) {
    return Boolean(
      rules &&
      Number.isInteger(rules.size) &&
      Number.isInteger(rules.winLength) &&
      rules.size >= 3 &&
      rules.winLength >= 3 &&
      rules.winLength <= rules.size
    );
  }

  function coordinatesToIndex(rules, layer, row, column) {
    if (!validRules(rules)) return null;
    const n = rules.size;
    if (![layer, row, column].every(
      (v) => Number.isInteger(v) && v >= 1 && v <= n
    )) return null;
    return (layer - 1) * n * n + (row - 1) * n + column - 1;
  }

  function indexToCoordinates(rules, index) {
    if (!validRules(rules) || !Number.isInteger(index)) return null;
    const n = rules.size;
    if (index < 0 || index >= n ** 3) return null;
    const layer = Math.floor(index / (n * n)) + 1;
    const local = index % (n * n);
    return Object.freeze({
      layer,
      row: Math.floor(local / n) + 1,
      column: (local % n) + 1,
    });
  }

  function classifyDirection([dl, dr, dc]) {
    const nonZero = [dl, dr, dc].filter((v) => v !== 0).length;
    if (nonZero === 1) return "axis";
    if (nonZero === 2) return "planar-diagonal";
    return "space-diagonal";
  }

  function generateWinningLines(rules) {
    if (!validRules(rules)) return Object.freeze([]);
    const n = rules.size;
    const k = rules.winLength;
    const lines = [];
    const seen = new Set();
    const inside = (v) => v >= 0 && v < n;

    for (const direction of DIRECTIONS) {
      const [dl, dr, dc] = direction;
      for (let l = 0; l < n; l += 1) {
        for (let r = 0; r < n; r += 1) {
          for (let c = 0; c < n; c += 1) {
            const end = [
              l + (k - 1) * dl,
              r + (k - 1) * dr,
              c + (k - 1) * dc,
            ];
            if (!end.every(inside)) continue;

            const cells = Array.from({ length: k }, (_, step) =>
              coordinatesToIndex(
                rules,
                l + step * dl + 1,
                r + step * dr + 1,
                c + step * dc + 1,
              )
            );

            const key = [...cells].sort((a, b) => a - b).join("-");
            if (seen.has(key)) continue;
            seen.add(key);
            lines.push(Object.freeze({
              cells: Object.freeze(cells),
              type: classifyDirection(direction),
              direction,
            }));
          }
        }
      }
    }

    return Object.freeze(lines);
  }

  function createGame(rules) {
    if (!validRules(rules)) throw new TypeError("Invalid rules");

    const frozenRules = Object.freeze({
      size: rules.size,
      winLength: rules.winLength,
    });
    const winningLines = generateWinningLines(frozenRules);
    const count = cellCount(frozenRules);
    const lineIdsByCell = Object.freeze(
      Array.from({ length: count }, (_, index) =>
        Object.freeze(winningLines.flatMap((line, id) =>
          line.cells.includes(index) ? [id] : []
        ))
      )
    );

    function getWinningLine(board, player) {
      if (!Array.isArray(board) || board.length !== count) return null;
      return winningLines.find((line) =>
        line.cells.every((index) => board[index] === player)
      ) ?? null;
    }

    function createInitialState() {
      return Object.freeze({
        board: Object.freeze(Array(count).fill(null)),
        currentPlayer: PLAYERS.X,
        gameStatus: GAME_STATUS.PLAYING,
        winner: null,
        winningLine: null,
        moves: 0,
      });
    }

    function makeMove(state, index) {
      if (
        !state ||
        state.gameStatus !== GAME_STATUS.PLAYING ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= count ||
        state.board[index] !== null
      ) return state;

      const board = [...state.board];
      board[index] = state.currentPlayer;
      const winningLine = getWinningLine(board, state.currentPlayer);
      const moves = state.moves + 1;

      if (winningLine) {
        return Object.freeze({
          board: Object.freeze(board),
          currentPlayer: state.currentPlayer,
          gameStatus: GAME_STATUS.WON,
          winner: state.currentPlayer,
          winningLine,
          moves,
        });
      }

      if (moves === count) {
        return Object.freeze({
          board: Object.freeze(board),
          currentPlayer: state.currentPlayer,
          gameStatus: GAME_STATUS.DRAW,
          winner: null,
          winningLine: null,
          moves,
        });
      }

      return Object.freeze({
        board: Object.freeze(board),
        currentPlayer:
          state.currentPlayer === PLAYERS.X ? PLAYERS.O : PLAYERS.X,
        gameStatus: GAME_STATUS.PLAYING,
        winner: null,
        winningLine: null,
        moves,
      });
    }

    return Object.freeze({
      rules: frozenRules,
      cellCount: count,
      winningLines,
      lineIdsByCell,
      getWinningLine,
      createInitialState,
      makeMove,
      coordinatesToIndex: (l, r, c) =>
        coordinatesToIndex(frozenRules, l, r, c),
      indexToCoordinates: (index) =>
        indexToCoordinates(frozenRules, index),
      lineParticipation: (index) =>
        Number.isInteger(index) && index >= 0 && index < count
          ? lineIdsByCell[index].length
          : 0,
    });
  }

  return Object.freeze({
    PLAYERS,
    GAME_STATUS,
    DIRECTIONS,
    validRules,
    cellCount,
    coordinatesToIndex,
    indexToCoordinates,
    generateWinningLines,
    createGame,
  });
});
