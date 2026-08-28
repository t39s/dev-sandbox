const {
  PLAYERS,
  GAME_STATUS,
  createInitialState,
  makeMove,
} = TTTGame;

const { getBestMove } = TTTAI;

const {
  createInitialScore,
  normalizeScore,
  recordResult,
} = TTTScore;

const HUMAN_PLAYER = PLAYERS.X;
const ALGORITHM_PLAYER = PLAYERS.O;
const SCORE_STORAGE_KEY = "ttt_score_v3";
const LEGACY_SCORE_STORAGE_KEY = "ttt_score_v2";
const ALGORITHM_DELAY_MS =
  globalThis.TTT_UI_CONFIG?.algorithmDelayMs ?? 350;

const cells = Array.from(document.querySelectorAll(".cell"));
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const restartButton = document.getElementById("restart");
const resetScoreButton = document.getElementById("reset-score");
const resetConfirmation = document.getElementById("reset-score-confirmation");
const confirmResetScoreButton = document.getElementById("confirm-reset-score");
const cancelResetScoreButton = document.getElementById("cancel-reset-score");
const scoreAlgorithmElement = document.getElementById("score-algorithm");
const scoreDrawsElement = document.getElementById("score-draws");

let state = createInitialState();
let score = loadScore();
let lastMove = null;
let algorithmTimerId = null;

function getCellLabel(index, value) {
  const position = `Клетка ${index + 1}`;
  const mark = value ?? "пусто";
  const lastMoveNote =
    index === lastMove && value !== null ? ", последний ход" : "";
  return `${position}: ${mark}${lastMoveNote}`;
}

function readStoredScore(key) {
  const raw = localStorage.getItem(key);
  return raw ? normalizeScore(JSON.parse(raw)) : null;
}

function loadScore() {
  try {
    return (
      readStoredScore(SCORE_STORAGE_KEY) ??
      readStoredScore(LEGACY_SCORE_STORAGE_KEY) ??
      createInitialScore()
    );
  } catch {
    return createInitialScore();
  }
}

function saveScore() {
  try {
    localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(score));
  } catch {
    // Игра остаётся работоспособной, даже если хранилище недоступно.
  }
}

function hasScore() {
  return score.algorithm > 0 || score.draws > 0;
}

function closeResetConfirmation({ restoreFocus = false } = {}) {
  resetConfirmation.hidden = true;
  resetScoreButton.hidden = false;
  resetScoreButton.setAttribute("aria-expanded", "false");

  if (restoreFocus && !resetScoreButton.disabled) {
    resetScoreButton.focus();
  }
}

function openResetConfirmation() {
  if (!hasScore()) {
    return;
  }

  resetScoreButton.hidden = true;
  resetConfirmation.hidden = false;
  resetScoreButton.setAttribute("aria-expanded", "true");
  confirmResetScoreButton.focus();
}

function renderScore() {
  scoreAlgorithmElement.textContent = String(score.algorithm);
  scoreDrawsElement.textContent = String(score.draws);

  resetScoreButton.disabled = !hasScore();

  if (!hasScore()) {
    closeResetConfirmation();
  }
}

function render() {
  const humanTurn =
    state.gameStatus === GAME_STATUS.PLAYING &&
    state.currentPlayer === HUMAN_PLAYER;
  const algorithmTurn =
    state.gameStatus === GAME_STATUS.PLAYING &&
    state.currentPlayer === ALGORITHM_PLAYER;

  boardElement.setAttribute("aria-busy", String(algorithmTurn));

  cells.forEach((cell, index) => {
    const value = state.board[index];
    const isActionable = humanTurn && value === null;

    cell.textContent = value ?? "";
    cell.setAttribute("aria-label", getCellLabel(index, value));
    cell.setAttribute("aria-disabled", String(!isActionable));
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
      state.winner === HUMAN_PLAYER
        ? "Вы победили"
        : "Победил алгоритм (O)";
    return;
  }

  if (state.gameStatus === GAME_STATUS.DRAW) {
    statusElement.textContent = "Ничья — цель достигнута";
    return;
  }

  statusElement.textContent =
    state.currentPlayer === HUMAN_PLAYER
      ? "Ваш ход (X)"
      : "Алгоритм думает";
}

function recordFinishedGame(previousStatus) {
  if (
    previousStatus === GAME_STATUS.PLAYING &&
    state.gameStatus !== GAME_STATUS.PLAYING
  ) {
    score = recordResult(
      score,
      state,
      HUMAN_PLAYER,
      ALGORITHM_PLAYER,
    );
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

  const move = getBestMove(state, ALGORITHM_PLAYER);

  if (move === null) {
    return;
  }

  const previousStatus = state.gameStatus;
  state = makeMove(state, move);
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
  const nextState = makeMove(state, index);

  if (nextState === state) {
    return;
  }

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
  state = createInitialState();
  lastMove = null;
  closeResetConfirmation();
  render();
}

function resetScore() {
  score = createInitialScore();
  saveScore();
  closeResetConfirmation();
  renderScore();
  restartButton.focus();
}

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
restartButton.addEventListener("click", startGame);
resetScoreButton.addEventListener("click", openResetConfirmation);
confirmResetScoreButton.addEventListener("click", resetScore);
cancelResetScoreButton.addEventListener("click", () =>
  closeResetConfirmation({ restoreFocus: true }),
);

render();
