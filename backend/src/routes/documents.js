import crypto from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { requireDatabase } from '../config/supabase.js'

const allowed = ['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req,file,cb) => cb(null,allowed.includes(file.mimetype)) })
export const documentRoutes = Router()

export function parseDocumentMetadata(value) {
  let metadata
  try { metadata = JSON.parse(value || '{}') }
  catch { throw Object.assign(new Error('Document metadata must be valid JSON'), { status: 400 }) }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) || !['person_id', 'category_id', 'document_name'].every((key) => typeof metadata[key] === 'string' && metadata[key].trim())) {
    throw Object.assign(new Error('Person, category, and document name are required'), { status: 400 })
  }
  return { person_id: metadata.person_id.trim(), category_id: metadata.category_id.trim(), document_name: metadata.document_name.trim() }
}

async function removeUploadedFile(db, path) {
  try {
    const result = await db.storage.from('personnel-documents').remove([path])
    if (result.error) console.error('Document upload cleanup failed:', result.error)
  } catch (cleanupError) { console.error('Document upload cleanup failed:', cleanupError) }
}

documentRoutes.get('/documents', async (req,res,next) => { try { const db=requireDatabase(); let query=db.from('documents').select('*',{count:'exact'}).order('uploaded_at',{ascending:false}); if(req.query.search) query=query.ilike('document_name',`%${req.query.search}%`); const result=await query.limit(100); if(result.error) throw result.error; res.json({data:result.data,meta:{total:result.count}}) } catch(error){next(error)} })
documentRoutes.post('/documents/upload', upload.single('file'), async (req,res,next) => { let path, db; try { if(!req.file) throw Object.assign(new Error('A PDF, image, or DOCX file is required'),{status:400}); const metadata=parseDocumentMetadata(req.body.data); path=`${metadata.person_id}/${crypto.randomUUID()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_')}`; db=requireDatabase(); const stored=await db.storage.from('personnel-documents').upload(path,req.file.buffer,{contentType:req.file.mimetype}); if(stored.error) throw stored.error; const created=await db.from('documents').insert({...metadata,file_path:path,file_type:req.file.mimetype,file_size:req.file.size,uploaded_by:req.user.id==='local-development'?null:req.user.id}).select().single(); if(created.error) throw created.error; res.status(201).json({data:created.data}) } catch(error) { if(path && db) await removeUploadedFile(db,path); next(error) } })
documentRoutes.get('/documents/:id/download', async (req,res,next) => { try { const db=requireDatabase(); const record=await db.from('documents').select('file_path').eq('id',req.params.id).single(); if(record.error) throw record.error; const signed=await db.storage.from('personnel-documents').createSignedUrl(record.data.file_path,60); if(signed.error) throw signed.error; res.json({data:{url:signed.data.signedUrl,expiresIn:60}}) } catch(error){next(error)} })
documentRoutes.delete('/documents/:id', async (req,res,next) => { try { const db=requireDatabase(); const record=await db.from('documents').select('file_path').eq('id',req.params.id).single(); if(record.error) throw record.error; const removed=await db.from('documents').delete().eq('id',req.params.id); if(removed.error) throw removed.error; const storage=await db.storage.from('personnel-documents').remove([record.data.file_path]); if(storage.error) throw storage.error; res.status(204).end() } catch(error){next(error)} })