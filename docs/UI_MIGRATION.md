# Essensplaner 1.4.1 – HA UI Kit 1.2.1

## Feste Einbindung

- UI Kit **1.2.1** aus `v9h45n47mh-lab/ha-ui-kit`, geprüfter Quellstand `78324b4f971b96ec198647a0ac08fcde1a0073d8`.
- Unveränderte generierte Dateien und Lizenz liegen in `custom_components/essensplaner/www/family-ui/1.2.1/`.
- Prüfsummen und lokaler Modulpfad stehen in `www/family-ui.lock.json`. Frühere Versionen bleiben für bestehende Moduladressen enthalten.
- Neuer Kartenpfad: `/essensplaner/essensplaner-card.js?v=1.4.1`. Der bisherige Ressourcenpfad `/essensplaner-card.js` bleibt als Kompatibilitäts-Loader erhalten.
- Alle Dateien werden durch die vorhandene statische Frontendauslieferung bereitgestellt. Keine zusätzliche Integration, kein CDN und keine Netzwerkabhängigkeit zur Laufzeit.

## Gemeinsame Komponenten

Navigation, Einstellungen, Zeilen, Symbole, Buttons, Schalter, Filter, Felder, Meldungen und Versionsanzeige verwenden weiterhin den gemeinsamen Baukasten. Zusätzlich werden folgende bisher lokale Umsetzungen durch 1.2.1 ersetzt:

| Oberfläche / Bedienung | Gemeinsamer Baustein |
| --- | --- |
| Wochenwechsel und Heute | `dateNavigation` mit zentralen Links-/Rechtssymbolen |
| Kalenderzeilen, Tagesaktion und Rezeptlink | `weekCalendar` |
| Durchsuchbare Gerichtsauswahl, sechs sichtbare Treffer und Tastaturbedienung | `combobox` und `bindUI` |
| Löschbestätigung für Gericht / Kalendereintrag | `confirmDialog` |
| Optionaler Rezeptlink | `field` mit nativem Typ `url` |
| Export des bisherigen Gerichtskatalogs | `downloadJSON` |
| Wischen und nach unten ziehen | `bindGestures` mit Cleanup beim Rendern und Entfernen |

Die lokalen Kalender-/Suchstile und der lokale Suchcontroller wurden entfernt. Auch die letzten lokalen Abstandsregeln für Zufallsrezept, Eintragsart und Katalogfelder sind entfernt. Die Karte liefert exakt `UI_CSS`, ohne zusätzliches CSS oder Inline-Stile. Die Anordnung verwendet ausschließlich die gemeinsamen `grid`, `full` und `toolbar`-Klassen. Sichtbarkeit wird mit dem nativen `hidden`-Attribut gesteuert. Es werden keine lokalen SVG-Symbole gepflegt. Die Import-/Uploadfunktion bleibt wie bisher entfernt; der gemeinsame Downloadhelfer erweitert die Berechtigungen nicht.

## Erhaltene Funktionen und Rechte

Gerichte, freie Mahlzeiten mit optionalem Link und Katalogaufnahme, Teilbegriffsuche, Zufallsrezeptregeln, JSON-Export, lokal gewählte Kalenderwochen und Live-Aktualisierungen bleiben erhalten. Die Backendlogik ist gegenüber 1.4.0 unverändert; nur die Integrationsversion wird erhöht. Eltern-/Adminrechte sowie das Löschen eigener Einträge bleiben bestehen. HA-Aufrufe nennen weiterhin den tatsächlichen Wochenplan-Sensor als Ziel.

Offene Formulare werden bei HA-Zustandsmeldungen nicht ersetzt. Die ausgewählte ID wird nur nach einer echten Auswahl übernommen und bei erneuter Texteingabe verworfen. Der gemeinsame Suchcontroller übernimmt Trefferliste und Tastatur; Essensplaner übernimmt Auswahl-ID und Bezeichnung in seinen Formularzustand. Fehlgeschlagenes Speichern zeigt den Fehler im offenen Dialog und erhält Eingaben. Freitext und Katalogoptionen bleiben beim Moduswechsel erhalten.

## Prüfungen am 10.11.2026

| Prüfung | Ergebnis |
| --- | --- |
| UI Kit Build, Unit-Tests und Build-Abgleich | Bestanden, 16 Tests |
| Vendor-Prüfung, Modul-/CSS-/Lizenzprüfsummen | Bestanden |
| Frontend-DOM-Regressionen | Bestanden: getrennte Wochen, Zeilenklick, neue Suchkomponente, Maus-/Tastaturauswahl, verworfene alte ID, Fehler, Live-Anzeige, freie Eingaben, Katalogoptionen, Bestätigung/Abbrechen, eigenes Löschen, Export, Einklappen und erneutes Einbinden |
| Backend-Berechtigungen | Bestanden: eigene/fremde Einträge, Eltern/Admin, Altbestand, doppelte Namen und parallele Änderungen |
| Desktop 1100 px, hell und dunkel | Im verbundenen Chromium mit lokalen Testdaten geprüft |
| Mobil 375 / 390 / 430 px | Im Chromium mit entsprechend breiten Iframes geprüft; kein horizontaler Überlauf, mindestens 40 × 40 px Symbolbedienflächen |
| Direkter Referenzvergleich | Bestanden: separat erzeugte, unveränderte UI-Kit-Komponenten; je Ansicht bis zu 24 Bausteine und 527 berechnete Werte verglichen. Schriftfamilie/-größe/-gewicht, Zeilenhöhe, Farben, Innenabstände, Rahmen, Symbole und Rasterabstände stimmen überein. Browserseitige `auto`-Mindestmaße und aktive Hover-Hintergründe werden nicht gegeneinander gewertet. |
| Mobile Dialoge und Auswahl | 375 px dunkel: Bearbeitungsdialog mit 20 Bausteinen / 436 Werten gegen Referenz geprüft; Escape und Fokuswiederherstellung erfolgreich. 390 px hell: Suche „Reis“, Pfeiltaste/Enter und sofortiges Einplanen erfolgreich; Auswahl mit bis zu 24 Bausteinen / 527 Werten gegen Referenz geprüft. |
| Zufallsrezept | Alle vier Personen initial ausgewählt; Vorschlag mit langem Namen bei 430 px im dunklen Theme ohne Überlauf, gemeinsame Rasterabstände und Schalter geprüft. |


Die Bildschirmprüfungen verwenden ausschließlich lokale Beispieldaten (`tests/preview.html`, `tests/frame.html`, `tests/fixture.js`). Es gab keinen Test an einer produktiven HA-Installation oder einem echten Mobilgerät. Der automatisierte Playwright-Prozessstart wird in der Shell durch eine Socket-Sandboxbeschränkung blockiert; die Bildschirm- und Bedienprüfungen wurden daher im verbundenen Chromium durchgeführt. Der reproduzierbare Browser-Test wurde um den Stilabgleich ergänzt (`tests/style-reference.js`). Der Vergleich läuft automatisch bei Änderungen der Karte, der Fensterbreite und des Themes; sein Ergebnis steht in der Testvorschau. Die Referenz wird außerhalb der produktiven Karte und ohne zusätzliche Styles erzeugt.

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
