export const resourceController = (service) => ({
  list: async (req, res, next) => { try { res.json(await service.list(req.query)) } catch (e) { next(e) } },
  find: async (req, res, next) => { try { res.json({ data: await service.find(req.params.id) }) } catch (e) { next(e) } },
  create: async (req, res, next) => {
  try {
    console.log('CREATE RESOURCE:', req.params, req.body);

    res.status(201).json({
      data: await service.create(req.body)
    });
  } catch (e) {
    next(e);
  }
},
  update: async (req, res, next) => { try { res.json({ data: await service.update(req.params.id, req.body) }) } catch (e) { next(e) } },
  remove: async (req, res, next) => { try { await service.remove(req.params.id); res.status(204).end() } catch (e) { next(e) } },
})