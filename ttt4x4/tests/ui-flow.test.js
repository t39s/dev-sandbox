const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

class FakeClassList {
  constructor(initial = "") { this.values = new Set(initial.split(/\s+/).filter(Boolean)); }
  toggle(name, force) { if (force) this.values.add(name); else this.values.delete(name); }
  contains(name) { return this.values.has(name); }
}

class FakeElement {
  constructor({ id = "", name = "", value = "", checked = false, hidden = false } = {}) {
    this.id = id;
    this.name = name;
    this.value = value;
    this.checked = checked;
    this.hidden = hidden;
    this.disabled = false;
    this.type = "";
    this.textContent = "";
    this.className = "";
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = [];
    this.classList = new FakeClassList();
    this.focused = false;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener(type, fn) { this.listeners.set(type, fn); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  focus() { this.focused = true; }
  click() { if (!this.disabled && !this.hidden) this.listeners.get("click")?.({ currentTarget: this }); }
  change() { this.listeners.get("change")?.({ currentTarget: this }); }
}

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function setup({ delay = 5, storageSeed = {} } = {}) {
  const modes = [
    new FakeElement({ name: "mode", value: "classic-3x3", checked: true }),
    new FakeElement({ name: "mode", value: "four-4x4" }),
    new FakeElement({ name: "mode", value: "three-4x4" }),
  ];
  const elements = Object.fromEntries([
    "mode-description", "scoreboard", "board", "status", "restart", "reset-score",
    "reset-score-confirmation", "confirm-reset-score", "cancel-reset-score",
  ].map((id) => [id, new FakeElement({ id, hidden: id === "reset-score-confirmation" })]));
  const storage = new Map(Object.entries(storageSeed));

  global.TTTModes = require("../modes.js");
  global.TTTGame = require("../game-model.js");
  global.TTTAI = require("../ai-model.js");
  global.TTTScore = require("../score-model.js");
  global.TTT_UI_CONFIG = { algorithmDelayMs: delay };
  global.localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
  };
  global.document = {
    querySelectorAll(selector) {
      assert.equal(selector, 'input[name="mode"]');
      return modes;
    },
    getElementById(id) { return elements[id]; },
    createElement() { return new FakeElement(); },
  };

  const scriptPath = path.resolve(__dirname, "../script.js");
  delete require.cache[scriptPath];
  require(scriptPath);
  return { modes, elements, storage };
}

function boardCells(elements) { return elements.board.children; }

test("starts in classic mode with 9 cells and only reachable score metrics", () => {
  const { elements } = setup({ storageSeed: { ttt_score_v3: JSON.stringify({ algorithm: 2, draws: 3 }) } });
  assert.equal(boardCells(elements).length, 9);
  assert.equal(elements.board.className, "board board-3");
  assert.equal(elements.scoreboard.children.length, 2);
  assert.match(elements["mode-description"].textContent, /без ошибок/);
});

test("switching to 4x4 / 4 builds 16 cells and loads its independent score", () => {
  const { modes, elements } = setup({
    storageSeed: {
      ttt_score_v3: JSON.stringify({ algorithm: 9, draws: 9 }),
      ttt_score_4x4_v1: JSON.stringify({ human: 2, algorithm: 1, draws: 4 }),
    },
  });
  modes[0].checked = false;
  modes[1].checked = true;
  modes[1].change();

  assert.equal(boardCells(elements).length, 16);
  assert.equal(elements.board.className, "board board-4");
  assert.equal(elements.scoreboard.children.length, 3);
  assert.match(elements["mode-description"].textContent, /совершенная игра не гарантируется/);
});

test("switching mode cancels a pending algorithm move", async () => {
  const { modes, elements } = setup({ delay: 15 });
  boardCells(elements)[0].click();
  assert.equal(elements.status.textContent, "Алгоритм думает");

  modes[0].checked = false;
  modes[2].checked = true;
  modes[2].change();
  assert.equal(boardCells(elements).length, 16);
  assert.ok(boardCells(elements).every((cell) => cell.textContent === ""));

  await wait(30);
  assert.ok(boardCells(elements).every((cell) => cell.textContent === ""));
});

test("4x4 / 3 description distinguishes it from 4x4 / 4", () => {
  const { modes, elements } = setup();
  modes[0].checked = false;
  modes[2].checked = true;
  modes[2].change();
  assert.match(elements["mode-description"].textContent, /выигрышную стратегию/);
  assert.equal(elements.board.getAttribute("aria-label"), "Игровое поле 4 на 4");
});

test("restores the last selected mode without adding setup UI", () => {
  const { modes, elements } = setup({
    storageSeed: { ttt_selected_mode_v1: "three-4x4" },
  });
  assert.equal(modes[2].checked, true);
  assert.equal(modes[0].checked, false);
  assert.equal(boardCells(elements).length, 16);
  assert.match(elements["mode-description"].textContent, /выигрышную стратегию/);
});

test("mode change persists the selected mode", () => {
  const { modes, storage } = setup();
  modes[0].checked = false;
  modes[1].checked = true;
  modes[1].change();
  assert.equal(storage.get("ttt_selected_mode_v1"), "four-4x4");
});
