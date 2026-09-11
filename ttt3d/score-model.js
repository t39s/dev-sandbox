(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TTT3DScore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function initialScore() {
    return Object.freeze({ human: 0, algorithm: 0 });
  }
  function normalizeScore(value) {
    if (!value || typeof value !== "object") return initialScore();
    return Object.freeze({
      human: Number.isInteger(value.human) && value.human >= 0 ? value.human : 0,
      algorithm:
        Number.isInteger(value.algorithm) && value.algorithm >= 0
          ? value.algorithm : 0,
    });
  }
  function recordWin(score, winner, human, algorithm) {
    const s = normalizeScore(score);
    if (winner === human) return Object.freeze({ ...s, human: s.human + 1 });
    if (winner === algorithm)
      return Object.freeze({ ...s, algorithm: s.algorithm + 1 });
    return s;
  }
  return Object.freeze({ initialScore, normalizeScore, recordWin });
});
