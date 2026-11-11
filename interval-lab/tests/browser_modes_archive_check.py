import json
"""Playwright Chromium: separate start-stop screen, archive form and mixed history."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT.parent/'qa-shots'
SHOTS.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    context.add_init_script('window.__clock = 10000; performance.now=()=>window.__clock;')
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    html=(ROOT/'index.html').read_text(encoding='utf-8')
    html=re.sub(r'<link rel="stylesheet"[^>]*>','',html)
    html=re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>','',html)
    page.set_content(html,wait_until='load')
    page.add_style_tag(content=(ROOT/'styles.css').read_text(encoding='utf-8'))
    page.evaluate("""() => {
      const store = new Map();
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),
        removeItem:k=>store.delete(k),clear:()=>store.clear()
      }});
    }""")
    page.add_script_tag(content=(ROOT/'model.js').read_text(encoding='utf-8'))
    page.evaluate("(cfg) => { window.fetch = async () => ({ok: true, status: 200, json: async () => cfg}); }", json.loads((ROOT/'config.json').read_text(encoding='utf-8')))
    page.add_script_tag(content=(ROOT/'app.js').read_text(encoding='utf-8'))
    page.wait_for_function("document.getElementById('tapZone').disabled === false")
    page.locator('#modeBtn').click()
    page.locator('#selectStopwatch').click()
    assert page.locator('#capture').evaluate("el=>el.classList.contains('mode-stopwatch')")
    assert not page.locator('#intervalDigit').is_visible()
    assert not page.locator('#intervalProgressArea').is_visible()
    assert page.locator('#timeDisplay').is_visible()
    assert page.locator('#timeDisplay').inner_text()=='00:00.00'
    page.screenshot(path=str(SHOTS/'startstop-ready.png'))
    def tap(ms):
        return page.evaluate('''(ms) => {window.__clock+=ms; const el=document.getElementById('tapZone'); el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,button:0})); return document.getElementById('capture').classList.contains('tap-flash'); }''',ms)
    assert tap(0)
    assert page.locator('#tapInstruction').inner_text()=='КОСНИТЕСЬ ДЛЯ СТОПА'
    page.screenshot(path=str(SHOTS/'startstop-flash.png'))
    page.wait_for_timeout(200)
    tap(999)
    assert page.locator('#review').is_hidden()
    assert not page.locator('#capture').evaluate("el=>el.classList.contains('tap-flash')")
    tap(1)
    assert page.locator('#review').is_hidden()
    assert tap(300)
    page.wait_for_timeout(740)
    assert page.locator('#reviewTitle').inner_text()=='Первое упражнение'
    assert not page.locator('#chartPanel').is_visible()
    assert not page.locator('#tablePanel').is_visible()
    state=page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1"))')
    assert state['version']==4 and state['sessions'][0]['exercises'][0]['totalMs']==1300
    assert state['sessions'][0]['exercises'][0]['mode']=='stopwatch'
    page.locator('#reviewActions').get_by_role('button',name='История').click()
    page.locator('#archiveDate').fill('2026-10-18')
    page.locator('#archiveSeconds').fill('1,500')
    page.locator('#archiveForm').get_by_role('button',name='Сохранить в архив').click()
    state=page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1"))')
    assert state['archived'][0]['bestMs']==1500
    assert page.locator('.archive-entry').count()==1
    page.screenshot(path=str(SHOTS/'history-with-archive.png'),full_page=True)
    page.get_by_role('button',name='Секундомер').click()
    assert 'ПОПЫТКА 02 / 02' in page.locator('#phaseLabel').inner_text()
    tap(0)
    tap(1700)
    page.wait_for_timeout(740)
    assert page.locator('#reviewTitle').inner_text()=='Сравнение упражнений'
    assert not page.locator('#tablePanel').is_visible()
    assert '1.300' in page.locator('#reviewSummary').inner_text()
    assert '1.500' in page.locator('#baselineWrap').inner_text()
    page.screenshot(path=str(SHOTS/'stopwatch-best-review.png'),full_page=True)
    page.get_by_role('button',name='Секундомер').click()
    page.set_viewport_size({'width':320,'height':568})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    boxes=page.evaluate("""() => {
      const ring=document.querySelector('.dial').getBoundingClientRect();
      const clock=document.querySelector('#timeDisplay').getBoundingClientRect();
      return {ring:{x:ring.x,w:ring.width},clock:{x:clock.x,w:clock.width},width:innerWidth};
    }""")
    assert boxes['clock']['x']>=0 and boxes['clock']['x']+boxes['clock']['w']<=boxes['width'],boxes
    page.screenshot(path=str(SHOTS/'startstop-320.png'))
    assert not errors,errors
    print('CHROMIUM PASS: distinct stopwatch UI; tap gate; archive; best-of-two/history; 390x844 & 320x568; zero JS errors')
    browser.close()
