"""Offline verification of the teaching artifact, not a bicycle safety test.
Run: python verify.py. Requires Python 3 and Git; writes only to a temporary directory.
"""
import json
from pathlib import Path
import subprocess
import tempfile
import re

ROOT = Path(__file__).resolve().parent
checks = []

def checked(label, condition):
    if not condition:
        raise AssertionError(label)
    checks.append(label)

def git(repo, *args):
    return subprocess.run(['git', *args], cwd=repo, text=True, capture_output=True, check=True).stdout.strip()

def read_json(repo, ref, path):
    return json.loads(git(repo, 'show', f'{ref}:{path}'))

def interface_errors(repo, ref):
    get = lambda name: read_json(repo, ref, f'config/{name}.json')
    f, w, b, d = map(get, ['frame', 'wheels', 'brakes', 'drivetrain'])
    errors = []
    for side in ['front', 'rear']:
        if w[f'{side}_rotor_mount'] != b[side]['rotor_mount']:
            errors.append(f'{side}: rotor/hub mismatch')
        if w[f'{side}_axle'] != f[f'{side}_axle']:
            errors.append(f'{side}: axle mismatch')
    if (f['wheel_bsd_mm'], f['tire_mm']) != (w['bsd_mm'], w['tire_mm']):
        errors.append('wheel/tire envelope mismatch')
    if b['caliper_mount'] != f['brake_mount']:
        errors.append('caliper/frame mismatch')
    if w['freehub'] != d['freehub']:
        errors.append('cassette/freehub mismatch')
    for key in ['chainline_system', 'bottom_bracket']:
        if d[key] != f[key]:
            errors.append(key + ' mismatch')
    if len(d['chainrings']) > 1 and not (f['front_derailleur_ready'] and d['front_derailleur'] and d['front_shifter']):
        errors.append('2x front shift system absent')
    capacity = max(d['chainrings']) - min(d['chainrings']) + max(d['cassette']) - min(d['cassette'])
    if capacity > d['rear_capacity_t'] or max(d['cassette']) > d['rear_max_sprocket_t']:
        errors.append('rear derailleur model limits exceeded')
    return errors

