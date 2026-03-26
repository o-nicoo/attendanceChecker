import { getDb } from '../../database/index'

export default defineEventHandler(() => {
  const db = getDb()

  // daily attendance for the last 14 days
  const dailyAttendance = db.prepare(`
    SELECT
      DATE(time) AS date,
      COUNT(DISTINCT rfID) FILTER (WHERE in_out = 1) AS entries,
      COUNT(DISTINCT rfID) FILTER (WHERE in_out = 0) AS exits
    FROM loggingW245
    WHERE time >= DATE('now', '-13 days')
    GROUP BY DATE(time)
    ORDER BY date ASC
  `).all()

  // hourly distribution (all time, entries only)
  const hourlyDistribution = db.prepare(`
    SELECT
      CAST(strftime('%H', time) AS INTEGER) AS hour,
      COUNT(*) AS count
    FROM loggingW245
    WHERE in_out = 1
    GROUP BY hour
    ORDER BY hour ASC
  `).all()

  // per-student attendance count
  const perStudent = db.prepare(`
    SELECT
      s.vorname || ' ' || s.nachname AS name,
      s.klasse                       AS class,
      COUNT(l.id) FILTER (WHERE l.in_out = 1) AS total_entries,
      MAX(l.time)                    AS last_seen
    FROM schueler s
    LEFT JOIN loggingW245 l ON l.rfID = CAST(s.id AS TEXT)
    GROUP BY s.id
    ORDER BY total_entries DESC
  `).all()

  // class attendance today
  const classToday = db.prepare(`
    SELECT
      s.klasse AS class,
      COUNT(DISTINCT l.rfID) AS present
    FROM loggingW245 l
    JOIN schueler s ON s.id = CAST(l.rfID AS INTEGER)
    WHERE DATE(l.time) = DATE('now')
      AND l.in_out = 1
    GROUP BY s.klasse
    ORDER BY s.klasse
  `).all()

  // currently present: students whose last log is 'enter'
  const currentlyPresent = (db.prepare(`
    SELECT COUNT(*) as c
    FROM schueler s
    WHERE (
      SELECT in_out FROM loggingW245
      WHERE rfID = CAST(s.id AS TEXT)
      ORDER BY time DESC
      LIMIT 1
    ) = 1
  `).get() as { c: number }).c

  const stats = {
    total_students: (db.prepare('SELECT COUNT(*) as c FROM schueler').get() as { c: number }).c,
    currently_present: currentlyPresent,
    entries_today: (db.prepare(`
      SELECT COUNT(*) as c FROM loggingW245
      WHERE DATE(time) = DATE('now') AND in_out = 1
    `).get() as { c: number }).c,
    total_scans: (db.prepare('SELECT COUNT(*) as c FROM loggingW245').get() as { c: number }).c,
  }

  return { dailyAttendance, hourlyDistribution, perStudent, classToday, stats }
})
