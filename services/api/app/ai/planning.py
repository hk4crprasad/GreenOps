"""Deterministic planning arithmetic over a run's authorized frozen evidence."""
from datetime import datetime, timedelta
from math import ceil
from zoneinfo import ZoneInfo
from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Literal
from app.simulation.engine import Baseline, Scenario, Intervention


class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)


class ExtraPeopleInput(Strict):
    extra_people: int = Field(ge=0, le=100000)
    person_type: Literal['visitors', 'inpatients', 'staff'] = 'visitors'
    average_stay_hours: float = Field(default=2, gt=0, le=24)
    arrival_window_hours: float = Field(default=10, gt=0, le=24)
    water_l_per_person: float | None = Field(default=None, ge=0, le=10000)
    energy_kwh_per_person: float | None = Field(default=None, ge=0, le=1000)
    waste_kg_per_person: float | None = Field(default=None, ge=0, le=1000)
    fresh_air_m3_per_person_hour: float = Field(default=30, ge=0, le=10000)
    water_loss_pct: float | None = Field(default=None, ge=0, le=100)
    avoidable_energy_pct: float | None = Field(default=None, ge=0, le=100)


class OutageComparisonInput(Strict):
    day: Literal['tomorrow', 'today'] = 'tomorrow'
    start_local: str = Field(default='09:00', pattern=r'^(?:[01]\d|2[0-3]):(?:00|15|30|45)$')
    end_local: str = Field(default='17:00', pattern=r'^(?:[01]\d|2[0-3]):(?:00|15|30|45)$')
    water_demand_increase_pct: float = Field(default=30, ge=0, le=300)
    pump_restoration_delay_hours: float = Field(default=0, ge=0, le=24, multiple_of=.25)
    additional_water_supply_lph: float | None = Field(default=None, ge=0, le=10000)

    @model_validator(mode='after')
    def increasing_window(self):
        if self.end_local <= self.start_local:
            raise ValueError('End time must be after start time on the selected day')
        return self


