# AttendanceChecker

RFID-basiertes Anwesenheitssystem für Schulen. Schüler scannen ihre RFID-Karte an einem Raspberry Pi — die Webanwendung zeigt Echtzeit-Anwesenheit, Protokolle und Auswertungen.

## Tech Stack

- **Frontend/Backend:** Nuxt 4 (Vue 3, TypeScript)
- **Datenbank:** SQLite via `better-sqlite3`
- **Styling:** Tailwind CSS (Dark Theme)
- **Charts:** Chart.js
- **Hardware:** Raspberry Pi + MFRC522 RFID-Leser + HC-SR04 Ultraschallsensor

## Setup

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env

# 3. Dev-Server starten
npm run dev
```

Die App ist dann unter `http://localhost:3000` erreichbar. Die SQLite-Datenbank und Demo-Daten werden beim ersten Start automatisch angelegt.

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|---|---|---|
| `DB_PATH` | `./data/attendance.db` | Pfad zur SQLite-Datenbankdatei |
| `SCAN_SECRET` | _(leer)_ | Shared Secret zwischen Pi und API (optional) |

## Befehle

```bash
npm run dev        # Dev-Server starten (http://localhost:3000)
npm run build      # Production Build
npm run preview    # Production Build vorschauen
npm run generate   # Statische Site generieren
```

## Projektstruktur

```
attendanceChecker/
├── app/
│   ├── pages/
│   │   ├── index.vue       # Dashboard — Live-Anwesenheit + Aktivitätsfeed
│   │   ├── students.vue    # Schülerverwaltung (CRUD)
│   │   ├── logs.vue        # Protokoll mit Datumsfilter & Pagination
│   │   └── analytics.vue   # Charts + Statistiken
│   ├── components/
│   │   └── AppNav.vue      # Sidebar-Navigation
│   ├── layouts/default.vue
│   └── assets/css/main.css # Tailwind + globale UI-Klassen
├── server/
│   ├── database/index.ts   # SQLite-Schema, Init, Demo-Daten
│   └── api/
│       ├── logs/           # POST (Pi-Endpunkt), GET (Protokoll)
│       ├── presence/       # Wer ist gerade im Raum
│       ├── students/       # CRUD für Schüler
│       └── analytics/      # Chart-Daten
├── rpi/
│   └── scanner.py          # Python-Script für den Raspberry Pi
├── .env.example
└── nuxt.config.ts
```

## Datenbankschema (SQLite)

| Tabelle | Zweck |
|---|---|
| `students` | Registrierte Schüler mit `rfid_id` (unique), Name, Klasse |
| `attendance_logs` | Unveränderliches Event-Log (`enter` / `exit` / `unknown`) |
| `presence` | Aktueller Status pro `rfid_id` (`in` / `out`) |

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/api/logs` | RFID-Scan vom Raspberry Pi entgegennehmen |
| `GET` | `/api/logs` | Logs abrufen (Filter: `date`, `student_id`, Pagination) |
| `GET` | `/api/presence` | Aktuelle Anwesenheitsliste |
| `GET` | `/api/students` | Alle Schüler abrufen |
| `POST` | `/api/students` | Neuen Schüler anlegen |
| `DELETE` | `/api/students/:id` | Schüler löschen |
| `GET` | `/api/analytics` | Chart-Daten (14-Tage-Verlauf, Tageszeit, Ranking) |

### POST /api/logs

```json
{
  "rfid_id": "RFID-001",
  "direction": "enter",
  "secret": "optional-shared-secret"
}
```

`direction` ist optional. Ohne Angabe wird der Status automatisch getoggelt (enter → exit → enter …).

## Raspberry Pi Setup

### Verkabelung

| Komponente | GPIO-Pin |
|---|---|
| HC-SR04 TRIG | GPIO 23 |
| HC-SR04 ECHO | GPIO 24 |
| MFRC522 RST | GPIO 25 |
| MFRC522 SPI | SPI0 (MOSI/MISO/SCK/CE0) |

### Installation

```bash
pip install RPi.GPIO mfrc522 requests
```

### Konfiguration

In `rpi/scanner.py` die folgenden Variablen anpassen:

```python
SERVER_URL  = "http://YOUR_SERVER_IP:3000"  # IP des Nuxt-Servers
SCAN_SECRET = ""                            # muss mit .env SCAN_SECRET übereinstimmen
DISTANCE_CM = 100                           # Auslöseabstand in cm
COOLDOWN_S  = 3                             # Sekunden zwischen zwei Scans derselben Karte
```

### Starten

```bash
python3 rpi/scanner.py
```

Ohne RFID-Hardware läuft das Script automatisch im Simulationsmodus.

## Datenfluss

```
Raspberry Pi (rpi/scanner.py)
  └─ POST /api/logs  { rfid_id, direction?, secret? }
       └─ togglet Anwesenheit, schreibt attendance_logs
            └─ Frontend pollt /api/presence alle 10 Sekunden
```
