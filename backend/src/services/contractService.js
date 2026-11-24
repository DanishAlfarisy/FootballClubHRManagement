import { requireDatabase } from '../config/supabase.js'

const statuses = ['Draft', 'Pending', 'Active', 'Expired', 'Terminated']
const fields = ['person_id', 'contract_number', 'contract_type', 'start_date', 'end_date', 'base_salary', 'status']

function clean(payload) {
  return Object.fromEntries(fields.filter((key) => payload[key] !== undefined).map((key) => [key, payload[key]]))
}

export function validateContract(payload, partial = false) {
  if (!partial) {
    for (const key of ['person_id', 'contract_number', 'contract_type', 'start_date', 'end_date', 'base_salary']) {
      if (payload[key] === undefined || payload[key] === '') throw Object.assign(new Error(`${key.replaceAll('_', ' ')} is required`), { status: 400 })
    }
  }
  if (payload.status && !statuses.includes(payload.status)) throw Object.assign(new Error('Invalid contract status'), { status: 400 })
  if (payload.start_date && payload.end_date && payload.end_date < payload.start_date) throw Object.assign(new Error('End date cannot be before start date'), { status: 400 })
  if (payload.base_salary !== undefined && Number(payload.base_salary) < 0) throw Object.assign(new Error('Base salary cannot be negative'), { status: 400 })
}

async function addHistory(db, contractId, actionType, previousValue, newValue, userId, notes = null) {
  const result = await db.from('contract_histories').insert({
    contract_id: contractId,
    action_type: actionType,
    previous_value: previousValue,
    new_value: newValue,
    notes,
    changed_by: userId === 'local-development' ? null : userId,
  })
  if (result.error) throw result.error
}

export class ContractService {
  async list(query) {
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
    const from = (page - 1) * limit
    let request = requireDatabase().from('contracts').select('*', { count: 'exact' })
    if (query.search) request = request.or(`contract_number.ilike.%${query.search.trim()}%,contract_type.ilike.%${query.search.trim()}%`)
    if (query.status) request = request.eq('status', query.status)
    const result = await request.order('end_date').range(from, from + limit - 1)
    if (result.error) throw result.error
    return { data: result.data, meta: { page, limit, total: result.count } }
  }

  async find(id) {
    const result = await requireDatabase().from('contracts').select('*').eq('id', id).single()
    if (result.error) throw result.error
    return result.data
  }

  async history(id) {
    await this.find(id)
    const result = await requireDatabase().from('contract_histories').select('*').eq('contract_id', id).order('changed_at', { ascending: false })
    if (result.error) throw result.error
    return result.data
  }

  async create(payload, userId) {
    const values = clean(payload)
    validateContract(values)
    values.status ||= 'Draft'
    const db = requireDatabase()
    const result = await db.from('contracts').insert(values).select().single()
    if (result.error) throw result.error
    await addHistory(db, result.data.id, 'Created', null, result.data, userId, payload.notes)
    return result.data
  }

  async update(id, payload, userId) {
    const previous = await this.find(id)
    const values = clean(payload)
    if (!Object.keys(values).length) throw Object.assign(new Error('Contract changes are required'), { status: 400 })
    validateContract({ ...previous, ...values }, true)
    const db = requireDatabase()
    const result = await db.from('contracts').update(values).eq('id', id).select().single()
    if (result.error) throw result.error
    const action = values.status && values.status !== previous.status ? `Status changed to ${values.status}` : 'Updated'
    await addHistory(db, id, action, previous, result.data, userId, payload.notes)
    return result.data
  }

  async renew(id, payload, userId) {
    const previous = await this.find(id)
    const values = clean({ ...previous, ...payload })
    delete values.id
    validateContract(values)
    if (values.contract_number === previous.contract_number) throw Object.assign(new Error('Renewal requires a new contract number'), { status: 400 })
    const db = requireDatabase()
    const created = await db.from('contracts').insert({ ...values, status: payload.status || 'Draft' }).select().single()
    if (created.error) throw created.error
    await addHistory(db, previous.id, 'Renewed', previous, created.data, userId, payload.notes || `Renewed as ${created.data.contract_number}`)
    await addHistory(db, created.data.id, 'Created by renewal', previous, created.data, userId, payload.notes || `Renewal of ${previous.contract_number}`)
    return created.data
  }

  async remove(id) {
    const result = await requireDatabase().from('contracts').delete().eq('id', id)
    if (result.error) throw result.error
  }
}