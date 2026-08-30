const { modes, getMode } = TTTModes;
const {
  PLAYERS,
  GAME_STATUS,
  createRules,
  createInitialState,
  makeMove,
} = TTTGame;
const { getAvailableMoves, getBestMove } = TTTAI;
const { createInitialScore, normalizeScore, recordResult } = TTTScore;

const HUMAN_PLAYER = PLAYERS.X;
const ALGORITHM_PLAYER = PLAYERS.O;
const ALGORITHM_DELAY_MS = globalThis.TTT_UI_CONFIG?.algorithmDelayMs ?? 300;
const SELECTED_MODE_STORAGE_KEY = "ttt_selected_mode_v1";

const modeInputs = Array.from(document.querySelectorAll('input[name="mode"]'));
const descriptionElement = document.getElementById("mode-description");
const scoreboardElement = document.getElementById("scoreboard");
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const restartButton = document.getElementById("restart");
const resetScoreButton = document.getElementById("reset-score");
const resetConfirmation = document.getElementById("reset-score-confirmation");
const confirmResetScoreButton = document.getElementById("confirm-reset-score");
const cancelResetScoreButton = document.getElementById("cancel-reset-score");

let mode = loadSelectedMode();
modeInputs.forEach((input) => {
  input.checked = input.value === mode.id;
});
let rules = createRules(mode.boardSize, mode.winLength);
let state = createInitialState(rules);
let score = loadScore(mode);
let cells = [];
let lastMove = null;
let algorithmTimerId = null;

const scoreLabels = Object.freeze({
  human: "Вы",
  draws: "Ничьи",
  algorithm: "Алгоритм",
});

function loadSelectedMode() {
  try {
    return getMode(localStorage.getItem(SELECTED_MODE_STORAGE_KEY)) ?? modes[0];
  } catch {
    return modes[0];
  }
}

function saveSelectedMode() {
  try {
    localStorage.setItem(SELECTED_MODE_STORAGE_KEY, mode.id);
  } catch {
    // Выбор режима остаётся работоспособным без localStorage.
  }
}

function loadScore(targetMode) {
  try {
    const raw = localStorage.getItem(targetMode.storageKey);
    return raw ? normalizeScore(JSON.parse(raw)) : createInitialScore();
  } catch {
    return createInitialScore();
  }
}

function saveScore() {
  try {
    localStorage.setItem(mode.storageKey, JSON.stringify(score));
  } catch {
    // Сбой localStorage не должен останавливать игру.
  }
}

function hasVisibleScore() {
  return mode.scoreFields.some((field) => score[field] > 0);
}

function closeResetConfirmation({ restoreFocus = false } = {}) {
  resetConfirmation.hidden = true;
  resetScoreButton.hidden = false;
  resetScoreButton.setAttribute("aria-expanded", "false");
  if (restoreFocus && !resetScoreButton.disabled) resetScoreButton.focus();
}

function openResetConfirmation() {
  if (!hasVisibleScore()) return;
  resetScoreButton.hidden = true;
  resetConfirmation.hidden = false;
  resetScoreButton.setAttribute("aria-expanded", "true");
  confirmResetScoreButton.focus();
}

function renderScore() {
  scoreboardElement.replaceChildren();

  for (const field of mode.scoreFields) {
    const item = document.createElement("div");
    item.className = "score-item";

    const label = document.createElement("span");
    label.textContent = scoreLabels[field];

    const value = document.createElement("strong");
    value.textContent = String(score[field]);

    item.append(label, value);
    scoreboardElement.append(item);
  }

  resetScoreButton.disabled = !hasVisibleScore();
  if (!hasVisibleScore()) closeResetConfirmation();
}

function getCellLabel(index, value) {
  const row = Math.floor(index / rules.boardSize) + 1;
  const column = (index % rules.boardSize) + 1;
  const mark = value ?? "пусто";
  const latest = index === lastMove && value !== null ? ", последний ход" : "";
  return `Строка ${row}, столбец ${column}: ${mark}${latest}`;
}

function buildBoard() {
  boardElement.replaceChildren();
  boardElement.className = `board board-${rules.boardSize}`;
  boardElement.setAttribute(
    "aria-label",
    `Игровое поле ${rules.boardSize} на ${rules.boardSize}`,
  );

  cells = Array.from({ length: rules.boardCells }, (_, index) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.index = String(index);
    cell.setAttribute("aria-disabled", "false");
    cell.addEventListener("click", handleCellClick);
    boardElement.append(cell);
    return cell;
  });
}

