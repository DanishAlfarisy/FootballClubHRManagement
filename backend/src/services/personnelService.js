import crypto from 'node:crypto'
import { requireDatabase } from '../config/supabase.js'

const personFields = ['full_name','date_of_birth','nationality','email','phone_number','address']
const splitPayload = (payload, type) => {
  const person = Object.fromEntries(personFields.filter((key) => payload[key] !== undefined).map((key) => [key, payload[key] || null]))
  const entityFields = type === 'players' ? ['jersey_number','primary_position_id','preferred_foot','height','weight','join_date','status'] : ['department_id','job_title','join_date','employment_status']
  return { person, entity: Object.fromEntries(entityFields.filter((key) => payload[key] !== undefined).map((key) => [key, payload[key] || null])) }
}

export class PersonnelService {
  constructor(type) { this.type = type; this.view = `${type === 'players' ? 'player' : 'staff'}_directory` }
  async list(query) {
    const page = Math.max(1, Number(query.page) || 1), limit = Math.min(100, Number(query.limit) || 20), from = (page - 1) * limit
    let q = requireDatabase().from(this.view).select('*', { count: 'exact' })
    if (query.search) q = q.or(`full_name.ilike.%${query.search}%,email.ilike.%${query.search}%`)
    if (query.status) q = q.eq(this.type === 'players' ? 'status' : 'employment_status', query.status)
    const { data, error, count } = await q.order('full_name').range(from, from + limit - 1)
    if (error) throw error
    return { data, meta: { page, limit, total: count } }
  }
  async find(id) {
  const db = requireDatabase()

  const { data, error } = await db
    .from(this.view)
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  // Ambil path foto dari tabel persons
  const { data: person, error: personError } = await db
    .from('persons')
    .select('photo_path')
    .eq('id', data.person_id)
    .single()

  if (personError) throw personError

  // Buat URL foto dari Supabase Storage
  if (person?.photo_path) {
    const { data: photo, error: photoError } = await db
      .storage
      .from('personnel-photos')
      .createSignedUrl(person.photo_path, 60 * 60)

    if (photoError) throw photoError

    data.photo_url = photo.signedUrl
  } else {
    data.photo_url = null
  }

  if (this.type === 'players') {
    const { data: positions, error: positionsError } = await db
      .from('player_positions')
      .select('position_id')
      .eq('player_id', id)

    if (positionsError) throw positionsError

    data.secondary_position_ids =
      positions?.map((item) => item.position_id) || []
  }

  return data
}
  async create(payload, file) {
    const db = requireDatabase(), { person, entity } = splitPayload(payload, this.type)
    if (!person.full_name || !entity.join_date) throw Object.assign(new Error('Full name and join date are required'), { status: 400 })
    let photoPath
    if (file) { photoPath = `${this.type}/${crypto.randomUUID()}.${file.mimetype.split('/')[1]}`; const upload = await db.storage.from('personnel-photos').upload(photoPath, file.buffer, { contentType: file.mimetype }); if (upload.error) throw upload.error; person.photo_path = photoPath }
    const createdPerson = await db.from('persons').insert(person).select().single()
    if (createdPerson.error) { if (photoPath) await db.storage.from('personnel-photos').remove([photoPath]); throw createdPerson.error }
    entity.person_id = createdPerson.data.id
    const created = await db.from(this.type).insert(entity).select().single()
    if (created.error) { await db.from('persons').delete().eq('id', createdPerson.data.id); if (photoPath) await db.storage.from('personnel-photos').remove([photoPath]); throw created.error }
    if (this.type === 'players' && payload.secondary_position_ids?.length) await db.from('player_positions').insert(payload.secondary_position_ids.map((position_id) => ({ player_id: created.data.id, position_id })))
    return this.find(created.data.id)
  }
  async update(id, payload, file) {
    const db = requireDatabase(), current = await this.find(id), { person, entity } = splitPayload(payload, this.type)
    if (file) { const path = `${this.type}/${crypto.randomUUID()}.${file.mimetype.split('/')[1]}`; const upload = await db.storage.from('personnel-photos').upload(path, file.buffer, { contentType: file.mimetype }); if (upload.error) throw upload.error; person.photo_path = path }
    if (Object.keys(person).length) { const result = await db.from('persons').update(person).eq('id', current.person_id); if (result.error) throw result.error }
    if (Object.keys(entity).length) { const result = await db.from(this.type).update(entity).eq('id', id); if (result.error) throw result.error }
    if (this.type === 'players' && payload.secondary_position_ids) { await db.from('player_positions').delete().eq('player_id', id); if (payload.secondary_position_ids.length) await db.from('player_positions').insert(payload.secondary_position_ids.map((position_id) => ({ player_id: id, position_id }))) }
    if (file && current.photo_path) await db.storage.from('personnel-photos').remove([current.photo_path])
    return this.find(id)
  }
  async remove(id) { const current = await this.find(id), db = requireDatabase(); const result = await db.from('persons').delete().eq('id', current.person_id); if (result.error) throw result.error; if (current.photo_path) await db.storage.from('personnel-photos').remove([current.photo_path]) }
}