with tempfile.TemporaryDirectory(prefix='bicycle-lesson-') as td:
    repo = Path(td) / 'demo'
    subprocess.run(['git', 'clone', str(ROOT / 'bicycle-demo.bundle'), str(repo)], check=True, capture_output=True)
    git(repo, 'config', 'user.name', 'Lesson verifier')
    git(repo, 'config', 'user.email', 'verifier@invalid.test')
    git(repo, 'bundle', 'verify', str(ROOT / 'bicycle-demo.bundle'))
    git(repo, 'fsck', '--full')
    checked('bundle clone and Git object integrity', True)
    refs = json.loads((ROOT / 'COMMITS.json').read_text())
    for name, sha in refs.items():
        actual = git(repo, 'rev-parse', (sha if name == 'incompatible_clean_merge' else name) + '^{commit}')
        checked('commit identity: ' + name, actual == sha)
    brake = 'origin/topic/04-brakes'
    checked('parallel branches share declared starting point', git(repo, 'merge-base', brake, 'wheel-proposal-incompatible') == refs['before-parallel'])
    checked('stored clean merge has two parents', len(git(repo, 'show', '-s', '--format=%P', refs['incompatible_clean_merge']).split()) == 2)
    checked('stored incompatible merge detected on both wheels', interface_errors(repo, refs['incompatible_clean_merge']) == ['front: rotor/hub mismatch', 'rear: rotor/hub mismatch'])
    git(repo, 'switch', '--detach', 'wheel-proposal-incompatible')
    git(repo, 'merge', '--no-ff', '--no-commit', brake)
    checked('replayed Git merge has no textual conflicts', git(repo, 'ls-files', '-u') == '')
    w = json.loads((repo / 'config/wheels.json').read_text())
    b = json.loads((repo / 'config/brakes.json').read_text())
    checked('replayed clean merge still violates both rotor interfaces', all(w[f'{s}_rotor_mount'] != b[s]['rotor_mount'] for s in ['front', 'rear']))
    git(repo, 'merge', '--abort')
    git(repo, 'switch', 'main')
    for ref in ['baseline-v1', 'baseline-v2', 'unit-serviced']:
        checked('declared model interfaces: ' + ref, not interface_errors(repo, ref))
    rejected = git(repo, 'rev-parse', 'origin/alternative/05-small-ring')
    ancestry = subprocess.run(['git','merge-base','--is-ancestor',rejected,'main'],cwd=repo)
    checked('rejected branch never entered main', ancestry.returncode == 1)
    d1 = read_json(repo, 'baseline-v1', 'config/drivetrain.json')
    dr = read_json(repo, rejected, 'config/drivetrain.json')
    d2 = read_json(repo, 'baseline-v2', 'config/drivetrain.json')
    low = lambda d: min(d['chainrings']) / max(d['cassette'])
    high = lambda d: max(d['chainrings']) / min(d['cassette'])
    checked('B1 does not meet later low-ratio criterion', low(d1) > .75)
    checked('small-ring alternative fails high-ratio criterion', low(dr) <= .75 and high(dr) < 3.2)
    checked('B2 meets both scenario ratio criteria', low(d2) <= .75 and high(d2) >= 3.2)
    checked('wide 1x alternative also meets ratios but exceeds reserve', 36/51 <= .75 and 36/11 >= 3.2 and 180 > 120)
    c1 = read_json(repo, 'baseline-v1', 'config/cost.json')
    c2 = read_json(repo, 'baseline-v2', 'config/cost.json')
    initial = sum(c1['initial_build_items'].values())
    u = c2['upgrade']
    upgrade = u['new_kit'] + u['labor'] - u['trade_in']
    checked('budget B1: 880 plus 120 reserve', initial == 880 and initial + c1['reserve'] == 1000)
    checked('budget B2: 110 upgrade, 990 total, 10 reserve', upgrade == 110 and initial + upgrade == c2['total_after_planned_work'] == 990 and c2['reserve'] == 10)
    built = read_json(repo,'unit-built','units/BUD-001.json')
    pending = read_json(repo,'baseline-v2','units/BUD-001.json')
    serviced = read_json(repo,'unit-serviced','units/BUD-001.json')
    checked('new design does not change actual unit automatically', pending == built and pending['current']['baseline_commit'] == refs['baseline-v1'])
    checked('as-built record remains unchanged after service', built['as_built'] == serviced['as_built'])
    checked('service links old and new baseline identities', serviced['events'][0]['from_baseline'] == refs['baseline-v1'] and serviced['events'][0]['to_baseline'] == refs['baseline-v2'])
    checked('current unit references B2 installed drivetrain', serviced['current']['baseline_commit'] == refs['baseline-v2'] and serviced['current']['drivetrain'] == d2['id'])
    checked('approved assembly deviation retained', serviced['current']['bell'] == 'BELL-B-SIM' and serviced['events'][0]['deviations_retained'] == ['DEV-01'])
    tracked = git(repo, 'ls-files').splitlines()
    for path in tracked:
        checked('snapshot matches main: ' + path, (repo / path).read_bytes() == (ROOT / 'snapshot' / path).read_bytes())
    checked('snapshot contains exactly tracked files', set(tracked) == {str(p.relative_to(ROOT/'snapshot')) for p in (ROOT/'snapshot').rglob('*') if p.is_file()})
    checked('exactly five principal forks in lesson', len(re.findall(r'^## Развилка [1-5]\.', (ROOT/'LESSON.md').read_text(), re.M)) == 5)
    print('PASS:',len(checks),'checks')
    for label in checks:
        print('PASS:',label)
    print('LIMIT: physical fit, loads, braking and field trials are simulated, not verified.')
