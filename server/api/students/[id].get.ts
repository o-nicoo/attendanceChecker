import { getDb } from '../../database/index'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = getDb()

  const student = db.prepare('SELECT * FROM schueler WHERE id = ?').get(id) as any
  if (!student) throw createError({ statusCode: 404, statusMessage: 'Schüler nicht gefunden' })

  const logs = db.prepare(`
    SELECT id, time, in_out,
      CASE WHEN in_out = 1 THEN 'enter' ELSE 'exit' END as event_type
    FROM loggingW245
    WHERE rfID = ?
    ORDER BY time DESC
    LIMIT 100
  `).all(id) as any[]

  const stats = db.prepare(`
    SELECT
      COUNT(CASE WHEN in_out = 1 THEN 1 END) as total_entries,
      COUNT(DISTINCT CASE WHEN in_out = 1 THEN DATE(time) END) as days_present,
      MAX(time) as last_seen,
      MIN(time) as first_seen
    FROM loggingW245 WHERE rfID = ?
  `).get(id) as any

  const heatmap = db.prepare(`
    SELECT DATE(time) as date, MAX(in_out) as was_present
    FROM loggingW245
    WHERE rfID = ? AND time >= DATE('now', '-91 days')
    GROUP BY DATE(time)
  `).all(id) as any[]

  return {
    student: {
      id: student.id,
      name: [student.vorname, student.nachname].filter(Boolean).join(' ') || '—',
      vorname: student.vorname,
      nachname: student.nachname,
      klasse: student.klasse,
    },
    stats,
    logs,
    heatmap,
  }
})
