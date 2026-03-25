import { getDb } from '../../database/index'

export default defineEventHandler(() => {
  const db = getDb()

  const present = db.prepare(`
    SELECT
      p.rfid_id,
      p.status,
      p.entered_at,
      p.last_seen,
      s.name,
      s.class
    FROM presence p
    LEFT JOIN students s ON p.student_id = s.id
    WHERE p.status = 'in'
    ORDER BY p.entered_at DESC
  `).all()

  const total = (db.prepare('SELECT COUNT(*) as c FROM students').get() as { c: number }).c

  return { present, count: present.length, total }
})
