import { getDb } from '../../database/index'

export default defineEventHandler(() => {
  const db = getDb()

  const dailyAttendance = db.prepare(`
    SELECT
      DATE(time) as date,
      SUM(CASE WHEN in_out = 1 THEN 1 ELSE 0 END) as entries,
      SUM(CASE WHEN in_out = 0 THEN 1 ELSE 0 END) as exits
    FROM loggingW245
    WHERE time >= DATE('now', '-14 days')
    GROUP BY DATE(time)
    ORDER BY date ASC
  `).all()

  const hourlyDistribution = db.prepare(`
    SELECT
      CAST(STRFTIME('%H', time) AS INTEGER) as hour,
      COUNT(*) as count
    FROM loggingW245
    WHERE in_out = 1 AND time >= DATE('now', '-30 days')
    GROUP BY hour
    ORDER BY hour ASC
  `).all()

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM schueler) as total_students,
      (SELECT COUNT(DISTINCT rfID) FROM loggingW245
        WHERE in_out = 1
        AND DATE(time) = DATE('now')
        AND rfID NOT IN (
          SELECT rfID FROM loggingW245 l2
          WHERE l2.rfID = loggingW245.rfID
          AND l2.time > loggingW245.time
          AND in_out = 0
        )
      ) as currently_present,
      (SELECT COUNT(*) FROM loggingW245 WHERE in_out = 1 AND DATE(time) = DATE('now')) as entries_today,
      (SELECT COUNT(*) FROM loggingW245) as total_scans
  `).get()

  const perStudent = db.prepare(`
    SELECT
      s.vorname || ' ' || s.nachname AS name,
      s.klasse AS class,
      COUNT(CASE WHEN lw.in_out = 1 THEN 1 END) AS total_entries,
      MAX(lw.time) AS last_seen
    FROM schueler s
    LEFT JOIN loggingW245 lw ON lw.rfID = s.id
    GROUP BY s.id
    ORDER BY total_entries DESC
  `).all()

  return { dailyAttendance, hourlyDistribution, stats, perStudent }
})
