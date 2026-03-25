import { getDb } from '../../database/index'

export default defineEventHandler(() => {
  const db = getDb()

  // daily attendance for the last 14 days
  const dailyAttendance = db.prepare(`
    SELECT
      DATE(timestamp) AS date,
      COUNT(DISTINCT rfid_id) FILTER (WHERE event_type = 'enter') AS entries,
      COUNT(DISTINCT rfid_id) FILTER (WHERE event_type = 'exit')  AS exits
    FROM attendance_logs
    WHERE timestamp >= DATE('now', '-13 days')
    GROUP BY DATE(timestamp)
    ORDER BY date ASC
  `).all()

  // hourly distribution (all time)
  const hourlyDistribution = db.prepare(`
    SELECT
      CAST(strftime('%H', timestamp) AS INTEGER) AS hour,
      COUNT(*) AS count
    FROM attendance_logs
    WHERE event_type = 'enter'
    GROUP BY hour
    ORDER BY hour ASC
  `).all()

  // per-student attendance count
  const perStudent = db.prepare(`
    SELECT
      s.name,
      s.class,
      COUNT(l.id) FILTER (WHERE l.event_type = 'enter') AS total_entries,
      MAX(l.timestamp) AS last_seen
    FROM students s
    LEFT JOIN attendance_logs l ON s.rfid_id = l.rfid_id
    GROUP BY s.id
    ORDER BY total_entries DESC
  `).all()

  // class attendance today
  const classToday = db.prepare(`
    SELECT
      s.class,
      COUNT(DISTINCT l.rfid_id) AS present
    FROM attendance_logs l
    JOIN students s ON l.rfid_id = s.rfid_id
    WHERE DATE(l.timestamp) = DATE('now')
      AND l.event_type = 'enter'
    GROUP BY s.class
    ORDER BY s.class
  `).all()

  // total stats
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM students)                                AS total_students,
      (SELECT COUNT(*) FROM presence WHERE status = 'in')           AS currently_present,
      (SELECT COUNT(*) FROM attendance_logs WHERE DATE(timestamp) = DATE('now')
        AND event_type = 'enter')                                    AS entries_today,
      (SELECT COUNT(*) FROM attendance_logs)                         AS total_scans
  `).get()

  return { dailyAttendance, hourlyDistribution, perStudent, classToday, stats }
})
