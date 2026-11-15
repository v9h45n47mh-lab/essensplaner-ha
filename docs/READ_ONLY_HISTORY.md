# Datumsbereich, schreibgeschützte Historie und UI Kit 1.6.0 · 1.5.1

Die Hauptansicht zeigt ausschließlich den Datumsbereich über den zehn Tagen ab heute. Die zusätzliche Überschrift entfällt.

Die Historie behält einzeln aufklappbare Monatsgruppen und Rezeptlinks. Kalenderzeilen haben dort keine Aktionsschaltflächen und keinen Editor beim Antippen. Vergangene Kalendertage können auch durch direkte Dienstaufrufe oder einen vor Mitternacht geöffneten Dialog nicht geändert oder gelöscht werden. Das Backend prüft vor jeder Kalendermutation das lokale Datum von Home Assistant. Die Rollenberechtigungen für heutige und zukünftige Einträge bleiben erhalten.

HA UI Kit 1.6.0 ist der zum Veröffentlichungszeitpunkt neueste veröffentlichte Release. Das offizielle Kopierwerkzeug übernimmt unveränderte JavaScript-/CSS-Dateien, Lizenz, Manifest und Lock-Datei nach `www/family-ui/1.6.0/`. Es gibt keine lokale CSS-/Symbolkopie oder Stilüberschreibung. Alte Versionen bleiben für bestehende Ressourcen erhalten; die neue Kartenadresse verwendet `?v=1.5.1`.

## Prüfung

- `npm test` und `TZ=Europe/Berlin npm test`: Gerichteauswahl, freie Eingaben, Katalogspeicherung, Wiederholungsversuche, Export, zehn Tage, lokale Mitternacht, Sommerzeit und Monats-/Jahresgrenzen bestanden. Neue Prüfungen sichern den reinen Datumsbereich und Historienzeilen ohne Buttons/Klick-Handler ab. Direkte UI-Aktionen und vor Mitternacht geöffnete Dialoge können die Historie nicht ändern; Links und Aufklappzustände bleiben erhalten.
- `python tests/permissions.py`: bestehende Rollen-/Eigentümerprüfungen und Sperre vergangener Tage für Eigentümer, Verwalter und Administratoren bestanden. Heute und zukünftig bleiben gemäß den bestehenden Berechtigungen beschreibbar.
- Python-Kompilierung, `npm run check` sowie das offizielle `vendor.mjs --check`: einheitliche Versionen, lokale Importe, unveränderte Originaldateien, Prüfsummen, Lizenz und ausschließlich `UI_CSS` ohne lokale Stile bestanden.
- Verbundener Chromium-Browser mit isolierten Testdaten: Desktop 1100 px und Mobil 375 px, jeweils hell und dunkel. Hauptansicht und monatliche Historie ohne horizontalen Überlauf; ein Antippen des Historientitels öffnet keinen Editor. Original-UI-Kit-Referenzvergleich meldet PASS. Mobile Gerichte-Suche und Tastaturauswahl wurden erfolgreich gespeichert; der Eintrag erscheint direkt im Kalender. Der mobile Dialog besteht den Stilabgleich mit 21 Bausteinen / 459 berechneten Werten.
- Die Testvorschau verwendet versionierte Moduladressen, damit auch der Referenzvergleich nach einem UI-Kit-Update aktuelle Dateien lädt.
- Der separate automatisierte Playwright-Prozess konnte wegen gesperrter AF_UNIX-Sockets nicht starten und wird nicht als bestanden gewertet. Die visuelle Prüfung erfolgte im verbundenen Browser. Keine produktive HA-Instanz verändert.

Nach Installation Home Assistant neu starten und App beziehungsweise Dashboard neu laden.
