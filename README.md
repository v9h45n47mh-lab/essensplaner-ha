# Essensplaner für Home Assistant

**Freie Mahlzeit einplanen:** „Auch in Gerichte speichern“ erscheint nur mit Gerichtskatalog-Verwaltungsrecht. Ohne dieses Recht bleibt die Planung freier Mahlzeiten verfügbar.

Eine lokale Essensplaner-Integration mit einer laufenden Zehntagesansicht ab heute, Freitext, gespeicherten Gerichten, Links, Mitesser-Auswahl und Zufallsrezepten.

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

Wenn Lovelace-Ressourcen in `configuration.yaml` im YAML-Modus verwaltet werden, muss zusätzlich `/essensplaner/essensplaner-card.js?v=1.6.0` als JavaScript-Modul eingetragen werden.

## Access Control

Den Wochenplan-Sensor (standardmäßig `sensor.essensplaner_wochenplan`) für die Benutzer zum **Lesen und Bedienen** freigeben, direkt oder über sein Label. Seit Version 1.1.1 nennen alle Aktionen der Karte diesen Sensor als Ziel. Eine Freigabe der Service-Domain `essensplaner` ist damit für die Karte nicht erforderlich. Die Integration prüft, dass das Ziel tatsächlich ihr eigener Wochenplan-Sensor ist. Bestehende Einträge und Gerichte dürfen nur die konfigurierten Verwalter oder HA-Administratoren ändern. Eigene heutige und zukünftige Kalendereinträge darf zusätzlich ihr Eintragender löschen. Vergangene Tage sind für alle Benutzer schreibgeschützt.

Nach einem Update Home Assistant neu starten und die App beziehungsweise das Dashboard neu laden. Die automatisch registrierte Karten-Ressource erhält eine neue Versionsadresse.

## Änderungen in 1.6.0

Über dem Essensplan steht nur noch der Datumsbereich. Die zehn Tage ab heute rücken weiterhin automatisch weiter.

Die monatlich aufklappbare Historie ist schreibgeschützt: keine Bearbeiten-, Löschen- oder Speichern-Aktionen und kein Editor beim Antippen eines Eintrags. Rezeptlinks bleiben nutzbar. Auch direkte Dienstaufrufe zum Eintragen, Ändern oder Löschen vergangener Tage werden abgewiesen; maßgeblich ist das lokale Datum von Home Assistant. Heutige und zukünftige Einträge behalten die bisherigen Berechtigungen.

HA UI Kit **1.6.0**, der aktuellste veröffentlichte Release, ist fest lokal eingebunden. Gemeinsame Komponenten, Symbole und Stylesheet sind unverändert; lokale CSS-Überschreibungen werden nicht verwendet. Desktop/Mobil sowie helle und dunkle Themes sind gegen die Originalkomponenten geprüft. Details: `docs/READ_ONLY_HISTORY.md`.

Nach dem Update Home Assistant neu starten und App beziehungsweise Dashboard neu laden.

## Änderungen in 1.5.0

Der Essensplan zeigt immer **heute und die nächsten neun Tage**. Wochenpfeile und Wochen-Wischgesten entfallen. Bei einem Tageswechsel rückt der Zeitraum automatisch weiter; nach Rückkehr zur App wird das Datum ebenfalls geprüft. Freie Eingaben, gespeicherte Gerichte, Links, Zufallsrezepte und Live-Aktualisierungen bleiben erhalten.

Vergangene Kalendereinträge stehen unter **Einstellungen → Historie**, gruppiert nach Monat und Jahr. Die Monate sind einzeln aufklappbar und anfangs geschlossen; die neuesten Monate und Tage stehen oben. Geöffnete Gruppen bleiben bei Aktualisierungen und nach Dialogen geöffnet. Bearbeiten, Löschen und „Als Gericht speichern“ stehen dort wie bisher entsprechend den Berechtigungen zur Verfügung. Daten und Backend-Berechtigungen werden nicht verändert.

Desktop und Mobil sowie helle und dunkle Themes wurden mit Testdaten geprüft. HA UI Kit 1.2.1 bleibt unverändert lokal eingebunden. Details: `docs/TEN_DAY_VIEW.md`.

