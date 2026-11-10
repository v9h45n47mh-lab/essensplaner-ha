# Essensplaner für Home Assistant

Eine lokale Essensplaner-Integration mit Wochenkalender Montag bis Sonntag, Freitext, gespeicherten Gerichten, Links, Protokoll, Mitesser-Auswahl und passenden Vorschlägen. Rezeptvorschläge entfallen.

## Installation

1. Repository `v9h45n47mh-lab/essensplaner-ha` in HACS unter **Benutzerdefinierte Repositories** als **Integration** hinzufügen.
2. **Essensplaner** installieren und Home Assistant neu starten.
3. Unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** nach **Essensplaner** suchen. Die Integration fügt die Essensplaner-Ansicht in die Seitenleiste ein.
4. In den Integrationsoptionen können die HA-Kontonamen eingetragen werden, die bestehende Plan-Einträge und Gerichte bearbeiten oder löschen dürfen. Standard: `Vera, Manuel`. HA-Administratoren dürfen alles.

## Gerichte von der Site importieren

1. Auf der Site unter **Gerichte hinzufügen / bearbeiten** die Schaltfläche **Gerichte für Home Assistant exportieren** wählen.
2. In der HA-Seitenleiste **Essensplaner → Einstellungen → Gerichte aus der Site übernehmen** auswählen.

Die Datei enthält nur den aktuellen Gerichtskatalog, Fleisch-Kennzeichen und Mitesser. Sie enthält keine Wochenplan-Einträge. Der Wochenplan und sein Verlauf bleiben lokal in Home Assistant.

## Ansicht und Rechte

- Wochenweise Ansicht Montag bis Sonntag mit vor/zurück, Tagesplanung, Link, Bearbeiten/Löschen und Verlauf.
- Leere Tage können von jedem angemeldeten HA-Konto belegt werden. Bestehende Einträge und der Gerichtskatalog können nur die konfigurierten Verwalter oder HA-Administratoren ändern.
- Gerichte werden direkt in der App hinzugefügt und bearbeitet. Das Formular zeigt Fleisch/vegetarisch und die Personen, die das Gericht gern essen.
- Wochenplanung, Bearbeiten und Löschen erfolgen in App-Dialogen ohne Browser-Pop-ups. Bei freien Mahlzeiten lassen sich Link und optional der Eintrag im Gerichtskatalog hinterlegen.

## Lokale Installation ohne HACS

`custom_components/essensplaner` in den gleichnamigen Ordner unter `<HA-Konfiguration>/custom_components/` kopieren und Home Assistant neu starten.
