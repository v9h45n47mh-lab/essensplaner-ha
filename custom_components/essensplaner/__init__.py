from __future__ import annotations

from datetime import date, datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse
import json
import logging
import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.storage import Store
from homeassistant.helpers import config_validation as cv
from .const import DOMAIN, PEOPLE, STORAGE_KEY, STORAGE_VERSION

_LOGGER = logging.getLogger(__name__)
PLATFORMS = ["sensor"]
IMPORT_SCHEMA = vol.Schema({vol.Required("catalog"): dict})
MEAL_SCHEMA = vol.Schema({vol.Optional("id"): str, vol.Required("name"): vol.All(str, vol.Length(min=1,max=120)), vol.Required("meat"): bool, vol.Required("eaters"): [str]})
DELETE_MEAL_SCHEMA = vol.Schema({vol.Required("id"): str})
PLAN_SCHEMA = vol.Schema({vol.Required("date"): cv.date, vol.Optional("meal_id"): str, vol.Optional("text"): vol.All(str, vol.Length(min=1,max=240)), vol.Optional("link"): vol.All(str, vol.Length(max=2048)), vol.Optional("clear", default=False): bool})
WEEK_SCHEMA = vol.Schema({vol.Optional("date"): cv.date})

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    store = Store(hass, STORAGE_VERSION, f"{STORAGE_KEY}_{entry.entry_id}")
    data = await store.async_load() or {"meals": [], "days": {}, "history": []}
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {"store": store, "data": data, "week": date.today()}
    entry.async_on_unload(entry.add_update_listener(_options_updated))
    async def update():
        await store.async_save(data)
        async_dispatcher_send(hass, f"{DOMAIN}_updated_{entry.entry_id}")
    async def can_manage(call):
        user = await hass.auth.async_get_user(call.context.user_id) if call.context.user_id else None
        configured = {x.strip().casefold() for x in entry.options.get("manager_names", "Vera, Manuel").split(",") if x.strip()}
        return bool(user and (user.is_admin or user.name.casefold() in configured))
    async def import_catalog(call: ServiceCall):
        payload = call.data["catalog"]
        if isinstance(payload.get("catalog"), dict):
            payload = payload["catalog"]
        if payload.get("format") not in (None, "essensplaner-ha-meals") or payload.get("version") not in (None, 1) or not isinstance(payload.get("meals"), list):
            raise HomeAssistantError("Ungültiger Export. Erwartet wird eine JSON-Datei mit einer Liste 'meals'.")
        meals=[]
        for index, m in enumerate(payload["meals"], start=1):
            if not isinstance(m, dict) or not isinstance(m.get("name", m.get("title")), str):
                raise HomeAssistantError(f"Gericht {index} enthält keinen gültigen Namen.")
            raw_eaters=m.get("eaters", m.get("people", m.get("likedBy", m.get("likes", []))))
            if isinstance(raw_eaters, dict):
                eaters=[p for p, liked in raw_eaters.items() if liked is True or str(liked).casefold() in ("x", "j", "ja", "true", "1")]
            elif isinstance(raw_eaters, str):
                eaters=[p.strip() for p in raw_eaters.replace(";", ",").split(",") if p.strip()]
            elif isinstance(raw_eaters, list):
                eaters=raw_eaters
            else:
                eaters=[]
            if not eaters or any(p not in PEOPLE for p in eaters):
                raise HomeAssistantError(f"Gericht {index} ({m.get('name', m.get('title'))}) benötigt mindestens eine gültige Person unter eaters.")
            name=m.get("name", m.get("title"))
            raw_meat=m.get("meat", m.get("is_meat", m.get("isMeat", m.get("fleisch", False))))
            meat = raw_meat if isinstance(raw_meat, bool) else str(raw_meat).strip().casefold() in ("j", "ja", "yes", "true", "1", "fleisch")
            if meat and "Maximilian" in eaters: raise HomeAssistantError(f"Gericht '{name}' ist als Fleischgericht markiert und Maximilian zugeordnet.")
            meals.append({"id":m.get("id") if isinstance(m.get("id"),str) and m.get("id") else __import__("uuid").uuid4().hex,"name":" ".join(name.split()),"meat":meat,"eaters":[p for p in PEOPLE if p in eaters]})
        if not await can_manage(call): raise HomeAssistantError("Nur Vera, Manuel oder ein HA-Administrator dürfen Gerichte importieren.")
        data["meals"]=meals
        await update()
    async def save_meal(call: ServiceCall):
        if not await can_manage(call): raise HomeAssistantError("Nur Vera, Manuel oder HA-Administratoren dürfen Gerichte verwalten.")
        item=call.data
        name=" ".join(item["name"].split()); eaters=item["eaters"]
        if not eaters or any(p not in PEOPLE for p in eaters): raise HomeAssistantError("Bitte mindestens eine gültige Person auswählen.")
        if item["meat"] and "Maximilian" in eaters: raise HomeAssistantError("Maximilian isst vegetarisch.")
        meal={"id":item.get("id") or __import__("uuid").uuid4().hex,"name":name,"meat":item["meat"],"eaters":[p for p in PEOPLE if p in eaters]}
        meals=data["meals"]
        existing=next((i for i,m in enumerate(meals) if m["id"]==meal["id"]),None)
        if existing is None: meals.append(meal)
        else: meals[existing]=meal
        await update()
    async def delete_meal(call: ServiceCall):
        if not await can_manage(call): raise HomeAssistantError("Nur Vera, Manuel oder HA-Administratoren dürfen Gerichte löschen.")
        meal=next((m for m in data["meals"] if m["id"]==call.data["id"]),None)
        if not meal: raise HomeAssistantError("Gericht nicht gefunden.")
        data["meals"]=[m for m in data["meals"] if m["id"]!=meal["id"]]
        for item in data["days"].values():
            if item.get("meal_id")==meal["id"]: item["meal_id"]=None
        await update()
    async def show_week(call: ServiceCall):
        hass.data[DOMAIN][entry.entry_id]["week"] = call.data.get("date", date.today())
        await update()
    async def plan_day(call: ServiceCall):
        target=call.data["date"].isoformat(); old=data["days"].get(target)
        if old and not await can_manage(call): raise HomeAssistantError("Bestehende Einträge dürfen nur Vera, Manuel oder HA-Administratoren ändern.")
        if call.data.get("clear"):
            if old and not await can_manage(call): raise HomeAssistantError("Nur Vera, Manuel oder HA-Administratoren dürfen löschen.")
            if old: data["days"].pop(target)
            title=old.get("title","") if old else ""
            action="remove"
        else:
            meal_id=call.data.get("meal_id"); meal=next((m for m in data["meals"] if m["id"]==meal_id),None) if meal_id else None
            if meal_id and not meal: raise HomeAssistantError("Das gespeicherte Gericht wurde nicht gefunden.")
            title=meal["name"] if meal else " ".join(call.data.get("text","").split())
            if not title: raise HomeAssistantError("Bitte ein Gericht wählen oder Freitext eingeben.")
            link=call.data.get("link","").strip()
            if link:
                parsed=urlparse(link)
                if parsed.scheme not in ("http","https") or not parsed.netloc or parsed.username or parsed.password: raise HomeAssistantError("Der Link muss mit http:// oder https:// beginnen.")
            user=await hass.auth.async_get_user(call.context.user_id) if call.context.user_id else None
            by=user.name if user else "Home Assistant"
            data["days"][target]={"title":title,"meal_id":meal["id"] if meal else None,"link":link,"planned_by":by,"planned_at":datetime.now().astimezone().isoformat()}
            action="replace" if old else "create"
        data.setdefault("history",[]).insert(0,{"date":target,"action":action,"before":old.get("title","") if old else "","after":title if action!="remove" else "","by":(await hass.auth.async_get_user(call.context.user_id)).name if call.context.user_id else "Home Assistant","at":datetime.now().astimezone().isoformat()})
        del data["history"][200:]
        await update()
    from homeassistant.helpers.dispatcher import async_dispatcher_send
    hass.services.async_register(DOMAIN,"import_catalog",import_catalog, schema=IMPORT_SCHEMA)
    hass.services.async_register(DOMAIN,"show_week",show_week, schema=WEEK_SCHEMA)
    hass.services.async_register(DOMAIN,"save_meal",save_meal, schema=MEAL_SCHEMA)
    hass.services.async_register(DOMAIN,"delete_meal",delete_meal, schema=DELETE_MEAL_SCHEMA)
    hass.services.async_register(DOMAIN,"plan_day",plan_day, schema=PLAN_SCHEMA)
    panel_file = Path(__file__).parent / "www" / "essensplaner-card.js"
    try:
        await hass.http.async_register_static_paths([StaticPathConfig("/essensplaner-card.js", str(panel_file), cache_headers=True)])
    except RuntimeError:
        # The static path is already registered during an in-place config-entry reload.
        pass
    frontend.async_register_built_in_panel(
        hass,
        "custom",
        frontend_url_path=DOMAIN,
        sidebar_title="Essensplaner",
        sidebar_icon="mdi:silverware-fork-knife",
        config={"_panel_custom": {"name": "essensplaner-panel", "module_url": "/essensplaner-card.js?v=1.0.8"}},
        require_admin=False,
        update=frontend.async_panel_exists(hass, DOMAIN),
    )
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True

async def _options_updated(hass, entry):
    await hass.config_entries.async_reload(entry.entry_id)

async def async_unload_entry(hass, entry):
    ok=await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok: hass.data[DOMAIN].pop(entry.entry_id, None)
    return ok
