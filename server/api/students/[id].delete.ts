import { getDb } from '../../database/index'

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  const db = getDb()
  const result = db.prepare('DELETE FROM schueler WHERE id = ?').run(id)

  if (result.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Student not found' })
  }

  return { success: true }
})
