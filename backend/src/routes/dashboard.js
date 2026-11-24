import { Router } from 'express'
import { requireDatabase } from '../config/supabase.js'

export const dashboardRoutes = Router()
dashboardRoutes.get('/dashboard', async (_req,res,next) => { try {
  const db = requireDatabase(), today = new Date().toISOString().slice(0, 10), soon = new Date(Date.now() + 90*86400000).toISOString().slice(0, 10)
  const [players,staff,contracts,expiring,events] = await Promise.all([
    db.from('players').select('*',{count:'exact',head:true}), db.from('staff').select('*',{count:'exact',head:true}),
    db.from('contracts').select('*',{count:'exact',head:true}).eq('status','Active'), db.from('contracts').select('id,contract_number,end_date,person_id').eq('status','Active').gte('end_date',today).lte('end_date',soon),
    db.from('events').select('*').gte('event_date',new Date().toISOString()).order('event_date').limit(5)
  ])
  res.json({ data: { totalPlayers: players.count||0, totalStaff: staff.count||0, activeContracts: contracts.count||0, expiringContracts: expiring.data||[], upcomingEvents: events.data||[] } })
} catch(e) { next(e) } })