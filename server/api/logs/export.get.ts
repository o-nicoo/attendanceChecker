import { getDb } from '../../database/index'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const date  = query.date as string | undefined
  const rfid  = query.rfid as string | undefined

  const db = getDb()

  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (date) { where += ' AND DATE(l.time) = ?'; params.push(date) }
  if (rfid) { where += ' AND l.rfID = ?';       params.push(rfid) }

  const logs = db.prepare(`
    SELECT
      l.time        AS Zeitstempel,
      COALESCE(s.vorname || ' ' || s.nachname, '—') AS Schueler,
      COALESCE(s.klasse, '—')                        AS Klasse,
      l.rfID                                          AS RFID_ID,
      CASE WHEN l.in_out = 1 THEN 'Eintritt' ELSE 'Austritt' END AS Ereignis
    FROM loggingW245 l
    LEFT JOIN schueler s ON s.id = l.rfID
    ${where}
    ORDER BY l.time DESC
    LIMIT 10000
  `).all(...params) as Record<string, string>[]

  if (!logs.length) return new Response('', { status: 204 })

  const header = Object.keys(logs[0]).join(';')
  const rows   = logs.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
  const csv    = [header, ...rows].join('\n')

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="protokoll${date ? '-' + date : ''}.csv"`)
  return csv
})
