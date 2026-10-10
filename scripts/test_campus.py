"""Deterministic browser checks for the campus page; no database writes.

Run with the web server running:
  scripts/ui-tests/.venv/bin/python scripts/test_campus.py
API responses below are explicit test fixtures, never product fallback data.
"""
import argparse
import json
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import expect, sync_playwright


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://localhost:3000')
    args = parser.parse_args()
    out = Path('.local/campus-tests')
    out.mkdir(parents=True, exist_ok=True)
    world = dict(id='campus-test', code='extended_v1', name='Test world', organization_id='org', facility_id='facility', as_of='2025-01-02T00:00:00Z', version=1, paused=True)
    zones = ['WARD_A', 'ICU', 'WARD_B', 'OPD', 'ADMIN', 'SERVICES']
    requests = []
    fail = {'enabled': False, 'heat': False}

    def row(code, **kwargs):
        return dict(id=code, zone_code=code, name=code, data={}, event_at=world['as_of'], **kwargs)

    def fixture(route):
        parsed = urlparse(route.request.url)
        path = parsed.path.removeprefix('/api/v1')
        q = parse_qs(parsed.query)
        requests.append((path, q))
        result = {'items': [], 'truncated': False}
        if path == '/me':
            result = dict(id='user', name='Campus reviewer', role='auditor', organization_id='org', llm={})
        elif path == '/worlds':
            result = {'items': [world, {**world, 'id': 'scoped-test', 'code': 'restricted_v1'}]}
        elif path == '/organizations':
            result = {'items': [{'id': 'org', 'name': 'GreenOps'}]}
        elif path == '/facilities':
            result = {'items': [{'id': 'facility', 'name': 'GreenOps Hospital'}]}
        elif path == '/zones':
            scope = ['WARD_A'] if q.get('world_id') == ['scoped-test'] else zones
            result['items'] = [row(z) for z in scope]
        elif path == '/actions':
            result['items'] = [row('WARD_A', status='in_progress', category='energy', due_at=None), {**row('WARD_A', status='verified', category='water', due_at=None), 'id': 'verified', 'name': 'Repair supply leak'}]
        elif path == '/alerts':
            result['items'] = [row('WARD_A', severity='high', status='open')]
        elif path == '/environment/state':
            if fail['heat']:
                return route.fulfill(status=503, json={'error': {'message': 'Temperature source offline'}})
            readings = [{**row('WARD_A'), 'data': {'temperature_c': 20, 'humidity_pct': 50, 'co2_ppm': 500}}, {**row('ICU'), 'data': {'temperature_c': 40}}]
            result = {'readings': [r for r in readings if q.get('world_id') != ['scoped-test'] or r['zone_code'] == 'WARD_A']}
        elif path == '/metrics/series':
            if fail['enabled']:
                return route.fulfill(status=503, json={'error': {'message': 'Test source unavailable'}})
            metric = q['metric'][0]
            scale = 10 if metric.startswith('water') else .1 if metric.startswith('waste') else 1
            # Explicit pagination: the first page contains 300, the second adds 50.
            if q['offset'] == ['0']:
                items = [dict(time='2025-01-01T01:00:00Z', zone='WARD_A', value=100*scale, rows=1, valid_rows=1), dict(time='2025-01-01T01:00:00Z', zone='ICU', value=200*scale, rows=1, valid_rows=1)]
            else:
                items = [dict(time='2025-01-01T02:00:00Z', zone='WARD_A', value=50*scale, rows=1, valid_rows=1), dict(time='2025-01-01T03:00:00Z', zone='WARD_A', value=None, rows=1, valid_rows=0)]
            if q.get('world_id') == ['scoped-test']:
                items = [item for item in items if item['zone'] == 'WARD_A']
            result = {'items': items, 'start': q['start'][0], 'end': q['end'][0], 'truncated': q['offset'] == ['0']}
        route.fulfill(json=result)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        context = browser.new_context(viewport={'width': 1600, 'height': 1100})
        context.route('**/api/v1/**', fixture)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(args.url + '/campus')
        expect(page.locator('.campus-directory button')).to_have_count(6)
        expect(page.locator('.campus-scene canvas')).to_be_visible()
        page.get_by_role('button', name='Pause auto rotation', exact=True).click()
        expect(page.locator('.campus-total').nth(0)).to_contain_text('350')
        expect(page.locator('.campus-inspector-metric')).to_contain_text('150 kWh')
        expect(page.locator('.campus-inspector-metric')).to_contain_text('8% interval coverage')
        expect(page.locator('.campus-fix-total')).to_contain_text('1 / 2')
        assert any(path == '/metrics/series' and q.get('offset') == ['500'] for path, q in requests)
        layers = page.get_by_role('group', name='Map resource layer')
        expect(layers.get_by_role('button')).to_have_count(4)
        ward = page.get_by_role('button', name='Inspect Ward A', exact=True)
        energy_color = ward.get_attribute('data-overlay-color')
        layers.get_by_role('button', name='Heat', exact=True).click()
        expect(page.locator('.campus-inspector-metric')).to_contain_text('20 °C')
        expect(ward).to_have_attribute('data-overlay-color', '#237fbc')
        expect(page.get_by_role('button', name='Inspect ICU', exact=True)).to_have_attribute('data-overlay-color', '#c82b38')
        expect(page.get_by_role('button', name='Inspect Admin', exact=True)).to_have_attribute('data-overlay-color', '#98a59f')
        expect(page.get_by_role('button', name='With improvements', exact=True)).to_be_disabled()
        expect(page.get_by_label('Heat color scale')).to_contain_text('40 or above')
        page.locator('.campus-directory').get_by_role('button', name='Admin').click()
        expect(page.locator('.campus-inspector-metric')).to_contain_text('No readings')
        page.locator('.campus-directory').get_by_role('button', name='Ward A').click()
        page.get_by_role('button', name='Overlay on', exact=True).click()
        expect(page.get_by_role('button', name='Overlay off', exact=True)).to_have_attribute('aria-pressed', 'false')
        page.get_by_role('button', name='Overlay off', exact=True).click()
        layers.get_by_role('button', name='Energy', exact=True).click()
        expect(ward).to_have_attribute('data-overlay-color', energy_color)

        page.locator('.campus-scene canvas').scroll_into_view_if_needed()
        canvas = page.locator('.campus-scene canvas').bounding_box()
        marker = page.get_by_role('button', name='Inspect Ward A', exact=True)
        before = marker.get_attribute('style')
        page.mouse.move(canvas['x']+canvas['width']*.65, canvas['y']+canvas['height']*.75)
        page.mouse.down()
        page.mouse.move(canvas['x']+canvas['width']*.8, canvas['y']+canvas['height']*.65, steps=10)
        page.mouse.up()
        expect(marker).not_to_have_attribute('style', before)
        page.get_by_role('button', name='Reset campus view').click()
        page.get_by_role('group', name='Map resource layer').get_by_role('button', name='Water', exact=True).click()
        expect(page.locator('.campus-inspector-metric')).to_contain_text('1,500 L')
        expect(ward).not_to_have_attribute('data-overlay-color', energy_color)
        water_scale = page.get_by_label('Water color scale').text_content()
        water_color = ward.get_attribute('data-overlay-color')
        page.get_by_label('Water reduction assumption').fill('20')
        expect(page.locator('.campus-potential')).to_contain_text('300 L')
        expect(page.get_by_label('Water color scale')).to_have_text(water_scale)
        expect(ward).not_to_have_attribute('data-overlay-color', water_color)
        expect(page.locator('.campus-comparison')).to_contain_text('1,200 L')
        expect(page.get_by_role('button', name='With improvements', exact=True)).to_have_attribute('aria-pressed', 'true')
        page.get_by_role('button', name='Inspect ICU', exact=True).click()
        expect(page.locator('.campus-inspector-title h3')).to_have_text('Intensive care unit')
        expect(page.locator('.campus-inspector-metric')).to_contain_text('2,000 L')
        expect(page.locator('.campus-no-actions')).to_be_visible()
        page.locator('.campus-directory').get_by_role('button', name='Admin').click()
        expect(page.locator('.campus-inspector-metric')).to_contain_text('No readings')
        expect(page.locator('.campus-potential')).to_contain_text('No readings')
        page.locator('.campus-directory').get_by_role('button', name='Ward A').click()
        page.get_by_role('group', name='Map resource layer').get_by_role('button', name='Wastage', exact=True).click()
        expect(page.locator('.campus-inspector-metric')).to_contain_text('15 kg')
        page.get_by_label('Waste reduction assumption').fill('0')
        expect(page.locator('.campus-potential')).to_contain_text('0 kg')
        marker = page.get_by_role('button', name='Inspect Ward A', exact=True)
        original_position = marker.get_attribute('style')
        page.get_by_role('button', name='Zoom in campus').click()
        expect(marker).not_to_have_attribute('style', original_position)
        page.get_by_role('button', name='Zoom out campus').click()
        page.locator('.campus-scene canvas').scroll_into_view_if_needed()
        canvas = page.locator('.campus-scene canvas').bounding_box()
        original_position = marker.get_attribute('style')
        page.mouse.move(canvas['x'] + 35, canvas['y'] + 190)
        page.mouse.down()
        page.mouse.move(canvas['x'] + 140, canvas['y'] + 210, steps=10)
        page.mouse.up()
        expect(marker).not_to_have_attribute('style', original_position)
        page.get_by_role('button', name='Reset campus view').click()
        page.get_by_role('button', name='Present to jury').click()
        expect(page.locator('.campus-presentation')).to_be_visible()
        page.keyboard.press('Escape')
        expect(page.locator('.campus-presentation')).to_have_count(0)
        page.get_by_label('Date range', exact=True).select_option('168')
        expect(page.locator('.campus-directory button')).to_have_count(6)
        assert any(path == '/metrics/series' and q.get('bucket') == ['day'] for path, q in requests)
        page.get_by_label('World', exact=True).select_option('scoped-test')
        expect(page.locator('.campus-directory button')).to_have_count(1)
        expect(page.locator('.campus-marker')).to_have_count(1)
        expect(page.locator('.campus-total').nth(0)).to_contain_text('150')
        fail['enabled'] = True
        page.get_by_role('button', name='Refresh', exact=True).click()
        expect(page.get_by_text('Campus data could not be loaded')).to_be_visible()
        expect(page.locator('.campus-total')).to_have_count(0)
        fail['enabled'] = False
        page.get_by_role('button', name='Retry campus data').click()
        expect(page.locator('.campus-directory button')).to_have_count(1)
        page.get_by_label('World', exact=True).select_option('campus-test')
        expect(page.locator('.campus-directory button')).to_have_count(6)
        page.wait_for_load_state('networkidle')
        page.screenshot(path=str(out / 'desktop.png'), full_page=True)
        page.set_viewport_size({'width': 390, 'height': 844})
        expect(page.locator('.campus-scene canvas')).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile horizontal overflow'
        page.screenshot(path=str(out / 'mobile.png'), full_page=True)
        fail['heat'] = True
        page.get_by_role('button', name='Refresh', exact=True).click()
        expect(page.locator('.campus-directory button')).to_have_count(6)
        layers.get_by_role('button', name='Heat', exact=True).click()
        expect(page.locator('.campus-inspector-metric')).to_contain_text('Temperature source offline')
        expect(page.locator('.campus-inspector-metric')).to_contain_text('No readings')
        layers.get_by_role('button', name='Energy', exact=True).click()
        expect(page.locator('.campus-total').nth(0)).to_contain_text('350')
        # A lost GPU context must retain all data through the accessible directory.
        page.locator('.campus-scene canvas').evaluate("el => el.dispatchEvent(new Event('webglcontextlost', {cancelable:true}))")
        expect(page.get_by_text('3D rendering is unavailable in this browser.')).to_be_visible()
        page.locator('.campus-directory').get_by_role('button', name='ICU', exact=False).click()
        expect(page.locator('.campus-inspector-title h3')).to_have_text('Intensive care unit')
        assert not errors, errors
        browser.close()
    print('PASS: pagination, totals, coverage, four 3D layers, temperature colors and source failure, fixed comparison scales, overlay toggle, building selection, missing readings, targets, actions, presentation, date filtering, world scope, retry, mobile, and WebGL fallback.')
    print(f'Screenshots: {out}')


if __name__ == '__main__':
    main()
