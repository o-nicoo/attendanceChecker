import { getDb } from '../../database/index'

export default defineEventHandler(() => {
  const db = getDb()

  const lessons = db.prepare(`
    SELECT
      l.lesson as id,
      l.start,
      l.end,
      COUNT(DISTINCT lw.rfID) as present_count
    FROM lesson l
    LEFT JOIN loggingW245 lw
      ON lw.in_out = 1
      AND CAST(STRFTIME('%s', lw.time) AS INTEGER) BETWEEN l.start AND l.end
    GROUP BY l.lesson
    ORDER BY l.start DESC
  `).all()

  return lessons
})
