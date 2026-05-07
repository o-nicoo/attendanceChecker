import { getDb } from '../../database/index'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const db = getDb()
  db.prepare('DELETE FROM lesson WHERE lesson = ?').run(id)
  return { ok: true }
})
