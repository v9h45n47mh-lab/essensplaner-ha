from __future__ import annotations
from datetime import date, timedelta
from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from .const import DOMAIN

async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([MealPlannerSensor(hass, entry)])

class MealPlannerSensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_name = "Wochenplan"
    _attr_icon = "mdi:silverware-fork-knife"
    def __init__(self, hass, entry):
        self.hass, self.entry = hass, entry
        self._attr_unique_id = f"{entry.entry_id}_week"
        self._attr_native_value = 0
        self._attr_extra_state_attributes = {}
    async def async_added_to_hass(self):
        self.async_on_remove(async_dispatcher_connect(self.hass, f"{DOMAIN}_updated_{self.entry.entry_id}", self._refresh))
        self._refresh()
    def _refresh(self):
        obj=self.hass.data[DOMAIN][self.entry.entry_id]; data=obj["data"]
        day=obj["week"]; start=day-timedelta(days=day.weekday())
        days=[]
        for offset in range(7):
            d=start+timedelta(days=offset); item=data["days"].get(d.isoformat())
            days.append({"date":d.isoformat(),"entry":item})
        self._attr_native_value=sum(1 for d in days if d["entry"])
        self._attr_extra_state_attributes={"week_start":start.isoformat(),"week_end":(start+timedelta(days=6)).isoformat(),"days":days,"meals":data["meals"],"history":data.get("history",[])[:40]}
        self.async_write_ha_state()
