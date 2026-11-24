import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { authenticate } from './middleware/auth.js'
import { resourceRoutes } from './routes/resources.js'
import { personnelRoutes } from './routes/personnel.js'
import { dashboardRoutes } from './routes/dashboard.js'
import { documentRoutes } from './routes/documents.js'
import { payrollRoutes } from './routes/payroll.js'
import { contractRoutes } from './routes/contracts.js'
import { errorHandler, notFound } from './middleware/errors.js'

export const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL?.split(',') || 'http://localhost:5173' }))
app.use(express.json({ limit: '2mb' }))
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: Boolean(process.env.SUPABASE_URL), timestamp: new Date().toISOString() }))
app.use('/api', authenticate, resourceRoutes)
app.use('/api', authenticate, contractRoutes)
app.use('/api', authenticate, personnelRoutes)
app.use('/api', authenticate, dashboardRoutes)
app.use('/api', authenticate, documentRoutes)
app.use('/api', authenticate, payrollRoutes)
app.use(notFound)
app.use(errorHandler)