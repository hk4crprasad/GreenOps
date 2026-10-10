"""Scoped next-calendar-day resource baseline. No provider or future observations."""
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from math import isfinite
from statistics import median
from zoneinfo import ZoneInfo
from sqlalchemy import select
from app.core.models import Observation, TABLES
from app.core.settings import settings

RESOURCES = {'energy.interval_kwh': ('Energy', 'kWh'), 'water.interval_l': ('Water', 'L'),
             'waste.generated_kg': ('Waste generated', 'kg')}


def percentile(values, fraction):
    ordered = sorted(values)
    position = (len(ordered) - 1) * fraction
    low = int(position)
    high = min(low + 1, len(ordered) - 1)
    return ordered[low] + (ordered[high] - ordered[low]) * (position - low)


def forecast_history(rows, zones, cutoff, timezone_name='Asia/Kolkata'):
    tz = ZoneInfo(timezone_name)
    cutoff = cutoff.astimezone(timezone.utc)
    tomorrow = cutoff.astimezone(tz).date() + timedelta(days=1)
    start = datetime.combine(tomorrow, datetime.min.time(), tzinfo=tz)
    end = datetime.combine(tomorrow + timedelta(days=1), datetime.min.time(), tzinfo=tz)
    history_start = cutoff - timedelta(days=28)
    zones = sorted(set(zones))
    history = defaultdict(dict)
    # An observation is assigned to its interval's starting local hour.
    for zone, metric, at, value in rows:
        if zone not in zones or metric not in RESOURCES or not history_start < at <= cutoff:
            continue
        history[zone, metric][at] = value
    points_at = []
    at = start.astimezone(timezone.utc)
    while at < end.astimezone(timezone.utc):
        points_at.append(at)
        at += timedelta(hours=1)
    resources = []
    for metric, (label, unit) in RESOURCES.items():
        predictions = defaultdict(list)
        zone_results = []
        valid_history = 0
        last_total, last_valid = 0., 0
        for zone in zones:
            samples = history[zone, metric]
            valid = [(at, v) for at, v in samples.items() if v is not None and isfinite(v) and v >= 0]
            valid_history += len(valid)
            recent = [v for at, v in valid if at > cutoff - timedelta(hours=24)]
            last_total += sum(recent)
            last_valid += len(recent)
            by_hour = defaultdict(list)
            by_weekday_hour = defaultdict(list)
            for at, value in valid:
                local = (at - timedelta(hours=1)).astimezone(tz)
                by_hour[local.hour].append(value)
                by_weekday_hour[local.weekday(), local.hour].append(value)
            fresh = bool(valid) and cutoff - max(at for at, _ in valid) <= timedelta(hours=48)
            zone_points = []
            for at in points_at:
                local = at.astimezone(tz)
                matching = by_weekday_hour[local.weekday(), local.hour]
                values = matching if len(matching) >= 3 else by_hour[local.hour]
                available = fresh and len(values) >= 3
                point = {'time': (at + timedelta(hours=1)).isoformat(), 'zone': zone,
                         'value': median(values) if available else None,
                         'lower': percentile(values, .1) if available else None,
                         'upper': percentile(values, .9) if available else None,
                         'sample_count': len(values),
                         'method': 'same_weekday_hour' if len(matching) >= 3 else 'same_hour_fallback',
                         'status': 'available' if available else 'insufficient_or_stale_history'}
                zone_points.append(point)
                predictions[point['time']].append(point)
            complete = all(p['value'] is not None for p in zone_points)
            zone_results.append({'zone': zone, 'value': sum(p['value'] for p in zone_points) if complete else None,
                                 'forecast_hours': sum(p['value'] is not None for p in zone_points),
                                 'status': 'available' if complete else 'unavailable'})
        facility_points = []
        for at in points_at:
            key = (at + timedelta(hours=1)).isoformat()
            group = predictions[key]
            complete = bool(zones) and len(group) == len(zones) and all(p['value'] is not None for p in group)
            facility_points.append({'time': key, 'zone': 'Facility forecast',
                                    **{k: sum(p[k] for p in group) if complete else None for k in ['value', 'lower', 'upper']},
                                    'available_zones': sum(p['value'] is not None for p in group), 'expected_zones': len(zones)})
        complete = bool(zones) and all(p['value'] is not None for p in facility_points)
        expected = len(zones) * 28 * 24
        last_expected = len(zones) * 24
        value = sum(p['value'] for p in facility_points) if complete else None
        last_coverage = min(1., last_valid / last_expected) if last_expected else 0
        resources.append({'metric': metric, 'label': label, 'unit': unit, 'value': value,
                          'lower': sum(p['lower'] for p in facility_points) if complete else None,
                          'upper': sum(p['upper'] for p in facility_points) if complete else None,
                          'status': 'available' if complete else 'unavailable', 'points': facility_points, 'zones': zone_results,
                          'forecast_hours': sum(p['value'] is not None for p in facility_points),
                          'history_valid_rows': valid_history, 'history_expected_rows': expected,
                          'history_coverage_pct': min(100., 100 * valid_history / expected) if expected else 0,
                          'last_24h': {'value': last_total if last_valid else None, 'coverage_pct': last_coverage * 100},
                          'change_pct': (value / last_total - 1) * 100 if complete and last_total > 0 and last_coverage == 1 else None})
    return {'as_of': cutoff.isoformat(), 'forecast_date': tomorrow.isoformat(), 'timezone': timezone_name,
            'start': start.isoformat(), 'end': end.isoformat(), 'horizon_hours': len(points_at),
            'history_start': history_start.isoformat(), 'history_end': cutoff.isoformat(), 'history_days': 28,
            'zone_codes': zones, 'resources': resources, 'method': 'weekday-hour-median-v1',
            'source_type': 'forecast_from_synthetic_history',
            'limitations': ['Per-zone median for the same weekday/hour over the last 28 days; falls back to same-hour history when fewer than three weekday samples exist.',
                           'Ranges sum historical 10th–90th percentile hourly values; they are planning variation bands, not calibrated prediction intervals.',
                           'Requires three samples per hourly bucket and readings no more than 48 hours old. Missing zones/hours make the full total unavailable.',
                           'Consumption and generated waste are forecast; water leaks, avoidable energy and category pickups are not inferred.',
                           'No future observations, extra visitors, weather forecast or planned interventions are used. Synthetic demonstration; real-hospital accuracy is unvalidated.']}


def tomorrow_forecast(db, scope):
    cutoff = scope.world.as_of
    zone = TABLES['zones']
    zone_query = select(zone.zone_code).where(zone.world_id == scope.world.id, zone.event_at <= cutoff, zone.zone_code.is_not(None))
    observation_query = select(Observation.zone_code, Observation.metric, Observation.interval_end, Observation.value).where(
        Observation.world_id == scope.world.id, Observation.metric.in_(RESOURCES),
        Observation.interval_end > cutoff - timedelta(days=28), Observation.interval_end <= cutoff)
    if scope.zone_codes is not None:
        zone_query = zone_query.where(zone.zone_code.in_(scope.zone_codes))
        observation_query = observation_query.where(Observation.zone_code.in_(scope.zone_codes))
    result = forecast_history(db.execute(observation_query).all(), db.scalars(zone_query).all(), cutoff, settings().facility_timezone)
    return {**result, 'world_id': str(scope.world.id), 'world_version': scope.world.version,
            'boundary': 'Sum of disjoint authorized reporting zones; generated waste is separate from pickup stock.'}
