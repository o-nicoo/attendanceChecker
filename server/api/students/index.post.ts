import { getDb } from '../../database/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, rfid_id, class: studentClass } = body

  if (!name || !rfid_id) {
    throw createError({ statusCode: 400, statusMessage: 'name and rfid_id are required' })
  }

  const rfidNum = parseInt(String(rfid_id).trim(), 10)
  if (isNaN(rfidNum)) {
    throw createError({ statusCode: 400, statusMessage: 'rfid_id muss eine numerische RFID-Kartennummer sein' })
  }

  const db = getDb()

  const existing = db.prepare('SELECT id FROM schueler WHERE id = ?').get(rfidNum)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'RFID ID already registered' })
  }

  // split "Vorname Nachname"
  const parts = name.trim().split(' ')
  const vorname = parts[0]
  const nachname = parts.slice(1).join(' ') || ''

  db.prepare(
    'INSERT INTO schueler (id, vorname, nachname, klasse) VALUES (?, ?, ?, ?)'
  ).run(rfidNum, vorname, nachname, (studentClass || '').trim())

  return { id: rfidNum, name: name.trim(), rfid_id: String(rfidNum), class: studentClass }
})
