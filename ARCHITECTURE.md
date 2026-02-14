# Powerfox Dashboard - Architektur

## Übersicht

Die Anwendung folgt einer **3-Schichten-Architektur** mit zentralisierten SDK-Calls und konsistentem Daten-Mapping.

```
┌─────────────────────────────────────────────────────────────┐
│                    App Components                            │
│  (Dashboard, Reports, Sync, etc.)                           │
│  → Arbeitet NUR mit DB/App-Format (gemappte Daten)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   React Hooks Layer                          │
│  hooks/use-powerfox-api.ts                                  │
│  → usePowerfoxDevices()                                      │
│  → usePowerfoxCurrentData()                                  │
│  → usePowerfoxOperatingReport()                              │
│  → usePowerfoxReport()                                       │
│  → Nutzt zentrale API-Schicht                                │
│  → Automatisches DB-Caching (optional)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│               Zentrale API-Schicht                           │
│  lib/powerfox-api.ts                                        │
│  → fetchDevices()                                            │
│  → fetchCurrentData()                                        │
│  → fetchOperatingReport()                                    │
│  → fetchReport()                                             │
│  → SDK-Calls                                                 │
│  → Mapping (SDK → DB/App-Format)                            │
│  → API-Logging                                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Powerfox SDK                                │
│  lib/powerfox-sdk/                                          │
│  → MyApi (generiert von OpenAPI)                            │
│  → Typisierte Models                                         │
└─────────────────────────────────────────────────────────────┘
```

## Wichtige Prinzipien

### 1. **Zentralisierung**
- ✅ **Alle SDK-Calls** erfolgen in `lib/powerfox-api.ts`
- ✅ **Alle Mappings** erfolgen in `lib/powerfox-api.ts` (nutzt `lib/mappers.ts`)
- ✅ **Alle Komponenten** nutzen nur die React Hooks
- ❌ Niemals direkt SDK in Komponenten importieren!

### 2. **Konsistentes Datenformat**
- Die App arbeitet **ausschließlich mit DB/App-Format** (camelCase, Prisma-kompatibel)
- SDK-Format (PascalCase) bleibt in der API-Schicht gekapselt
- Mapping erfolgt transparent in der zentralen API-Schicht

### 3. **Typsicherheit**
- Alle Funktionen sind voll typisiert
- Return-Types entsprechen DB-Models (Prisma)
- Keine `any`-Types in der Anwendungslogik

## Datei-Struktur

```
lib/
├── powerfox-api.ts          # Zentrale API-Schicht (SDK-Calls + Mapping)
├── mappers.ts               # Mapping-Funktionen (SDK ↔ DB)
├── powerfox-db.ts           # Datenbankoperationen
├── powerfox-store.ts        # Zustand (Credentials)
└── powerfox-sdk/            # Generierter SDK (nicht direkt nutzen!)

hooks/
├── use-powerfox-api.ts      # React Hooks für API-Zugriff
└── use-powerfox.ts          # Legacy (kann entfernt werden)

app/api/powerfox/
├── route.ts                 # Dünner Wrapper für HTTP-Zugriff
├── logs/route.ts            # API-Logs abrufen
└── save/route.ts            # Legacy (kann vereinfacht werden)
```

## Usage Examples

### In Components (empfohlen)

```typescript
import {
  usePowerfoxDevices,
  usePowerfoxCurrentData,
} from "@/hooks/use-powerfox-api"

function Dashboard() {
  // Daten sind bereits gemappt (DB-Format)
  const { data: devices, error, isLoading } = usePowerfoxDevices()
  const { data: currentData } = usePowerfoxCurrentData(deviceId, 'kwh')
  
  // Arbeite direkt mit DB-Format
  return (
    <div>
      {devices?.map(device => (
        <div key={device.deviceId}>
          {device.name} - {device.mainDevice ? 'Main' : 'Secondary'}
        </div>
      ))}
      
      {currentData && (
        <div>
          Power: {currentData.watt}W
          Energy: {currentData.kiloWattHour}kWh
        </div>
      )}
    </div>
  )
}
```

### In Server Components / API Routes

```typescript
import {
  fetchDevices,
  fetchCurrentData,
} from "@/lib/powerfox-api"

// Daten sind bereits gemappt
const devices = await fetchDevices({ email, password })
const currentData = await fetchCurrentData({ email, password }, deviceId, 'kwh')

// Speichere in DB
await saveDevice(devices[0])  // Bereits im richtigen Format!
```

