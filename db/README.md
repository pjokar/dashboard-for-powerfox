## SQLite-Datenbank (`db/`)

Dieses Verzeichnis enthält die lokale SQLite-Datenbank (z.B. `dev.db`).  
Die eigentliche DB-Datei ist in der Regel **nicht im Git-Repo**, diese `README` sorgt dafür, dass das Verzeichnis trotzdem committed wird.

### Datenbank initial erstellen

Im Projektroot:

```bash
# Prisma-Client generieren (falls noch nicht vorhanden)
pnpm db:generate

# Datenbank aus dem Prisma-Schema erzeugen / aktualisieren
pnpm db:push
# alternativ (mit Migrationen)
# pnpm db:migrate
```

Anschließend liegt die Datei `db/dev.db` vor und kann z.B. mit Prisma Studio inspiziert werden:

```bash
pnpm db:studio
```

