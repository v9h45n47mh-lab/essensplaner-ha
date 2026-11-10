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

Wenn Lovelace-Ressourcen in `configuration.yaml` im YAML-Modus verwaltet werden, muss zusätzlich `/essensplaner-card.js?v=1.2.0` als JavaScript-Modul eingetragen werden.

## Access Control

Den Wochenplan-Sensor (standardmäßig `sensor.essensplaner_wochenplan`) für die Benutzer zum **Lesen und Bedienen** freigeben, direkt oder über sein Label. Seit Version 1.1.1 nennen alle Aktionen der Karte diesen Sensor als Ziel. Eine Freigabe der Service-Domain `essensplaner` ist damit für die Karte nicht erforderlich. Die Integration prüft, dass das Ziel tatsächlich ihr eigener Wochenplan-Sensor ist. Bestehende Einträge und Gerichte dürfen nur die konfigurierten Verwalter oder HA-Administratoren ändern. Eigene Kalendereinträge darf zusätzlich ihr Eintragender löschen.

Nach einem Update Home Assistant neu starten und die App beziehungsweise das Dashboard neu laden. Die automatisch registrierte Karten-Ressource erhält eine neue Versionsadresse.

## Änderungen in 1.2.0

- Größere Wochenpfeile mit 48 × 48 Pixeln Bedienfläche.
- Bearbeiten und Löschen in der Gerichteverwaltung als Symbole mit Beschriftung für Screenreader und Tooltip.
- Versionsanzeige am Ende der Einstellungen.
- Maximilian und Paul können eigene Kalendereinträge nach Bestätigung löschen. Das Backend prüft die gespeicherte Benutzer-ID. Bei älteren Einträgen ohne Benutzer-ID wird ein eindeutig zuordenbarer Kontoname verwendet. Die Berechtigung zum Ändern bestehender Einträge bleibt auf Verwalter und HA-Administratoren beschränkt.

## Änderungen in 1.1.3

Jede geöffnete Karte verwaltet ihre angezeigte Woche lokal. Vor/Zurück, Wischen und **Heute** senden keinen gemeinsamen Wochenwechsel mehr. Paul und Manuel können deshalb unabhängig voneinander verschiedene Wochen ansehen. Der Sensor liefert alle geplanten Tage, sodass Einträge weiterhin sofort in allen Karten erscheinen, die gerade den betreffenden Tag anzeigen. Beim Öffnen startet die Karte in der aktuellen Woche.

## Änderungen in 1.1.2

Die Sensor-Aktualisierung läuft als Home-Assistant-Callback im Event Loop. Ein geplantes Gericht, Änderungen am Katalog und der Wochenwechsel werden so direkt an die Karte gemeldet. Sensor-Attribute werden als eigenständige Kopien geschrieben, damit auch Katalogänderungen zuverlässig ein neues Zustandsereignis auslösen. Nach der Gerichtsauswahl bestätigt **Einplanen** den Eintrag im gewählten Tag.

## Ansicht und Rechte

- Wochenweise Ansicht Montag bis Sonntag mit vor/zurück, Tagesplanung, Link, Bearbeiten/Löschen.
- Leere Tage können von jedem angemeldeten HA-Konto belegt werden. Bestehende Einträge und der Gerichtskatalog können nur die konfigurierten Verwalter oder HA-Administratoren ändern. Eigene Kalendereinträge kann der Eintragende löschen.
- Gerichte werden direkt in der App hinzugefügt und bearbeitet. Das Formular zeigt Fleisch/vegetarisch sowie die Personen, die das Gericht gern essen.
- Wochenplanung, Bearbeiten und Löschen erfolgen in App-Dialogen ohne Browser-Pop-ups. Bei freien Mahlzeiten lassen sich Link und optional der Eintrag im Gerichtskatalog hinterlegen.

- „Zufallsrezept“ schlägt passende gespeicherte Gerichte für die gewählten Mitesser vor, ohne sie direkt zu wiederholen. Mit Maximilian werden nur vegetarische Gerichte vorgeschlagen. Das ausgewählte Gericht lässt sich direkt für einen Kalendertag vormerken.

## Lokale Installation ohne HACS

`custom_components/essensplaner` in den gleichnamigen Ordner unter `<HA-Konfiguration>/custom_components/` kopieren und Home Assistant neu starten.
