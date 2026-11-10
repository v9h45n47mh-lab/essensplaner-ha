# Essensplaner 1.3.0 – HA UI Kit

## Feste Einbindung

- UI Kit **1.0.0** aus `v9h45n47mh-lab/ha-ui-kit`, geprüfter Quellstand `978160baafd2d26db8dbfb869c5822eedccdb661`.
- Unveränderte Release-Dateien und Lizenz liegen in `custom_components/essensplaner/www/family-ui/1.0.0/`.
- Prüfsummen und lokaler Modulpfad: `www/family-ui.lock.json`.
- Kalender, Einstellungen, Zufallsrezept und sämtliche Dialoge verwenden `UI_CSS` und die zentralen Komponenten. Es gibt keine lokalen SVG-Kopien oder abweichende allgemeine Button-/Formularstile.
- Fachlich spezifisch bleiben Kalenderanordnung und Suchliste mit sechs sichtbaren Treffern. Die Wochenpfeile verwenden das zentrale Pfeilsymbol gedreht; der Export verwendet das zentrale Speichersymbol.
- `/essensplaner/` liefert den gesamten Frontendordner aus. `/essensplaner-card.js` bleibt als Kompatibilitäts-Loader für bestehende YAML-Ressourcen erhalten.

## Erhaltene Logik

Gerichte, Freitext mit optionalem Link und Katalogaufnahme, Teilbegriffsuche, Zufallsrezeptregeln, JSON-Export, unabhängig gewählte Wochen und Live-Aktualisierungen bleiben erhalten. Die Backend-Funktionen für Berechtigungen und Änderungen sind gegenüber 1.2.2 unverändert. Der Sensor veröffentlicht zusätzlich die Integrationsversion für die gemeinsame Versionszeile.

Der Karten-Host bleibt bestehen. Während eines offenen Dialogs werden HA-Updates entgegengenommen, ohne die Eingaben zu ersetzen. Dialogfehler werden im offenen Formular angezeigt. Native Modalität, Escape und Fokuswiederherstellung wurden geprüft. Die Ereignisdelegation wird einmal pro ShadowRoot gebunden und beim Entfernen gelöst.

## Prüfungen am 10.11.2026

| Prüfung | Ergebnis |
| --- | --- |
| UI Kit build, unit tests, build check | Bestanden |
| Vendor-Prüfung, Modul-/CSS-/Lizenzprüfsummen | Bestanden |
| Frontend-DOM-Regressionen | Bestanden: Suche, Einplanen, Freitext, Auswahlzustand, Fehler, Export, getrennte Wochen, erneutes Einbinden |
| Backend-Berechtigungen | Bestanden: eigene/fremde Einträge, Eltern/Admin, Altbestand, doppelte Namen, gleichzeitige Änderungen |
| Desktop 1100 px, hell und dunkel | Im Chromium-Browser mit lokaler Testkarte geprüft |
| Mobil 375, 390, 430 px | Im Chromium-Browser mit entsprechend breiten Iframes geprüft; kein horizontaler Überlauf |
| Mobile Dialoge, 375 px | Native Dialoge passen ins Fenster; Felder ohne horizontalen Überlauf |
| Gerichte-Suche | „Reis“ liefert zehn Testtreffer; sechs sichtbar, weitere scrollbar; Auswahl per Pfeiltasten/Enter und Einplanen geprüft |
| Bearbeiten/Löschen | Gerichte gespeichert; eigener Kalendereintrag als Paul gelöscht; fremde Löschaktionen und Einstellungen ausgeblendet |
| Fokus/Escape | Abbrechen und Escape stellen den Fokus auf die auslösende Aktion zurück |

Die Bildschirmprüfungen verwenden ausschließlich lokale Beispieldaten (`tests/preview.html`, `tests/frame.html`, `tests/fixture.js`), keine produktive HA-Installation. `npm run test:browser` des Baukastens konnte im Shell-Sandbox wegen eines blockierten Chromium-Prozessstarts nicht laufen; die genannten Browserprüfungen wurden stattdessen im verbundenen Chromium ausgeführt. Ein echter iPhone-/Android-Gerätetest ist damit nicht abgedeckt.

## Prüfungen wiederholen

```sh
npm ci
npm test
npm run check
python tests/permissions.py
npx playwright install chromium
npm run test:browser
```

Alternativ das Repository lokal per HTTP ausliefern und `/tests/preview.html` öffnen. Die Vorschau bietet 1100, 430, 390 und 375 px, helle/dunkle Themes, Testkonten und einen Knopf für Layoutmessungen. `CHROMIUM_PATH` kann für die automatischen Browserprüfungen auf ein vorhandenes Chromium zeigen.
