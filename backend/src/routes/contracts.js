import { Router } from 'express'
import { ContractService } from '../services/contractService.js'

export const contractRoutes = Router()
const service = new ContractService()

contractRoutes.get('/contracts', async (req, res, next) => { try { res.json(await service.list(req.query)) } catch (error) { next(error) } })
contractRoutes.get('/contracts/:id/history', async (req, res, next) => { try { res.json({ data: await service.history(req.params.id) }) } catch (error) { next(error) } })
contractRoutes.get('/contracts/:id', async (req, res, next) => { try { res.json({ data: await service.find(req.params.id) }) } catch (error) { next(error) } })
contractRoutes.post('/contracts', async (req, res, next) => { try { res.status(201).json({ data: await service.create(req.body, req.user.id) }) } catch (error) { next(error) } })
contractRoutes.post('/contracts/:id/renew', async (req, res, next) => { try { res.status(201).json({ data: await service.renew(req.params.id, req.body, req.user.id) }) } catch (error) { next(error) } })
contractRoutes.patch('/contracts/:id', async (req, res, next) => { try { res.json({ data: await service.update(req.params.id, req.body, req.user.id) }) } catch (error) { next(error) } })
contractRoutes.delete('/contracts/:id', async (req, res, next) => { try { await service.remove(req.params.id); res.status(204).end() } catch (error) { next(error) } })