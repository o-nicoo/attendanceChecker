import { getDb } from '../../database/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, rfid_id, class: studentClass } = body

  if (!name || !rfid_id) {
    throw createError({ statusCode: 400, statusMessage: 'name and rfid_id are required' })
  }

  const db = getDb()

  const existing = db.prepare('SELECT id FROM students WHERE rfid_id = ?').get(rfid_id)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'RFID ID already registered' })
  }

  const result = db.prepare(
    'INSERT INTO students (name, rfid_id, class) VALUES (?, ?, ?)'
  ).run(name.trim(), rfid_id.trim().toUpperCase(), (studentClass || '').trim())

  db.prepare(
    'INSERT OR IGNORE INTO presence (rfid_id, student_id, status) VALUES (?, ?, ?)'
  ).run(rfid_id.trim().toUpperCase(), result.lastInsertRowid, 'out')

  return { id: result.lastInsertRowid, name, rfid_id, class: studentClass }
})
