# 🔄 API Sync - Anleitung

## Übersicht

Das Dashboard nutzt jetzt **ausschließlich die Datenbank** für alle Anzeigen. Die neue **Sync-Seite** (`/sync`) ermöglicht das manuelle Abrufen von Daten von der Powerfox API und Speichern in die DB.

## 🎯 Workflow

```
1. Daten mit /sync von API holen → 2. In DB speichern → 3. Dashboard zeigt DB-Daten
```

## Wie funktioniert es?

### Dashboard (Hauptseite `/`)

**Liest ALLES aus der Datenbank:**

- ✅ Device-Liste aus DB
- ✅ Aktuelle Messwerte aus DB (letzte 100 Einträge)
- ✅ Operating Reports aus DB
- ✅ Reports aus DB
- ✅ Historische Daten aus DB (z.B. letzte 24h)

**Refresh-Intervalle:**
- Current Data: alle 30 Sekunden
- Operating Data: alle 60 Sekunden
- Reports: nur bei Seitenwechsel

### Sync-Seite (`/sync`)

**Holt Daten von der Powerfox API:**

1. **Endpoint auswählen** - Was soll abgerufen werden?
2. **Parameter konfigurieren** - Device ID, Datum, etc.
3. **Fetch & Save** - Daten abrufen und automatisch in DB speichern

## 📋 Verfügbare Endpoints

### 1. All Devices
- **Pfad:** `all/devices`
- **Beschreibung:** Holt alle Geräte
- **Speichert:** Device-Informationen
- **Parameter:** Keine
- **Verwendung:** Initial Setup, um alle Devices zu laden

### 2. Device Info
- **Pfad:** `{deviceId}/main`
- **Beschreibung:** Detaillierte Geräteinformationen
- **Speichert:** Device-Informationen
- **Parameter:** 
  - `deviceId` (required) - Die Device ID

### 3. Current Data ⚡
- **Pfad:** `{deviceId}/current`
- **Beschreibung:** Aktuelle Messwerte (Watt, kWh, Phasen)
- **Speichert:** CurrentData Zeitreihe
- **Parameter:**
  - `deviceId` (required)
  - `unit` (optional) - "kwh" oder "wh"
- **Tipp:** Regelmäßig ausführen für aktuelle Daten!

### 4. Operating Report
- **Pfad:** `{deviceId}/operating`
- **Beschreibung:** Betriebsbericht mit Min/Max/Avg
- **Speichert:** OperatingReport mit Values
- **Parameter:**
  - `deviceId` (required)

### 5. Full Report 📊
- **Pfad:** `{deviceId}/report`
- **Beschreibung:** Vollständiger Bericht (Consumption, Generation, etc.)
- **Speichert:** Report mit allen Summaries
- **Parameter:**
  - `deviceId` (required)
  - `year` (optional)
  - `month` (optional, 1-12)
  - `day` (optional)

## 🚀 Erste Schritte

### 1. Initiale Daten laden

```bash
# Schritt 1: Alle Devices holen
/sync → "All Devices" → Fetch

# Schritt 2: Current Data für jedes Device
/sync → "Current Data" → Device ID eingeben → Fetch

# Schritt 3: Reports laden (optional)
/sync → "Full Report" → Device ID + Datum → Fetch
```

### 2. Regelmäßige Updates

**Option A: Manuell**
- Gehe zu `/sync`
- Wähle "Current Data"
- Fetch für jedes Device

**Option B: Automatisiert (Cronjob - TODO)**
```typescript
// cron/sync.ts
import { saveCurrentData } from '@/lib/powerfox-db'

export async function syncAll() {
  const devices = await getAllDevices()
  
  for (const device of devices) {
    // Fetch von API
    const data = await fetchFromPowerfox(device.deviceId)
    // Save to DB
    await saveCurrentData(data)
  }
}
```

## 💡 Tipps & Best Practices

### Dashboard Performance
- Dashboard lädt schnell, da alles aus lokaler DB kommt
- Keine API-Rate-Limits beim Betrachten
- Historische Daten sofort verfügbar

### Sync-Strategie

**Für Live-Monitoring:**
- Current Data alle 1-5 Minuten syncen
- Operating Reports alle 15 Minuten
- Full Reports 1x täglich