function render() {
  const humanTurn =
    state.gameStatus === GAME_STATUS.PLAYING &&
    state.currentPlayer === HUMAN_PLAYER;
  const algorithmTurn =
    state.gameStatus === GAME_STATUS.PLAYING &&
    state.currentPlayer === ALGORITHM_PLAYER;

  descriptionElement.textContent = mode.description;
  boardElement.setAttribute("aria-busy", String(algorithmTurn));

  cells.forEach((cell, index) => {
    const value = state.board[index];
    const actionable = humanTurn && value === null;

    cell.textContent = value ?? "";
    cell.setAttribute("aria-label", getCellLabel(index, value));
    cell.setAttribute("aria-disabled", String(!actionable));
    cell.classList.toggle("mark-x", value === HUMAN_PLAYER);
    cell.classList.toggle("mark-o", value === ALGORITHM_PLAYER);
    cell.classList.toggle("last-move", index === lastMove && value !== null);
    cell.classList.toggle(
      "winning",
      state.winningCombination?.includes(index) ?? false,
    );
  });

  renderScore();
  statusElement.classList.toggle("thinking", algorithmTurn);

  if (state.gameStatus === GAME_STATUS.WON) {
    statusElement.textContent =
      state.winner === HUMAN_PLAYER ? "Вы победили" : "Победил алгоритм (O)";
    return;
  }

  if (state.gameStatus === GAME_STATUS.DRAW) {
    statusElement.textContent =
      mode.id === "classic-3x3" ? "Ничья — лучший результат" : "Ничья";
    return;
  }

  statusElement.textContent = humanTurn ? "Ваш ход (X)" : "Алгоритм думает";
}

function recordFinishedGame(previousStatus) {
  if (
    previousStatus === GAME_STATUS.PLAYING &&
    state.gameStatus !== GAME_STATUS.PLAYING
  ) {
    score = recordResult(score, state, HUMAN_PLAYER, ALGORITHM_PLAYER);
    saveScore();
    return true;
  }
  return false;
}

function cancelAlgorithmMove() {
  if (algorithmTimerId !== null) {
    clearTimeout(algorithmTimerId);
    algorithmTimerId = null;
  }
}

function makeAlgorithmMove() {
  algorithmTimerId = null;
  if (
    state.gameStatus !== GAME_STATUS.PLAYING ||
    state.currentPlayer !== ALGORITHM_PLAYER
  ) {
    return;
  }

  const available = getAvailableMoves(state.board, rules);
  const move =
    getBestMove(state, rules, mode.strategy, ALGORITHM_PLAYER) ??
    available[0] ??
    null;
  if (move === null) return;

  const previousStatus = state.gameStatus;
  state = makeMove(state, rules, move);
  lastMove = move;
  recordFinishedGame(previousStatus);
  render();
}

function scheduleAlgorithmMove() {
  cancelAlgorithmMove();
  algorithmTimerId = setTimeout(makeAlgorithmMove, ALGORITHM_DELAY_MS);
}

function handleCellClick(event) {
  if (
    state.gameStatus !== GAME_STATUS.PLAYING ||
    state.currentPlayer !== HUMAN_PLAYER
  ) {
    return;
  }

  const index = Number(event.currentTarget.dataset.index);
  const previousStatus = state.gameStatus;
  const nextState = makeMove(state, rules, index);
  if (nextState === state) return;

  state = nextState;
  lastMove = index;

  if (recordFinishedGame(previousStatus)) {
    render();
    return;
  }

  render();
  scheduleAlgorithmMove();
}

function startGame() {
  cancelAlgorithmMove();
  state = createInitialState(rules);
  lastMove = null;
  closeResetConfirmation();
  render();
}

function changeMode(id) {
  const nextMode = getMode(id);
  if (!nextMode || nextMode.id === mode.id) return;

  cancelAlgorithmMove();
  mode = nextMode;
  saveSelectedMode();
  rules = createRules(mode.boardSize, mode.winLength);
  state = createInitialState(rules);
  score = loadScore(mode);
  lastMove = null;
  closeResetConfirmation();
  buildBoard();
  render();
}

function resetScore() {
  score = createInitialScore();
  saveScore();
  closeResetConfirmation();
  renderScore();
  restartButton.focus();
}

modeInputs.forEach((input) =>
  input.addEventListener("change", () => {
    if (input.checked) changeMode(input.value);
  }),
);
restartButton.addEventListener("click", startGame);
resetScoreButton.addEventListener("click", openResetConfirmation);
confirmResetScoreButton.addEventListener("click", resetScore);
cancelResetScoreButton.addEventListener("click", () =>
  closeResetConfirmation({ restoreFocus: true }),
);

buildBoard();
render();
