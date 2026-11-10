import ast
import asyncio
from copy import deepcopy
from datetime import date, datetime
from pathlib import Path
from types import SimpleNamespace as NS
from urllib.parse import urlparse

class Rejected(Exception):
    pass

async def main():
    source = ast.parse((Path(__file__).resolve().parents[1] / 'custom_components/essensplaner/__init__.py').read_text())
    setup = next(n for n in source.body if isinstance(n, ast.AsyncFunctionDef) and n.name == 'async_setup_entry')
    nodes = [next(n for n in source.body if isinstance(n, ast.AsyncFunctionDef) and n.name == 'async_is_entry_owner')]
    nodes += [n for n in setup.body if isinstance(n, ast.AsyncFunctionDef) and n.name in ('can_manage', 'plan_day', 'apply_plan_day')]
    for node in nodes:
        node.returns = None
        for arg in node.args.args:
            arg.annotation = None
    users = {key: NS(id=key, name=name, is_admin=key=='admin') for key,name in [('paul','Paul'),('max','Maximilian'),('manuel','Manuel'),('vera','Vera'),('admin','Administrator')]}
    async def get_user(key): return users.get(key)
    async def get_users(): return list(users.values())
    auth = NS(async_get_user=get_user, async_get_users=get_users)
    data = {'meals': [], 'days': {}, 'history': []}
    writes = []
    async def update(): writes.append(deepcopy(data))
    async def validate(*args): pass
    ns = {'hass': NS(auth=auth), 'entry': NS(options={}), 'data': data, 'update': update,
          'async_validate_target': validate, 'plan_lock': asyncio.Lock(), 'HomeAssistantError': Rejected,
          'datetime': datetime, 'urlparse': urlparse}
    exec(compile(ast.Module(body=nodes,type_ignores=[]), '<planner handlers>', 'exec'),ns)
    target = '2026-11-10'
    def call(actor, **payload): return NS(context=NS(user_id=actor),data={'date':date.fromisoformat(target),**payload})
    def seed(owner, name=None):
        data['days'][target]={'title':'Pasta','planned_by':name or users.get(owner,NS(name='Home Assistant')).name,'planned_by_user_id':owner}
    async def denied(actor, **payload):
        before=deepcopy(data)
        try: await ns['plan_day'](call(actor, **payload))
        except Rejected: assert data==before
        else: raise AssertionError(f'{actor} should have been rejected')
    for actor in ('paul','max'):
        data['days'].clear()
        await ns['plan_day'](call(actor,text='Eigenes Essen'))
        assert data['days'][target]['planned_by_user_id']==actor
        await ns['plan_day'](call(actor,clear=True))
        assert target not in data['days']
    print('PASS Paul and Maximilian create and delete their own entries')
    for owner,actor in [('paul','max'),('max','paul'),('manuel','paul'),('vera','max')]:
        seed(owner);await denied(actor,clear=True)
    seed('paul');await denied('paul',text='Unzulässiges Ändern')
    seed(None,'Paul');await denied('paul',clear=True)
    seed('max','Paul');await denied('paul',clear=True)
    print('PASS foreign entries, replacement of own entries and misleading display names are rejected')
    for actor in ('manuel','vera','admin'):
        seed('paul');await ns['plan_day'](call(actor,clear=True));assert target not in data['days']
    print('PASS parents and administrator retain deletion permission')
    for actor in ('paul','max'):
        data['days'][target]={'title':'Altbestand','planned_by':users[actor].name}
        await ns['plan_day'](call(actor,clear=True));assert target not in data['days']
    users['other-paul']=NS(id='other-paul',name='PAUL',is_admin=False)
    data['days'][target]={'title':'Mehrdeutig','planned_by':'Paul'}
    await denied('paul',clear=True)
    seed('paul');await denied('other-paul',clear=True)
    users.pop('other-paul')
    print('PASS unique legacy names work; ambiguous names and mismatched IDs are rejected')

    seed('paul')
    manager_started,release_manager=asyncio.Event(),asyncio.Event()
    async def delayed_get_user(key):
        if key=='manuel' and not manager_started.is_set():
            manager_started.set();await release_manager.wait()
        return users.get(key)
    auth.async_get_user=delayed_get_user
    parent=asyncio.create_task(ns['plan_day'](call('manuel',text='Neu von Manuel')))
    await manager_started.wait()
    child=asyncio.create_task(ns['plan_day'](call('paul',clear=True)))
    await asyncio.sleep(0)
    assert not child.done()
    release_manager.set();await parent
    try: await child
    except Rejected: pass
    else: raise AssertionError('old ownership was used after a concurrent replacement')
    assert data['days'][target]['title']=='Neu von Manuel'
    assert data['days'][target]['planned_by_user_id']=='manuel'
    print('PASS concurrent replacement cannot be deleted using stale ownership')

asyncio.run(main())
