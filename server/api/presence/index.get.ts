import { getDb } from '../../database/index'

export default defineEventHandler(() => {
  const db = getDb()

  // Students whose most recent log entry is 'enter' (in_out = 1)
  const present = db.prepare(`
    SELECT
      CAST(s.id AS TEXT)             AS rfid_id,
      'in'                           AS status,
      l.time                         AS entered_at,
      l.time                         AS last_seen,
      s.vorname || ' ' || s.nachname AS name,
      s.klasse                       AS class
    FROM schueler s
    JOIN loggingW245 l ON l.id = (
      SELECT id FROM loggingW245
      WHERE rfID = CAST(s.id AS TEXT)
      ORDER BY time DESC
      LIMIT 1
    )
    WHERE l.in_out = 1
    ORDER BY l.time DESC
  `).all()

  const total = (db.prepare('SELECT COUNT(*) as c FROM schueler').get() as { c: number }).c

  return { present, count: present.length, total }
})
