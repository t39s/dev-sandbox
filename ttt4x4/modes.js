(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.TTTModes = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const modes = Object.freeze([
    Object.freeze({
      id: "classic-3x3",
      boardSize: 3,
      winLength: 3,
      shortLabel: "3×3",
      ruleLabel: "3 подряд",
      description: "Алгоритм без ошибок. Лучший результат — ничья.",
      strategy: "exact",
      scoreFields: Object.freeze(["draws", "algorithm"]),
      storageKey: "ttt_score_v3",
    }),
    Object.freeze({
      id: "four-4x4",
      boardSize: 4,
      winLength: 4,
      shortLabel: "4×4",
      ruleLabel: "4 подряд",
      description: "Сильный алгоритм; совершенная игра не гарантируется.",
      strategy: "alpha-beta",
      scoreFields: Object.freeze(["human", "draws", "algorithm"]),
      storageKey: "ttt_score_4x4_v1",
    }),
    Object.freeze({
      id: "three-4x4",
      boardSize: 4,
      winLength: 3,
      shortLabel: "4×4",
      ruleLabel: "3 подряд",
      description: "X имеет выигрышную стратегию. Защита алгоритма оптимальна.",
      strategy: "exact",
      scoreFields: Object.freeze(["human", "draws", "algorithm"]),
      storageKey: "ttt_score_4x4_k3_v1",
    }),
  ]);

  const byId = new Map(modes.map((mode) => [mode.id, mode]));

  function getMode(id) {
    return byId.get(id) ?? null;
  }

  return Object.freeze({ modes, getMode });
});
