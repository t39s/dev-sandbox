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
  if (!TTTGame) throw new Error("TTTGame is required before TTTAI");

  const { PLAYERS, GAME_STATUS, isValidBoard, makeMove } = TTTGame;
  const exactCache = new Map();
  const movePriorityCache = new Map();
  const WIN_SCORE = 1_000_000;

  function isValidPlayer(player) {
    return player === PLAYERS.X || player === PLAYERS.O;
  }

  function getOpponent(player) {
    if (!isValidPlayer(player)) return null;
    return player === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
  }

  function getMovePriority(rules) {
    if (!rules) return [];
    if (movePriorityCache.has(rules.key)) {
      return movePriorityCache.get(rules.key);
    }

    const participation = Array(rules.boardCells).fill(0);
    for (const line of rules.winningCombinations) {
      for (const index of line) participation[index] += 1;
    }

    const center = (rules.boardSize - 1) / 2;
    const priority = Object.freeze(
      Array.from({ length: rules.boardCells }, (_, index) => index).sort(
        (a, b) => {
          if (participation[b] !== participation[a]) {
            return participation[b] - participation[a];
          }

          const ar = Math.floor(a / rules.boardSize);
          const ac = a % rules.boardSize;
          const br = Math.floor(b / rules.boardSize);
          const bc = b % rules.boardSize;
          const ad = Math.abs(ar - center) + Math.abs(ac - center);
          const bd = Math.abs(br - center) + Math.abs(bc - center);
          return ad - bd || a - b;
        },
      ),
    );

    movePriorityCache.set(rules.key, priority);
    return priority;
  }

  function getAvailableMoves(board, rules) {
    if (!isValidBoard(board, rules)) return [];
    return getMovePriority(rules).filter((index) => board[index] === null);
  }

  function findImmediateWinningMoves(state, rules, player) {
    if (
      !state ||
      typeof state !== "object" ||
      !rules ||
      !isValidBoard(state.board, rules) ||
      !isValidPlayer(player)
    ) {
      return [];
    }

    const probe = {
      ...state,
      currentPlayer: player,
      gameStatus: GAME_STATUS.PLAYING,
      winner: null,
      winningCombination: null,
    };

    const wins = [];
    for (const move of getAvailableMoves(state.board, rules)) {
      const next = makeMove(probe, rules, move);
      if (next.gameStatus === GAME_STATUS.WON && next.winner === player) {
        wins.push(move);
      }
    }
    return wins;
  }

  function encodeState(state, rules) {
    let encoded = 0;
    let factor = 1;
    for (const value of state.board) {
      const digit = value === PLAYERS.X ? 1 : value === PLAYERS.O ? 2 : 0;
      encoded += digit * factor;
      factor *= 3;
    }
    return `${rules.key}:${encoded}:${state.currentPlayer}`;
  }

  function solveExact(state, rules) {
    if (
      !state ||
      !rules ||
      !isValidBoard(state.board, rules) ||
      state.gameStatus !== GAME_STATUS.PLAYING ||
      !isValidPlayer(state.currentPlayer)
    ) {
      return null;
    }

    const key = encodeState(state, rules);
    if (exactCache.has(key)) return exactCache.get(key);

    const currentPlayer = state.currentPlayer;
    const immediateWins = findImmediateWinningMoves(state, rules, currentPlayer);
    if (immediateWins.length > 0) {
      exactCache.set(key, 1);
      return 1;
    }

    const opponent = getOpponent(currentPlayer);
    const threats = findImmediateWinningMoves(state, rules, opponent);
    if (threats.length >= 2) {
      exactCache.set(key, -1);
      return -1;
    }

    const moves =
      threats.length === 1 ? threats : getAvailableMoves(state.board, rules);
    let best = -1;

    for (const move of moves) {
      const next = makeMove(state, rules, move);
      const value =
        next.gameStatus === GAME_STATUS.DRAW ? 0 : -solveExact(next, rules);
      if (value > best) best = value;
      if (best === 1) break;
    }

    exactCache.set(key, best);
    return best;
  }

  function getExactBestMove(state, rules, player) {
    const moves = getAvailableMoves(state.board, rules);
    if (moves.length === 0) return null;

    const ownWins = findImmediateWinningMoves(state, rules, player);
    if (ownWins.length > 0) return ownWins[0];

    const opponent = getOpponent(player);
    const threats = findImmediateWinningMoves(state, rules, opponent);
    if (threats.length > 0) return threats[0];

    let bestMove = moves[0];
    let bestValue = -2;

    for (const move of moves) {
      const next = makeMove(state, rules, move);
      const value =
        next.gameStatus === GAME_STATUS.DRAW ? 0 : -solveExact(next, rules);
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
      if (bestValue === 1) break;
    }

    return bestMove;
  }

  function getSearchDepth(emptyCount, rules) {
    if (!rules || !Number.isInteger(emptyCount) || emptyCount < 0) return 0;
    if (rules.boardSize !== 4 || rules.winLength !== 4) return emptyCount;
    if (emptyCount <= 9) return emptyCount;
    if (emptyCount <= 11) return 7;
    if (emptyCount <= 13) return 6;
    return 5;
  }

  function getLineWeights(winLength) {
    if (winLength === 4) {
      // Preserve the heuristic from ttt 0.3.0 exactly.
      return [0, 2, 18, 180, 20_000];
    }

    const weights = [0];
    for (let count = 1; count <= winLength; count += 1) {
      weights.push(count === winLength ? 20_000 : 2 * 10 ** (count - 1));
    }
    return weights;
  }

  function evaluateBoard(board, rules, aiPlayer) {
    if (!rules || !isValidBoard(board, rules) || !isValidPlayer(aiPlayer)) {
      return 0;
    }

    const opponent = getOpponent(aiPlayer);
    const weights = getLineWeights(rules.winLength);
    let score = 0;

    for (const line of rules.winningCombinations) {
      let aiCount = 0;
      let opponentCount = 0;

      for (const index of line) {
        if (board[index] === aiPlayer) aiCount += 1;
        if (board[index] === opponent) opponentCount += 1;
      }

      if (aiCount > 0 && opponentCount > 0) continue;
      if (aiCount > 0) score += weights[aiCount];
      if (opponentCount > 0) score -= weights[opponentCount];
    }

    return score;
  }

  function terminalScore(state, aiPlayer, ply) {
    if (state.gameStatus === GAME_STATUS.DRAW) return 0;
    if (state.gameStatus !== GAME_STATUS.WON) return null;
    return state.winner === aiPlayer ? WIN_SCORE - ply : -WIN_SCORE + ply;
  }

  function alphaBeta(state, rules, aiPlayer, depth, alpha, beta, ply) {
    const terminal = terminalScore(state, aiPlayer, ply);
    if (terminal !== null) return terminal;
    if (depth <= 0) return evaluateBoard(state.board, rules, aiPlayer);

    const moves = getAvailableMoves(state.board, rules);
    const maximizing = state.currentPlayer === aiPlayer;

    if (maximizing) {
      let value = -Infinity;
      for (const move of moves) {
        value = Math.max(
          value,
          alphaBeta(
            makeMove(state, rules, move),
            rules,
            aiPlayer,
            depth - 1,
            alpha,
            beta,
            ply + 1,
          ),
        );
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break;
      }
      return value;
    }

    let value = Infinity;
    for (const move of moves) {
      value = Math.min(
        value,
        alphaBeta(
          makeMove(state, rules, move),
          rules,
          aiPlayer,
          depth - 1,
          alpha,
          beta,
          ply + 1,
        ),
      );
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return value;
  }

  function getAlphaBetaBestMove(state, rules, player) {
    const moves = getAvailableMoves(state.board, rules);
    if (moves.length === 0) return null;

    const ownWins = findImmediateWinningMoves(state, rules, player);
    if (ownWins.length > 0) return ownWins[0];

    const opponent = getOpponent(player);
    const threats = findImmediateWinningMoves(state, rules, opponent);
    if (threats.length > 0) return threats[0];

    const depth = getSearchDepth(moves.length, rules);
    let bestMove = moves[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;

    for (const move of moves) {
      const score = alphaBeta(
        makeMove(state, rules, move),
        rules,
        player,
        Math.max(0, depth - 1),
        alpha,
        Infinity,
        1,
      );
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
    }

    return bestMove;
  }

  function getBestMove(state, rules, strategy, player = PLAYERS.O) {
    if (
      !state ||
      !rules ||
      !isValidPlayer(player) ||
      !isValidBoard(state.board, rules) ||
      state.gameStatus !== GAME_STATUS.PLAYING ||
      state.currentPlayer !== player
    ) {
      return null;
    }

    if (strategy === "exact") {
      return getExactBestMove(state, rules, player);
    }
    if (strategy === "alpha-beta") {
      return getAlphaBetaBestMove(state, rules, player);
    }
    return null;
  }

  function clearExactCache() {
    exactCache.clear();
  }

  return Object.freeze({
    getOpponent,
    getMovePriority,
    getAvailableMoves,
    findImmediateWinningMoves,
    solveExact,
    getSearchDepth,
    getLineWeights,
    evaluateBoard,
    getBestMove,
    clearExactCache,
  });
});
