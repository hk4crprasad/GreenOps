"""Recorded operating risks and explicit, user-triggered presentation drills."""
from datetime import timedelta
from uuid import UUID
from typing import Literal
from fastapi import HTTPException
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select, func
from app.core.models import TABLES, Observation, now
from app.core.records import query, serialize, insert, get, audit
from app.core.settings import settings

DRILLS = {
    'water': {'name': 'Demo drill: water leak suspected', 'severity': 'high',
              'message': 'A presentation scenario flags unexpected water demand. Inspect the zone, acknowledge, and demonstrate containment.',
              'assumption': 'The leak signal is injected for the presentation. Recorded consumption below comes from the scoped synthetic dataset.'},
    'energy': {'name': 'Demo drill: after-hours energy spike', 'severity': 'high',
               'message': 'A presentation scenario flags an HVAC schedule mismatch. Review the energy map and record follow-up.',
               'assumption': 'The HVAC signal is injected for the presentation. Recorded consumption below comes from the scoped synthetic dataset. Critical clinical loads remain protected.'},
    'waste': {'name': 'Demo drill: waste pickup overdue', 'severity': 'medium',
              'message': 'A presentation scenario flags a missed pickup. Inspect the waste zone and demonstrate escalation.',
              'assumption': 'Simulated missed pickup. No physical handover or disposal is claimed.'},
}

class DrillInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    kind: Literal['water', 'energy', 'waste']
    zone_code: str = Field(min_length=1, max_length=80)

class DrillTransition(BaseModel):
    model_config = ConfigDict(extra='forbid')
    operation: Literal['acknowledge', 'resolve']
    expected_version: int = Field(ge=1)

def feed(db, scope):
    alerts = TABLES['alerts']; actions = TABLES['actions']
    open_filter = (alerts.world_id==scope.world.id, alerts.event_at<=scope.world.as_of, alerts.status=='open')
    active = list(db.scalars(select(alerts).where(*open_filter).order_by(
        alerts.event_at.desc(), alerts.created_at.desc(), alerts.id).limit(50)))
    recent_drills = list(db.scalars(select(alerts).where(alerts.world_id==scope.world.id,
        alerts.event_at<=scope.world.as_of, alerts.status=='resolved',
        alerts.data['demo_drill'].as_boolean()==True).order_by(alerts.created_at.desc()).limit(10)))
    due = list(db.scalars(select(actions).where(actions.world_id==scope.world.id,
        actions.event_at<=scope.world.as_of, actions.status.notin_(['closed','verified']),
        actions.due_at<=scope.world.as_of+timedelta(hours=24)).order_by(actions.due_at,actions.id).limit(20)))
    count = db.scalar(select(func.count()).select_from(alerts).where(*open_filter))
    return {'alerts':[serialize(r) for r in active+recent_drills], 'actions':[serialize(r) for r in due],
            'open_count':count, 'truncated':count>50, 'as_of':scope.world.as_of.isoformat(),
            'demo_enabled':settings().app_mode=='demo',
            'zones':[{'code':r.zone_code,'name':r.name} for r in query(db,scope,'zones',100) if r.zone_code]}

def require_drill(scope):
    if settings().app_mode!='demo':
        raise HTTPException(403,'Presentation drills are available only in demo mode')
    scope.require('environment')  # Administrators and operations supervisors only.

def create_drill(db, scope, body, key):
    require_drill(scope); scope.zone(body.zone_code)
    if not any(r.zone_code==body.zone_code for r in query(db,scope,'zones',100)):
        raise HTTPException(422,'Select an authorized reporting zone')
    cls=TABLES['alerts']
    key=f'drill:{scope.principal.user_id}:{key}' if key else None
    if key:
        old=db.scalar(select(cls).where(cls.world_id==scope.world.id,cls.idempotency_key==key))
        if old:return serialize(old)
    active=db.scalar(select(func.count()).select_from(cls).where(cls.world_id==scope.world.id,
        cls.status=='open',cls.data['demo_drill'].as_boolean()==True))
    if active>=5:raise HTTPException(409,'Resolve an existing drill before starting another (maximum five active)')
    preset=DRILLS[body.kind]
    metric,unit={'water':('water.interval_l','L'),'energy':('energy.interval_kwh','kWh'),
                 'waste':('waste.generated_kg','kg')}[body.kind]
    start=scope.world.as_of-timedelta(hours=24)
    observations=db.execute(select(func.sum(Observation.value),func.count(),func.count(Observation.value)).where(
        Observation.world_id==scope.world.id,Observation.zone_code==body.zone_code,
        Observation.metric==metric,Observation.interval_end>start,Observation.interval_end<=scope.world.as_of)).one()
    context={'metric':metric,'unit':unit,'value':float(observations[0]) if observations[0] is not None else None,
             'rows':observations[1],'valid_rows':observations[2],'expected_rows':24,
             'coverage_pct':min(100,observations[2]/24*100),'zone_code':body.zone_code,
             'start':start.isoformat(),'end':scope.world.as_of.isoformat(),'source_type':'synthetic_observations'}
    row=insert(db,scope,'alerts',{'demo_drill':True,'kind':body.kind,'message':preset['message'],
        'assumption':preset['assumption'],'recorded_context':context,'stage':'detected',
        'timeline':[{'stage':'detected','at':now().isoformat(),'actor':str(scope.principal.user_id)}],
        'limitations':['User-triggered synthetic drill. Does not change measured consumption, equipment, or verified savings.']},
        name=preset['name'],category=body.kind,severity=preset['severity'],status='open',
        zone_code=body.zone_code,owner_id=scope.principal.user_id,source_type='synthetic_demo_drill',idempotency_key=key)
    audit(db,scope,'demo_drill_created','alerts',row.id,None,serialize(row))
    return serialize(row)

def transition_drill(db, scope, record_id, body):
    require_drill(scope)
    row=get(db,scope,'alerts',record_id,True)
    if not row.data.get('demo_drill'):
        raise HTTPException(422,'Only a presentation drill can use simulated containment')
    scope.zone(row.zone_code)
    if row.version!=body.expected_version:raise HTTPException(409,'Drill changed; refresh and retry')
    stage=row.data.get('stage')
    target='acknowledged' if body.operation=='acknowledge' else 'resolved'
    if target==stage:return serialize(row)
    if (target=='acknowledged' and stage!='detected') or (target=='resolved' and stage!='acknowledged'):
        raise HTTPException(409,'Acknowledge the drill before demonstrating containment')
    before=serialize(row)
    row.version+=1
    row.data={**row.data,'stage':target,'timeline':row.data.get('timeline',[])+[
        {'stage':target,'at':now().isoformat(),'actor':str(scope.principal.user_id)}]}
    if target=='resolved':row.status='resolved'
    db.flush();audit(db,scope,'demo_drill_'+target,'alerts',row.id,before,serialize(row))
    return serialize(row)
