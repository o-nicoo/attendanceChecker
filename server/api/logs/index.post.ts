/**
 * POST /api/logs
 * Called by the Raspberry Pi when an RFID chip is detected.
 *
 * Body:
 *   rfid_id   string  — the RFID chip ID (numeric card ID)
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

  // look up student (rfid_id matches schueler.id)
  const student = db.prepare(
    'SELECT * FROM schueler WHERE id = ?'
  ).get(String(rfid_id)) as any

  // determine current presence from last log entry
  const lastLog = db.prepare(
    'SELECT in_out FROM loggingW245 WHERE rfID = ? ORDER BY time DESC LIMIT 1'
  ).get(String(rfid_id)) as { in_out: number } | undefined

  const currentlyIn = lastLog?.in_out === 1

  let inOut: number
  if (direction === 'enter') {
    inOut = 1
  } else if (direction === 'exit') {
    inOut = 0
  } else {
    inOut = currentlyIn ? 0 : 1
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  db.prepare('INSERT INTO loggingW245 (time, rfID, in_out) VALUES (?, ?, ?)').run(
    now, String(rfid_id), inOut
  )

  const eventType = inOut === 1 ? 'enter' : 'exit'
  const newStatus = inOut === 1 ? 'in' : 'out'

  return {
    rfid_id,
    event_type: eventType,
    student: student
      ? { id: student.id, name: `${student.vorname} ${student.nachname}`, class: student.klasse }
      : null,
    status: newStatus,
  }
})
