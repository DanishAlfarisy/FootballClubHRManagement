import { requireDatabase } from '../config/supabase.js'

export class ResourceRepository {
  constructor(config) { this.config = config }
  async list({ search, status, page = 1, limit = 20 }) {
    const from = (page - 1) * limit
    let query = requireDatabase().from(this.config.table).select('*', { count: 'exact' })
    if (search) query = query.or(this.config.search.map((field) => `${field}.ilike.%${search}%`).join(','))
    if (status) query = query.eq('status', status)
    const { data, error, count } = await query.order(this.config.order, { ascending: this.config.order !== 'created_at' }).range(from, from + limit - 1)
    if (error) throw error
    return { data, meta: { page, limit, total: count } }
  }
  async find(id) { const { data, error } = await requireDatabase().from(this.config.table).select('*').eq('id', id).single(); if (error) throw error; return data }
  async create(payload) { const { data, error } = await requireDatabase().from(this.config.table).insert(payload).select().single(); if (error) throw error; return data }
  async update(id, payload) { const { data, error } = await requireDatabase().from(this.config.table).update(payload).eq('id', id).select().single(); if (error) throw error; return data }
  async remove(id) { const { error } = await requireDatabase().from(this.config.table).delete().eq('id', id); if (error) throw error }
}