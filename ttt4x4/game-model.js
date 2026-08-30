(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.TTTGame = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PLAYERS = Object.freeze({ X: "X", O: "O" });
  const GAME_STATUS = Object.freeze({
    PLAYING: "playing",
    WON: "won",
    DRAW: "draw",
  });

  const rulesCache = new Map();

  function buildWinningCombinations(boardSize, winLength) {
    const lines = [];
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    for (let row = 0; row < boardSize; row += 1) {
      for (let column = 0; column < boardSize; column += 1) {
        for (const [rowStep, columnStep] of directions) {
          const endRow = row + rowStep * (winLength - 1);
          const endColumn = column + columnStep * (winLength - 1);

          if (
            endRow < 0 ||
            endRow >= boardSize ||
            endColumn < 0 ||
            endColumn >= boardSize
          ) {
            continue;
          }

          lines.push(
            Object.freeze(
              Array.from({ length: winLength }, (_, offset) => {
                const lineRow = row + rowStep * offset;
                const lineColumn = column + columnStep * offset;
                return lineRow * boardSize + lineColumn;
              }),
            ),
          );
        }
      }
    }

    return Object.freeze(lines);
  }

  function createRules(boardSize, winLength) {
    if (
      !Number.isInteger(boardSize) ||
      !Number.isInteger(winLength) ||
      boardSize < 3 ||
      winLength < 3 ||
      winLength > boardSize
    ) {
      return null;
    }

    const key = `${boardSize}x${boardSize}-k${winLength}`;
    if (rulesCache.has(key)) return rulesCache.get(key);

    const rules = Object.freeze({
      key,
      boardSize,
      winLength,
      boardCells: boardSize * boardSize,
      winningCombinations: buildWinningCombinations(boardSize, winLength),
    });
    rulesCache.set(key, rules);
    return rules;
  }

  function createInitialState(rules) {
    if (!rules) return null;

    return {
      board: Array(rules.boardCells).fill(null),
      currentPlayer: PLAYERS.X,
      gameStatus: GAME_STATUS.PLAYING,
      winner: null,
      winningCombination: null,
    };
  }

  function isValidBoard(board, rules) {
    return (
      Boolean(rules) &&
      Array.isArray(board) &&
      board.length === rules.boardCells &&
      board.every(
        (value) =>
          value === null || value === PLAYERS.X || value === PLAYERS.O,
      )
    );
  }

  function getWinningCombination(board, rules) {
    if (!isValidBoard(board, rules)) return null;

    return (
      rules.winningCombinations.find((line) => {
        const first = board[line[0]];
        return first !== null && line.every((index) => board[index] === first);
      }) ?? null
    );
  }

  function makeMove(state, rules, index) {
    if (
      !state ||
      typeof state !== "object" ||
      !rules ||
      !isValidBoard(state.board, rules) ||
      state.gameStatus !== GAME_STATUS.PLAYING ||
      (state.currentPlayer !== PLAYERS.X && state.currentPlayer !== PLAYERS.O)
    ) {
      return state;
    }

    if (!Number.isInteger(index) || index < 0 || index >= rules.boardCells) {
      return state;
    }

    if (state.board[index] !== null) return state;

    const board = [...state.board];
    board[index] = state.currentPlayer;
    const winningCombination = getWinningCombination(board, rules);

    if (winningCombination) {
      return {
        ...state,
        board,
        gameStatus: GAME_STATUS.WON,
        winner: state.currentPlayer,
        winningCombination,
      };
    }

    if (board.every((value) => value !== null)) {
      return {
        ...state,
        board,
        gameStatus: GAME_STATUS.DRAW,
        winner: null,
        winningCombination: null,
      };
    }

    return {
      ...state,
      board,
      currentPlayer:
        state.currentPlayer === PLAYERS.X ? PLAYERS.O : PLAYERS.X,
    };
  }

  return Object.freeze({
    PLAYERS,
    GAME_STATUS,
    createRules,
    createInitialState,
    isValidBoard,
    getWinningCombination,
    makeMove,
  });
});
