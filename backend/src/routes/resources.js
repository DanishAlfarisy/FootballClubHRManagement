import { Router } from 'express'
import { resources } from '../config/resources.js'
import { ResourceService } from '../services/resourceService.js'
import { resourceController } from '../controllers/resourceController.js'

export const resourceRoutes = Router()
for (const [path, config] of Object.entries(resources)) {
  const c = resourceController(new ResourceService(config))
  resourceRoutes.get(`/${path}`, c.list)
  resourceRoutes.get(`/${path}/:id`, c.find)
  if (!config.readOnly) {
    resourceRoutes.post(`/${path}`, c.create)
    resourceRoutes.patch(`/${path}/:id`, c.update)
    resourceRoutes.delete(`/${path}/:id`, c.remove)
  }
}