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
    where += ' AND DATE(l.timestamp) = ?'
    params.push(date)
  }
  if (rfid) {
    where += ' AND l.rfid_id = ?'
    params.push(rfid)
  }

  const logs = db.prepare(`
    SELECT
      l.id,
      l.rfid_id,
      l.event_type,
      l.timestamp,
      s.name  AS student_name,
      s.class AS student_class
    FROM attendance_logs l
    LEFT JOIN students s ON l.student_id = s.id
    ${where}
    ORDER BY l.timestamp DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  const total = (db.prepare(`
    SELECT COUNT(*) as c FROM attendance_logs l ${where}
  `).get(...params) as { c: number }).c

  return { logs, total, limit, offset }
})
