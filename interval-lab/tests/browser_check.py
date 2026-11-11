import json
"""Real Chromium end-to-end checks; monotonic timestamps are deterministic, UI timers real."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import subprocess, time, re

ROOT = Path(__file__).resolve().parents[1]
SHOTS = Path('/mnt/data/interval-lab_1.4.2/qa-shots')
SHOTS.mkdir(parents=True, exist_ok=True)
PORT = 18765
server = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
    time.sleep(0.35)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
        context.add_init_script('window.__clock = 10000; performance.now = () => window.__clock;')
        page = context.new_page()
        errors=[]
        page.on('pageerror', lambda e: errors.append(str(e)))
        mode = 'HTTP'
        try:
            page.goto(f'http://127.0.0.1:{PORT}/', wait_until='networkidle', timeout=3000)
        except Exception as exc:
            if 'ERR_BLOCKED_BY_ADMINISTRATOR' not in str(exc):
                raise
            mode = 'DOM injection (navigation blocked by environment)'
            page.close()
            page = context.new_page()
            page.on('pageerror', lambda e: errors.append(str(e)))
            html = (ROOT/'index.html').read_text()
            html = re.sub(r'<link rel="stylesheet"[^>]*>', '', html)
            html = re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>', '', html)
            page.set_content(html, wait_until='load')
            page.add_style_tag(content=(ROOT/'styles.css').read_text())
            page.evaluate("""() => {
              const store = new Map();
              Object.defineProperty(window,'localStorage',{configurable:true,value:{
                getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),
                removeItem:k=>store.delete(k),clear:()=>store.clear()
              }});
            }""")
            page.add_script_tag(content=(ROOT/'model.js').read_text())
            page.evaluate("(cfg) => { window.fetch = async () => ({ok: true, status: 200, json: async () => cfg}); }", json.loads((ROOT/'config.json').read_text(encoding='utf-8')))
            page.add_script_tag(content=(ROOT/'app.js').read_text())
            page.wait_for_function("document.getElementById('tapZone').disabled === false")
        print('Browser test mode:',mode)
        def tick_tap(ms):
            page.evaluate('(ms) => window.__clock += ms', ms)
            page.locator('#tapZone').tap()
        assert page.locator('#intervalDigit').inner_text() == '0'
        assert page.locator('#intervalText').inner_text() == '0 / 10 интервалов'
        assert page.locator('#pressText').count() == 0
        assert page.locator('.last-interval').count() == 0
        page.screenshot(path=str(SHOTS/'waiting.png'))
        tick_tap(0)
        assert page.locator('#intervalDigit').inner_text() == '0'
        assert page.locator('#capture').evaluate('(e) => e.classList.contains("tap-flash")')
        page.screenshot(path=str(SHOTS/'start-flash.png'))
        time.sleep(0.20)
        assert not page.locator('#capture').evaluate('(e) => e.classList.contains("tap-flash")')
        tick_tap(999)
        assert page.locator('#intervalDigit').inner_text() == '0'
        assert not page.locator('#capture').evaluate('(e) => e.classList.contains("tap-flash")')
        tick_tap(1)
        assert page.locator('#intervalDigit').inner_text() == '0'
        tick_tap(1)
        assert page.locator('#intervalDigit').inner_text() == '1'
        assert page.locator('#capture').evaluate('(e) => e.classList.contains("tap-flash")')
        time.sleep(.20)
        page.screenshot(path=str(SHOTS/'count-1.png'))
        for i in range(2,10):
            tick_tap(1300)
            assert page.locator('#intervalDigit').inner_text() == str(i)
        tick_tap(1300)
        assert page.locator('#intervalDigit').inner_text() == '10'
        assert page.locator('#capture').is_visible(), 'final number should be briefly visible'
        assert page.locator('#capture').evaluate('(e) => e.classList.contains("tap-flash")')
        page.screenshot(path=str(SHOTS/'finish-flash.png'))
        time.sleep(0.75)
        assert page.locator('#reviewTitle').inner_text() == 'Первое упражнение'
        assert page.locator('#intervalTable tbody tr').count() == 10
        assert len(page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1")).sessions[0].exercises')) == 1
        page.get_by_role('button',name='Запустить упражнение 2 →').click()
        for i in range(11):
            tick_tap(1500)
        time.sleep(0.75)
        assert page.locator('#reviewTitle').inner_text() == 'Сравнение упражнений'
        assert page.locator('#intervalTable tbody tr').count() == 10
        assert len(page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1")).sessions[0].exercises')) == 2
        page.screenshot(path=str(SHOTS/'comparison.png'),full_page=True)
        if mode == 'HTTP':
            page.reload(wait_until='networkidle')
        page.get_by_role('button',name='История',exact=True).click()
        assert page.locator('.history-card').count() == 1
        page.get_by_role('button',name='Секундомер').click()
        page.get_by_role('button',name='Настройки').click()
        page.locator('#targetInput').fill('2')
        page.get_by_role('button',name='Сохранить').click()
        page.get_by_role('button',name='Секундомер').click()
        for i in range(3):tick_tap(1600)
        time.sleep(0.75)
        assert page.locator('#intervalTable tbody tr').count() == 2
        assert page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1")).sessions.length') == 2
        page.get_by_role('button',name='Секундомер').click()
        page.get_by_role('button',name='История').click()
        assert page.locator('.history-card').count() == 2
        page.get_by_role('button',name='Секундомер').click()
        page.set_viewport_size({'width': 320, 'height': 568})
        page.locator('#intervalDigit').evaluate('(e) => {e.textContent="100"; e.classList.add("digits-3");}')
        rects=page.evaluate('''() => {const d=document.querySelector('#intervalDigit').getBoundingClientRect(),
           ring=document.querySelector('.dial').getBoundingClientRect();return {d:{x:d.x,width:d.width},ring:{x:ring.x,width:ring.width},scrollWidth:document.documentElement.scrollWidth,innerWidth};}''')
        assert rects['scrollWidth'] <= rects['innerWidth'], rects
        assert rects['d']['x'] >= 0 and rects['d']['x']+rects['d']['width'] <= rects['innerWidth'], rects
        page.screenshot(path=str(SHOTS/'small-100.png'))
        assert not errors, errors
        print('CHROMIUM PASS: flash 150ms; 0→10; 1000ms gate; pair; persistence; new target; zero JS errors')
        context.close()
        browser.close()
finally:
    server.terminate()
    server.wait()
