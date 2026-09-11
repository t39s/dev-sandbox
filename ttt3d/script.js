const { MODES, DEFAULT_MODE_ID, getMode } = TTT3DModes;
const { PLAYERS, GAME_STATUS, createGame } = TTT3DGame;
const { getBestMove } = TTT3DAI;
const { initialScore, normalizeScore, recordWin } = TTT3DScore;

const HUMAN = PLAYERS.X;
const ALGORITHM = PLAYERS.O;
const MODE_KEY = "ttt_3d_selected_mode_v1";
const DELAY = globalThis.TTT_3D_UI_CONFIG?.algorithmDelayMs ?? 300;

const subtitle = document.getElementById("subtitle");
const statusEl = document.getElementById("status");
const layersEl = document.getElementById("layers");
const boardEl = document.getElementById("board");
const overviewEl = document.getElementById("overview");
const layerStatus = document.getElementById("layer-status");
const ruleNote = document.getElementById("rule-note");
const scoreHuman = document.getElementById("score-human");
const scoreAlgorithm = document.getElementById("score-algorithm");
const restart = document.getElementById("restart");
const resetScore = document.getElementById("reset-score");
const modeInputs = [...document.querySelectorAll('input[name="mode"]')];

let mode = getMode(loadModeId());
let game = createGame(mode);
let state = game.createInitialState();
let activeLayer = 1;
let lastMove = null;
let score = loadScore();
let timer = null;

