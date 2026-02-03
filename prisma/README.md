# Powerfox Dashboard - Datenbank

Diese Datenbank-Integration ermöglicht die Persistierung von Powerfox-Daten in einer SQLite-Datenbank mit Prisma.

## Setup

Die Datenbank wurde bereits initialisiert. Die wichtigsten Dateien:

- `schema.prisma` - Datenbankschema basierend auf dem Powerfox SDK
- `dev.db` - SQLite-Datenbank (lokal, nicht in Git)
- `migrations/` - Migrationsdateien

## Datenbank-Schema

Das Schema wurde aus den Powerfox SDK-Modellen erstellt:

### Haupttabellen

1. **Device** - Powerfox-Geräte
   - deviceId (unique), name, division, prosumer, etc.

2. **CurrentData** - Aktuelle Messwerte
   - Watt, kWh, Phasen (L1, L2, L3), Zählerstände
   - Zeitstempel für historische Daten

3. **OperatingReport** - Betriebsberichte
   - Min/Max/Avg-Werte
   - Verknüpft mit OperatingReportValue (Zeitreihen)

4. **Report** - Zusammenfassende Berichte
   - Verbrauch, Eigenverbrauch, Einspeisung, Erzeugung
   - Verknüpft mit verschiedenen Summary-Tabellen (Power, Heat, Gas, Water)

5. **ReportSummary*** - Zusammenfassungen nach Typ
   - ReportSummaryPower (Strom)
   - ReportSummaryHeat (Wärme)
   - ReportSummaryGas (Gas)
   - ReportSummaryWater (Wasser)

6. **ReportMeterReading** - Zählerstände aus Reports

7. **ReportValue** - Einzelne Messwerte aus Reports

## NPM-Skripte

```bash
# Prisma Client generieren
pnpm db:generate

# Neue Migration erstellen
pnpm db:migrate

# Schema direkt in DB pushen (ohne Migration)
pnpm db:push

# Prisma Studio öffnen (Datenbank-UI)
pnpm db:studio

# Seed-Daten einfügen
pnpm db:seed
```

## Verwendung

### Import

```typescript
import {
  saveDevice,
  saveCurrentData,
  saveOperatingReport,
  saveReport,
  getAllDevices,
  getLatestCurrentData,
  // ... weitere Funktionen
} from '@/lib/powerfox-db';
```

### Device speichern

```typescript
const device = {
  deviceId: 'ABC123',
  name: 'Mein Stromzähler',
  mainDevice: true,
  prosumer: false,
  division: 1,
};

await saveDevice(device);
```

### Aktuelle Messdaten speichern

```typescript
const currentData = {
  deviceId: 'ABC123',
  watt: 2500,
  kiloWattHour: 150.5,
  timestamp: Math.floor(Date.now() / 1000),
  l1: 800,
  l2: 850,
  l3: 850,
};

await saveCurrentData(currentData);
```

### Daten abrufen

```typescript
// Alle Devices
const devices = await getAllDevices();

// Letzte 100 Messwerte
const data = await getLatestCurrentData('ABC123', 100);

// Daten für Zeitraum
const rangeData = await getCurrentDataByTimeRange(
  'ABC123',
  startTimestamp,
  endTimestamp
);

// Reports
const reports = await getReports('ABC123', 10);
```

### Alte Daten bereinigen

```typescript
// Löscht Daten älter als 30 Tage
await deleteOldCurrentData(30);
```

## Direkter Datenbankzugriff

Für spezielle Queries kannst du den Prisma Client direkt verwenden:

```typescript
import { prisma } from '@/lib/db';

const customQuery = await prisma.device.findMany({
  where: {
    prosumer: true,
  },
  include: {
    currentData: {
      take: 10,
      orderBy: { timestamp: 'desc' },
    },
  },
});
```

## Prisma Studio

Um die Datenbank visuell zu erkunden:

```bash
pnpm db:studio
```

Dies öffnet eine Web-UI unter `http://localhost:5555`

## Migration erstellen

Wenn du das Schema änderst:

```bash
pnpm db:migrate
```

Prisma fragt nach einem Namen für die Migration.

## Enums

Die folgenden Enums aus dem SDK werden als Integer gespeichert:

- **Divisions**: 0-5, -1
- **MeterReadingType**: 0-5, 101, 202, 301, 302, 401
- **ValuesType**: (siehe SDK)

## Beispiele

Siehe `lib/powerfox-db.example.ts` für vollständige Beispiele zur:
- API-Route-Integration
- Cronjob-Setup
- Datenabfragen

## Backup

SQLite-Datenbank sichern:

```bash
cp dev.db dev.db.backup
```

Oder mit sqlite3:

```bash
sqlite3 dev.db ".backup backup.db"
```
