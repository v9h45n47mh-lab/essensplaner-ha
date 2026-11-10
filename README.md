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

Wenn Lovelace-Ressourcen in `configuration.yaml` im YAML-Modus verwaltet werden, muss zusätzlich `/essensplaner/essensplaner-card.js?v=1.4.0` als JavaScript-Modul eingetragen werden.

## Access Control

Den Wochenplan-Sensor (standardmäßig `sensor.essensplaner_wochenplan`) für die Benutzer zum **Lesen und Bedienen** freigeben, direkt oder über sein Label. Seit Version 1.1.1 nennen alle Aktionen der Karte diesen Sensor als Ziel. Eine Freigabe der Service-Domain `essensplaner` ist damit für die Karte nicht erforderlich. Die Integration prüft, dass das Ziel tatsächlich ihr eigener Wochenplan-Sensor ist. Bestehende Einträge und Gerichte dürfen nur die konfigurierten Verwalter oder HA-Administratoren ändern. Eigene Kalendereinträge darf zusätzlich ihr Eintragender löschen.

Nach einem Update Home Assistant neu starten und die App beziehungsweise das Dashboard neu laden. Die automatisch registrierte Karten-Ressource erhält eine neue Versionsadresse.

## Änderungen in 1.4.0

HA UI Kit **1.2.0** ist fest und lokal eingebunden. Wochenkalender, Vor-/Zurück-/Heute-Navigation, Gerichte-Suche mit sechs sichtbaren Treffern, Bestätigungsdialoge, URL-Felder, JSON-Download und Wischgesten verwenden jetzt die gemeinsamen Bausteine. Die bisherigen lokalen Kalender-/Suchstile und Suchcontroller entfallen. Freie Eingaben, unabhängige Kalenderwochen, Live-Aktualisierung, Zufallsrezepte, Gerichteexport und Berechtigungen bleiben erhalten.

Geprüft mit Testdaten: Desktop und Mobil (1100/430/390/375 px), helle/dunkle Themes, Teilbegriffsuche, Tastaturauswahl, direktes Einplanen, Gerichte bearbeiten und eigenes Löschen. Nach dem Update Home Assistant neu starten und die App bei allen Benutzern neu laden.

## Änderungen in 1.3.1

Der lokale HA UI Kit wurde auf **1.1.0** aktualisiert (fester Quellstand `6e57c4079ff20d56a7cbd91470216c27c9767e13`). Die neue Moduladresse und die Ressourcenkennung laden die aktualisierten Komponenten ohne Verwechslung mit der bisherigen UI-Version. Kalender, Gerichte, Formulare und Berechtigungen bleiben unverändert. Nach dem Update Home Assistant neu starten und die App bei allen Benutzern neu laden.

## Oberfläche seit 1.3.0

Die gesamte Oberfläche verwendet den lokal mitgelieferten **HA UI Kit 1.2.0** aus `v9h45n47mh-lab/ha-ui-kit`: Navigation, Einstellungen, kompakte Zeilen, Symbole, Buttons, Schalter, Eingabefelder, Statusmeldungen, Versionszeile und native modale Dialoge. Farben und Schriften folgen dem Home-Assistant-Theme. Der Gerichtskatalog, die Suche mit sechs sichtbaren Treffern, Zufallsrezepte, Export, unabhängige Kalenderwochen und die bisherigen Berechtigungen bleiben erhalten.

Es wird keine zusätzliche Integration benötigt. Gemeinsames Modul, Lizenz und Prüfsummen liegen unter `custom_components/essensplaner/www/family-ui/1.2.0/`; die feste Bindung ist in `www/family-ui.lock.json` dokumentiert. Der bisherige Ressourcenpfad `/essensplaner-card.js` bleibt über einen lokalen Kompatibilitäts-Loader nutzbar.

Nach dem Update Home Assistant neu starten und die App beziehungsweise das Dashboard neu laden.

## Änderungen in 1.2.2

- Einheitliche SVG-Symbole für Bearbeiten und Löschen in Essensplan und Einstellungen.
- Neue Tageseinträge starten mit „Aus Gerichten auswählen“.
- Durchsuchbare Gerichte-Auswahl: Teilbegriffe wie „Reis“ filtern unabhängig von Groß-/Kleinschreibung. Bis zu sechs Treffer sichtbar, weitere per Scrollen.

## Änderungen in 1.2.1

- Im Zufallsrezept sind anfangs Vera, Manuel, Maximilian und Paul ausgewählt. Eine anschließend geänderte Auswahl bleibt beim Wechsel der Ansichten erhalten.
- Unter Einstellungen → Gerichte exportieren lässt sich der vollständige Gerichtskatalog als JSON-Datei herunterladen. Der Export enthält IDs, Namen, Fleisch/vegetarisch und die zugeordneten Personen im bisherigen Katalogformat `essensplaner-ha-meals` (Version 1).

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