**Für Historical Analysis:**
- Current Data alle 5-15 Minuten
- Reports nach Bedarf

### Daten-Retention

Die DB sammelt kontinuierlich Daten. Nutze die Cleanup-Funktion:

```typescript
import { deleteOldCurrentData } from '@/lib/powerfox-db'

// Alte Daten bereinigen (älter als 30 Tage)
await deleteOldCurrentData(30)
```

## 🔍 Debugging

### Dashboard zeigt keine Daten?

1. **Prüfe DB:** `pnpm db:studio` → Sind Daten vorhanden?
2. **Fetch Daten:** Gehe zu `/sync` und hole Daten
3. **Console:** Browser DevTools → Network Tab → Prüfe API-Calls

### Sync-Fehler?

- **401 Unauthorized:** Credentials in Settings falsch
- **404 Not Found:** Device ID existiert nicht
- **412 Precondition Failed:** Datenübertragung vom Kunden verweigert
- **429 Too Many Requests:** Rate-Limit erreicht (warte 1 Minute)

## 📊 Beispiel-Workflow

### Szenario: Tägliches Energy-Monitoring

**Morgens (einmalig):**
```
1. /sync → "All Devices" → Fetch (falls neue Devices)
```

**Alle 5 Minuten (automatisiert):**
```
2. /sync → "Current Data" → Device ID → Fetch
   (für jedes aktive Device)
```

**Abends:**
```
3. Dashboard öffnen → Tagesverbrauch analysieren
4. Charts zeigen automatisch Tagesverlauf aus DB
```

**Ende des Monats:**
```
5. /sync → "Full Report" → Jahr + Monat → Fetch
6. Dashboard zeigt Monatsstatistiken
```

## 🎨 UI-Features der Sync-Seite

- **Endpoint-Dropdown:** Alle verfügbaren API-Endpoints
- **Dynamische Parameter:** Felder passen sich an Endpoint an
- **Required-Marker:** Pflichtfelder sind gekennzeichnet (*)
- **Live-Vorschau:** Endpoint-Pfad wird angezeigt
- **Erfolgs-/Fehler-Meldungen:** Farbcodiertes Feedback
- **JSON-Vorschau:** Zeigt API-Response an
- **Navigation:** Zurück-Button zum Dashboard

## 🔐 Sicherheit

- Credentials werden im Zustand gespeichert (nicht in DB)
- Credentials müssen in Settings eingegeben werden
- API-Calls gehen über Backend-Route (`/api/powerfox/save`)
- Credentials werden nie im Frontend-Code gespeichert

## 🚧 Zukünftige Features (TODO)

- [ ] **Auto-Sync:** Automatischer Background-Sync alle X Minuten
- [ ] **Bulk-Fetch:** Alle Devices auf einmal syncen
- [ ] **Sync-Schedule:** Zeitgesteuerte Syncs konfigurieren
- [ ] **Sync-History:** Log aller Sync-Vorgänge
- [ ] **Push-Notifications:** Bei erfolgreichen/fehlgeschlagenen Syncs
- [ ] **Rate-Limit-Anzeige:** Zeige verbleibende API-Calls

## 📚 Siehe auch

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Datenbank-Setup & Schema
- [prisma/README.md](./prisma/README.md) - Prisma-Dokumentation
- [app/api/powerfox/API.md](./app/api/powerfox/API.md) - API-Endpunkte Details

## ❓ FAQ

**Q: Muss ich für jede Ansicht neu syncen?**
A: Nein! Einmal syncen, dann zeigt das Dashboard die Daten aus der DB.

**Q: Wie oft sollte ich syncen?**
A: Für Live-Monitoring alle 1-5 Minuten. Für Analyse 1x täglich reicht.

**Q: Kann ich alte Daten sehen?**
A: Ja! Alle gesyncten Daten bleiben in der DB (bis zu manueller Bereinigung).

**Q: Was passiert bei Sync-Fehlern?**
A: Die Seite zeigt eine Fehlermeldung. Vorherige Daten bleiben erhalten.

**Q: Gibt es ein Rate-Limit?**
A: Ja, Powerfox API hat Limits. Bei 429-Fehler 1 Minute warten.
