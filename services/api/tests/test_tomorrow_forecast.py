from datetime import datetime, timedelta, timezone
import pytest
from app.analytics.tomorrow import forecast_history, RESOURCES


def history(cutoff, zones=('ICU',)):
    return [(zone, metric, cutoff - timedelta(hours=i), value)
            for zone in zones for metric, value in zip(RESOURCES, (10., 100., 2.)) for i in range(28*24)]


def test_next_local_calendar_day_totals_and_no_future_leakage():
    cutoff = datetime(2025, 6, 30, 20, tzinfo=timezone.utc)  # July 1 in India
    rows = history(cutoff) + [('ICU', 'energy.interval_kwh', cutoff + timedelta(hours=1), 999999.)]
    result = forecast_history(rows, ['ICU'], cutoff)
    assert result['forecast_date'] == '2025-07-02'
    assert result['start'] == '2025-07-02T00:00:00+05:30'
    assert result['horizon_hours'] == 24
    assert [r['value'] for r in result['resources']] == [240., 2400., 48.]
    assert all(r['history_coverage_pct'] == 100 for r in result['resources'])
    assert all(r['lower'] == r['upper'] == r['value'] for r in result['resources'])


def test_missing_zone_and_null_readings_never_become_zero_totals():
    cutoff = datetime(2025, 6, 30, tzinfo=timezone.utc)
    result = forecast_history(history(cutoff), ['ICU', 'WARD_A'], cutoff)
    assert all(r['value'] is None and r['forecast_hours'] == 0 for r in result['resources'])
    rows = [(z, m, at, None if m == 'water.interval_l' else v) for z, m, at, v in history(cutoff)]
    result = forecast_history(rows, ['ICU'], cutoff)
    assert result['resources'][0]['value'] == 240
    assert result['resources'][1]['value'] is None
    assert result['resources'][1]['last_24h']['value'] is None


def test_short_and_stale_history_and_scoped_zone_boundary():
    cutoff = datetime(2025, 6, 30, tzinfo=timezone.utc)
    assert all(r['value'] is None for r in forecast_history(history(cutoff)[:2], ['ICU'], cutoff)['resources'])
    assert all(r['value'] is None for r in forecast_history(history(cutoff - timedelta(days=3)), ['ICU'], cutoff)['resources'])
    result = forecast_history(history(cutoff, ('ICU', 'WARD_A')), ['ICU'], cutoff)
    assert result['resources'][0]['value'] == 240
    assert result['zone_codes'] == ['ICU']


def test_matching_weekday_pattern_and_partial_comparison():
    cutoff = datetime(2025, 6, 30, 20, tzinfo=timezone.utc)
    rows = history(cutoff)
    from zoneinfo import ZoneInfo
    tz = ZoneInfo('Asia/Kolkata')
    rows = [(z, m, at, v*2 if (at-timedelta(hours=1)).astimezone(tz).weekday() == 2 else v) for z, m, at, v in rows]
    result = forecast_history(rows, ['ICU'], cutoff)
    assert result['resources'][0]['value'] == pytest.approx(480)
    # A missing previous-period interval cannot support a day-over-day percentage.
    result = forecast_history([r for r in rows if r[2] != cutoff], ['ICU'], cutoff)
    assert result['resources'][0]['change_pct'] is None
