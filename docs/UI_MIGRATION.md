# Essensplaner 1.4.0 – HA UI Kit 1.2.0

## Feste Einbindung

- UI Kit **1.2.0** aus `v9h45n47mh-lab/ha-ui-kit`, geprüfter Quellstand `a3b7a7d3bd3a05a97093b2263c5b6fc7d2c4af50`.
- Unveränderte generierte Dateien und Lizenz liegen in `custom_components/essensplaner/www/family-ui/1.2.0/`.
- Prüfsummen und lokaler Modulpfad stehen in `www/family-ui.lock.json`. Frühere Versionen bleiben für bestehende Moduladressen enthalten.
- Neuer Kartenpfad: `/essensplaner/essensplaner-card.js?v=1.4.0`. Der bisherige Ressourcenpfad `/essensplaner-card.js` bleibt als Kompatibilitäts-Loader erhalten.
- Alle Dateien werden durch die vorhandene statische Frontendauslieferung bereitgestellt. Keine zusätzliche Integration, kein CDN und keine Netzwerkabhängigkeit zur Laufzeit.

## Gemeinsame Komponenten

Navigation, Einstellungen, Zeilen, Symbole, Buttons, Schalter, Filter, Felder, Meldungen und Versionsanzeige verwenden weiterhin den gemeinsamen Baukasten. Zusätzlich werden folgende bisher lokale Umsetzungen durch 1.2.0 ersetzt:

| Oberfläche / Bedienung | Gemeinsamer Baustein |
| --- | --- |
| Wochenwechsel und Heute | `dateNavigation` mit zentralen Links-/Rechtssymbolen |
| Kalenderzeilen, Tagesaktion und Rezeptlink | `weekCalendar` |
| Durchsuchbare Gerichtsauswahl, sechs sichtbare Treffer und Tastaturbedienung | `combobox` und `bindUI` |
| Löschbestätigung für Gericht / Kalendereintrag | `confirmDialog` |
| Optionaler Rezeptlink | `field` mit nativem Typ `url` |
| Export des bisherigen Gerichtskatalogs | `downloadJSON` |
| Wischen und nach unten ziehen | `bindGestures` mit Cleanup beim Rendern und Entfernen |

Die lokalen Kalender-/Suchstile und der lokale Suchcontroller wurden entfernt. Fachlich spezifisch bleiben lediglich die Anordnung des Zufallsrezepts und die zusätzlichen Katalogfelder. Es werden keine lokalen SVG-Symbole gepflegt. Die Import-/Uploadfunktion bleibt wie bisher entfernt; der gemeinsame Downloadhelfer erweitert die Berechtigungen nicht.

## Erhaltene Funktionen und Rechte

Gerichte, freie Mahlzeiten mit optionalem Link und Katalogaufnahme, Teilbegriffsuche, Zufallsrezeptregeln, JSON-Export, lokal gewählte Kalenderwochen und Live-Aktualisierungen bleiben erhalten. Die Backendlogik ist gegenüber 1.3.1 unverändert; nur die Integrationsversion wird erhöht. Eltern-/Adminrechte sowie das Löschen eigener Einträge bleiben bestehen. HA-Aufrufe nennen weiterhin den tatsächlichen Wochenplan-Sensor als Ziel.

Offene Formulare werden bei HA-Zustandsmeldungen nicht ersetzt. Die ausgewählte ID wird nur nach einer echten Auswahl übernommen und bei erneuter Texteingabe verworfen. Der gemeinsame Suchcontroller übernimmt Trefferliste und Tastatur; Essensplaner übernimmt Auswahl-ID und Bezeichnung in seinen Formularzustand. Fehlgeschlagenes Speichern zeigt den Fehler im offenen Dialog und erhält Eingaben. Freitext und Katalogoptionen bleiben beim Moduswechsel erhalten.

## Prüfungen am 10.11.2026

| Prüfung | Ergebnis |
| --- | --- |
| UI Kit Build, Unit-Tests und Build-Abgleich | Bestanden, 15 Tests |
| Vendor-Prüfung, Modul-/CSS-/Lizenzprüfsummen | Bestanden |
| Frontend-DOM-Regressionen | Bestanden: getrennte Wochen, Zeilenklick, neue Suchkomponente, Maus-/Tastaturauswahl, verworfene alte ID, Fehler, Live-Anzeige, freie Eingaben, Katalogoptionen, Bestätigung/Abbrechen, eigenes Löschen, Export, Einklappen und erneutes Einbinden |
| Backend-Berechtigungen | Bestanden: eigene/fremde Einträge, Eltern/Admin, Altbestand, doppelte Namen und parallele Änderungen |
| Desktop 1100 px, hell und dunkel | Im verbundenen Chromium mit lokalen Testdaten geprüft |
| Mobil 375 / 390 / 430 px | Im Chromium mit entsprechend breiten Iframes geprüft; kein horizontaler Überlauf, mindestens 40 × 40 px Symbolbedienflächen |
| Mobile Suche und Einplanen | Bei 375 px im dunklen Theme: „Reis“ liefert zehn passende Gerichte, sechs sichtbar und weitere scrollbar; Pfeiltaste/Enter, Auswahl-ID und sofortige Anzeige im Tag geprüft |
| Bearbeiten | Gericht und Personenzuordnung bei 390 px gespeichert; sofortige Anzeige und Fokuswiederherstellung geprüft |
| Pauls Rechte und Löschdialog | Einstellungen und fremde Löschaktionen ausgeblendet; Escape stellt Fokus wieder her; eigener Eintrag nach Bestätigung gelöscht und sofort entfernt |

Die Bildschirmprüfungen verwenden ausschließlich lokale Beispieldaten (`tests/preview.html`, `tests/frame.html`, `tests/fixture.js`). Es gab keinen Test an einer produktiven HA-Installation oder einem echten Mobilgerät. Der automatisierte Playwright-Prozessstart wird in der Shell durch eine Socket-Sandboxbeschränkung blockiert; die Bildschirm- und Bedienprüfungen wurden daher im verbundenen Chromium durchgeführt. Der reproduzierbare Browser-Test wurde an die neuen Komponenten angepasst.

## Prüfungen wiederholen

```sh
npm ci
npm test
npm run check
python tests/permissions.py
npx playwright install chromium
npm run test:browser
```

Alternativ das Repository lokal per HTTP ausliefern und `/tests/preview.html` öffnen. Die Vorschau bietet Desktop/Mobil, helle/dunkle Themes, Testkonten und Layoutmessungen. `CHROMIUM_PATH` kann für die automatisierten Browserprüfungen auf ein vorhandenes Chromium zeigen.
