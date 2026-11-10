# Essensplaner für Home Assistant

Home Assistant Integration mit lokaler Wochenplanung, Gerichteimport aus der Essensplaner-Site und einer mobilen Ansicht.

## Installation

Repository in HACS als benutzerdefiniertes Repository hinzufügen (Kategorie Integration) oder `custom_components/essensplaner` in den Home-Assistant-Konfigurationsordner kopieren. Integration hinzufügen und danach den Panel-Ressourceneintrag gemäß Installationsanleitung einrichten.

## Gerichte übernehmen

In der Essensplaner-Site unter **Gerichte hinzufügen / bearbeiten** den Export **Gerichte für Home Assistant exportieren** laden. In der Essensplaner-Ansicht in Home Assistant die JSON-Datei importieren.

Der Export enthält nur Gerichte und Essensvorlieben. Wochenplaneinträge bleiben lokal in Home Assistant.
