import { Router } from 'express'
import multer from 'multer'
import { PersonnelService } from '../services/personnelService.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_r, f, cb) => cb(null, ['image/jpeg','image/png','image/webp'].includes(f.mimetype)) })
export const personnelRoutes = Router()
for (const type of ['players','staff']) {
  const service = new PersonnelService(type)
  personnelRoutes.get(`/${type}`, async (req,res,next) => { try { res.json(await service.list(req.query)) } catch(e) { next(e) } })
  personnelRoutes.get(`/${type}/:id`, async (req,res,next) => { try { res.json({ data: await service.find(req.params.id) }) } catch(e) { next(e) } })
  personnelRoutes.post(`/${type}`, upload.single('photo'), async (req,res,next) => { try { res.status(201).json({ data: await service.create(JSON.parse(req.body.data || '{}'), req.file) }) } catch(e) { next(e) } })
  personnelRoutes.patch(`/${type}/:id`, upload.single('photo'), async (req,res,next) => { try { res.json({ data: await service.update(req.params.id, JSON.parse(req.body.data || '{}'), req.file) }) } catch(e) { next(e) } })
  personnelRoutes.delete(`/${type}/:id`, async (req,res,next) => { try { await service.remove(req.params.id); res.status(204).end() } catch(e) { next(e) } })
}