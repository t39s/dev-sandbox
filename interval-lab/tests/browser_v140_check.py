import json
"""Chromium end-to-end: early finish, decline second, delete individual records, and narrow phone UI."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT.parent/'qa-shots'
SHOTS.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    context.add_init_script('window.__clock = 10000; performance.now=()=>window.__clock;')
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    dialogs={'accept':True}
    def handle_dialog(dialog):
        dialog.accept() if dialogs['accept'] else dialog.dismiss()
    page.on('dialog',handle_dialog)
    html=(ROOT/'index.html').read_text(encoding='utf-8')
    html=re.sub(r'<link rel="stylesheet"[^>]*>','',html)
    html=re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>','',html)
    page.set_content(html,wait_until='load')
    page.add_style_tag(content=(ROOT/'styles.css').read_text(encoding='utf-8'))
    page.evaluate('''() => {let store=new Map();window.__fakeStore=store;Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}})}''')
    page.add_script_tag(content=(ROOT/'model.js').read_text(encoding='utf-8'))
    page.evaluate("(cfg) => { window.fetch = async () => ({ok: true, status: 200, json: async () => cfg}); }", json.loads((ROOT/'config.json').read_text(encoding='utf-8')))
    page.add_script_tag(content=(ROOT/'app.js').read_text(encoding='utf-8'))
    page.wait_for_function("document.getElementById('tapZone').disabled === false")
    def snapshot():return page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1"))')
    def tap(ms):
        return page.evaluate('''(ms)=>{window.__clock+=ms;let e=document.getElementById('tapZone');e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,button:0}));return document.getElementById('intervalDigit').textContent}''',ms)
    def go_capture():
        page.get_by_role('button',name='Секундомер').click()
    page.locator('#settingsBtn').click()
    page.locator('#targetInput').fill('3')
    page.locator('#settingsForm button[type="submit"]').click()
    go_capture()
    assert tap(0)=='0';assert page.locator('#earlyFinishBtn').is_visible()
    tap(1400);tap(1300)
    assert page.locator('#intervalDigit').inner_text()=='2'
    # The intentional early-exit control is not part of the touch/interval region.
    page.screenshot(path=str(SHOTS/'v140-running-390.png'))
    dialogs['accept']=False
    page.locator('#earlyFinishBtn').click()
    assert page.locator('#earlyFinishBtn').is_visible(), 'dismissing early finish leaves timer running'
    assert snapshot()['incomplete']==[]
    dialogs['accept']=True
    page.locator('#earlyFinishBtn').click()
    state=snapshot()
    assert state['version']==4 and len(state['incomplete'])==1 and len(state['sessions'])==0
    assert state['incomplete'][0]['intervals']==[1400,1300]
    assert state['incomplete'][0]['elapsedMs']>=2700
    assert page.locator('.incomplete-entry').count()==1
    assert '2 из 3 интервалов' in page.locator('.incomplete-entry').inner_text()
    page.locator('.incomplete-details summary').click()
    assert '1.400' in page.locator('.incomplete-details').inner_text()
    page.screenshot(path=str(SHOTS/'v140-incomplete-history.png'),full_page=True)
    go_capture()
    for offset in [0,1300,1200,1500]:tap(offset)
    page.wait_for_timeout(740)
    state=snapshot()
    assert len(state['sessions'])==1 and state['sessions'][0]['status']=='pending'
    assert len(state['incomplete'])==1
    assert 'Завершить серию без второй попытки' in page.locator('#reviewActions').inner_text()
    dialogs['accept']=False
    page.get_by_role('button',name='Завершить серию без второй попытки').click()
    assert snapshot()['sessions'][0]['status']=='pending'
    dialogs['accept']=True
    page.get_by_role('button',name='Завершить серию без второй попытки').click()
    state=snapshot()
    assert state['sessions'][0]['status']=='closed'
    assert len(state['sessions'][0]['exercises'])==1
    assert page.locator('#reviewTitle').inner_text()=='Серия завершена'
    assert '3.000' not in page.locator('#reviewSummary').inner_text() # arbitrary guard? NOTE session duration 4000
    page.screenshot(path=str(SHOTS/'v140-closed-one.png'),full_page=True)
    page.get_by_role('button',name='История').click()
    page.locator('#archiveDate').fill('2026-10-18')
    page.locator('#archiveSeconds').fill('8,000')
    page.locator('#archiveForm button[type="submit"]').click()
    state=snapshot();assert len(state['archived'])==1
    assert page.locator('.history-entry').count()==1
    assert page.locator('.incomplete-entry').count()==1
    assert page.locator('.archive-entry:not(.incomplete-entry)').count()==1
    dialogs['accept']=False
    page.locator('.history-entry').get_by_role('button',name='Удалить запись').click()
    assert len(snapshot()['sessions'])==1
    dialogs['accept']=True
    page.locator('.history-entry').get_by_role('button',name='Удалить запись').click()
    assert len(snapshot()['sessions'])==0 and len(snapshot()['archived'])==1 and len(snapshot()['incomplete'])==1
    page.locator('.archive-entry:not(.incomplete-entry)').get_by_role('button',name='Удалить архивную запись').click()
    assert len(snapshot()['archived'])==0
    page.locator('.incomplete-entry').get_by_role('button',name='Удалить неполную попытку').click()
    assert len(snapshot()['incomplete'])==0
    assert 'пока нет результатов' in page.locator('#historyList').inner_text()
    go_capture()
    assert page.locator('#earlyFinishBtn').is_hidden()
    page.set_viewport_size({'width':320,'height':568})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    tap(0)
    assert page.locator('#earlyFinishBtn').is_visible()
    rects=page.evaluate('''()=>{const a=document.getElementById('earlyFinishBtn').getBoundingClientRect();const d=document.getElementById('intervalDigit').getBoundingClientRect();return {a:{x:a.x,y:a.y,w:a.width,h:a.height},d:{x:d.x,y:d.y,w:d.width,h:d.height},viewport:{w:innerWidth,h:innerHeight}}}''')
    assert rects['a']['x']>=0 and rects['a']['x']+rects['a']['w']<=rects['viewport']['w'],rects
    assert rects['a']['y']+rects['a']['h']<=rects['viewport']['h'],rects
    assert rects['d']['y']+rects['d']['h']<rects['a']['y'],rects
    page.screenshot(path=str(SHOTS/'v140-running-320.png'))
    assert not errors,errors
    print('CHROMIUM PASS: early abort/confirm, incomplete history, one-attempt closed, delete all three, 390x844 & 320x568, zero JS errors')
    browser.close()
