import { getDb } from '../../database/index'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 200)
  const offset = Number(query.offset) || 0
  const date = query.date as string | undefined
  const rfid = query.rfid as string | undefined

  const db = getDb()

  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (date) {
    where += ' AND DATE(l.time) = ?'
    params.push(date)
  }
  if (rfid) {
    where += ' AND l.rfID = ?'
    params.push(rfid)
  }

  const logs = db.prepare(`
    SELECT
      l.id,
      l.rfID                                                AS rfid_id,
      CASE WHEN l.in_out = 1 THEN 'enter' ELSE 'exit' END  AS event_type,
      l.time                                                AS timestamp,
      s.vorname || ' ' || s.nachname                       AS student_name,
      s.klasse                                              AS student_class
    FROM loggingW245 l
    LEFT JOIN schueler s ON s.id = CAST(l.rfID AS INTEGER)
    ${where}
    ORDER BY l.time DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  const total = (db.prepare(`
    SELECT COUNT(*) as c FROM loggingW245 l ${where}
  `).get(...params) as { c: number }).c

  return { logs, total, limit, offset }
})
