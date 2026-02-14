# API Sync Anleitung

## ✅ Setup erfolgreich!

Die Powerfox Dashboard ist jetzt mit einer SQLite-Datenbank konfiguriert und kann Daten von der Powerfox API abrufen und speichern.

## 📦 Installierte Komponenten

- **Prisma 7.3.0** - ORM für Datenbankzugriff
- **better-sqlite3** - SQLite Treiber (nativ kompiliert)
- **@prisma/adapter-better-sqlite3** - Adapter für Prisma mit SQLite

## 🗄️ Datenbank

Die Datenbank befindet sich in:
```
db/dev.db
```

## 🚀 Verwendung

### 1. Dashboard öffnen

Der Dev-Server läuft bereits auf: **http://localhost:3000**

### 2. API Sync Page nutzen

1. Öffne im Browser: **http://localhost:3000/sync**
2. Du findest einen Button "API Sync" im Header des Dashboards

Auf der Sync Page kannst du:
- **Endpoints auswählen**: Wähle welche Daten du abrufen möchtest
  - All Devices
  - Device Info
  - Current Data
  - Operating Report
  - Full Report
  
- **Parameter konfigurieren**: Fülle erforderliche Parameter aus (z.B. Device ID)

- **Daten abrufen**: Klicke auf "Daten abrufen und speichern"
  - Die Daten werden von der Powerfox API abgerufen
  - Automatisch in der Datenbank gespeichert
  - Ergebnis wird angezeigt

### 3. Credentials konfigurieren

⚠️ **Wichtig**: Du musst zuerst deine Powerfox-Credentials in den Einstellungen hinterlegen!

1. Klicke auf das Zahnrad-Symbol im Dashboard
2. Gib deine Powerfox Email und Passwort ein
3. Speichern

## 📡 API Endpunkte

### POST /api/powerfox/save

Ruft Daten von der Powerfox API ab und speichert sie in der DB.

**Request Body:**
```json
{
  "email": "deine@email.de",
  "password": "dein-passwort",
  "endpoint": "all/devices",
  "params": {
    "unit": "kwh"
  },
  "saveToDb": true
}
```

**Unterstützte Endpoints:**
- `all/devices` - Alle Geräte
- `{deviceId}/main` - Geräteinformationen
- `{deviceId}/current` - Aktuelle Messdaten
- `{deviceId}/operating` - Betriebsbericht
- `{deviceId}/report` - Vollständiger Bericht

### GET /api/powerfox/history

Ruft Daten aus der lokalen Datenbank ab.

**Query Parameter:**
- `deviceId` (required) - Device ID
- `type` - "current" | "operating" | "reports" (default: "current")
- `limit` - Anzahl der Einträge (default: 100)
- `startTimestamp` - Unix-Timestamp für Zeitraum-Filter (optional)
- `endTimestamp` - Unix-Timestamp für Zeitraum-Filter (optional)

**Beispiel:**
```
GET /api/powerfox/history?deviceId=123&type=current&limit=50
```

## 🔧 Prisma Commands

```bash
# Prisma Client generieren
pnpm db:generate

# Datenbank Schema pushen (ohne Migration)
pnpm db:push

# Migration erstellen
pnpm db:migrate

# Prisma Studio öffnen (DB GUI)
pnpm db:studio
```

## 🛠️ Troubleshooting

### Server startet nicht?
```bash
# Build Cache löschen
rm -rf .next node_modules/.cache

# Dev Server neu starten
pnpm run dev
```

### Datenbankfehler?
```bash
# Prisma Client neu generieren
pnpx prisma generate

# Datenbank neu erstellen
pnpx prisma db push
```

### better-sqlite3 Fehler?
```bash
# Native Bindings neu bauen
cd node_modules/.pnpm/better-sqlite3@12.6.2/node_modules/better-sqlite3
npm run install
cd ../../../../../..
```

## 📊 Datenbank Schema

Das Schema enthält folgende Models:
- **Device** - Geräteinformationen
- **CurrentData** - Aktuelle Messwerte
- **OperatingReport** - Betriebsberichte mit Values
- **Report** - Vollständige Reports mit Summaries
  - ReportSummaryPower (Consumption, Own Consumption, Feed-In, Generation)
  - ReportSummaryHeat
  - ReportSummaryGas
  - ReportSummaryWater

## 🎯 Nächste Schritte

1. **Credentials konfigurieren** in den Dashboard-Einstellungen
2. **Erste Daten abrufen** über die Sync Page
3. **Dashboard nutzen** - Alle Daten werden jetzt aus der lokalen DB geladen

## 📚 Weitere Ressourcen

- [Prisma Dokumentation](https://www.prisma.io/docs)
- [Prisma SQLite Quickstart](https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/sqlite)
- [Next.js Dokumentation](https://nextjs.org/docs)
