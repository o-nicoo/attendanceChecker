import { getDb } from '../../database/index'

export default defineEventHandler(() => {
  const db = getDb()

  const students = db.prepare(`
    SELECT
      s.id,
      s.name,
      s.rfid_id,
      s.class,
      s.created_at,
      p.status,
      p.entered_at,
      p.last_seen
    FROM students s
    LEFT JOIN presence p ON s.rfid_id = p.rfid_id
    ORDER BY s.class, s.name
  `).all()

  return students
})
