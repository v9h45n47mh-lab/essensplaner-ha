# Freie Gerichte speichern · 1.4.2

Freie Kalendereinträge erhalten für Gerichteverwalter die Aktion „Als Gericht speichern“. Der Dialog übernimmt den Namen und verlangt eine ausdrückliche Auswahl von Fleisch/vegetarisch sowie mindestens einer Person. Er speichert ausschließlich das Gericht; Datum, Titel, Link und Urheber des Kalendereintrags bleiben erhalten. Bereits gespeicherte Namen werden unabhängig von Groß-/Kleinschreibung und zusätzlichen Leerzeichen erkannt.

Die bisherige Option „Auch in Gerichte speichern“ beim Einplanen bleibt erhalten. Beide Abläufe erzeugen IDs auch auf lokalen HTTP-Ursprüngen ohne `crypto.randomUUID`. Wiederholte Speicherversuche verwenden dieselbe ID. Die Backend-Berechtigungen sind unverändert.

## Prüfung

- `npm test`: Pflichtangaben, Fleisch/Maximilian-Prüfung, unveränderter Kalendereintrag, fehlgeschlagene Aufrufe mit erneutem Versuch, Namensvergleich und Verwalterberechtigung bestanden. Der bestehende Inline-Ablauf wurde ohne `randomUUID` und mit abgelehntem Planungsschritt geprüft; der zweite Versuch erzeugt kein weiteres Gericht.
- `npm run check`: unveränderte lokale HA-UI-Kit-1.2.1-Dateien, Prüfsummen, gemeinsame Komponenten, keine lokalen CSS-Überschreibungen und einheitliche Version bestanden.
- `python tests/permissions.py` und Python-Kompilierung bestanden.
- Verbundener Chromium-Browser mit isolierten Testdaten: Desktop 1100 px und Mobil 375 px, jeweils hell und dunkel. Der neue Dialog passt in die Karte; der unabhängige Vergleich der berechneten Komponentenstile mit HA UI Kit 1.2.1 meldet PASS. Auf Mobil wurde ein freier Eintrag als vegetarisch für Manuel und Paul gespeichert. Der Dienstaufruf enthielt nur `save_meal`; Kalendertext, Link und ursprünglicher Eintragender blieben sichtbar erhalten.
- Der separate automatisierte Playwright-Prozess konnte wegen gesperrter AF_UNIX-Sockets in der Ausführungsumgebung nicht starten. Die Browserprüfung erfolgte deshalb über den verbundenen Browser. Es wurde keine produktive Home-Assistant-Instanz verändert.

Nach Installation Home Assistant neu starten und die App beziehungsweise das Dashboard neu laden.
