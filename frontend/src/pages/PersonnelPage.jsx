
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { api } from '../lib/api'
import PhotoCropModal from '../components/PhotoCropModal'

const playerStatuses = ['Active', 'Injured', 'Loaned', 'Inactive', 'Retired']
const staffStatuses = ['Active', 'On Leave', 'Inactive', 'Terminated']

const empty = {
  preferred_foot: 'Right',
  status: 'Active',
  employment_status: 'Active',
  secondary_position_ids: []
}

export default function PersonnelPage({ type }) {
  const isPlayer = type === 'players'
  const title = isPlayer ? 'Players' : 'Staff'
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [cropSource, setCropSource] = useState('')
  const [photo, setPhoto] = useState(null)

  // Fetch personnel data
  const { data: rows = [], isLoading: loading, error: personnelError } = useQuery({
    queryKey: ['personnel', type, appliedSearch],
    queryFn: async () => {
      const result = await api(`/${type}?search=${encodeURIComponent(appliedSearch)}`)
      return result.data
    }
  })

  // Fetch positions or departments
  const { data: references = [], error: referenceError } = useQuery({
    queryKey: ['personnel-references', type],
    queryFn: async () => {
      const endpoint = isPlayer ? '/positions?limit=100' : '/departments?limit=100'
      const result = await api(endpoint)
      return result.data
    }
  })

  // Photo preview
  const photoPreview = useMemo(() => photo ? URL.createObjectURL(photo) : '', [photo])

  useEffect(() => {
    setSearch('')
    setAppliedSearch('')
    setEditing(null)
    setPhoto(null)
    setCropSource('')
    setError('')
  }, [type])

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  // Create and update personnel
  const saveMutation = useMutation({
    mutationFn: async ({ values, photo, id }) => {
      const body = new FormData()
      body.append('data', JSON.stringify(values))
      if (photo) body.append('photo', photo, 'profile.jpg')

      return api(`/${type}${id ? `/${id}` : ''}`, {
        method: id ? 'PATCH' : 'POST',
        body
      })
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
    queryKey: ['personnel', type]
  })

  queryClient.invalidateQueries({
    queryKey: ['personnel-detail', type]
  })
      setEditing(null)
      setPhoto(null)
      setError('')
    },
    onError: (e) => setError(e.message || 'Failed to save personnel.')
  })

  // Delete personnel
  const deleteMutation = useMutation({
    mutationFn: async (id) => api(`/${type}/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['personnel', type] })
    },
    onError: (e) => setError(e.message || 'Failed to delete personnel.')
  })

  // Open edit modal
  const openEdit = async (row) => {
    try {
      setError('')
      const result = await api(`/${type}/${row.id}`)
      setEditing(result.data)
      setPhoto(null)
    } catch (e) {
      setError(e.message)
    }
  }

  // Choose profile photo
  const choosePhoto = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be 5 MB or smaller.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => setCropSource(reader.result)
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  // Save personnel
  const save = async (event) => {
    event.preventDefault()
    if (saveMutation.isPending || !editing) return

    setError('')
    const form = new FormData(event.currentTarget)
    const values = Object.fromEntries(form)

    if (isPlayer) values.secondary_position_ids = form.getAll('secondary_position_ids')

    try {
      await saveMutation.mutateAsync({
        values,
        photo,
        id: editing.id
      })
    } catch {
      // Error handled by mutation onError
    }
  }

  // Delete personnel
  const remove = async (id) => {
    const confirmed = confirm(`Delete this ${isPlayer ? 'player' : 'staff member'}?`)
    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync(id)
    } catch {
      // Error handled by mutation onError
    }
  }

  const handleSearch = () => setAppliedSearch(search.trim())
  const displayError = error || personnelError?.message || referenceError?.message
  const saving = saveMutation.isPending

  return (
    <section className="page">
      <header>
        <div>
          <p className="eyebrow">Personnel management</p>
          <h1>{title}</h1>
        </div>

        <button className="primary" onClick={() => {
          setEditing({ ...empty })
          setPhoto(null)
          setError('')
        }}>
          <Plus /> Add {isPlayer ? 'player' : 'staff'}
        </button>
      </header>

      {/* Search */}
      <div className="toolbar">
        <label>
          <Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search ${title.toLowerCase()}`}
          />
        </label>
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* Error message */}
      {displayError && (
        <div className="error">
          {displayError}
          <button onClick={() => setError('')}><X /></button>
        </div>
      )}

      {/* Personnel table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>{isPlayer ? 'Position' : 'Department'}</th>
              <th>{isPlayer ? 'Jersey' : 'Job title'}</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id}
              className="clickable-row"
              onClick={() => navigate(`/${type}/${row.id}`)}>
                <td>
                  <strong>{row.full_name}</strong>
                  <small className="cell-note">{row.email || 'No email'}</small>
                </td>
                <td>{isPlayer ? row.primary_position : row.department_name || '—'}</td>
                <td>{isPlayer ? row.jersey_number : row.job_title}</td>
                <td>{isPlayer ? row.status : row.employment_status}</td>
                <td className="actions">
                  <button title="Edit" onClick={(e) => {
                    e.stopPropagation();
                    openEdit(row);
                  }}><Pencil /></button>
                  <button title="Delete" disabled={deleteMutation.isPending} onClick={(e) => {
                    e.stopPropagation();
                    remove(row.id);
                  }}><Trash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <div className="state">Loading personnel...</div>}
        {!loading && !rows.length && <div className="state">No personnel found.</div>}
      </div>

      {/* Add / Edit modal */}
      {editing && (
        <div className="modal-backdrop">
          <form className="modal personnel-modal" onSubmit={save}>
            <header>
              <h2>{editing.id ? 'Edit' : 'Add'} {isPlayer ? 'player' : 'staff member'}</h2>
              <button type="button" onClick={() => setEditing(null)}><X /></button>
            </header>

            <div className="personnel-form">
              {/* Profile photo */}
              <div className="photo-field">
                <div className="photo-preview">
                  {photoPreview ? <img src={photoPreview} alt="Cropped profile preview" /> : <Camera />}
                </div>

                <label className="secondary-button">
                  Choose photo
                  <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
                </label>

                <small>JPG, PNG or WebP. Maximum 5 MB.</small>
              </div>

              {/* Personnel fields */}
              <div className="form-grid">
                <Field name="full_name" label="Full name" value={editing.full_name} required />
                <Field name="email" label="Email" type="email" value={editing.email} />
                <Field name="date_of_birth" label="Date of birth" type="date" value={editing.date_of_birth} />
                <Field name="nationality" label="Nationality" value={editing.nationality} />
                <Field name="phone_number" label="Phone number" value={editing.phone_number} />
                <Field name="address" label="Address" value={editing.address} />
                <Field name="join_date" label="Join date" type="date" value={editing.join_date} required />

                {isPlayer ? (
                  <>
                    <Field name="jersey_number" label="Jersey number" type="number" min="1" max="99" value={editing.jersey_number} />

                    <Select
                      name="primary_position_id"
                      label="Primary position"
                      value={editing.primary_position_id}
                      options={references.map((i) => [i.id, `${i.code} - ${i.position_name}`])}
                    />

                    <Select
                      name="preferred_foot"
                      label="Preferred foot"
                      value={editing.preferred_foot}
                      options={['Left', 'Right', 'Both'].map((i) => [i, i])}
                    />

                    <Field name="height" label="Height (cm)" type="number" step="0.01" value={editing.height} />
                    <Field name="weight" label="Weight (kg)" type="number" step="0.01" value={editing.weight} />

                    <Select
                      name="status"
                      label="Status"
                      value={editing.status}
                      options={playerStatuses.map((i) => [i, i])}
                    />

                    <label className="wide">
                      <span>Secondary positions</span>
                      <select name="secondary_position_ids" multiple defaultValue={editing.secondary_position_ids || []}>
                        {references
                          .filter((i) => i.id !== editing.primary_position_id)
                          .map((i) => (
                            <option key={i.id} value={i.id}>{i.code} - {i.position_name}</option>
                          ))}
                      </select>
                      <small>Use Ctrl/Cmd to select more than one.</small>
                    </label>
                  </>
                ) : (
                  <>
                    <Select
                      name="department_id"
                      label="Department"
                      value={editing.department_id}
                      options={references.map((i) => [i.id, i.department_name])}
                    />

                    <Field name="job_title" label="Job title" value={editing.job_title} required />

                    <Select
                      name="employment_status"
                      label="Employment status"
                      value={editing.employment_status}
                      options={staffStatuses.map((i) => [i, i])}
                    />
                  </>
                )}
              </div>
            </div>

            <footer>
              <button type="button" onClick={() => setEditing(null)}>Cancel</button>
              <button className="primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save personnel'}
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* Photo crop modal */}
      {cropSource && (
        <PhotoCropModal
          source={cropSource}
          onCancel={() => setCropSource('')}
          onConfirm={(blob) => {
            setPhoto(blob)
            setCropSource('')
          }}
        />
      )}
    </section>
  )
}

// Reusable input field
function Field({ label, value, ...props }) {
  return (
    <label>
      <span>{label}</span>
      <input {...props} defaultValue={value || ''} />
    </label>
  )
}

// Reusable select field
function Select({ label, options, value, ...props }) {
  return (
    <label>
      <span>{label}</span>
      <select {...props} defaultValue={value || ''}>
        <option value="">Select...</option>
        {options.map(([key, text]) => (
          <option key={key} value={key}>{text}</option>
        ))}
      </select>
    </label>
  )
}