Nach dem Update Home Assistant neu starten und die App beziehungsweise das Dashboard neu laden.

## Änderungen in 1.4.2

Freie Kalendereinträge können über das Speichersymbol **„Als Gericht speichern“** in den Gerichtskatalog übernommen werden. Der Name ist vorbelegt; Fleisch/vegetarisch und mindestens eine Person müssen ausgewählt werden. Der Kalendereintrag samt Link und ursprünglichem Eintragenden bleibt erhalten. Bereits vorhandene Gerichte werden anhand ihres Namens erkannt. Die Aktion steht wie die Gerichteverwaltung Vera, Manuel und HA-Administratoren zur Verfügung.

Beim neuen freien Eintrag bleibt **„Auch in Gerichte speichern“** verfügbar. Die Erstellung einer Gerichte-ID funktioniert auch beim lokalen HTTP-Zugriff ohne `crypto.randomUUID`. Ein erneuter Versuch nach einem fehlgeschlagenen Einplanen verwendet dieselbe ID und erzeugt kein zweites Gericht.

Nach dem Update Home Assistant neu starten und die App neu laden.

## Änderungen in 1.4.1

HA UI Kit **1.2.1** ist fest und lokal eingebunden. Die Oberfläche verwendet ausschließlich dessen unverändertes Stylesheet. Die letzten lokalen Abstandsregeln für Zufallsrezept, Eintragsart und Katalogfelder sind entfernt; diese Bereiche verwenden die gemeinsamen Rasterklassen. Navigation, Kalender, Gerichte-Suche, Buttons, Listen und Dialoge bleiben gemeinsame UI-Kit-Komponenten. Funktionen und Berechtigungen sind erhalten.

Desktop und Mobil sowie helle/dunkle Themes wurden ausdrücklich gegen separat erzeugte UI-Kit-Referenzkomponenten geprüft: Schriftfamilie, Größe, Gewicht, Zeilenhöhe, Farben, Innenabstände, Rahmen, Symbole und Rasterabstände stimmen überein. Details und Einschränkungen: `docs/UI_MIGRATION.md`.

Nach dem Update Home Assistant neu starten und die App bei allen Benutzern neu laden.

## Änderungen in 1.4.0

HA UI Kit **1.2.0** ist fest und lokal eingebunden. Wochenkalender, Vor-/Zurück-/Heute-Navigation, Gerichte-Suche mit sechs sichtbaren Treffern, Bestätigungsdialoge, URL-Felder, JSON-Download und Wischgesten verwenden jetzt die gemeinsamen Bausteine. Die bisherigen lokalen Kalender-/Suchstile und Suchcontroller entfallen. Freie Eingaben, unabhängige Kalenderwochen, Live-Aktualisierung, Zufallsrezepte, Gerichteexport und Berechtigungen bleiben erhalten.

Geprüft mit Testdaten: Desktop und Mobil (1100/430/390/375 px), helle/dunkle Themes, Teilbegriffsuche, Tastaturauswahl, direktes Einplanen, Gerichte bearbeiten und eigenes Löschen. Nach dem Update Home Assistant neu starten und die App bei allen Benutzern neu laden.

## Änderungen in 1.3.1

Der lokale HA UI Kit wurde auf **1.1.0** aktualisiert (fester Quellstand `6e57c4079ff20d56a7cbd91470216c27c9767e13`). Die neue Moduladresse und die Ressourcenkennung laden die aktualisierten Komponenten ohne Verwechslung mit der bisherigen UI-Version. Kalender, Gerichte, Formulare und Berechtigungen bleiben unverändert. Nach dem Update Home Assistant neu starten und die App bei allen Benutzern neu laden.

## Oberfläche seit 1.3.0

