"""Browser verification using the real seeded demo API, without an AI provider call.
Run: uv run --project scripts/ui-tests python scripts/test_notifications.py --url http://localhost:3000
"""
import argparse
import json
import time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--url',default='http://localhost:3000')
    args=parser.parse_args()
    out=Path('.local/notification-tests');out.mkdir(parents=True,exist_ok=True)
    expect.set_options(timeout=60000)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        context=browser.new_context(viewport={'width':1600,'height':1100})
        page=context.new_page();errors=[];requests=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:requests.append(urlparse(r.url).path))
        page.goto(args.url,wait_until='networkidle')
        expect(page.get_by_role('heading',name='Choose a demo role')).to_be_visible()
        page.get_by_role('button',name='Continue as Hospital admin',exact=True).click()
        expect(page.get_by_role('heading',name='Overview',exact=True)).to_be_visible()
        expect(page.locator('.loading:visible')).to_have_count(0)
        page.get_by_label('World',exact=True).select_option(label='extended_v1')
        expect(page.locator('.loading:visible')).to_have_count(0)
        with page.expect_response(lambda r:urlparse(r.url).path=='/api/v1/notifications'):
            page.get_by_role('button',name='Refresh',exact=True).click()
        workspace_before=requests.count('/api/v1/workspace')
        page.get_by_role('button',name='Notifications',exact=False).click()
        drawer=page.get_by_role('dialog')
        expect(drawer.get_by_role('heading',name='Notification centre')).to_be_visible()
        drawer.get_by_label('Drill reporting zone').select_option('WARD_A')
        with page.expect_response(lambda r:urlparse(r.url).path=='/api/v1/demo/alerts' and r.request.method=='POST') as created:
            drawer.get_by_role('button',name='Leak drill',exact=True).click()
        row=created.value.json()
        assert created.value.status==201 and row['data']['demo_drill'] is True
        card=drawer.locator('.notification-card').filter(has_text=row['name']).first
        expect(card.locator('.notification-recorded')).to_be_visible()
        ctx=row['data']['recorded_context']
        assert ctx['source_type']=='synthetic_observations' and ctx['zone_code']=='WARD_A'
        # Confirm the displayed drill data equals the real metric API for its exact window.
        metric=context.request.get(args.url+'/api/v1/metrics/series',params={
            'world_id':page.get_by_label('World',exact=True).input_value(), 'metric':ctx['metric'],
            'start':ctx['start'],'end':ctx['end'],'limit':500}).json()
        total=sum(point['value'] or 0 for point in metric['items'] if point['zone']=='WARD_A')
        assert abs(total-ctx['value'])<.0001
        page.screenshot(path=str(out/'notification.png'))
        card.get_by_role('link',name='Locate on 3D map').click()
        expect(page.locator('.campus-scene canvas')).to_be_visible()
        expect(page.locator('.campus-inspector-title')).to_contain_text('WARD_A')
        expect(page.get_by_role('group',name='Map resource layer').get_by_role('button',name='Water',exact=True)).to_have_attribute('aria-pressed','true')
        assert requests.count('/api/v1/workspace')==workspace_before,'Navigation repeated workspace authentication'
        page.get_by_role('button',name='Notifications',exact=False).click()
        drawer=page.get_by_role('dialog')
        card=drawer.locator('.notification-card').filter(has_text=row['name']).first
        card.get_by_role('button',name='Acknowledge drill').click()
        expect(card.get_by_role('button',name='Simulate containment')).to_be_visible()
        card.get_by_role('button',name='Simulate containment').click()
        expect(card).to_have_class(__import__('re').compile('resolved'))
        expect(card.locator('.notification-timeline li.done')).to_have_count(3)
        page.screenshot(path=str(out/'contained.png'))
        drawer.get_by_role('button',name='Close notifications').click()
        # Fresh navigation followed by an immediate return should reuse the page snapshot.
        page.locator('.navlink').filter(has_text='Overview').click()
        expect(page.locator('.loading:visible')).to_have_count(0)
        expect(page.locator('.kpi .value')).to_have_count(4)
        page.wait_for_load_state('networkidle')
        initial=requests.count('/api/v1/overview')
        page.locator('.navlink').filter(has_text='Environment').click()
        expect(page.locator('.grid.three .metric-mini')).to_have_count(6)
        t=time.perf_counter();page.locator('.navlink').filter(has_text='Overview').click()
        expect(page.locator('main h1')).to_have_text('Overview')
        expect(page.locator('.kpi .value')).to_have_count(4)
        elapsed=time.perf_counter()-t
        assert requests.count('/api/v1/overview')==initial,'Fresh cached page was unnecessarily refetched'
        assert not errors,errors
        page.get_by_role('button',name='Sign out',exact=True).click()
        expect(page.get_by_role('heading',name='Choose a demo role')).to_be_visible()
        page.get_by_role('button',name='Continue as Maintenance technician',exact=True).click()
        expect(page.get_by_role('heading',name='Overview',exact=True)).to_be_visible()
        page.get_by_role('button',name='Notifications',exact=False).click()
        drawer=page.get_by_role('dialog')
        expect(drawer.get_by_role('button',name='Leak drill',exact=True)).to_have_count(0)
        assert not errors,errors
        result={'passed':True,'recorded_context_matches_metric_api':True,'no_workspace_remount':True,
                'cached_navigation_seconds':round(elapsed,3),'role_controls_verified':True,'javascript_errors':errors}
        (out/'result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
        browser.close()


if __name__=='__main__':main()
