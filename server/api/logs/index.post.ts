/**
 * POST /api/logs
 * Called by the Raspberry Pi when an RFID chip is detected.
 *
 * Body:
 *   rfid_id   string  — the RFID chip ID
 *   direction string  — "enter" | "exit" (optional, defaults to toggle)
 *   secret    string  — optional shared secret (set via env SCAN_SECRET)
 */
import { getDb } from '../../database/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { rfid_id, direction, secret } = body

  if (!rfid_id) {
    throw createError({ statusCode: 400, statusMessage: 'rfid_id is required' })
  }

  const config = useRuntimeConfig()
  if (config.scanSecret && secret !== config.scanSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const db = getDb()

  // look up student
  const student = db.prepare('SELECT * FROM students WHERE rfid_id = ?').get(rfid_id) as any

  const currentPresence = db.prepare(
    'SELECT status FROM presence WHERE rfid_id = ?'
  ).get(rfid_id) as { status: string } | undefined

  // determine event type
  let eventType: 'enter' | 'exit'
  if (direction === 'enter' || direction === 'exit') {
    eventType = direction
  } else {
    // toggle
    eventType = currentPresence?.status === 'in' ? 'exit' : 'enter'
  }

  const newStatus = eventType === 'enter' ? 'in' : 'out'

  db.transaction(() => {
    // insert log
    db.prepare(`
      INSERT INTO attendance_logs (rfid_id, student_id, event_type)
      VALUES (?, ?, ?)
    `).run(rfid_id, student?.id ?? null, eventType)

    // update presence
    if (currentPresence) {
      db.prepare(`
        UPDATE presence
        SET status = ?, last_seen = CURRENT_TIMESTAMP,
            entered_at = CASE WHEN ? = 'in' THEN CURRENT_TIMESTAMP ELSE entered_at END
        WHERE rfid_id = ?
      `).run(newStatus, newStatus, rfid_id)
    } else {
      db.prepare(`
        INSERT INTO presence (rfid_id, student_id, status, entered_at, last_seen)
        VALUES (?, ?, ?, CASE WHEN ? = 'in' THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)
      `).run(rfid_id, student?.id ?? null, newStatus, newStatus)
    }
  })()

  return {
    rfid_id,
    event_type: eventType,
    student: student ? { id: student.id, name: student.name, class: student.class } : null,
    status: newStatus,
  }
})
