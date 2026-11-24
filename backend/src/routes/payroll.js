import { Router } from 'express'
import { requireDatabase } from '../config/supabase.js'

export const payrollRoutes = Router()
const itemTypes = ['Base Salary', 'Bonus', 'Allowance', 'Deduction']
const payrollStatuses = ['Draft', 'Approved', 'Paid', 'Cancelled']

export function validatePayrollItem({ item_type, description, amount }) {
  const value = Number(amount)
  if (!itemTypes.includes(item_type) || typeof description !== 'string' || !description.trim() || amount === '' || amount === null || amount === undefined || !Number.isFinite(value) || value < 0) {
    throw Object.assign(new Error('Valid item type, description, and non-negative amount are required'), { status: 400 })
  }
  return { item_type, description: description.trim(), amount: value }
}

export function validatePayment({ payment_date, amount, payment_method, payment_status, reference_number }) {
  const value = Number(amount)
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(payment_date || '') ? new Date(`${payment_date}T00:00:00Z`) : null
  const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === payment_date
  if (!validDate || !Number.isFinite(value) || value <= 0 || typeof payment_method !== 'string' || !payment_method.trim() || typeof payment_status !== 'string' || !payment_status.trim()) {
    throw Object.assign(new Error('Valid payment date, positive amount, method, and status are required'), { status: 400 })
  }
  return { payment_date, amount: value, payment_method: payment_method.trim(), payment_status: payment_status.trim(), reference_number: reference_number?.trim() || null }
}

payrollRoutes.get('/payrolls', async (req, res, next) => { try {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
  const result = await requireDatabase().from('payrolls').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1)
  if (result.error) throw result.error
  res.json({ data: result.data, meta: { page, limit, total: result.count } })
} catch (error) { next(error) } })

payrollRoutes.post('/payrolls', async (req, res, next) => { try {
  const { person_id, payroll_period } = req.body
  if (typeof person_id !== 'string' || !person_id || typeof payroll_period !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(payroll_period)) throw Object.assign(new Error('Personnel and a valid YYYY-MM payroll period are required'), { status: 400 })
  const result = await requireDatabase().from('payrolls').insert({ person_id, payroll_period, total_earnings: 0, total_deductions: 0, status: 'Draft' }).select().single()
  if (result.error) throw result.error
  res.status(201).json({ data: result.data })
} catch (error) { next(error) } })

payrollRoutes.patch('/payrolls/:id', async (req, res, next) => { try {
  const { status } = req.body
  if (!payrollStatuses.includes(status)) throw Object.assign(new Error('Valid payroll status is required'), { status: 400 })
  const result = await requireDatabase().from('payrolls').update({ status }).eq('id', req.params.id).select().single()
  if (result.error) throw result.error
  res.json({ data: result.data })
} catch (error) { next(error) } })

async function recalculate(payrollId) {
  const db = requireDatabase()
  const result = await db.from('payroll_items').select('item_type,amount').eq('payroll_id', payrollId)
  if (result.error) throw result.error
  const total_earnings = result.data.filter((item) => item.item_type !== 'Deduction').reduce((sum, item) => sum + Number(item.amount), 0)
  const total_deductions = result.data.filter((item) => item.item_type === 'Deduction').reduce((sum, item) => sum + Number(item.amount), 0)
  const updated = await db.from('payrolls').update({ total_earnings, total_deductions }).eq('id', payrollId)
  if (updated.error) throw updated.error
}

payrollRoutes.get('/payrolls/:id/details', async (req,res,next) => { try { const db=requireDatabase(); const [payroll,items,payments]=await Promise.all([db.from('payrolls').select('*').eq('id',req.params.id).single(),db.from('payroll_items').select('*').eq('payroll_id',req.params.id).order('item_type'),db.from('payments').select('*').eq('payroll_id',req.params.id).order('payment_date',{ascending:false})]); if(payroll.error) throw payroll.error; if(items.error) throw items.error; if(payments.error) throw payments.error; res.json({data:{...payroll.data,items:items.data,payments:payments.data}}) } catch(error){next(error)} })
payrollRoutes.post('/payrolls/:id/items', async (req,res,next) => { try { const item=validatePayrollItem(req.body); const db=requireDatabase(); const result=await db.from('payroll_items').insert({payroll_id:req.params.id,...item}).select().single(); if(result.error) throw result.error; await recalculate(req.params.id); res.status(201).json({data:result.data}) } catch(error){next(error)} })
payrollRoutes.delete('/payrolls/:payrollId/items/:itemId', async (req,res,next) => { try { const result=await requireDatabase().from('payroll_items').delete().eq('id',req.params.itemId).eq('payroll_id',req.params.payrollId); if(result.error) throw result.error; await recalculate(req.params.payrollId); res.status(204).end() } catch(error){next(error)} })
payrollRoutes.post('/payrolls/:id/payments', async (req,res,next) => { try { const payment=validatePayment(req.body); const result=await requireDatabase().from('payments').insert({payroll_id:req.params.id,...payment}).select().single(); if(result.error) throw result.error; res.status(201).json({data:result.data}) } catch(error){next(error)} })