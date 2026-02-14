# Powerfox Dashboard - Architektur

## Datenfluss-Architektur

### Zentrale Mapper-Strategie

**Prinzip:** Alle API-Daten werden durch Mapper transformiert, bevor sie in der App verwendet werden.

**Vorteil:** Bei API-Änderungen müssen nur die Mapper angepasst werden, nicht der gesamte App-Code!

```
┌─────────────────────────────────────────────────────────────┐
│                    Powerfox API                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  SDK (lib/powerfox-sdk)                      │
│              - Generierte TypeScript Models                  │
│              - API Client                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              MAPPER (lib/mappers.ts)                         │
│         ┌──────────────────┬──────────────────┐            │
│         │  SDK → App       │  DB → App        │            │
│         │  deviceSdkToDb() │  deviceDbToSdk() │            │
│         │  currentData...  │  currentData...  │            │
│         │  operating...    │  operating...    │            │
│         │  report...       │  report...       │            │
│         └──────────────────┴──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            APP-FORMAT (einheitlich in der App)               │
│         - camelCase Felder                                   │
│         - DB-kompatibel                                      │
│         - TypeScript Types (Prisma)                          │
└─────────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
    ┌──────────┐                        ┌──────────┐
    │    UI    │                        │    DB    │
    │ Components│                       │  Prisma  │
    └──────────┘                        └──────────┘
```

## API-Routen

### `/api/powerfox` - Live API Daten (mit Mapper)

**Verwendung:** Dashboard (Live-Daten)

**Datenfluss:**
```
Request → SDK API Call → Mapper → App-Format → Response
```

**Beispiel:**
```typescript
// /api/powerfox
const sdkData = await api.apiVersionMyIdDevicesGet({ id: 'all' })
const mappedData = sdkData.map(d => deviceSdkToDb(d))  // MAPPER!
return NextResponse.json(mappedData)  // App-Format
```

### `/api/powerfox/save` - API + DB Speicherung (mit Mapper)

**Verwendung:** Sync-Seite (Manuelle Datensynchronisation)

**Datenfluss:**
```
Request → SDK API Call → Mapper → App-Format → DB Speicherung
                                   ↓
                                Response
```

**Direkter Speicher-Modus:**
```
Request (bereits gemappte Daten) → DB Speicherung → Response
```

### `/api/powerfox/history` - DB Daten lesen (mit Mapper)

**Verwendung:** Reports-Seite (Historische Analysen)

**Datenfluss:**
```
Request → DB Query → Mapper → App-Format → Response
```

**Beispiel:**
```typescript
// /api/powerfox/history
const dbData = await getCurrentDataByTimeRange(...)
const mappedData = dbData.map(currentDataDbToSdk)  // MAPPER!
return NextResponse.json(mappedData)  // App-Format
```

## Hooks (SWR)

### `useDevices()`
- Holt Devices von `/api/powerfox`
- Daten sind **bereits gemappt**
- Speichert automatisch in DB (Hintergrund)

### `useCurrentData(deviceId)`
- Holt Current-Daten von `/api/powerfox`
- Daten sind **bereits gemappt**

### `useOperatingData(deviceId)`
- Holt Operating-Daten von `/api/powerfox`
- Daten sind **bereits gemappt**

### `useReportData(deviceId, params)`
- Holt Report-Daten von `/api/powerfox`
- Daten sind **bereits gemappt**

## Mapper-Funktionen

### SDK → App Format (für API-Responses)

```typescript
deviceSdkToDb(sdk: MyDeviceModel): Omit<Device, 'id' | 'createdAt' | 'updatedAt'>
currentDataSdkToDb(sdk: MyCurrentDataModel, deviceId: string): Omit<CurrentData, ...>
operatingReportSdkToDb(sdk: OperatingReportModel, deviceId: string): {...}
reportSdkToDb(sdk: ReportModel, deviceId: string): {...}
```

### DB → App Format (für DB-Reads)

```typescript
deviceDbToSdk(db: Device): MyDeviceModel
currentDataDbToSdk(db: CurrentData): MyCurrentDataModel
```

### Utility

```typescript
transformApiFieldsToCamelCase(data: any): any
// Transformiert snake_case Felder zu camelCase
// z.B. a_Plus → aPlus
```

## Seiten

### Dashboard (`/`)
- **Daten:** Live von API (`/api/powerfox`)
- **Format:** App-Format (bereits gemappt)
- **Update:** Automatisch (SWR polling)
- **DB:** Automatisches Speichern im Hintergrund

### Reports (`/reports`)
- **Daten:** Historisch von DB (`/api/powerfox/history`)
- **Format:** App-Format (gemappt von DB)
- **Filter:** Device, Zeitraum, Datentyp
- **Features:** Tabelle, Statistiken, Export

### Sync (`/sync`)
- **Daten:** Manuell von API (`/api/powerfox/save`)
- **Format:** App-Format (bereits gemappt)
- **Funktion:** Daten in DB laden für Reports
- **UI:** Device-Auswahl, Endpoint-Auswahl

## Vorteile dieser Architektur

1. **Zentrale Datentransformation**
   - Nur Mapper müssen bei API-Änderungen angepasst werden
   - App-Code bleibt unverändert

2. **Einheitliches Datenformat**
   - Überall in der App das gleiche Format
   - Einfaches Debugging
   - Type-Safety durch TypeScript

3. **Klare Verantwortlichkeiten**
   - APIs: Daten holen + mappen
   - Hooks: Daten cachen (SWR)
   - Components: Daten anzeigen
   - Mapper: Format-Konvertierung

4. **Flexible Datenquellen**
   - Dashboard: Live-API
   - Reports: DB mit Filtern
   - Nahtloser Wechsel möglich

5. **Performanz**
   - SWR Caching
   - Background DB-Speicherung
   - Effiziente DB-Queries

## Wartung

### Bei API-Änderungen

1. SDK neu generieren (falls OpenAPI-Spec verfügbar)
2. Mapper-Funktionen in `lib/mappers.ts` anpassen
3. Fertig! App-Code muss nicht geändert werden

### Neue Felder hinzufügen

1. Prisma Schema aktualisieren (`prisma/schema.prisma`)
2. Mapper-Funktionen erweitern (`lib/mappers.ts`)
3. `npx prisma db push` ausführen
4. TypeScript prüft automatisch alle Verwendungen

### Neue Endpoints

1. SDK-Aufruf in `/api/powerfox/route.ts` hinzufügen
2. Mapper-Funktion erstellen (falls neuer Typ)
3. Hook erstellen (optional)
4. UI-Component erstellen
