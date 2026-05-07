import { getDb } from '../../database/index'

export default defineEventHandler(() => {
  const db = getDb()

  const classes = db.prepare(`
    SELECT
      s.klasse                                          AS class,
      COUNT(DISTINCT s.id)                              AS total_students,
      SUM(CASE WHEN (
        SELECT in_out FROM loggingW245
        WHERE rfID = s.id ORDER BY time DESC LIMIT 1
      ) = 1 THEN 1 ELSE 0 END)                         AS present_now,
      COUNT(DISTINCT CASE WHEN lw.in_out = 1 AND DATE(lw.time) = DATE('now') THEN s.id END) AS present_today,
      ROUND(
        CAST(COUNT(DISTINCT CASE WHEN lw.in_out = 1 THEN DATE(lw.time) || s.id END) AS FLOAT) /
        NULLIF(COUNT(DISTINCT s.id) * 30.0, 0) * 100, 0
      )                                                 AS attendance_rate_30d
    FROM schueler s
    LEFT JOIN loggingW245 lw
      ON lw.rfID = s.id
      AND lw.time >= DATE('now', '-30 days')
    WHERE s.klasse IS NOT NULL AND s.klasse != ''
    GROUP BY s.klasse
    ORDER BY s.klasse
  `).all()

  const studentsPerClass = db.prepare(`
    SELECT
      s.id,
      s.vorname || ' ' || s.nachname AS name,
      s.klasse                        AS class,
      CASE WHEN (
        SELECT in_out FROM loggingW245 WHERE rfID = s.id ORDER BY time DESC LIMIT 1
      ) = 1 THEN 'in' ELSE 'out' END  AS status,
      (SELECT time FROM loggingW245 WHERE rfID = s.id AND in_out = 1 ORDER BY time DESC LIMIT 1) AS entered_at,
      (SELECT time FROM loggingW245 WHERE rfID = s.id ORDER BY time DESC LIMIT 1) AS last_seen
    FROM schueler s
    WHERE s.klasse IS NOT NULL AND s.klasse != ''
    ORDER BY s.klasse, s.nachname
  `).all()

  return { classes, students: studentsPerClass }
})
