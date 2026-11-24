import { ResourceRepository } from '../repositories/resourceRepository.js'

export class ResourceService {
  constructor(config) { this.repository = new ResourceRepository(config) }
  list(query) { return this.repository.list({ search: query.search?.trim(), status: query.status, page: Math.max(1, Number(query.page) || 1), limit: Math.min(100, Math.max(1, Number(query.limit) || 20)) }) }
  find(id) { return this.repository.find(id) }
  create(payload) { this.validate(payload); return this.repository.create(payload) }
  update(id, payload) { this.validate(payload); return this.repository.update(id, payload) }
  remove(id) { return this.repository.remove(id) }
  validate(payload) { if (!payload || !Object.keys(payload).length) throw Object.assign(new Error('Request body is required'), { status: 400 }) }
}