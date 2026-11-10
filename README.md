# Essensplaner für Home Assistant

Eine lokale Essensplaner-Integration mit Wochenkalender Montag bis Sonntag, Freitext, gespeicherten Gerichten, Links, Mitesser-Auswahl und Zufallsrezepten.

## Installation

1. Repository `v9h45n47mh-lab/essensplaner-ha` in HACS unter **Benutzerdefinierte Repositories** als **Integration** hinzufügen.
2. **Essensplaner** installieren und Home Assistant neu starten.
3. Unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** nach **Essensplaner** suchen. Nach dem Neustart wird die Essensplaner-Karte in Lovelace registriert. Füge sie über **Dashboard bearbeiten → Karte hinzufügen → Essensplaner** zu deinem Dashboard hinzu.
4. In den Integrationsoptionen können die HA-Kontonamen eingetragen werden, die bestehende Plan-Einträge und Gerichte bearbeiten oder löschen dürfen. Standard: `Vera, Manuel`. HA-Administratoren dürfen alles.

## Essensplaner zum Dashboard hinzufügen

In einem normalen Lovelace-Dashboard: **Dashboard bearbeiten → Karte hinzufügen → Essensplaner**. Die Karte kann auch als YAML-Karte mit folgender Konfiguration eingefügt werden:

```yaml
type: custom:essensplaner-card
```

Wenn Lovelace-Ressourcen in `configuration.yaml` im YAML-Modus verwaltet werden, muss zusätzlich `/essensplaner-card.js?v=1.1.0` als JavaScript-Modul eingetragen werden.

## Ansicht und Rechte

- Wochenweise Ansicht Montag bis Sonntag mit vor/zurück, Tagesplanung, Link, Bearbeiten/Löschen.
- Leere Tage können von jedem angemeldeten HA-Konto belegt werden. Bestehende Einträge und der Gerichtskatalog können nur die konfigurierten Verwalter oder HA-Administratoren ändern.
- Gerichte werden direkt in der App hinzugefügt und bearbeitet. Das Formular zeigt Fleisch/vegetarisch sowie die Personen, die das Gericht gern essen.
- Wochenplanung, Bearbeiten und Löschen erfolgen in App-Dialogen ohne Browser-Pop-ups. Bei freien Mahlzeiten lassen sich Link und optional der Eintrag im Gerichtskatalog hinterlegen.

- „Zufallsrezept“ schlägt passende gespeicherte Gerichte für die gewählten Mitesser vor, ohne sie direkt zu wiederholen. Mit Maximilian werden nur vegetarische Gerichte vorgeschlagen. Das ausgewählte Gericht lässt sich direkt für einen Kalendertag vormerken.\n\n## Lokale Installation ohne HACS

`custom_components/essensplaner` in den gleichnamigen Ordner unter `<HA-Konfiguration>/custom_components/` kopieren und Home Assistant neu starten.
