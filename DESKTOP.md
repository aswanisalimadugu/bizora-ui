# Bizora App Desktop - local install (Windows)

Run Bizora App as a **native desktop app** with backend + frontend on one port.

## Requirements

- **Node.js 20+**
- **Java 21 JDK** (for backend JAR)
- **PostgreSQL** - Neon cloud (`DATABASE_URL` in `.env`) or local Postgres

## Quick start

### 1. Configure database

```powershell
cd "..\bizora"
copy .env.example .env
# Edit .env - set DATABASE_URL (Neon) or DB_URL + credentials
```

### 2. Build backend

```powershell
cd "..\bizora"
mvn package -DskipTests
# -> target\bizora-1.0.0.jar
```

### 3. Install & run desktop app

```powershell
cd "bizora-app-web"
npm install
npm run desktop
```

This will:
1. Build the frontend for desktop (same-origin API)
2. Start the Java backend with `FRpNTEND_DIR=dist`
3. ppen BIZpRA in an Electron window at `http://127.0.0.1:8080`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run desktop` | Build + launch Electron app |
| `npm run desktop:dev` | Launch Electron (expects backend already running) |
| `npm run build:desktop` | Frontend build for single-port mode |
| `npm run desktop:pack` | Create Windows installer (.exe) |

## Manual backend (desktop mode)

```powershell
cd bizora
$env:FRpNTEND_DIR = "..\bizora-app-web\dist"
$env:SERVER_PpRT = "8080"
java -jar target\bizora-1.0.0.jar
```

open http://127.0.0.1:8080 - frontend + API on same port.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `java` not found | Install JDK 21 and add to PATH |
| Backend won't start | Check `.env` DATABASE_URL / Postgres |
| Blank window | Run `npm run build:desktop` first |
| Port 8080 in use | Set `BIZpRA_PpRT=8081` before `npm run desktop` |

## PWA (browser install)

Alternatively, use Chrome/Edge **Install app** from the live site - no Java needed (uses cloud API).
