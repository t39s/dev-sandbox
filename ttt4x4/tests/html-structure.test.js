const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
const css = fs.readFileSync(path.resolve(__dirname, "../styles.css"), "utf8");

test("interface exposes exactly three native radio mode options", () => {
  const values = [...html.matchAll(/name="mode" value="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(values, ["classic-3x3", "four-4x4", "three-4x4"]);
  assert.match(html, /<fieldset class="mode-picker">/);
});

test("board itself is generated dynamically rather than duplicated three times", () => {
  assert.match(html, /id="board"/);
  assert.doesNotMatch(html, /class="cell" data-index=/);
});

test("CSS supports both board sizes and compact mode picker", () => {
  assert.match(css, /\.board-3[\s\S]*repeat\(3, 1fr\)/);
  assert.match(css, /\.board-4[\s\S]*repeat\(4, 1fr\)/);
  assert.match(css, /\.mode-picker[\s\S]*grid-template-columns:\s*repeat\(3, 1fr\)/);
});
