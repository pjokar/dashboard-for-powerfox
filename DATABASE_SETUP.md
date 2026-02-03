# Powerfox Dashboard - Datenbankintegration Setup

## ✅ Setup abgeschlossen

Die SQLite-Datenbank mit Prisma wurde erfolgreich eingerichtet!

## 🔄 Dashboard nutzt jetzt DB

**Wichtig:** Das Dashboard wurde umgestellt und liest **alle Daten aus der Datenbank**!

- ✅ Dashboard (`/`) - Zeigt nur DB-Daten
- ✅ Sync-Seite (`/sync`) - Manuelle API-Abfrage & Speicherung
- ✅ Auto-Refresh alle 30-60 Sekunden

👉 **Siehe [SYNC_USAGE.md](./SYNC_USAGE.md) für Details zur Sync-Seite**

## Was wurde erstellt?

### 1. **Prisma Schema** (`prisma/schema.prisma`)
- Vollständiges Datenbankschema basierend auf allen Powerfox SDK-Modellen
- Unterstützt alle Datentypen: Device, CurrentData, OperatingReport, Report, und alle Summary-Typen
- SQLite als Datenbank-Provider

### 2. **Datenbank** (`dev.db`)
- SQLite-Datenbank mit allen Tabellen
- Initiale Migration wurde erstellt und angewendet
- Gespeichert im Projektverzeichnis

### 3. **Prisma Client** (`lib/generated/prisma/`)
- TypeScript-typisierter Client wurde generiert
- Wird automatisch bei `pnpm db:generate` neu generiert

### 4. **Datenbank-Helper** (`lib/db.ts`)
- Prisma Client Singleton für Development/Production
- Verhindert Multiple Instances während Development

### 5. **Powerfox-DB-Service** (`lib/powerfox-db.ts`)
- **Save-Funktionen:**
  - `saveDevice()` - Device speichern/aktualisieren
  - `saveCurrentData()` - Aktuelle Messwerte speichern
  - `saveOperatingReport()` - Operating Reports speichern
  - `saveReport()` - Vollständige Reports speichern

- **Query-Funktionen:**
  - `getAllDevices()` - Alle Devices abrufen
  - `getDeviceByDeviceId()` - Spezifisches Device
  - `getLatestCurrentData()` - Letzte N Messwerte
  - `getCurrentDataByTimeRange()` - Messwerte für Zeitraum
  - `getOperatingReports()` - Operating Reports
  - `getReports()` - Reports
  
- **Maintenance:**
  - `deleteOldCurrentData()` - Alte Daten bereinigen

### 6. **API-Routes**

#### `/app/api/powerfox/save/route.ts`
- POST: Daten von Powerfox API abrufen UND in DB speichern
- GET: Alle gespeicherten Devices abrufen

#### `/app/api/powerfox/history/route.ts`
- GET: Historische Daten aus der lokalen Datenbank abrufen
- Query-Parameter: `deviceId`, `type`, `limit`, `startTimestamp`, `endTimestamp`

### 7. **Dokumentation**
- `prisma/README.md` - Prisma-spezifische Dokumentation
- `lib/powerfox-db.example.ts` - Vollständige Code-Beispiele
- `app/api/powerfox/API.md` - API-Endpunkte Dokumentation

### 8. **NPM-Skripte** (package.json)
```bash
pnpm db:generate    # Prisma Client generieren
pnpm db:migrate     # Neue Migration erstellen
pnpm db:push        # Schema direkt pushen
pnpm db:studio      # Prisma Studio öffnen
pnpm db:seed        # Seed-Daten einfügen
```

## Schnellstart

### 1. Daten speichern

```typescript
import { saveDevice, saveCurrentData } from '@/lib/powerfox-db';

// Device speichern
await saveDevice({
  deviceId: 'ABC123',
  name: 'Mein Stromzähler',
  mainDevice: true,
  prosumer: false,
  division: 1,
});

// Aktuelle Messdaten speichern
await saveCurrentData({
  deviceId: 'ABC123',
  watt: 2500,
  kiloWattHour: 150.5,
  timestamp: Math.floor(Date.now() / 1000),
});
```

### 2. Daten abrufen

```typescript
import { getLatestCurrentData, getCurrentDataByTimeRange } from '@/lib/powerfox-db';

// Letzte 100 Messwerte
const latest = await getLatestCurrentData('ABC123', 100);

// Daten der letzten 24 Stunden
const now = Math.floor(Date.now() / 1000);
const yesterday = now - 86400;
const rangeData = await getCurrentDataByTimeRange('ABC123', yesterday, now);
```

### 3. Via API

```typescript
// Daten von Powerfox abrufen UND in DB speichern
const response = await fetch('/api/powerfox/save', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password',
    endpoint: 'current',
  }),
});

// Historische Daten aus DB abrufen
const history = await fetch('/api/powerfox/history?deviceId=ABC123&type=current&limit=100');
const data = await history.json();
```

### 4. Prisma Studio öffnen

```bash
pnpm db:studio
```

Öffnet eine Web-UI unter `http://localhost:5555` zum Erkunden der Datenbank.

## Datenbankstruktur

### Haupttabellen

1. **Device** - Powerfox-Geräte
2. **CurrentData** - Zeitreihe der Messwerte (Watt, kWh, Phasen)
3. **OperatingReport** - Betriebsberichte mit Min/Max/Avg
4. **Report** - Zusammenfassende Reports
5. **ReportSummary*** - Verschiedene Summary-Typen (Power, Heat, Gas, Water)
6. **ReportMeterReading** - Zählerstände
7. **ReportValue** - Einzelne Messwerte aus Reports

### Indizes

- `deviceId` - Schnelle Abfragen pro Device
- `timestamp` - Zeitbasierte Abfragen
- Alle Relations haben automatische Foreign Keys

## Wartung

### Alte Daten bereinigen

```typescript
import { deleteOldCurrentData } from '@/lib/powerfox-db';

// Daten älter als 30 Tage löschen
await deleteOldCurrentData(30);
```

### Datenbank-Backup

```bash
# SQLite-Datei kopieren
cp dev.db dev.db.backup

# Oder mit sqlite3
sqlite3 dev.db ".backup backup.db"
```

### Migration erstellen

Wenn du das Schema änderst:

```bash
pnpm db:migrate
```

Prisma fragt nach einem Namen für die Migration.

## Nächste Schritte

1. **Cronjob einrichten** - Regelmäßig Daten von Powerfox abrufen
2. **Charts implementieren** - Historische Daten visualisieren
3. **Dashboard erweitern** - Lokale Daten statt API verwenden
4. **Backup-Strategie** - Regelmäßige Backups der SQLite-Datei
5. **Data Retention** - Policy für alte Daten definieren

## Troubleshooting

### Build-Fehler

Wenn beim Build Fehler auftreten, Prisma Client neu generieren:

```bash
pnpm db:generate
```

### Datenbank zurücksetzen

```bash
rm dev.db
pnpm db:migrate
```

### Schema-Änderungen

Nach Schema-Änderungen immer:

```bash
pnpm db:generate
pnpm db:migrate
```

## Weiterführende Dokumentation

- `prisma/README.md` - Detaillierte Prisma-Dokumentation
- `lib/powerfox-db.example.ts` - Vollständige Code-Beispiele
- `app/api/powerfox/API.md` - API-Endpunkte Übersicht
- [Prisma Docs](https://www.prisma.io/docs)

## Support

Bei Fragen zur Datenbankintegration:
- Siehe Beispiele in `lib/powerfox-db.example.ts`
- Prisma Schema: `prisma/schema.prisma`
- API-Docs: `app/api/powerfox/API.md`