def extra_people_plan(frozen, body: ExtraPeopleInput):
    snapshot = frozen['get_facility_snapshot']
    forecast = frozen.get('get_tomorrow_forecast', {})
    n = body.extra_people
    defaults = {'water': 2.5, 'energy': .15, 'waste': .025} if body.person_type == 'visitors' else {}
    allowances = {key: getattr(body, field) if getattr(body, field) is not None else defaults.get(key)
                  for key, field in [('water', 'water_l_per_person'), ('energy', 'energy_kwh_per_person'), ('waste', 'waste_kg_per_person')]}
    forecast_metrics = {r['metric']: r for r in forecast.get('resources', [])}
    resources = {}
    for key, metric, unit in [('water', 'water.interval_l', 'L'), ('energy', 'energy.interval_kwh', 'kWh'), ('waste', 'waste.generated_kg', 'kg')]:
        prediction = forecast_metrics.get(metric, {})
        observed = snapshot.get('metrics', {}).get(metric, {})
        baseline = prediction.get('value')
        source = 'tomorrow_historical_forecast'
        if baseline is None:
            baseline = observed.get('value')
            source = 'last_24h_carry_forward_assumption' if baseline is not None else 'unknown'
        additional = n * allowances[key] if allowances[key] is not None else None
        resources[key] = {'unit': unit, 'allowance_per_person': allowances[key], 'additional': additional,
                          'baseline': baseline, 'baseline_source': source,
                          'projected_total': baseline + additional if baseline is not None and additional is not None else None,
                          'observed_coverage_pct': observed.get('coverage_pct'),
                          'forecast_history_coverage_pct': prediction.get('history_coverage_pct')}
    capacity, occupied = snapshot.get('bed_capacity'), snapshot.get('occupied_beds')
    headroom = max(0, capacity - occupied) if capacity is not None and occupied is not None else None
    waste = frozen.get('get_waste_state', {})
    free_waste = sum(max(0, c['capacity_kg']-c['stock_kg']) for c in waste.get('categories', [])) if waste.get('bins') else None
    parking = frozen.get('get_parking_and_safety', {}).get('parking', [])
    park = parking[0] if parking else None
    reserves = frozen.get('get_resource_reserves', {}).get('reserves', [])
    tank_data = [{'name': r['configuration']['name'], 'kind': r['configuration']['data'].get('kind'),
                  'reserve_l': r['state']['data'].get('reserve_l'), 'inflow_lph': r['state']['data'].get('inflow_lph'),
                  'recorded_at': r['state']['event_at']} for r in reserves if 'reserve_l' in r['state']['data']]
    power = [{'name': r['configuration']['name'], 'values': r['state']['data'], 'recorded_at': r['state']['event_at']}
             for r in reserves if 'battery_deliverable_kwh' in r['state']['data']]
    usable = sum(r['reserve_l'] for r in tank_data if r['kind'] != 'fire' and r['reserve_l'] is not None) if tank_data else None
    concerns = ['Staffing, clinical capability, fresh-air capacity and actual grid/supply availability are unknown; resource arithmetic cannot guarantee admission or service capacity.']
    if snapshot.get('stale_zone_codes'):concerns.append('Latest operating context is stale in: '+', '.join(snapshot['stale_zone_codes']))
    if body.person_type == 'inpatients' and headroom is not None and n > headroom:concerns.append('Additional inpatient count exceeds recorded bed headroom.')
    if park and (park['data'].get('queue', 0) > 0 or park['data'].get('protected_route_at_risk')):concerns.append('Recorded parking queue or protected-route risk requires review before claiming the facility can handle the increase.')
    additional_waste = resources['waste']['additional']
    if free_waste is not None and additional_waste is not None and additional_waste > free_waste:concerns.append('Additional generated waste exceeds recorded aggregate free bin capacity; category distribution/pickups require review.')
    return {'source_type': 'estimated_from_frozen_synthetic_data', 'extra_people': n, 'person_type': body.person_type,
            'as_of': snapshot['as_of'], 'forecast_date': forecast.get('forecast_date'), 'resources': resources,
            'average_stay_hours': body.average_stay_hours, 'arrival_window_hours': body.arrival_window_hours,
            'average_additional_people_on_site': n*min(1, body.average_stay_hours/body.arrival_window_hours),
            'additional_fresh_air_m3': n*body.average_stay_hours*body.fresh_air_m3_per_person_hour,
            'fresh_air_allowance_m3_per_person_hour': body.fresh_air_m3_per_person_hour,
            'water_loss_pct': body.water_loss_pct, 'avoidable_energy_pct': body.avoidable_energy_pct,
            'additional_water_loss_l': resources['water']['additional']*body.water_loss_pct/100 if resources['water']['additional'] is not None and body.water_loss_pct is not None else None,
            'additional_avoidable_energy_kwh': resources['energy']['additional']*body.avoidable_energy_pct/100 if resources['energy']['additional'] is not None and body.avoidable_energy_pct is not None else None,
            'bed_capacity': capacity, 'occupied_beds': occupied, 'bed_headroom': headroom,
            'beds_needed_assumption': n if body.person_type == 'inpatients' else 0,
            'usable_nonfire_water_reserve_l': usable, 'tank_states': tank_data, 'power_states': power,
            'free_waste_capacity_kg': free_waste, 'parking': park,
            'handling_status': 'not_confirmed', 'concerns': concerns,
            'assumptions': ['Unspecified members are treated as visitors for this planning case; confirm whether they are visitors, inpatients or staff.',
                            'Visitor defaults match synthetic generator per-OPD-visit coefficients; inpatient/staff resource allowances are unknown unless supplied.',
                            'Tomorrow historical resource forecast is used when available; fallback repeats the last 24-hour total with its partial coverage.',
                            'Arrivals are uniform across the chosen arrival window. Fresh-air allowance is illustrative, not a validated hospital standard.',
                            'Extra consumption is not necessarily wastage. Fire reserves cannot cover routine use. Staffing and indoor pollutant predictions are unavailable.']}


