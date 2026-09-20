#!/usr/bin/env python3
"""Chromium end-to-end checks for the 2x2 RC.

The execution environment blocks browser navigation to localhost/file URLs, so the
static HTML/CSS/JS assets and bundled JSON are injected into a Chromium page.
Application code itself is unmodified. A minimal in-memory localStorage shim is
used so session persistence can be carried between fresh pages.
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path
from typing import Callable

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.htm").read_text(encoding="utf-8")
HTML = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', HTML)
HTML = re.sub(r'<link rel="stylesheet" href="styles\\.css">', '', HTML)
HTML = re.sub(r'<script src="core\\.js"></script><script src="app\\.js"></script>', '', HTML)
CSS = (ROOT / "styles.css").read_text(encoding="utf-8")
CORE = (ROOT / "core.js").read_text(encoding="utf-8")
APP = (ROOT / "app.js").read_text(encoding="utf-8")
STOCK = json.loads((ROOT / "data/templates.json").read_text(encoding="utf-8"))
DEMO = json.loads((ROOT / "data/demo-templates.json").read_text(encoding="utf-8"))

INIT_JS = r"""({store,stock,demo})=>{
  const data={...store};
  Object.defineProperty(window,'localStorage',{configurable:true,value:{
    getItem:k=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:null,
    setItem:(k,v)=>{data[k]=String(v)},
    removeItem:k=>{delete data[k]},
    clear:()=>{for(const k of Object.keys(data))delete data[k]}
  }});
  window.__store=data;
  window.fetch=async url=>({
    ok:true,status:200,
    text:async()=>JSON.stringify(String(url).includes('demo-templates')?demo:stock)
  });
}"""


def make_page(browser, store=None, viewport=None, storage_available=True):
    page = browser.new_page(viewport=viewport or {"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.set_content(HTML)
    page.add_style_tag(content=CSS)
    if storage_available:
        page.evaluate(INIT_JS, {"store": store or {}, "stock": STOCK, "demo": DEMO})
    else:
        page.evaluate("""({stock,demo})=>{
          Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError')}});
          window.__store={};
          window.fetch=async url=>({ok:true,status:200,text:async()=>JSON.stringify(String(url).includes('demo-templates')?demo:stock)});
        }""", {"stock": STOCK, "demo": DEMO})
    page.add_script_tag(content=CORE)
    page.add_script_tag(content=APP)
    page.evaluate("window.dispatchEvent(new Event('DOMContentLoaded'))")
    page.locator("#levels button").first.wait_for(timeout=10_000)
    return page, errors


def dump_store(page):
    return page.evaluate("JSON.parse(JSON.stringify(window.__store))")


def select_first_and_start(page):
    page.locator("#levels button").first.click()
    page.wait_for_function("!document.querySelector('#startBtn').disabled")
    page.locator("#startBtn").click()
    page.locator("#practice").wait_for(state="visible")


def wait_progress(page, text):
    page.wait_for_function("t => document.querySelector('#progress').textContent.trim() === t", arg=text)


def test_initial_stock(browser):
    page, errors = make_page(browser)
    assert page.locator("#setTitle").inner_text() == STOCK["title"]
    assert page.locator("#levels button").count() == 8
    assert "прошёл структурную" in page.locator("#diagnostics").inner_text()
    assert not errors, errors
    page.close()



def test_full_level_pass_unlocks_next(browser):
    page, errors = make_page(browser)
    select_first_and_start(page)
    answers = ["4", "5", "11", "-4", "16", "4", "11", "-6"]
    for i, answer in enumerate(answers):
        if answer.startswith("-"):
            page.keyboard.press("-")
            digits = answer[1:]
        else:
            digits = answer
        for digit in digits:
            page.keyboard.press(digit)
        page.keyboard.press("Enter")
        if i < len(answers) - 1:
            wait_progress(page, f"{i+2} / 8")
    page.locator("#report").wait_for(state="visible", timeout=5_000)
    assert page.locator("#reportTitle").inner_text() == "Уровень пройден"
    assert "8/8 верно" in page.locator("#reportStats").inner_text()
    page.locator("#backBtn").click()
    assert page.locator("#levels button").nth(1).is_enabled()
    assert not errors, errors
    page.close()


def test_demo_generator_integrates_with_ui(browser):
    page, errors = make_page(browser)
    page.locator("#demoBtn").click()
    page.wait_for_function("t => document.querySelector('#setTitle').textContent === t", arg=DEMO["title"])
    select_first_and_start(page)
    assert page.locator("#progress").inner_text().strip() == "1 / 8"
    assert page.locator("#problem").inner_text().strip()
    assert not errors, errors
    page.close()



def test_preparation_cancel_allows_retry(browser):
    large = {
        "format": "2x2-templates", "version": 1, "id": "large", "revision": 1, "title": "large",
        "templates": [{"id": "large-t", "title": "large", "variables": {"a": {"min": 0, "max": 999}, "b": {"min": 0, "max": 99}}, "expression": "a * 100 + b"}],
        "levels": [{"id": "large-l", "title": "large", "maxErrors": 0, "maxSeconds": 999, "items": [{"templateId": "large-t", "count": 1}], "shuffle": False}]
    }
    page, errors = make_page(browser)
    page.locator("#fileInput").set_input_files({"name": "large.json", "mimeType": "application/json", "buffer": json.dumps(large).encode("utf-8")})
    page.locator("#candidateBox").wait_for(state="visible")
    page.locator("#useCandidateBtn").click()
    page.locator("#levels button").first.click()
    page.wait_for_function("!document.querySelector('#startBtn').disabled", timeout=10_000)
    page.locator("#startBtn").click()
    page.locator("#prepareBox").wait_for(state="visible")
    page.locator("#cancelPrepare").click()
    page.wait_for_function("document.querySelector('#prepareBox').hidden && !document.querySelector('#startBtn').disabled")
    assert not errors, errors
    page.close()

def test_storage_unavailable_is_explicit(browser):
    page, errors = make_page(browser, storage_available=False)
    assert "Хранилище браузера недоступно" in page.locator("#diagnostics").inner_text()
    page.locator("#levels button").first.click()
    page.wait_for_function("!document.querySelector('#startBtn').disabled")
    assert not errors, errors
    page.close()

def test_practice_keyboard_and_double_submit(browser):
    page, errors = make_page(browser)
    select_first_and_start(page)
    assert page.locator("#problem").inner_text().strip() == "2 + 2"
    page.locator('button[data-action="4"]').click()
    page.locator("#submit").click()
    # Repeated Enter during feedback must not create another result.
    page.keyboard.press("Enter")
    page.keyboard.press("Enter")
    wait_progress(page, "2 / 8")
    assert page.locator("#problem").inner_text().strip() == "9 − 4"

    # Zero is a valid input; Backspace correction uses the same action path.
    page.keyboard.press("0")
    assert page.locator("#answer").inner_text().strip() == "0"
    page.keyboard.press("Backspace")
    assert page.locator("#answer").inner_text().strip() == ""

    # Hardware keyboard path.
    page.keyboard.press("5")
    page.keyboard.press("Enter")
    wait_progress(page, "3 / 8")
    page.keyboard.press("1")
    page.keyboard.press("1")
    page.keyboard.press("Enter")
    wait_progress(page, "4 / 8")

    # Negative answer path with the same action handler.
    page.keyboard.press("-")
    page.keyboard.press("4")
    page.keyboard.press("Enter")
    wait_progress(page, "5 / 8")
    assert not errors, errors
    page.close()


def test_reload_during_answer_restores_same_item(browser):
    page, errors = make_page(browser)
    select_first_and_start(page)
    prompt = page.locator("#problem").inner_text()
    page.keyboard.press("4")
    assert page.locator("#answer").inner_text().strip() == "4"
    store = dump_store(page)
    page.close()

    page2, errors2 = make_page(browser, store=store)
    assert not page2.locator("#resumeBox").is_hidden()
    assert "задание 1 из 8" in page2.locator("#resumeBox").inner_text()
    page2.locator("#resumeBtn").click()
    assert page2.locator("#problem").inner_text() == prompt
    assert page2.locator("#answer").inner_text().strip() == "4"
    assert "Сеанс прерван" in page2.locator("#feedback").inner_text()
    assert not errors and not errors2, (errors, errors2)
    page2.close()


def test_reload_during_feedback_does_not_duplicate_answer(browser):
    page, errors = make_page(browser)
    select_first_and_start(page)
    page.keyboard.press("4")
    page.keyboard.press("Enter")
    page.wait_for_function("document.querySelector('#feedback').textContent.includes('Верно')")
    store = dump_store(page)
    # Capture before the 900 ms advance fires.
    page.close()

    page2, errors2 = make_page(browser, store=store)
    assert "задание 2 из 8" in page2.locator("#resumeBox").inner_text()
    page2.locator("#resumeBtn").click()
    assert page2.locator("#progress").inner_text().strip() == "2 / 8"
    assert page2.locator("#problem").inner_text().strip() == "9 − 4"
    assert not errors and not errors2, (errors, errors2)
    page2.close()



def test_visibility_change_marks_session_interrupted(browser):
    page, errors = make_page(browser)
    select_first_and_start(page)
    prompt = page.locator("#problem").inner_text()
    page.evaluate("""() => {
      Object.defineProperty(document,'hidden',{configurable:true,value:true});
      document.dispatchEvent(new Event('visibilitychange'));
    }""")
    assert page.locator("#problem").inner_text() == prompt
    assert "Сеанс прерван" in page.locator("#feedback").inner_text()
    store = dump_store(page)
    session = json.loads(store['2x2:v1:session'])
    assert session['interrupted'] is True
    assert not errors, errors
    page.close()


def test_threshold_boundaries(browser):
    boundary = {
        "format": "2x2-templates", "version": 1, "id": "boundary", "revision": 1, "title": "boundary",
        "templates": [{"id": "fixed", "title": "fixed", "expression": "2 + 2"}],
        "levels": [{"id": "l", "title": "boundary", "maxErrors": 1, "maxSeconds": 1, "items": [{"templateId": "fixed", "count": 1}], "shuffle": False}]
    }
    def run(elapsed_ms, answer, expected_title):
        page, errors = make_page(browser)
        page.locator("#fileInput").set_input_files({"name": "boundary.json", "mimeType": "application/json", "buffer": json.dumps(boundary).encode("utf-8")})
        page.locator("#candidateBox").wait_for(state="visible")
        page.locator("#useCandidateBtn").click()
        page.locator("#levels button").first.click()
        page.wait_for_function("!document.querySelector('#startBtn').disabled")
        page.evaluate("window.__now=100000; Date.now=()=>window.__now")
        page.locator("#startBtn").click()
        page.locator("#practice").wait_for(state="visible")
        for ch in answer:
            if ch == '-': page.keyboard.press('-')
            else: page.keyboard.press(ch)
        page.evaluate("ms => window.__now=100000+ms", elapsed_ms)
        page.keyboard.press("Enter")
        page.locator("#report").wait_for(state="visible", timeout=5_000)
        assert page.locator("#reportTitle").inner_text() == expected_title
        assert not errors, errors
        page.close()
    # Exactly one error and exactly one second are both accepted at the boundary.
    run(1000, "0", "Уровень пройден")
    # Exceeding time by 1 ms fails even with a correct answer.
    run(1001, "4", "Тренировка завершена")

def test_import_is_two_phase_and_bad_file_preserves_active_set(browser):
    page, errors = make_page(browser)
    page.locator("#fileInput").set_input_files({
        "name": "demo.json", "mimeType": "application/json",
        "buffer": json.dumps(DEMO, ensure_ascii=False).encode("utf-8")
    })
    page.locator("#candidateBox").wait_for(state="visible")
    assert page.locator("#setTitle").inner_text() == STOCK["title"]
    assert page.locator("#candidateTitle").inner_text() == DEMO["title"]
    page.locator("#candidateLevels button").first.click()
    page.wait_for_function("!document.querySelector('#candidatePreview .preview-head').textContent.includes('подготовка')")
    assert page.locator("#candidatePreview .preview-row").count() > 0
    page.locator("#useCandidateBtn").click()
    page.wait_for_function("t => document.querySelector('#setTitle').textContent === t", arg=DEMO["title"])
    assert page.locator("#setTitle").inner_text() == DEMO["title"]

    page.locator("#fileInput").set_input_files({
        "name": "bad.json", "mimeType": "application/json", "buffer": b'{"broken":'
    })
    page.wait_for_function("document.querySelector('#diagnostics').textContent.includes('Ошибка синтаксиса JSON')")
    assert page.locator("#setTitle").inner_text() == DEMO["title"]
    assert "Ошибка синтаксиса JSON" in page.locator("#diagnostics").inner_text()
    assert not errors, errors
    page.close()


def test_imported_html_is_text_not_markup(browser):
    custom = {
        "format": "2x2-templates", "version": 1, "id": "html-text", "revision": 1,
        "title": "<img src=x onerror=window.__xss=1>",
        "templates": [{
            "id": "t", "title": "<b>title</b>", "variables": {"a": {"values": [2]}},
            "prompt": "<img src=x onerror=window.__xss=2> {a} + □", "answer": "a"
        }],
        "levels": [{"id": "l", "title": "level", "maxErrors": 0, "maxSeconds": 10,
                    "items": [{"templateId": "t", "count": 1}], "shuffle": False}]
    }
    page, errors = make_page(browser)
    page.locator("#fileInput").set_input_files({
        "name": "html.json", "mimeType": "application/json",
        "buffer": json.dumps(custom, ensure_ascii=False).encode("utf-8")
    })
    page.locator("#candidateBox").wait_for(state="visible")
    assert page.locator("#candidateBox img").count() == 0
    assert "<img" in page.locator("#candidateTitle").inner_text()
    page.locator("#candidateLevels button").first.click()
    page.wait_for_function("document.querySelectorAll('#candidatePreview .preview-row').length === 1")
    assert page.locator("#candidatePreview img").count() == 0
    assert page.evaluate("window.__xss") is None
    assert not errors, errors
    page.close()


def test_mobile_layouts(browser):
    for width in (320, 375, 390, 430):
        page, errors = make_page(browser, viewport={"width": width, "height": 568})
        select_first_and_start(page)
        dims = page.evaluate("""() => ({
          w: innerWidth, h: innerHeight,
          scrollW: document.documentElement.scrollWidth,
          practiceH: document.querySelector('#practice').scrollHeight,
          submitBottom: document.querySelector('#submit').getBoundingClientRect().bottom,
          keyWidths: Array.from(document.querySelectorAll('#keypad button')).map(x=>x.getBoundingClientRect().width),
          keyHeights: Array.from(document.querySelectorAll('#keypad button')).map(x=>x.getBoundingClientRect().height)
        })""")
        assert dims["scrollW"] <= dims["w"], (width, dims)
        assert dims["practiceH"] <= dims["h"], (width, dims)
        assert dims["submitBottom"] <= dims["h"], (width, dims)
        assert min(dims["keyWidths"]) >= 56 and min(dims["keyHeights"]) >= 56, (width, dims)
        assert not errors, (width, errors)
        page.close()


TESTS: list[tuple[str, Callable]] = [
    ("stock set loads and 8 levels render", test_initial_stock),
    ("full level pass opens report and unlocks next level", test_full_level_pass_unlocks_next),
    ("generated demo level integrates with UI", test_demo_generator_integrates_with_ui),
    ("large preparation can be cancelled and retried", test_preparation_cancel_allows_retry),
    ("unavailable storage is reported explicitly", test_storage_unavailable_is_explicit),
    ("practice keyboard, negative answer, repeat Enter", test_practice_keyboard_and_double_submit),
    ("reload during answer restores same concrete item/input", test_reload_during_answer_restores_same_item),
    ("reload during feedback advances without duplicate result", test_reload_during_feedback_does_not_duplicate_answer),
    ("visibility change marks the current session interrupted", test_visibility_change_marks_session_interrupted),
    ("error/time boundaries are inclusive; exceeding time fails", test_threshold_boundaries),
    ("JSON import is two-phase; bad file preserves active set", test_import_is_two_phase_and_bad_file_preserves_active_set),
    ("HTML in imported text is rendered as text", test_imported_html_is_text_not_markup),
    ("320/375/390/430 × 568 portrait layout fits", test_mobile_layouts),
]


def main():
    passed = failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        try:
            for name, fn in TESTS:
                try:
                    fn(browser)
                    print("PASS", name)
                    passed += 1
                except Exception as exc:
                    print("FAIL", name, "\n ", repr(exc), file=sys.stderr)
                    failed += 1
        finally:
            browser.close()
    print(f"\n{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
