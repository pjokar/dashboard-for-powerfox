# API Logging System

## Übersicht

Das System loggt jetzt automatisch **alle** API-Aufrufe zur Powerfox API in die Datenbank. Jeder Log-Eintrag enthält:

- **Request-Informationen**: Endpoint, Methode, Parameter
- **Response-Informationen**: Status-Code, Erfolg/Fehler, Response-Daten
- **Metadaten**: Zeitstempel, Dauer in Millisekunden
- **Fehlerinformationen**: Fehlermeldungen bei fehlgeschlagenen Aufrufen

## Datenbank-Schema

```prisma
model ApiLog {
  id                  String    @id @default(cuid())
  
  // Request Information
  endpoint            String    // z.B. "all/devices", "{deviceId}/current"
  method              String    // GET, POST, etc.
  params              String?   // JSON string der Parameter
  
  // Response Information
  statusCode          Int
  success             Boolean   @default(true)
  responseData        String?   // JSON string der Response
  errorMessage        String?
  
  // Metadata
  duration            Int?      // Dauer in Millisekunden
  timestamp           DateTime  @default(now())
}
```

## API-Endpunkt zum Abrufen der Logs

### GET `/api/powerfox/logs`

#### Query-Parameter:

- `limit` (optional, default: 100): Anzahl der zurückzugebenden Einträge
- `endpoint` (optional): Filter nach bestimmtem Endpoint
- `failed` (optional, boolean): Nur fehlgeschlagene Aufrufe anzeigen

#### Beispiele:

```bash
# Alle Logs abrufen (letzte 100)
curl http://localhost:3000/api/powerfox/logs

# Nur fehlgeschlagene Aufrufe
curl http://localhost:3000/api/powerfox/logs?failed=true

# Logs für einen bestimmten Endpoint
curl http://localhost:3000/api/powerfox/logs?endpoint=all/devices

# Letzte 50 Logs
curl http://localhost:3000/api/powerfox/logs?limit=50

# Kombination
curl http://localhost:3000/api/powerfox/logs?endpoint=all/devices&limit=20
```

#### Response-Format:

```json
{
  "count": 10,
  "logs": [
    {
      "id": "clx...",
      "endpoint": "all/devices",
      "method": "POST",
      "params": {
        "unit": "wh"
      },
      "statusCode": 200,
      "success": true,
      "responseData": [...],
      "errorMessage": null,
      "duration": 523,
      "timestamp": "2026-02-04T10:30:00.000Z"
    },
    ...
  ]
}
```

### DELETE `/api/powerfox/logs`

Löscht alte Logs aus der Datenbank.

#### Query-Parameter:

- `days` (optional, default: 7): Anzahl der Tage, die behalten werden sollen

#### Beispiel:

```bash
# Logs älter als 7 Tage löschen
curl -X DELETE http://localhost:3000/api/powerfox/logs

# Logs älter als 30 Tage löschen
curl -X DELETE http://localhost:3000/api/powerfox/logs?days=30
```

## Automatisches Logging

Alle API-Routes loggen automatisch:

1. **Erfolgreiche Aufrufe**: 
   - Volle Response-Daten (als JSON)
   - Dauer des Aufrufs
   - Verwendete Parameter

2. **Fehlgeschlagene Aufrufe**:
   - Fehlertyp und -nachricht
   - HTTP-Status-Code
   - Verwendete Parameter

## Verwendung zur Fehlersuche

### Problem: API liefert 0 Werte

Um herauszufinden, warum die API 0 Werte liefert:

```bash
# 1. Überprüfe die letzten API-Logs
curl http://localhost:3000/api/powerfox/logs?limit=10

# 2. Überprüfe nur fehlgeschlagene Aufrufe
curl http://localhost:3000/api/powerfox/logs?failed=true

# 3. Schaue dir die Response-Daten an
# Die responseData enthält die exakte Antwort der Powerfox API
```

### Beispiel-Analyse:

```javascript
// Hole die Logs
const response = await fetch('http://localhost:3000/api/powerfox/logs?limit=10')
const { logs } = await response.json()

// Analysiere die Daten
logs.forEach(log => {
  console.log(`\n=== ${log.endpoint} ===`)
  console.log('Status:', log.statusCode, log.success ? '✓' : '✗')
  console.log('Dauer:', log.duration, 'ms')
  
  if (log.responseData) {
    const data = log.responseData
    console.log('Response-Typ:', Array.isArray(data) ? 'Array' : typeof data)
    console.log('Anzahl Items:', Array.isArray(data) ? data.length : 'N/A')
    console.log('Daten:', JSON.stringify(data, null, 2))
  }
  
  if (log.errorMessage) {
    console.log('Fehler:', log.errorMessage)
  }
})
```

## Datenbankzugriff

Du kannst die Logs auch direkt in der Datenbank über Prisma Studio anschauen:

```bash
pnpm run db:studio
```

Dann navigiere zur `ApiLog` Tabelle.

## Wartung

### Automatisches Löschen alter Logs

Um zu verhindern, dass die Datenbank zu groß wird, solltest du regelmäßig alte Logs löschen:

```bash
# Als Cron-Job oder manuell
curl -X DELETE http://localhost:3000/api/powerfox/logs?days=7
```

### Empfohlene Retention:

- Entwicklung: 7 Tage
- Produktion: 30 Tage

## Integration in Monitoring

Die Logs können für verschiedene Zwecke verwendet werden:

1. **Error Tracking**: Fehlgeschlagene Aufrufe identifizieren
2. **Performance Monitoring**: Dauer der API-Aufrufe analysieren
3. **Debugging**: Exakte Request/Response-Daten anschauen
4. **Audit Trail**: Nachvollziehen, welche Daten wann abgerufen wurden

## Nächste Schritte

1. **Dashboard erstellen**: Eine UI-Komponente, die die Logs anzeigt
2. **Alerting**: Benachrichtigungen bei häufigen Fehlern
3. **Metriken**: Aggregierte Statistiken über API-Performance