def outage_scenarios(baseline: Baseline, body: OutageComparisonInput, timezone_name):
    tz = ZoneInfo(timezone_name)
    date = baseline.as_of.astimezone(tz).date() + timedelta(days=int(body.day == 'tomorrow'))
    start = datetime.combine(date, datetime.strptime(body.start_local, '%H:%M').time(), tzinfo=tz)
    end = datetime.combine(date, datetime.strptime(body.end_local, '%H:%M').time(), tzinfo=tz)
    offset = (start - baseline.as_of).total_seconds()/3600
    end_offset = (end - baseline.as_of).total_seconds()/3600
    if offset < 0 or end_offset > 72:
        raise ValueError('Outage must be in the future and within the 72-hour simulation horizon')
    # Align the frozen reading to the existing 15-minute engine grid.
    if abs(offset*4-round(offset*4)) > 1e-6:
        raise ValueError('Frozen clock and requested time must align to a 15-minute grid')
    duration = (end - start).total_seconds()/3600
    if body.pump_restoration_delay_hours >= duration:
        raise ValueError('Pump restoration delay must be shorter than the outage')
    common = [Intervention(kind='grid_outage', start_hour=offset, duration_hours=duration, target='grid'),
              Intervention(kind='pump_failure', start_hour=offset, duration_hours=duration, target='pump'),
              Intervention(kind='water_demand_increase', start_hour=offset, duration_hours=duration, amount=body.water_demand_increase_pct)]
    demand = {kind: sum((t.essential_lph+t.nonessential_lph)*(1+body.water_demand_increase_pct/100) for t in baseline.tanks if t.kind == kind)
              for kind in ['potable', 'process']}
    total = sum(demand.values())
    supply = total if body.additional_water_supply_lph is None else body.additional_water_supply_lph
    external = [Intervention(kind='additional_water_supply', start_hour=offset, duration_hours=duration,
                             amount=supply*demand[kind]/total if total else 0, target=kind) for kind in demand]
    scenarios = [Scenario(name='No action', horizon_hours=ceil(end_offset), events=common),
                 Scenario(name='Backup pump restore', horizon_hours=ceil(end_offset), events=common+[
                     Intervention(kind='asset_restoration', start_hour=offset+body.pump_restoration_delay_hours,
                                  duration_hours=duration-body.pump_restoration_delay_hours, target='pump')]),
                 Scenario(name='Additional water supply', horizon_hours=ceil(end_offset), events=common+external)]
    return scenarios, {'start_local': start.isoformat(), 'end_local': end.isoformat(),
                       'start_utc': start.astimezone(ZoneInfo('UTC')).isoformat(), 'end_utc': end.astimezone(ZoneInfo('UTC')).isoformat(),
                       'start_hour': offset, 'end_hour': end_offset, 'duration_hours': duration,
                       'water_demand_increase_pct': body.water_demand_increase_pct, 'additional_water_supply_lph': supply,
                       'external_supply_split_lph': {e.target: e.amount for e in external},
                       'pump_restoration_delay_hours': body.pump_restoration_delay_hours,
                       'time_resolution_minutes': 15, 'timezone': timezone_name}


def outage_run_summary(saved, window, timezone_name):
    result = saved['data']['result']['central']
    baseline = Baseline.model_validate(saved['data']['baseline'])
    start, end = window['start_hour'], window['end_hour']
    relevant = [v for v in result['violations'] if start < v['hour'] <= end]
    def shortage(kind):
        first = next((v for v in relevant if v['kind'] == kind), None)
        if first is None:return None
        to = baseline.as_of + timedelta(hours=first['hour'])
        return {'resource': 'water' if kind.endswith('water') else 'power',
                'interval_start_local': (to-timedelta(minutes=15)).astimezone(ZoneInfo(timezone_name)).isoformat(),
                'interval_end_local': to.astimezone(ZoneInfo(timezone_name)).isoformat(),
                'at_utc': to.astimezone(ZoneInfo('UTC')).isoformat(),
                'shortfall_in_first_interval': first.get('value_l', first.get('value_kwh')),
                'unit': 'L' if kind.endswith('water') else 'kWh'}
    water, power = shortage('unmet_essential_water'), shortage('unmet_essential_power')
    at_start = next((p for p in result['points'] if abs(p['hour']-start) < 1e-6), None)
    at_end = next(p for p in result['points'] if abs(p['hour']-end) < 1e-6)
    totals = {key: at_end[key]-(at_start[key] if at_start else 0) for key in ['unmet_essential_water_l', 'unmet_essential_energy_kwh']}
    first_hour = min((v['hour'] for v in relevant), default=None)
    return {'id': saved['id'], 'name': saved['name'], 'status': saved['status'],
            'outage_unmet_essential': totals, 'water_shortage': water, 'power_shortage': power,
            'first_shortages': [s for s in [water, power] if s and s['at_utc'] == (baseline.as_of+timedelta(hours=first_hour)).astimezone(ZoneInfo('UTC')).isoformat()] if first_hour is not None else [],
            'already_unmet_before_outage': {key: at_start[key] if at_start else 0 for key in totals},
            'at_outage_end': {'tanks_l': at_end['tanks'], 'battery_kwh': at_end['battery_kwh'], 'fuel_l': at_end['fuel_l'],
                              'pump_available': at_end['pump_available']},
            'full_horizon_totals': result['totals']}
