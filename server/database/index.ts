import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const config = useRuntimeConfig()
  const dbPath = config.dbPath as string
  const dir = dbPath.split('/').slice(0, -1).join('/')

  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initSchema(db)
  seedDemoData(db)

  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      rfid_id    TEXT UNIQUE NOT NULL,
      class      TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      rfid_id    TEXT NOT NULL,
      student_id INTEGER,
      event_type TEXT NOT NULL CHECK(event_type IN ('enter', 'exit', 'unknown')),
      timestamp  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS presence (
      rfid_id    TEXT PRIMARY KEY,
      student_id INTEGER,
      status     TEXT NOT NULL DEFAULT 'out' CHECK(status IN ('in', 'out')),
      entered_at DATETIME,
      last_seen  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_logs_rfid      ON attendance_logs(rfid_id);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON attendance_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_logs_student   ON attendance_logs(student_id);
  `)
}

function seedDemoData(db: Database.Database) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM students').get() as { c: number }).c
  if (count > 0) return

  const students = [
    { name: 'Max Mustermann', rfid_id: 'RFID-001', class: '10A' },
    { name: 'Laura Schmidt', rfid_id: 'RFID-002', class: '10A' },
    { name: 'Tom Weber', rfid_id: 'RFID-003', class: '10B' },
    { name: 'Anna Müller', rfid_id: 'RFID-004', class: '10B' },
    { name: 'Felix Braun', rfid_id: 'RFID-005', class: '11A' },
    { name: 'Sophie Klein', rfid_id: 'RFID-006', class: '11A' },
  ]

  const insertStudent = db.prepare(
    'INSERT INTO students (name, rfid_id, class) VALUES (?, ?, ?)'
  )
  const insertPresence = db.prepare(
    'INSERT OR IGNORE INTO presence (rfid_id, student_id, status) VALUES (?, ?, ?)'
  )
  const insertLog = db.prepare(
    'INSERT INTO attendance_logs (rfid_id, student_id, event_type, timestamp) VALUES (?, ?, ?, ?)'
  )

  const insertAll = db.transaction(() => {
    for (const s of students) {
      const result = insertStudent.run(s.name, s.rfid_id, s.class)
      const sid = result.lastInsertRowid

      insertPresence.run(s.rfid_id, sid, 'out')

      // seed some historical logs over the past 7 days
      for (let day = 6; day >= 0; day--) {
        const base = new Date()
        base.setDate(base.getDate() - day)
        base.setHours(8, Math.floor(Math.random() * 30), 0, 0)
        const enterTs = base.toISOString().replace('T', ' ').substring(0, 19)

        insertLog.run(s.rfid_id, sid, 'enter', enterTs)

        const exitBase = new Date(base)
        exitBase.setHours(exitBase.getHours() + 6 + Math.floor(Math.random() * 2))
        const exitTs = exitBase.toISOString().replace('T', ' ').substring(0, 19)
        insertLog.run(s.rfid_id, sid, 'exit', exitTs)
      }
    }

    // mark first two students as currently present
    db.prepare("UPDATE presence SET status = 'in', entered_at = datetime('now', '-2 hours') WHERE rfid_id IN ('RFID-001', 'RFID-002')").run()
  })

  insertAll()
}
