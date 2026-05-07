import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const config = useRuntimeConfig()
  const dbPath = config.dbPath as string

  mkdirSync(dirname(dbPath), { recursive: true })

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS schueler (
      id       INTEGER PRIMARY KEY,
      vorname  TEXT NOT NULL,
      nachname TEXT NOT NULL,
      klasse   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loggingW245 (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      time   TEXT NOT NULL,
      rfID   TEXT NOT NULL,
      in_out INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lesson (
      lesson INTEGER PRIMARY KEY AUTOINCREMENT,
      start  INTEGER,
      end    INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_logging_rfid ON loggingW245 (rfID);
    CREATE INDEX IF NOT EXISTS idx_logging_time ON loggingW245 (time);
  `)

  return db
}
