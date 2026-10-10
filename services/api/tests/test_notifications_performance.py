from copy import deepcopy
from datetime import timedelta
from uuid import uuid4
from types import SimpleNamespace
import pytest
from fastapi import HTTPException
from sqlalchemy import select
from app.core.db import Session, transaction
from app.cli import demo_principal
from app.core.auth import resolve_scope, Principal
from app.core.models import World
from app.core.snapshot import snapshot_reads, snapshot_read
from app.core.settings import settings
from app.domains.notifications import feed, create_drill, transition_drill, DrillInput, DrillTransition


def test_drill_lifecycle_is_scoped_audited_and_does_not_change_consumption():
    p=demo_principal()
    with transaction(p.user_id,p.organization_id) as db:
        fixture=db.begin_nested()
        w=db.scalar(select(World).where(World.code=='extended_v1'));scope=resolve_scope(db,p,w.id)
        from app.domains.metrics import totals, window
        before=totals(db,scope,*window(scope))
        key=str(uuid4())
        row=create_drill(db,scope,DrillInput(kind='water',zone_code='WARD_A'),key)
        assert row['source_type']=='synthetic_demo_drill' and row['data']['demo_drill']
        assert create_drill(db,scope,DrillInput(kind='water',zone_code='WARD_A'),key)['id']==row['id']
        assert row['id'] in {r['id'] for r in feed(db,scope)['alerts']}
        with pytest.raises(HTTPException) as exc:
            transition_drill(db,scope,row['id'],DrillTransition(operation='resolve',expected_version=1))
        assert exc.value.status_code==409
        ack=transition_drill(db,scope,row['id'],DrillTransition(operation='acknowledge',expected_version=1))
        assert ack['status']=='open' and ack['version']==2
        with pytest.raises(HTTPException):
            transition_drill(db,scope,row['id'],DrillTransition(operation='resolve',expected_version=1))
        end=transition_drill(db,scope,row['id'],DrillTransition(operation='resolve',expected_version=2))
        assert end['status']=='resolved' and len(end['data']['timeline'])==3
        assert totals(db,scope,*window(scope))==before
        with pytest.raises(HTTPException):create_drill(db,scope,DrillInput(kind='energy',zone_code='INVENTED'),None)
        fixture.rollback()


def test_drills_require_demo_mode_and_operational_role(monkeypatch):
    p=demo_principal()
    with transaction(p.user_id,p.organization_id) as db:
        w=db.scalar(select(World).where(World.code=='extended_v1'));scope=resolve_scope(db,p,w.id)
        monkeypatch.setattr(settings(),'app_mode','production')
        with pytest.raises(HTTPException) as exc:create_drill(db,scope,DrillInput(kind='water',zone_code='WARD_A'),None)
        assert exc.value.status_code==403
        monkeypatch.setattr(settings(),'app_mode','demo')
        scope.principal=Principal(p.user_id,p.organization_id,'auditor')
        with pytest.raises(HTTPException) as exc:create_drill(db,scope,DrillInput(kind='water',zone_code='WARD_A'),None)
        assert exc.value.status_code==403


def test_snapshot_cache_is_short_lived_scoped_and_copies_results():
    calls=[]
    @snapshot_read
    def read(db,scope,start=None,end=None):
        calls.append(scope.zone_codes)
        return {'rows':[scope.zone_codes]}
    db=SimpleNamespace(info={})
    from datetime import datetime,timezone
    scope=SimpleNamespace(principal=SimpleNamespace(user_id=uuid4()),zone_codes=None,
        world=SimpleNamespace(id=uuid4(),as_of=datetime.now(timezone.utc),version=1))
    with snapshot_reads(db):
        value=read(db,scope);value['rows'].clear()
        assert read(db,scope)['rows']==[None]
        read(db,scope,scope.world.as_of-timedelta(hours=24),scope.world.as_of)
        assert len(calls)==1
        scope.zone_codes=['WARD_A'];assert read(db,scope)['rows']==[['WARD_A']]
        assert len(calls)==2
    assert not db.info
    read(db,scope);assert len(calls)==3


def test_jobs_publish_only_after_outer_commit_and_rollback_discards(monkeypatch):
    from app.jobs import service
    sent=[]
    monkeypatch.setattr(service,'_dispatch_pool',SimpleNamespace(submit=lambda fn,jid:sent.append(jid)))
    with Session() as db:
        with db.begin():
            db.info['greenops_dispatch_jobs']=['committed']
            with db.begin_nested():pass
            assert not sent
        assert sent==['committed']
        with pytest.raises(ValueError):
            with db.begin():
                db.info['greenops_dispatch_jobs']=['rolled-back']
                raise ValueError('rollback')
        assert sent==['committed'] and 'greenops_dispatch_jobs' not in db.info
