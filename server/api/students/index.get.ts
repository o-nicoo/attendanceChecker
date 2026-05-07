import { getDb } from '../../database/index'

export default defineEventHandler(() => {
  const db = getDb()

  const students = db.prepare(`
    SELECT
      s.id,
      s.vorname || ' ' || s.nachname                        AS name,
      s.id                                                  AS rfid_id,
      s.klasse                                              AS class,
      NULL                                                  AS created_at,
      CASE WHEN (
        SELECT in_out FROM loggingW245
        WHERE rfID = s.id
        ORDER BY time DESC LIMIT 1
      ) = 1 THEN 'in' ELSE 'out' END                        AS status,
      (
        SELECT time FROM loggingW245
        WHERE rfID = s.id AND in_out = 1
        ORDER BY time DESC LIMIT 1
      )                                                     AS entered_at,
      (
        SELECT time FROM loggingW245
        WHERE rfID = s.id
        ORDER BY time DESC LIMIT 1
      )                                                     AS last_seen
    FROM schueler s
    ORDER BY s.klasse, s.nachname
  `).all()

  return students
})
