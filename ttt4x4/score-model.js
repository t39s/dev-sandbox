(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.TTTScore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function createInitialScore() {
    return { human: 0, algorithm: 0, draws: 0 };
  }

  function toCounter(value) {
    return Number.isInteger(value) && value >= 0 ? value : 0;
  }

  function normalizeScore(value) {
    if (!value || typeof value !== "object") return createInitialScore();
    return {
      human: toCounter(value.human),
      algorithm: toCounter(value.algorithm),
      draws: toCounter(value.draws),
    };
  }

  function recordResult(score, state, humanPlayer = "X", algorithmPlayer = "O") {
    const next = normalizeScore(score);
    if (!state || typeof state !== "object") return next;

    if (state.gameStatus === "draw") {
      return { ...next, draws: next.draws + 1 };
    }
    if (state.gameStatus !== "won") return next;
    if (state.winner === humanPlayer) {
      return { ...next, human: next.human + 1 };
    }
    if (state.winner === algorithmPlayer) {
      return { ...next, algorithm: next.algorithm + 1 };
    }
    return next;
  }

  return Object.freeze({ createInitialScore, normalizeScore, recordResult });
});