### Mapping-Richtung

```typescript
// SDK → DB (erfolgt automatisch in powerfox-api.ts)
const dbDevice = deviceSdkToDb(sdkDevice)

// DB → SDK (für Rückgabe an Frontend, falls nötig)
const sdkDevice = deviceDbToSdk(dbDevice)
```

## Vorteile dieser Architektur

### ✅ **Wartbarkeit**
- Änderungen an der API nur an einer Stelle
- Konsistentes Datenformat in der gesamten App
- Einfaches Testen (Mock nur die zentrale API-Schicht)

### ✅ **Typsicherheit**
- Compiler prüft Datenformat
- Keine Laufzeitfehler durch falsche Felder
- IntelliSense für alle Properties

### ✅ **Performance**
- SWR-Caching in den Hooks
- Automatisches Revalidating
- Optimistische Updates möglich

### ✅ **Debuggability**
- Alle API-Calls werden geloggt
- Zentrale Fehlerbehandlung
- Einfaches Monitoring

### ✅ **Flexibilität**
- Einfacher Wechsel von API zu DB-Modus
- Hybride Strategien möglich (Live + Cached)
- Neue Endpoints schnell hinzufügbar

## Migration Guide

### Von direkten SDK-Calls:

```typescript
// ❌ Alt (nicht empfohlen)
import { MyApi, Configuration } from "@/lib/powerfox-sdk"

const api = new MyApi(config)
const devices = await api.apiVersionMyIdDevicesGet(...)
// Manuelles Mapping nötig
// Kein automatisches Logging

// ✅ Neu (empfohlen)
import { usePowerfoxDevices } from "@/hooks/use-powerfox-api"

const { data: devices } = usePowerfoxDevices()
// Daten bereits gemappt
// Automatisches Logging
// Automatisches Caching
```

### Von API-Route-Calls:

```typescript
// ❌ Alt
const response = await fetch("/api/powerfox", {
  method: "POST",
  body: JSON.stringify({ email, password, endpoint: "all/devices" })
})
const devices = await response.json()

// ✅ Neu
const { data: devices } = usePowerfoxDevices()
```

## Best Practices

### ✅ **DO:**
- Nutze die React Hooks in Components
- Nutze die API-Funktionen in Server Components
- Arbeite nur mit DB-Format
- Vertraue auf automatisches Caching

### ❌ **DON'T:**
- SDK niemals direkt in Components importieren
- Nicht manuell zwischen Formaten konvertieren
- Keine direkten fetch-Calls zu Powerfox API
- Nicht das SDK-Format in der App verwenden

## Logging & Monitoring

Alle API-Calls werden automatisch in der DB geloggt:

```typescript
// Logs abrufen
const logs = await fetch('/api/powerfox/logs?limit=50')

// Nur fehlgeschlagene Calls
const failedLogs = await fetch('/api/powerfox/logs?failed=true')

// Für bestimmten Endpoint
const deviceLogs = await fetch('/api/powerfox/logs?endpoint=all/devices')
```

Siehe: [API_LOGGING.md](./API_LOGGING.md)

## Troubleshooting

### Problem: Hook gibt `undefined` zurück
- **Lösung**: Credentials im Store setzen:
  ```typescript
  const { setCredentials } = usePowerfoxCredentials()
  setCredentials({ email, password })
  ```

### Problem: SDK liefert undefined-Werte (ReadableStream Problem)
- **Ursache**: Der von `@openapitools/openapi-generator-cli` generierte SDK hat ein Problem mit ReadableStream - der Body ist `locked: true, state: 'closed'`
- **Lösung**: Wir nutzen die `*Raw` SDK-Methoden und lesen den Response Body mit `response.raw.text()` aus, dann parsen wir das JSON manuell
- **Code**: Siehe `parseRawResponse()` in `lib/powerfox-api.ts`

### Problem: Falsche Datenfelder
- **Überprüfe**: Nutzt du die Hooks? Daten sollten bereits im DB-Format sein
- **Fix**: Überprüfe Mapper in `lib/mappers.ts`

## Future Improvements

- [ ] WebSocket-Integration für Echtzeit-Updates
- [ ] Optimistic Updates in Hooks
- [ ] Offline-Modus mit Service Worker
- [ ] GraphQL-Layer für komplexe Queries
- [ ] React Query statt SWR (besseres Caching)
