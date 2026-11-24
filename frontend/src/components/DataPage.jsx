
import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Trash2,
  X,
  Pencil,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { api } from '../lib/api'

export default function DataPage({ title, resource, fields, dateField }) {
  const [rows, setRows] = useState([])
  const [lookups, setLookups] = useState({})
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('desc')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedStatus, setAppliedStatus] = useState('')
  const [appliedSort, setAppliedSort] = useState('desc')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  const isEvent = resource === 'events'
  const filterKey = isEvent ? 'status' : 'achievement_type'
  const filterLabel = isEvent ? 'Status' : 'Achievement type'

  const filterOptions = isEvent
    ? ['Scheduled', 'Completed', 'Cancelled']
    : ['Individual', 'Team', 'Club']

  // Load records
  const load = async () => {
    setLoading(true)

    try {
      const response = await api(`/${resource}?limit=100`)
      setRows(response.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [resource])

  // Load lookup data
  useEffect(() => {
    const resources = [
      ...new Set(
        fields
          .filter((f) => f.optionsResource)
          .map((f) => f.optionsResource)
      ),
    ]

    resources.forEach((path) => {
      api(`/${path}?limit=100`)
        .then((r) =>
          setLookups((v) => ({
            ...v,
            [path]: r.data,
          }))
        )
        .catch((e) => setError(e.message))
    })
  }, [resource])

  // Display field value
  const display = (row, field) => {
    if (field.optionsResource) {
      return (
        lookups[field.optionsResource]?.find(
          (x) => x.id === row[field.key]
        )?.[field.optionLabel || 'full_name'] || '—'
      )
    }

    return row[field.key] ?? '—'
  }

  // Apply all filters and sorting
  const filteredRows = useMemo(() => {
    let result = [...rows]

    // Search
    if (appliedSearch.trim()) {
      const keyword = appliedSearch.toLowerCase()

      result = result.filter((row) => {
        const searchableValues = fields.map((field) =>
          String(display(row, field)).toLowerCase()
        )

        return searchableValues.some((value) =>
          value.includes(keyword)
        )
      })
    }

    // Status or achievement type
    if (appliedStatus) {
      result = result.filter(
        (row) => row[filterKey] === appliedStatus
      )
    }

    // Date range
    result = result.filter((row) => {
      const value = row[dateField]

      if (!value) return false

      const recordDate = String(value).slice(0, 10)

      if (appliedStartDate && recordDate < appliedStartDate) {
        return false
      }

      if (appliedEndDate && recordDate > appliedEndDate) {
        return false
      }

      return true
    })

    // Sorting
    result.sort((a, b) => {
      const dateA = String(a[dateField] || '')
      const dateB = String(b[dateField] || '')

      return appliedSort === 'asc'
        ? dateA.localeCompare(dateB)
        : dateB.localeCompare(dateA)
    })

    return result
  }, [
    rows,
    fields,
    lookups,
    appliedSearch,
    appliedStatus,
    appliedSort,
    appliedStartDate,
    appliedEndDate,
    filterKey,
    dateField,
  ])

  // Apply button
  const applyFilters = () => {
    if (startDate && endDate && startDate > endDate) {
      setError('Start date cannot be later than end date.')
      return
    }

    setError('')
    setAppliedSearch(search)
    setAppliedStatus(status)
    setAppliedSort(sort)
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
  }

  // Reset filters
  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setSort('desc')
    setStartDate('')
    setEndDate('')

    setAppliedSearch('')
    setAppliedStatus('')
    setAppliedSort('desc')
    setAppliedStartDate('')
    setAppliedEndDate('')
    setError('')
  }

  // Download Excel
  const downloadExcel = () => {
    if (!filteredRows.length) {
      setError('No records available to export.')
      return
    }

    const excelData = filteredRows.map((row) => {
      const result = {}

      fields.forEach((field) => {
        result[field.label] = display(row, field)
      })

      return result
    })

    const worksheet = XLSX.utils.json_to_sheet(excelData)

    worksheet['!cols'] = fields.map((field) => ({
      wch: Math.max(field.label.length + 5, 18),
    }))

    worksheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: excelData.length, c: fields.length - 1 },
      }),
    }

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      isEvent ? 'Events' : 'Achievements'
    )

    const filename = `${resource}_${appliedStartDate || 'All'}_to_${appliedEndDate || 'All'}.xlsx`

    XLSX.writeFile(workbook, filename)
  }

  // Save record
  const save = async (e) => {
    e.preventDefault()

    const values = Object.fromEntries(
      new FormData(e.currentTarget)
    )

    try {
      await api(
        `/${resource}${editing?.id ? '/' + editing.id : ''}`,
        {
          method: editing?.id ? 'PATCH' : 'POST',
          body: JSON.stringify(values),
        }
      )

      setEditing(null)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  // Delete record
  const remove = async (id) => {
    if (!confirm('Delete this record?')) return

    try {
      await api(`/${resource}/${id}`, {
        method: 'DELETE',
      })

      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <section className="page">
      <header>
        <div>
          <p className="eyebrow">Club administration</p>
          <h1>{title}</h1>
        </div>

        <button
          className="primary"
          onClick={() => setEditing({})}
        >
          <Plus /> Add record
        </button>
      </header>

      {/* Main Filters - Same style as Contracts */}
      <div className="toolbar contract-filters club-filters">
        <label>
          <Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder={
              isEvent
                ? 'Search club events'
                : 'Search achievements'
            }
          />
        </label>

        <select
          aria-label={`Filter by ${filterLabel}`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">
            All {isEvent ? 'statuses' : 'types'}
          </option>

          {filterOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          aria-label="Sort by date"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="desc">Ascend</option>
          <option value="asc">Descend</option>
        </select>

        <button onClick={applyFilters}>Apply</button>
      </div>

      {/* Date Filter and Excel Export */}
      <div className="toolbar contract-filters club-date-filters">
        <label>
          <span>Start Date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          <span>End Date</span>
          <input
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>


        <button
          type="button"
          onClick={resetFilters}
        >
          <RotateCcw size={16} />
          Reset
        </button>

        <button
          type="button"
          onClick={downloadExcel}
          disabled={!filteredRows.length || loading}
        >
          <FileSpreadsheet size={17} />
          Download Excel ({filteredRows.length})
        </button>
      </div>

      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={() => setError('')}>
            <X />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {fields.slice(0, 4).map((f) => (
                <th key={f.key}>{f.label}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              filteredRows.map((row) => (
                <tr key={row.id}>
                  {fields.slice(0, 4).map((f) => (
                    <td key={f.key}>{display(row, f)}</td>
                  ))}

                  <td className="actions">
                    <button
                      title="Edit"
                      onClick={() => setEditing(row)}
                    >
                      <Pencil />
                    </button>

                    <button
                      title="Delete"
                      onClick={() => remove(row.id)}
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {loading && (
          <div className="state">Loading records...</div>
        )}

        {!loading && !filteredRows.length && (
          <div className="state">No records found.</div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {editing && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={save}>
            <header>
              <h2>{editing.id ? 'Edit' : 'Add'} record</h2>

              <button
                type="button"
                onClick={() => setEditing(null)}
              >
                <X />
              </button>
            </header>

            <div className="form-grid">
              {fields.map((f) => (
                <label key={f.key}>
                  <span>{f.label}</span>

                  {f.optionsResource ? (
                    <select
                      name={f.key}
                      defaultValue={editing[f.key] || ''}
                      required={f.required}
                    >
                      <option value="">Select...</option>

                      {lookups[f.optionsResource]?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item[f.optionLabel || 'full_name']}
                        </option>
                      ))}
                    </select>
                  ) : f.options ? (
                    <select
                      name={f.key}
                      defaultValue={editing[f.key] || ''}
                      required={f.required}
                    >
                      <option value="">Select...</option>

                      {f.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={f.key}
                      type={f.type || 'text'}
                      step={f.step}
                      defaultValue={editing[f.key] || ''}
                      required={f.required}
                    />
                  )}
                </label>
              ))}
            </div>

            <footer>
              <button
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>

              <button className="primary">
                Save record
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  )
}
