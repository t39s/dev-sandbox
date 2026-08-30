(function (root, factory) {
  const gameApi =
    typeof module === "object" && module.exports
      ? require("./game-model.js")
      : root.TTTGame;
  const api = factory(gameApi);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.TTTAI = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (TTTGame) {
  if (!TTTGame) {
    throw new Error("TTTGame is required before TTTAI");
  }

  const {
    PLAYERS,
    GAME_STATUS,
    makeMove,
  } = TTTGame;

  // Stable tie-breaker among equally optimal moves: center, corners, edges.
  // Minimax determines correctness; this order only makes equal outcomes deterministic.
  const MOVE_PRIORITY = Object.freeze([4, 0, 2, 6, 8, 1, 3, 5, 7]);

  function isValidPlayer(player) {
    return player === PLAYERS.X || player === PLAYERS.O;
  }

  function isValidBoard(board) {
    return (
      Array.isArray(board) &&
      board.length === 9 &&
      board.every(
        (value) =>
          value === null ||
          value === PLAYERS.X ||
          value === PLAYERS.O,
      )
    );
  }

  function getOpponent(player) {
    if (!isValidPlayer(player)) {
      return null;
    }

    return player === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
  }

  function getAvailableMoves(board) {
    if (!isValidBoard(board)) {
      return [];
    }

    return MOVE_PRIORITY.filter((index) => board[index] === null);
  }

  function getTerminalScore(state, aiPlayer, depth) {
    if (state.gameStatus === GAME_STATUS.DRAW) {
      return 0;
    }

    if (state.gameStatus === GAME_STATUS.WON) {
      return state.winner === aiPlayer ? 10 - depth : depth - 10;
    }

    return null;
  }

  function getMemoKey(state, aiPlayer) {
    const boardKey = state.board.map((value) => value ?? "_").join("");
    return `${boardKey}|${state.currentPlayer}|${aiPlayer}`;
  }

  function minimax(state, aiPlayer, depth, memo) {
    const terminalScore = getTerminalScore(state, aiPlayer, depth);

    if (terminalScore !== null) {
      return terminalScore;
    }

    const memoKey = getMemoKey(state, aiPlayer);

    if (memo.has(memoKey)) {
      return memo.get(memoKey);
    }

    const availableMoves = getAvailableMoves(state.board);
    const maximizing = state.currentPlayer === aiPlayer;
    let bestScore = maximizing ? -Infinity : Infinity;

    for (const move of availableMoves) {
      const nextState = makeMove(state, move);
      const score = minimax(nextState, aiPlayer, depth + 1, memo);

      if (maximizing) {
        bestScore = Math.max(bestScore, score);
      } else {
        bestScore = Math.min(bestScore, score);
      }
    }

    memo.set(memoKey, bestScore);
    return bestScore;
  }

  function getBestMove(state, aiPlayer = PLAYERS.O) {
    if (!state || typeof state !== "object") {
      return null;
    }

    if (
      !isValidPlayer(aiPlayer) ||
      !isValidBoard(state.board) ||
      state.gameStatus !== GAME_STATUS.PLAYING ||
      !isValidPlayer(state.currentPlayer) ||
      state.currentPlayer !== aiPlayer
    ) {
      return null;
    }

    const availableMoves = getAvailableMoves(state.board);

    if (availableMoves.length === 0) {
      return null;
    }

    const memo = new Map();
    let bestMove = availableMoves[0];
    let bestScore = -Infinity;

    for (const move of availableMoves) {
      const nextState = makeMove(state, move);
      const score = minimax(nextState, aiPlayer, 1, memo);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  return Object.freeze({
    MOVE_PRIORITY,
    getOpponent,
    getAvailableMoves,
    getBestMove,
  });
});