Die gesamte Oberfläche verwendet den lokal mitgelieferten **HA UI Kit 1.6.0** aus `v9h45n47mh-lab/ha-ui-kit`: Navigation, Einstellungen, kompakte Zeilen, Symbole, Buttons, Schalter, Eingabefelder, Statusmeldungen, Versionszeile und native modale Dialoge. Farben und Schriften folgen dem Home-Assistant-Theme. Der Gerichtskatalog, die Suche mit sechs sichtbaren Treffern, Zufallsrezepte, Export, unabhängige Kalenderwochen und die bisherigen Berechtigungen bleiben erhalten.

Es wird keine zusätzliche Integration benötigt. Gemeinsames Modul, Lizenz und Prüfsummen liegen unter `custom_components/essensplaner/www/family-ui/1.6.0/`; die feste Bindung ist in `www/family-ui.lock.json` dokumentiert. Der bisherige Ressourcenpfad `/essensplaner-card.js` bleibt über einen lokalen Kompatibilitäts-Loader nutzbar.

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

- Hauptansicht: heute und die nächsten neun Tage mit Tagesplanung, Link, Bearbeiten/Löschen. Vergangene Tage: Einstellungen → Historie mit aufklappbaren Monatsgruppen.
- Die Rechte für neue und bestehende Einträge sowie den Gerichtskatalog werden getrennt je Rolle in Family Access vergeben. Eigene heutige und zukünftige Kalendereinträge kann der Eintragende löschen. Vergangene Tage sind schreibgeschützt.
- Gerichte werden direkt in der App hinzugefügt und bearbeitet. Das Formular zeigt Fleisch/vegetarisch sowie die Personen, die das Gericht gern essen.
- Wochenplanung, Bearbeiten und Löschen erfolgen in App-Dialogen ohne Browser-Pop-ups. Bei freien Mahlzeiten lassen sich Link und optional der Eintrag im Gerichtskatalog hinterlegen.

- „Zufallsrezept“ schlägt passende gespeicherte Gerichte für die gewählten Mitesser vor, ohne sie direkt zu wiederholen. Mit Maximilian werden nur vegetarische Gerichte vorgeschlagen. Das ausgewählte Gericht lässt sich direkt für einen Kalendertag vormerken.

## Lokale Installation ohne HACS

`custom_components/essensplaner` in den gleichnamigen Ordner unter `<HA-Konfiguration>/custom_components/` kopieren und Home Assistant neu starten.



## Zentrale Rollenrechte

Getrennte Rechte: Essensplan ansehen, Essen eintragen/eigene Einträge löschen, fremde Einträge ändern, fremde Einträge löschen und Gerichtskatalog verwalten. Das Löschen eines Essens eines anderen Benutzers ist ein ausdrücklich zu vergebendes Verwaltungsrecht. Vergangene Einträge bleiben schreibgeschützt. Die lokale Namensliste für Verwalter entfällt.

Berechtigungen werden jetzt in **Family Access → Anwendung → Rolle** verwaltet. Benutzer können mehrere Rollen erhalten; ihre Freigaben ergänzen sich. Vorhandene Anwendungsrechte werden einmalig in Rollen mit dem Zusatz „übernommen“ importiert und den bisherigen Benutzern zugeordnet. Dashboardfreigaben und die Aktivierung der Dashboardnavigation werden dadurch nicht verändert.

Zum Entziehen eines Rechts alle zugewiesenen Rollen einschließlich übernommener Rollen prüfen. Neue Benutzer erhalten nach der Übernahme keine automatischen Anwendungsrechte. Echte HA-Administratoren behalten Vollzugriff zur Wiederherstellung. Geräte-, Eigentümer- und externe Kontoberechtigungen gelten zusätzlich; eine Rolle erzeugt keine HA-Administratorrechte.

**Aktualisierung:** zuerst Family Access Manager 1.1.0 oder neuer, danach die beteiligten Anwendungen aktualisieren und Home Assistant neu starten. Solange Family Access nicht eingerichtet ist, bleibt die bisherige Rechtevergabe erhalten. Ist Family Access eingerichtet, aber nicht verfügbar oder zu alt, werden Anwendungsaktionen für normale Benutzer abgelehnt. Lokale Benutzer-/Personen-, Geräte- und Musikkontozuordnungen bleiben für Identität und Eigentum erhalten; Rechte werden zentral vergeben.
