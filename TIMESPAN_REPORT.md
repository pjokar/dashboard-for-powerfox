# Zeitraum-Durchschnitts-Report

Ein spezialisierter Report zur Analyse des Durchschnittsverbrauchs für bestimmte Tageszeiten über längere Zeiträume.

## Funktionen

### Zeitraum-Auswahl
- **Letzte 7 Tage**: Rollierender 7-Tage-Zeitraum ab heute
- **Letzter Kalendermonat**: Kompletter vorheriger Monat (z.B. wenn Februar 2026 → gesamter Januar 2026)
- **Letztes Kalenderjahr**: Komplettes vorheriges Jahr (z.B. wenn 2026 → gesamtes Jahr 2025: 01.01.2025 - 31.12.2025)

### Datenquelle
- **Automatisch (empfohlen)**: CurrentData für Woche/Monat, ReportValues für Jahr
- **CurrentData**: Detaillierte Messwerte (alle 60 Sekunden) - ideal für kurze Zeiträume
- **ReportValues**: Aggregierte Stunden-/Tageswerte - effizienter für lange Zeiträume

### Uhrzeitfilter
- **Von-Zeit**: Start der Analyse (z.B. 20:00)
- **Bis-Zeit**: Ende der Analyse (z.B. 23:59)
- Unterstützt **Zeiträume über Mitternacht** (z.B. 20:00 - 02:00)

## Anwendungsfälle

### 1. Nachtverbrauch analysieren
**Konfiguration:**
- Zeitraum: Letzter Monat
- Von: 22:00
- Bis: 06:00

**Nutzen:** Standby-Verbrauch und unnötige Nachtverbräuche identifizieren

### 2. Arbeitszeitverbrauch
**Konfiguration:**
- Zeitraum: Letzte Woche
- Von: 08:00
- Bis: 18:00

**Nutzen:** Verbrauch während Arbeitszeiten tracken

### 3. Abendspitzen & Saisonale Trends
**Konfiguration:**
- Zeitraum: Letztes Kalenderjahr (z.B. 2025)
- Von: 18:00
- Bis: 22:00

**Nutzen:** Saisonale Trends bei Abendverbrauch erkennen (Winter vs. Sommer)

### 4. Jahresvergleich
**Konfiguration:**
- Zeitraum: Letztes Kalenderjahr
- Von: 00:00
- Bis: 23:59

**Nutzen:** Gesamtverbrauch des vorherigen Jahres analysieren

## Berechnungen

### Pro Tag
- **Durchschnitt (Ø)**: Mittelwert aller Messwerte in der gewählten Zeitspanne
- **Maximum**: Höchster gemessener Wert
- **Minimum**: Niedrigster gemessener Wert
- **Anzahl**: Anzahl der Messwerte

### Gesamt
- **Ø Leistung**: Durchschnitt über alle Tage
- **Gesamt Maximum**: Höchster Wert über alle Tage
- **Gesamt Minimum**: Niedrigster Wert über alle Tage
- **Tage**: Anzahl der Tage mit Daten
- **Messwerte**: Gesamtzahl aller gefilterten Messwerte

## Visualisierung

### Chart
- **Balken (blau)**: Durchschnittswert pro Tag
- **Linie (orange)**: Maximumwerte
- **Linie (grün)**: Minimumwerte

### Tabelle
Detaillierte tägliche Aufschlüsselung mit:
- Datum (mit Wochentag)
- Anzahl Messwerte
- Durchschnitt, Maximum, Minimum

## Technische Details

### API Endpoint
```
GET /api/reports/timespan?deviceId={id}&period={period}&dataSource={source}&fromHour={h}&fromMinute={m}&toHour={h}&toMinute={m}
```

**Parameter:**
- `deviceId`: Device-ID (erforderlich)
- `period`: `week`, `month`, `year` (erforderlich)
- `dataSource`: `auto`, `current`, `report` (optional, default: `auto`)
- `fromHour`, `fromMinute`: Start-Uhrzeit (0-23, 0-59)
- `toHour`, `toMinute`: End-Uhrzeit (0-23, 0-59)

### Datenquellen
- **CurrentData**: Detaillierte Messwerte (alle 60 Sekunden)
  - Vorteile: Sehr genau, Echtzeit-Daten
  - Nachteile: Große Datenmenge bei langen Zeiträumen
  - Empfohlen für: Letzte Woche, Letzter Monat
  
- **ReportValues**: Aggregierte Daten (stündlich/täglich)
  - Vorteile: Effizienter bei langen Zeiträumen, weniger DB-Last
  - Nachteile: Weniger detailliert
  - Empfohlen für: Letztes Jahr

- **Automatisch (Standard)**:
  - Nutzt CurrentData für Woche & Monat
  - Nutzt ReportValues für Jahr
  - Filtert nach `timestamp` im gewählten Zeitraum
  - Filtert nach Uhrzeit (Stunden + Minuten)
  - Gruppiert nach Tagen

### Performance
- Effiziente DB-Abfrage mit Indexing auf `timestamp` und `deviceId`
- Frontend-Berechnung der Aggregationen
- Unterstützt große Datenmengen (1 Jahr = ~525.600 Messwerte bei 60s Intervall)

## Zugriff

1. **Navigation**: Dashboard → Reports
2. **Button**: "Zeitraum-Report" (oben rechts)
3. **Direktlink**: `/reports/timespan`

## Beispiel-Workflows

### Energiespar-Analyse
1. Wähle "Letzter Monat"
2. Setze 22:00 - 06:00 (Nacht)
3. Prüfe Durchschnitt - sollte niedrig sein (Standby)
4. Identifiziere Tage mit hohen Nachtwerten
5. Optimiere diese Tage

### Vergleich Jahreszeiten
1. Wähle "Letztes Kalenderjahr" (z.B. 2025)
2. Setze 18:00 - 22:00 (Abend)
3. Beobachte saisonale Trends im Chart (Januar vs. Juli)
4. Identifiziere Heiz-/Kühlungskosten über das gesamte Jahr

### Peak-Load Management
1. Wähle "Letzte Woche"
2. Setze 17:00 - 20:00 (Peak Time)
3. Vergleiche mit 10:00 - 13:00 (Off-Peak)
4. Optimiere Lastverteilung

## Limitierungen

- Benötigt gespeicherte `CurrentData` in der DB
- Daten müssen durch Dashboard-Nutzung oder Sync gesammelt werden
- Uhrzeitauflösung: 15-Minuten-Schritte
- Keine Wochentag-spezifische Filterung (alle Tage im Zeitraum)

## Zukünftige Erweiterungen

- [ ] Wochentag-Filter (Mo-Fr vs. Sa-So)
- [ ] Export als CSV/PDF
- [ ] Vergleich zweier Zeiträume
- [ ] Alarme bei Schwellenwert-Überschreitung
- [ ] Integration mit Strompreis-API für Kostenanalyse
