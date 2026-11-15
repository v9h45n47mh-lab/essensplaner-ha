# Zehntagesansicht und monatliche Historie · 1.5.1

Seit 1.5.1 zeigt die Kopfzeile nur den Datumsbereich. Die Historie ist ohne Aktionsschaltflächen und ohne Editor; vergangene Tage sind auch im Backend schreibgeschützt. Details zur neuen Prüfung und UI-Kit-Übernahme: `READ_ONLY_HISTORY.md`. Die folgenden Prüfnachweise beziehen sich auf die Einführung der Zehntagesansicht in 1.5.0.

Die Hauptansicht zeigt zehn lokale Kalendertage: heute bis einschließlich heute + 9. Sie lässt sich nicht mehr auf andere Wochen verschieben. Ein lokaler Mitternachtstimer und die Prüfung bei Rückkehr zur sichtbaren App aktualisieren den Zeitraum. Offene Eingabedialoge bleiben erhalten; der Zeitraum wird nach ihrem Schließen aktualisiert.

Vergangene, noch gespeicherte Kalendereinträge stehen ausschließlich unter Einstellungen → Historie. Monate und Jahre sowie die Tage darin sind absteigend sortiert. Jeder Monat ist anfangs zugeklappt und einzeln aufklappbar. Aufklappzustände bleiben in der geöffneten Karte bei Sensoraktualisierungen, Ansichtswechseln und nach Dialogen erhalten. Die Historie zeigt vergangene Mahlzeiten, keinen Änderungsverlauf. Der vorhandene Datenbestand wird nicht umgeschrieben oder gekürzt.

Der Kalender verwendet unveränderte Zeilen des lokal eingebundenen HA UI Kit 1.6.0. In der Historie werden die Aktionsschaltflächen und der Klick-Handler entfernt; das gemeinsame Stylesheet bleibt unverändert. Die Integration setzt dessen Kalenderausgaben für den gewünschten Zeitraum zusammen; die gemeinsamen Dateien, Symbole und Stile sind unverändert. Historie und Gerichteverwaltung bleiben in den Einstellungen der Verwalter beziehungsweise HA-Administratoren. Die Rollenberechtigungen für heute/zukünftig und die Sensor-Schnittstelle bleiben unverändert; vergangene Tage werden im Backend gegen Änderungen und Löschungen geschützt.

## Prüfung

- `npm test` sowie `TZ=Europe/Berlin npm test`: zehn Tage, Grenzen über Monat/Jahr, Sommerzeit, Mitternachtstimer, Rückkehr zur sichtbaren App und Aufräumen beim Entfernen der Karte bestanden.
- Monatliche Historie: nur vergangene Einträge, absteigende Reihenfolge, anfangs geschlossene Monate, erhaltener Aufklappzustand nach Sensoraktualisierung/Dialog, Links und Aktionen sowie Einstellungssperre für Paul bestanden.
- Bestehende Tests für Gerichte-Suche, freie Eingaben, Speichern freier Gerichte, Wiederholungsversuche, Zufallsrezepte und Export bestanden.
- `npm run check`: Prüfsummen und unveränderte UI-Kit-Stile sowie einheitliche Versionsnummern bestanden.
- `python tests/permissions.py` und Python-Kompilierung bestanden; Backend-Fachlogik unverändert.
- Verbundener Chromium-Browser mit isolierten Testdaten: Hauptansicht und Historie auf Desktop 1100 px und Mobil 375 px jeweils hell/dunkel geprüft. Zehn Tage ab aktuellem Datum sichtbar; Monatsgruppen einzeln bedienbar; historischer Eintrag öffnet mit ursprünglichem Text/Link. Layoutprüfung meldet keinen horizontalen Überlauf und ausreichende Bedienflächen. Vergleich der berechneten Stile gegen unabhängige UI-Kit-Referenzen meldet PASS.
- Der erweiterte automatisierte Playwright-Prozess konnte wegen gesperrter AF_UNIX-Sockets in der Ausführungsumgebung nicht starten. Seine Browserprüfungen wurden nicht als bestanden gewertet; die visuelle Prüfung erfolgte im verbundenen Browser. Keine produktive Home-Assistant-Instanz verändert.

Nach Installation Home Assistant neu starten und App beziehungsweise Dashboard neu laden.
