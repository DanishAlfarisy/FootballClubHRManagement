export function notFound(req, _res, next) { next(Object.assign(new Error(`Route not found: ${req.method} ${req.path}`), { status: 404 })) }
export function errorHandler(error, _req, res, _next) {
  const status = error.status || (error.code === 'LIMIT_FILE_SIZE' ? 413 : error.name === 'MulterError' ? 400 : 500)
  res.status(status).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 10 MB limit' : error.message || 'Internal server error', details: error.details })
}