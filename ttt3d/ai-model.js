(function (root, factory) {
  const Game =
    typeof module === "object" && module.exports
      ? require("./game-model.js")
      : root.TTT3DGame;
  const api = factory(Game);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TTT3DAI = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Game) {
  const { PLAYERS } = Game;
  const WIN = 1_000_000;

  function opponent(player) {
    return player === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
  }

  function available(board) {
    return board.flatMap((cell, index) => cell === null ? [index] : []);
  }

  function place(board, move, player) {
    const next = [...board];
    next[move] = player;
    return next;
  }

  function immediateWins(game, board, player) {
    return available(board).filter((move) =>
      Boolean(game.getWinningLine(place(board, move, player), player))
    );
  }

  function lineValue(game, board, cells, algorithmPlayer) {
    const other = opponent(algorithmPlayer);
    let own = 0, theirs = 0;
    for (const index of cells) {
      if (board[index] === algorithmPlayer) own += 1;
      else if (board[index] === other) theirs += 1;
    }
    if (own && theirs) return 0;
    const k = game.rules.winLength;
    if (own === k) return WIN;
    if (theirs === k) return -WIN;
    const weights =
      k === 3 ? [0, 4, 60, WIN] : [0, 2, 14, 180, WIN];
    if (own) return weights[own];
    if (theirs) return -weights[theirs] * 1.12;
    return 0;
  }

  function evaluate(game, board, algorithmPlayer) {
    let score = 0;
    for (const line of game.winningLines) {
      score += lineValue(game, board, line.cells, algorithmPlayer);
    }
    for (let i = 0; i < board.length; i += 1) {
      if (board[i] === null) continue;
      const p = game.lineParticipation(i);
      score += board[i] === algorithmPlayer ? p * 0.5 : -p * 0.55;
    }
    return score;
  }

  function threatCount(game, board, player) {
    return immediateWins(game, board, player).length;
  }

  function movePriority(game, board, move, player) {
    const after = place(board, move, player);
    const ownThreats = threatCount(game, after, player);
    const other = opponent(player);
    let blocking = 0;

    for (const lineId of game.lineIdsByCell[move]) {
      const line = game.winningLines[lineId].cells;
      const rest = line.filter((i) => i !== move);
      const opponentMarks = rest.filter((i) => board[i] === other).length;
      const empties = rest.filter((i) => board[i] === null).length;
      if (opponentMarks === game.rules.winLength - 1 && empties === 0) {
        blocking += 1;
      }
    }

    return ownThreats * 5000 + blocking * 4000 +
      game.lineParticipation(move) * 12;
  }

  function orderedMoves(game, board, player, limit = Infinity) {
    return available(board)
      .map((move) => ({ move, score: movePriority(game, board, move, player) }))
      .sort((a, b) => b.score - a.score || a.move - b.move)
      .slice(0, limit)
      .map((x) => x.move);
  }


  function cheapMovePriority(game, board, move, player) {
    const other = opponent(player);
    let score = game.lineParticipation(move) * 8;

    for (const lineId of game.lineIdsByCell[move]) {
      const line = game.winningLines[lineId].cells;
      let own = 0, theirs = 0, empty = 0;
      for (const index of line) {
        if (index === move) {
          own += 1;
        } else if (board[index] === player) {
          own += 1;
        } else if (board[index] === other) {
          theirs += 1;
        } else {
          empty += 1;
        }
      }
      if (theirs === 0) score += own * own * 18 + empty;
      if (own === 1 && theirs > 0) score += theirs * theirs * 14;
    }
    return score;
  }

  function cheapOrderedMoves(game, board, player, limit = Infinity) {
    return available(board)
      .map((move) => ({
        move,
        score: cheapMovePriority(game, board, move, player),
      }))
      .sort((a, b) => b.score - a.score || a.move - b.move)
      .slice(0, limit)
      .map((x) => x.move);
  }

  function chooseDepth(game, emptyCount) {
    if (game.rules.size === 3) {
      if (emptyCount >= 23) return 2;
      if (emptyCount >= 18) return 3;
      if (emptyCount >= 13) return 4;
      if (emptyCount >= 9) return 5;
      return Math.min(emptyCount, 7);
    }

    if (emptyCount >= 52) return 1;
    if (emptyCount >= 40) return 2;
    if (emptyCount >= 28) return 3;
    if (emptyCount >= 18) return 4;
    return Math.min(emptyCount, 5);
  }

  function alphaBeta(game, board, player, depth, alpha, beta, algorithmPlayer, search) {
    search.nodes += 1;
    if (search.nodes >= search.maxNodes) {
      search.cutoff = true;
      return evaluate(game, board, algorithmPlayer);
    }
    if (game.getWinningLine(board, algorithmPlayer)) return WIN + depth;
    if (game.getWinningLine(board, opponent(algorithmPlayer))) return -WIN - depth;
    if (depth <= 0) return evaluate(game, board, algorithmPlayer);

    const moves = available(board);
    if (!moves.length) return 0;

    const maximizing = player === algorithmPlayer;
    let best = maximizing ? -Infinity : Infinity;
    const branchLimit =
      game.rules.size === 4 && depth >= 3 ? 18 : Infinity;

    for (const move of cheapOrderedMoves(game, board, player, branchLimit)) {
      if (search.cutoff) break;
      const score = alphaBeta(
        game,
        place(board, move, player),
        opponent(player),
        depth - 1,
        alpha,
        beta,
        algorithmPlayer,
        search
      );

      if (maximizing) {
        best = Math.max(best, score);
        alpha = Math.max(alpha, best);
      } else {
        best = Math.min(best, score);
        beta = Math.min(beta, best);
      }
      if (search.cutoff || beta <= alpha) break;
    }

    return best;
  }

  function findForkMoves(game, board, player) {
    return available(board).filter((move) =>
      threatCount(game, place(board, move, player), player) >= 2
    );
  }

  function nodeBudget(game, emptyCount) {
    if (game.rules.size === 3) return 60_000;
    if (emptyCount >= 40) return 2_000;
    if (emptyCount >= 24) return 3_500;
    return 5_000;
  }

  function getBestMove(game, state, algorithmPlayer = PLAYERS.O) {
    if (!game || !state || state.currentPlayer !== algorithmPlayer) return null;
    const board = state.board;
    const moves = available(board);
    if (!moves.length) return null;

    const wins = immediateWins(game, board, algorithmPlayer);
    if (wins.length) return wins[0];

    const other = opponent(algorithmPlayer);
    const threats = immediateWins(game, board, other);
    if (threats.length === 1) return threats[0];

    const forks = findForkMoves(game, board, algorithmPlayer);
    if (forks.length) {
      return forks.sort((a, b) =>
        movePriority(game, board, b, algorithmPlayer) -
        movePriority(game, board, a, algorithmPlayer)
      )[0];
    }

    const opponentForks = findForkMoves(game, board, other);
    if (opponentForks.length === 1) return opponentForks[0];

    const depth = chooseDepth(game, moves.length);

    // Qubic opening: bounded positional choice; deep search is not useful yet.
    if (game.rules.size === 4 && moves.length >= 52) {
      return orderedMoves(game, board, algorithmPlayer)[0];
    }

    let bestMove = null;
    let bestScore = -Infinity;
    const search = {
      nodes: 0,
      maxNodes: nodeBudget(game, moves.length),
      cutoff: false,
    };
    const candidates = orderedMoves(
      game, board, algorithmPlayer,
      game.rules.size === 4 && depth >= 3 ? 20 : Infinity
    );

    for (const move of candidates) {
      const score = alphaBeta(
        game,
        place(board, move, algorithmPlayer),
        other,
        depth - 1,
        -Infinity,
        Infinity,
        algorithmPlayer,
        search
      );
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      if (search.cutoff) break;
    }
    return bestMove ?? candidates[0] ?? null;
  }

  return Object.freeze({
    opponent,
    available,
    immediateWins,
    evaluate,
    findForkMoves,
    chooseDepth,
    nodeBudget,
    cheapOrderedMoves,
    orderedMoves,
    getBestMove,
  });
});
