import json
"""Chromium smoke test: two athletes alternate exercises, history remains isolated."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, time

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT.parent/'qa-shots'
SHOTS.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    context.add_init_script('window.__clock=10000; performance.now = () => window.__clock;')
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    html=(ROOT/'index.html').read_text()
    html=re.sub(r'<link rel="stylesheet"[^>]*>','',html)
    html=re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>','',html)
    page.set_content(html,wait_until='load')
    # Navigation to local HTTP is blocked in this test environment; supply a private DOM store.
    page.evaluate("""() => {
      const store = new Map();
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),
        removeItem:k=>store.delete(k),clear:()=>store.clear()
      }});
    }""")
    page.add_style_tag(content=(ROOT/'styles.css').read_text())
    page.add_script_tag(content=(ROOT/'model.js').read_text())
    page.evaluate("(cfg) => { window.fetch = async () => ({ok: true, status: 200, json: async () => cfg}); }", json.loads((ROOT/'config.json').read_text(encoding='utf-8')))
    page.add_script_tag(content=(ROOT/'app.js').read_text())
    page.wait_for_function("document.getElementById('tapZone').disabled === false")
    assert page.locator('#athleteBtn').inner_text()=='Спортсмен 1 ▾'
    page.locator('#athleteBtn').click()
    page.screenshot(path=str(SHOTS/'profiles-first.png'))
    page.locator('#athleteNameInput').fill('Спортсмен 2')
    page.get_by_role('button',name='Добавить и выбрать').click()
    assert page.locator('#athleteBtn').inner_text()=='Спортсмен 2 ▾'
    page.locator('#athleteBtn').click()
    assert page.locator('.athlete-card').count()==2
    page.screenshot(path=str(SHOTS/'profiles-two.png'))
    # Choose first again to run the A1 B1 A2 B2 sequence.
    page.locator('.athlete-choose').nth(0).click()
    page.locator('#settingsBtn').click()
    page.locator('#targetInput').fill('2')
    page.get_by_role('button',name='Сохранить').click()
    page.get_by_role('button',name='Секундомер').click()
    def exercise():
        for i in range(3):
            page.evaluate('window.__clock+=1300')
            page.locator('#tapZone').tap()
            assert page.locator('#intervalDigit').inner_text()==str(i)
        page.wait_for_timeout(740)
        assert page.locator('#review').is_visible()
    exercise() # A1
    assert page.locator('#reviewTitle').inner_text()=='Первое упражнение'
    page.get_by_role('button',name='Сменить спортсмена').click()
    page.locator('.athlete-choose').nth(1).click()
    assert '01 / 02' in page.locator('#phaseLabel').inner_text()
    exercise() # B1
    state=page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1"))')
    assert len(state['sessions'])==2 and all(len(x['exercises'])==1 for x in state['sessions'])
    page.get_by_role('button',name='Сменить спортсмена').click()
    page.screenshot(path=str(SHOTS/'profiles-pending.png'))
    page.locator('.athlete-choose').nth(0).click()
    assert '02 / 02' in page.locator('#phaseLabel').inner_text()
    exercise() # A2
    assert page.locator('#reviewTitle').inner_text()=='Сравнение упражнений'
    state=page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1"))')
    assert len(state['sessions'][0]['exercises'])==2 and len(state['sessions'][1]['exercises'])==1
    page.screenshot(path=str(SHOTS/'athlete-1-comparison.png'),full_page=True)
    page.get_by_role('button',name='История',exact=True).click()
    assert page.locator('.history-card').count()==1
    assert page.locator('#historyAthlete').inner_text()=='Спортсмен 1'
    page.get_by_role('button',name='Сменить спортсмена').click()
    page.locator('.athlete-choose').nth(1).click()
    assert '02 / 02' in page.locator('#phaseLabel').inner_text()
    exercise() # B2
    assert page.locator('#reviewTitle').inner_text()=='Сравнение упражнений'
    state=page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1"))')
    assert all(len(x['exercises'])==2 for x in state['sessions'])
    page.get_by_role('button',name='История',exact=True).click()
    assert page.locator('.history-card').count()==1
    assert page.locator('#historyAthlete').inner_text()=='Спортсмен 2'
    # On 320 px phone the top toolbar must fit without horizontal overflow.
    page.get_by_role('button',name='Секундомер').click()
    page.set_viewport_size({'width':320,'height':568})
    page.screenshot(path=str(SHOTS/'capture-320.png'))
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert not errors,errors
    print('CHROMIUM PASS: A1 B1 A2 B2; independent histories; 2 profiles; 390x844/320x568; no JS errors')
    browser.close()
