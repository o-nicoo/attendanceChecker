import { getDb } from '../../database/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { start, end } = body

  if (!start || !end) {
    throw createError({ statusCode: 400, statusMessage: 'start und end sind erforderlich' })
  }

  const startTs = Math.floor(new Date(start).getTime() / 1000)
  const endTs   = Math.floor(new Date(end).getTime() / 1000)

  if (endTs <= startTs) {
    throw createError({ statusCode: 400, statusMessage: 'Ende muss nach dem Start liegen' })
  }

  const db = getDb()
  const result = db.prepare('INSERT INTO lesson (start, end) VALUES (?, ?)').run(startTs, endTs)

  return { id: result.lastInsertRowid }
})
