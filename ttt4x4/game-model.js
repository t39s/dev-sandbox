(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.TTTGame = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const PLAYERS = Object.freeze({
    X: "X",
    O: "O",
  });

  const GAME_STATUS = Object.freeze({
    PLAYING: "playing",
    WON: "won",
    DRAW: "draw",
  });

  const WINNING_COMBINATIONS = Object.freeze([
    Object.freeze([0, 1, 2]),
    Object.freeze([3, 4, 5]),
    Object.freeze([6, 7, 8]),
    Object.freeze([0, 3, 6]),
    Object.freeze([1, 4, 7]),
    Object.freeze([2, 5, 8]),
    Object.freeze([0, 4, 8]),
    Object.freeze([2, 4, 6]),
  ]);

  function createInitialState() {
    return {
      board: Array(9).fill(null),
      currentPlayer: PLAYERS.X,
      gameStatus: GAME_STATUS.PLAYING,
      winner: null,
      winningCombination: null,
    };
  }

  function getWinningCombination(board) {
    return (
      WINNING_COMBINATIONS.find(([a, b, c]) => {
        return (
          board[a] !== null &&
          board[a] === board[b] &&
          board[a] === board[c]
        );
      }) ?? null
    );
  }

  function makeMove(state, index) {
    if (state.gameStatus !== GAME_STATUS.PLAYING) {
      return state;
    }

    if (!Number.isInteger(index) || index < 0 || index > 8) {
      return state;
    }

    if (state.board[index] !== null) {
      return state;
    }

    const board = [...state.board];
    board[index] = state.currentPlayer;

    const winningCombination = getWinningCombination(board);

    if (winningCombination) {
      return {
        ...state,
        board,
        gameStatus: GAME_STATUS.WON,
        winner: state.currentPlayer,
        winningCombination,
      };
    }

    if (board.every((value) => value !== null)) {
      return {
        ...state,
        board,
        gameStatus: GAME_STATUS.DRAW,
        winner: null,
        winningCombination: null,
      };
    }

    return {
      ...state,
      board,
      currentPlayer:
        state.currentPlayer === PLAYERS.X ? PLAYERS.O : PLAYERS.X,
    };
  }

  return Object.freeze({
    PLAYERS,
    GAME_STATUS,
    WINNING_COMBINATIONS,
    createInitialState,
    getWinningCombination,
    makeMove,
  });
});
