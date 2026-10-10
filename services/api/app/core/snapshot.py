"""Reuse reads only while explicitly capturing one immutable, authorized snapshot."""
from contextlib import contextmanager
from copy import deepcopy
from functools import wraps
from inspect import signature
from datetime import timedelta


@contextmanager
def snapshot_reads(db):
    previous = db.info.get('greenops_snapshot_reads')
    if previous is None:
        db.info['greenops_snapshot_reads'] = {}
    try:
        yield
    finally:
        if previous is None:
            db.info.pop('greenops_snapshot_reads', None)


def snapshot_read(fn):
    parameters = signature(fn)
    @wraps(fn)
    def read(db, scope, *args, **kwargs):
        cache = db.info.get('greenops_snapshot_reads')
        if cache is None:
            return fn(db, scope, *args, **kwargs)
        bound = parameters.bind(db, scope, *args, **kwargs)
        bound.apply_defaults()
        values = {k:v for k,v in bound.arguments.items() if k not in {'db','scope'}}
        if 'start' in values and 'end' in values:
            values['end'] = values['end'] or scope.world.as_of
            values['start'] = values['start'] or values['end']-timedelta(hours=24)
        key = (fn.__module__, fn.__name__, str(scope.principal.user_id),
               str(scope.world.id), scope.world.as_of.isoformat(), scope.world.version,
               None if scope.zone_codes is None else tuple(scope.zone_codes), repr(sorted(values.items())))
        if key not in cache:
            cache[key] = fn(db, scope, *args, **kwargs)
        return deepcopy(cache[key])  # Tool formatting must not trim another reader's data.
    return read
