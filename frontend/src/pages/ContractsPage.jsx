import { useEffect, useMemo, useState } from 'react'
import { History, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { api } from '../lib/api'

const statuses = ['Draft', 'Pending', 'Active', 'Expired', 'Terminated']
const emptyContract = { status: 'Draft' }

export default function ContractsPage() {
  const [rows, setRows] = useState([])
  const [people, setPeople] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState(null)
  const [renewing, setRenewing] = useState(null)
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const peopleById = useMemo(() => Object.fromEntries(people.map((person) => [person.id, person.full_name])), [people])
  const load = async () => {
    setLoading(true)
    try {
      const response = await api(`/contracts?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&limit=100`)
      setRows(response.data)
    } catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(); api('/people?limit=100').then((response) => setPeople(response.data)).catch((requestError) => setError(requestError.message)) }, [])

  const save = async (event) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    try {
      await api(`/contracts${editing.id ? `/${editing.id}` : ''}`, { method: editing.id ? 'PATCH' : 'POST', body: JSON.stringify(values) })
      setEditing(null)
      await load()
    } catch (requestError) { setError(requestError.message) }
  }

  const renew = async (event) => {
    event.preventDefault()
    try {
      await api(`/contracts/${renewing.id}/renew`, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) })
      setRenewing(null)
      await load()
    } catch (requestError) { setError(requestError.message) }
  }

  const showHistory = async (contract) => {
    try { setHistory({ contract, entries: (await api(`/contracts/${contract.id}/history`)).data }) }
    catch (requestError) { setError(requestError.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this contract and its audit history?')) return
    try { await api(`/contracts/${id}`, { method: 'DELETE' }); await load() }
    catch (requestError) { setError(requestError.message) }
  }

  return <section className="page"><header><div><p className="eyebrow">Employment records</p><h1>Contracts</h1></div><button className="primary" onClick={() => setEditing({ ...emptyContract })}><Plus />New contract</button></header><div className="toolbar contract-filters"><label><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && load()} placeholder="Contract number or type" /></label><select aria-label="Filter contracts by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button onClick={load}>Apply</button></div>{error && <div className="error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X aria-hidden="true" /></button></div>}<div className="table-wrap"><table><thead><tr><th>Personnel</th><th>Contract</th><th>Type</th><th>End date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{peopleById[row.person_id] || 'Unknown personnel'}</td><td><strong>{row.contract_number}</strong><small className="cell-note">{money(row.base_salary)}</small></td><td>{row.contract_type}</td><td>{date(row.end_date)}</td><td><span className={`status status-${row.status.toLowerCase()}`}>{row.status}</span></td><td className="actions"><button aria-label={`View history for ${row.contract_number}`} onClick={() => showHistory(row)}><History aria-hidden="true" /></button><button aria-label={`Renew ${row.contract_number}`} onClick={() => setRenewing(row)}><RefreshCw aria-hidden="true" /></button><button aria-label={`Edit ${row.contract_number}`} onClick={() => setEditing(row)}><Pencil aria-hidden="true" /></button><button aria-label={`Delete ${row.contract_number}`} onClick={() => remove(row.id)}><Trash2 aria-hidden="true" /></button></td></tr>)}</tbody></table>{loading && <div className="state">Loading contracts...</div>}{!loading && !rows.length && <div className="state">No contracts found.</div>}</div>{editing && <ContractModal title={editing.id ? 'Edit contract' : 'New contract'} value={editing} people={people} onClose={() => setEditing(null)} onSubmit={save} />}{renewing && <ContractModal title={`Renew ${renewing.contract_number}`} value={{ ...renewing, id: undefined, contract_number: '', start_date: '', end_date: '', status: 'Draft', notes: `Renewal of ${renewing.contract_number}` }} people={people} onClose={() => setRenewing(null)} onSubmit={renew} renewal />}{history && <HistoryDrawer value={history} onClose={() => setHistory(null)} />}</section>
}

function ContractModal({ title, value, people, onClose, onSubmit, renewal = false }) {
  return <div className="modal-backdrop"><form className="modal" onSubmit={onSubmit}><header><h2>{title}</h2><button type="button" aria-label="Close contract form" onClick={onClose}><X aria-hidden="true" /></button></header><div className="form-grid"><label><span>Personnel</span><select name="person_id" defaultValue={value.person_id || ''} required disabled={renewal}><option value="">Select...</option>{people.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select>{renewal && <input type="hidden" name="person_id" value={value.person_id} />}</label><Field name="contract_number" label="Contract number" value={value.contract_number} required /><Field name="contract_type" label="Contract type" value={value.contract_type} required /><Field name="start_date" label="Start date" type="date" value={value.start_date} required /><Field name="end_date" label="End date" type="date" value={value.end_date} required /><Field name="base_salary" label="Base salary" type="number" min="0" step="0.01" value={value.base_salary} required /><label><span>Status</span><select name="status" defaultValue={value.status || 'Draft'} required>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><label className="wide"><span>Change note</span><textarea name="notes" defaultValue={value.notes || ''} rows="3" placeholder="Reason for this change" /></label></div><footer><button type="button" onClick={onClose}>Cancel</button><button className="primary">{renewal ? 'Create renewal' : 'Save contract'}</button></footer></form></div>
}

function HistoryDrawer({ value, onClose }) {
  return <aside className="detail-drawer" aria-label={`History for ${value.contract.contract_number}`}><header><div><p className="eyebrow">Contract history</p><h2>{value.contract.contract_number}</h2></div><button aria-label="Close contract history" onClick={onClose}><X aria-hidden="true" /></button></header>{value.entries.length ? <ol className="history-list">{value.entries.map((entry) => <li key={entry.id}><div><strong>{entry.action_type}</strong><time>{new Date(entry.changed_at).toLocaleString()}</time></div>{entry.notes && <p>{entry.notes}</p>}</li>)}</ol> : <div className="state">No history entries found.</div>}</aside>
}

function Field({ label, value, ...props }) { return <label><span>{label}</span><input {...props} defaultValue={value || ''} /></label> }
const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value) || 0)
const date = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—'