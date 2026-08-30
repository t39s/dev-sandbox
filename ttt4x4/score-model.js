(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.TTTScore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function createInitialScore() {
    return {
      algorithm: 0,
      draws: 0,
    };
  }

  function toNonNegativeInteger(value) {
    return Number.isInteger(value) && value >= 0 ? value : 0;
  }

  function normalizeScore(value) {
    if (!value || typeof value !== "object") {
      return createInitialScore();
    }

    return {
      algorithm: toNonNegativeInteger(value.algorithm),
      draws: toNonNegativeInteger(value.draws),
    };
  }

  function recordResult(
    score,
    gameState,
    humanPlayer = "X",
    algorithmPlayer = "O",
  ) {
    const nextScore = normalizeScore(score);

    if (!gameState || typeof gameState !== "object") {
      return nextScore;
    }

    if (
      gameState.gameStatus === "won" &&
      gameState.winner === algorithmPlayer
    ) {
      return {
        ...nextScore,
        algorithm: nextScore.algorithm + 1,
      };
    }

    if (gameState.gameStatus === "draw") {
      return {
        ...nextScore,
        draws: nextScore.draws + 1,
      };
    }

    // A human win is intentionally not part of the score model for this mode:
    // the perfect algorithm is exhaustively tested to be non-losing.
    return nextScore;
  }

  return Object.freeze({
    createInitialScore,
    normalizeScore,
    recordResult,
  });
});
