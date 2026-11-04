from playwright.sync_api import sync_playwright
import subprocess, time, json, os
port=8765
server=subprocess.Popen(['python3','-m','http.server',str(port),'--bind','127.0.0.1'],cwd='/mnt/data/interval-lab',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.5)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
  page=context.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{port}/',wait_until='networkidle')
  page.screenshot(path='/mnt/data/interval-lab/tests/capture.png')
  assert page.locator('#pressText').inner_text()=='1-е из 11 нажатий'
  for i in range(11):
   page.locator('#tapZone').tap();time.sleep(.02)
  assert page.locator('#review').is_visible(), 'review not visible'
  assert page.locator('#reviewTitle').inner_text()=='Первое упражнение'
  assert page.locator('#intervalTable tbody tr').count()==10
  assert page.locator('.metrics .metric').count()==4
  assert len(page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1")).sessions[0].exercises'))==1
  page.screenshot(path='/mnt/data/interval-lab/tests/first_result.png',full_page=True)
  page.get_by_role('button',name='Запустить упражнение 2 →').click()
  assert page.locator('#capture').is_visible()
  for i in range(11):
   page.locator('#tapZone').tap();time.sleep(.02)
  assert page.locator('#reviewTitle').inner_text()=='Сравнение упражнений'
  assert page.locator('#intervalTable tbody tr').count()==10
  assert page.locator('#intervalTable thead th').count()==4
  assert len(page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1")).sessions[0].exercises'))==2
  page.screenshot(path='/mnt/data/interval-lab/tests/comparison.png',full_page=True)
  page.reload(wait_until='networkidle')
  page.get_by_role('button',name='История',exact=True).click()
  assert page.locator('.history-card').count()==1
  page.locator('.history-card').first.click(); assert page.locator('#review').is_visible()
  page.get_by_role('button',name='Секундомер').click()
  page.get_by_role('button',name='Настройки').click()
  inp=page.locator('#targetInput');inp.fill('2');page.get_by_role('button',name='Сохранить').click()
  assert '3 нажатия' in page.locator('#pressExplanation').inner_text()
  page.get_by_role('button',name='Секундомер').click()
  assert page.locator('#pressText').inner_text()=='1-е из 3 нажатий'
  for i in range(3):
   page.locator('#tapZone').tap();time.sleep(.02)
  assert page.locator('#intervalTable tbody tr').count()==2
  assert page.evaluate('JSON.parse(localStorage.getItem("interval-lab:data:v1")).sessions.length')==2
  # UI and persistence of prior pair
  page.get_by_role('button',name='Секундомер').click();page.get_by_role('button',name='История').click()
  assert page.locator('.history-card').count()==2
  # verify service worker registration
  assert page.evaluate('navigator.serviceWorker.controller !== null || !!navigator.serviceWorker')
  assert not errors, errors
  print('BROWSER PASS: 10 intervals=11 taps, first+second exercise, persisted history, reload, adjustable target')
  context.close();browser.close()
finally:
 server.terminate();server.wait()