function loadModeId() {
  try {
    const id = localStorage.getItem(MODE_KEY);
    return MODES[id] ? id : DEFAULT_MODE_ID;
  } catch {
    return DEFAULT_MODE_ID;
  }
}
function saveMode() {
  try { localStorage.setItem(MODE_KEY, mode.id); } catch {}
}
function loadScore() {
  try {
    const raw = localStorage.getItem(mode.scoreKey);
    return raw ? normalizeScore(JSON.parse(raw)) : initialScore();
  } catch { return initialScore(); }
}
function saveScore() {
  try { localStorage.setItem(mode.scoreKey, JSON.stringify(score)); } catch {}
}
function cancelTimer() {
  if (timer !== null) { clearTimeout(timer); timer = null; }
}
function setMode(id) {
  cancelTimer();
  mode = getMode(id);
  game = createGame(mode);
  state = game.createInitialState();
  activeLayer = 1;
  lastMove = null;
  score = loadScore();
  saveMode();
  render();
}
function startGame() {
  cancelTimer();
  state = game.createInitialState();
  activeLayer = 1;
  lastMove = null;
  render();
}
function winningSet() {
  return new Set(state.winningLine?.cells ?? []);
}
function renderModes() {
  modeInputs.forEach((input) => input.checked = input.value === mode.id);
  subtitle.textContent = mode.subtitle;
}
function renderLayers() {
  layersEl.style.gridTemplateColumns = `repeat(${mode.size},1fr)`;
  layersEl.replaceChildren(layersEl.querySelector("legend"));
  const lastLayer = lastMove === null ? null :
    game.indexToCoordinates(lastMove).layer;

  for (let layer = 1; layer <= mode.size; layer += 1) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "layer";
    input.value = String(layer);
    input.checked = layer === activeLayer;
    input.addEventListener("change", () => {
      if (input.checked) { activeLayer = layer; render(); }
    });
    const number = document.createElement("span");
    number.textContent = String(layer);
    const small = document.createElement("small");
    small.textContent = layer === 1 ? "ближний" :
      layer === mode.size ? "дальний" : "средний";
    if (layer === lastLayer) small.textContent += " · ход";
    label.append(input, number, small);
    layersEl.append(label);
  }
}
function renderBoard() {
  const wins = winningSet();
  const humanTurn = state.gameStatus === GAME_STATUS.PLAYING &&
    state.currentPlayer === HUMAN;
  boardEl.replaceChildren();
  boardEl.className = `board size-${mode.size}`;
  boardEl.style.gridTemplateColumns = `repeat(${mode.size},1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${mode.size},1fr)`;
  boardEl.setAttribute("aria-busy", String(
    state.gameStatus === GAME_STATUS.PLAYING &&
    state.currentPlayer === ALGORITHM
  ));
  boardEl.setAttribute("aria-label", `Игровое поле, слой ${activeLayer}`);

  for (let row = 1; row <= mode.size; row += 1) {
    for (let col = 1; col <= mode.size; col += 1) {
      const index = game.coordinatesToIndex(activeLayer, row, col);
      const value = state.board[index];
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.index = String(index);
      cell.textContent = value ?? "";
      cell.setAttribute("aria-disabled", String(!humanTurn || value !== null));
      cell.setAttribute(
        "aria-label",
        `Слой ${activeLayer}, строка ${row}, столбец ${col}: ${value ?? "пусто"}`
      );
      cell.classList.toggle("mark-x", value === HUMAN);
      cell.classList.toggle("mark-o", value === ALGORITHM);
      cell.classList.toggle("last-move", index === lastMove && value !== null);
      cell.classList.toggle("winning", wins.has(index));
      cell.addEventListener("click", handleCell);
      boardEl.append(cell);
    }
  }
  layerStatus.textContent = `Слой ${activeLayer} из ${mode.size}`;
}
function renderOverview() {
  const wins = winningSet();
  overviewEl.replaceChildren();
  for (let layer = 1; layer <= mode.size; layer += 1) {
    const wrap = document.createElement("div");
    wrap.className = "mini-layer";
    wrap.classList.toggle("active", layer === activeLayer);
    const label = document.createElement("span");
    label.className = "mini-label";
    label.textContent = `L${layer}`;
    const grid = document.createElement("div");
    grid.className = "mini-grid";
    grid.style.gridTemplateColumns = `repeat(${mode.size},1fr)`;
    for (let row = 1; row <= mode.size; row += 1) {
      for (let col = 1; col <= mode.size; col += 1) {
        const index = game.coordinatesToIndex(layer, row, col);
        const value = state.board[index];
        const cell = document.createElement("span");
        cell.className = "mini-cell";
        cell.textContent = value ?? "";
        cell.classList.toggle("mark-x", value === HUMAN);
        cell.classList.toggle("mark-o", value === ALGORITHM);
        cell.classList.toggle("last-move", index === lastMove && value !== null);
        cell.classList.toggle("winning", wins.has(index));
        grid.append(cell);
      }
    }
    wrap.append(label, grid);
    overviewEl.append(wrap);
  }
}
function renderStatus() {
  const thinking = state.gameStatus === GAME_STATUS.PLAYING &&
    state.currentPlayer === ALGORITHM;
  statusEl.classList.toggle("thinking", thinking);
  if (state.gameStatus === GAME_STATUS.WON) {
    statusEl.textContent = state.winner === HUMAN ?
      "Вы победили" : "Победил алгоритм (O)";
  } else if (state.gameStatus === GAME_STATUS.DRAW) {
    statusEl.textContent = "Ничья";
  } else {
    statusEl.textContent = thinking ? "Алгоритм думает" : "Ваш ход (X)";
  }
}
function renderScore() {
  scoreHuman.textContent = String(score.human);
  scoreAlgorithm.textContent = String(score.algorithm);
  resetScore.disabled = score.human === 0 && score.algorithm === 0;
}
function renderRule() {
  ruleNote.textContent =
    mode.id === "classic"
      ? "Classic: 3 знака на любой прямой. Быстрый вводный 3D-режим."
      : "Strategic / Qubic: 4 знака на любой прямой. 64 клетки, 76 линий.";
}
function render() {
  renderModes();
  renderLayers();
  renderBoard();
  renderOverview();
  renderStatus();
  renderScore();
  renderRule();
}
function recordFinish(previousStatus) {
  if (previousStatus === GAME_STATUS.PLAYING &&
      state.gameStatus === GAME_STATUS.WON) {
    score = recordWin(score, state.winner, HUMAN, ALGORITHM);
    saveScore();
    return true;
  }
  return state.gameStatus !== GAME_STATUS.PLAYING;
}
function makeAlgorithmMove() {
  timer = null;
  if (state.gameStatus !== GAME_STATUS.PLAYING ||
      state.currentPlayer !== ALGORITHM) return;
  const move = getBestMove(game, state, ALGORITHM);
  if (move === null) return;
  const before = state.gameStatus;
  state = game.makeMove(state, move);
  lastMove = move;
  activeLayer = game.indexToCoordinates(move).layer;
  recordFinish(before);
  render();
}
function handleCell(event) {
  if (state.gameStatus !== GAME_STATUS.PLAYING ||
      state.currentPlayer !== HUMAN) return;
  const index = Number(event.currentTarget.dataset.index);
  const before = state.gameStatus;
  const next = game.makeMove(state, index);
  if (next === state) return;
  state = next;
  lastMove = index;
  if (recordFinish(before)) { render(); return; }
  render();
  cancelTimer();
  timer = setTimeout(makeAlgorithmMove, DELAY);
}
modeInputs.forEach((input) => input.addEventListener("change", () => {
  if (input.checked) setMode(input.value);
}));
restart.addEventListener("click", startGame);
resetScore.addEventListener("click", () => {
  score = initialScore();
  saveScore();
  renderScore();
});
render();
