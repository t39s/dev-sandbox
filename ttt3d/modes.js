(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TTT3DModes = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const MODES = Object.freeze({
    classic: Object.freeze({
      id: "classic",
      label: "Classic 3D",
      size: 3,
      winLength: 3,
      scoreKey: "ttt_3d_score_v1",
      subtitle: "3×3×3 · 3 подряд · 49 линий",
    }),
    strategic: Object.freeze({
      id: "strategic",
      label: "Strategic 3D",
      size: 4,
      winLength: 4,
      scoreKey: "ttt_3d_qubic_score_v1",
      subtitle: "4×4×4 · 4 подряд · 76 линий",
    }),
  });

  const DEFAULT_MODE_ID = "classic";

  function getMode(id) {
    return MODES[id] ?? MODES[DEFAULT_MODE_ID];
  }

  return Object.freeze({ MODES, DEFAULT_MODE_ID, getMode });
});
