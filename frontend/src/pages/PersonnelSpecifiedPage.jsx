
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, MapPin, CalendarDays,
  BriefcaseBusiness, UserRound, Ruler, Weight,
  Footprints, Shirt, Building2, Globe
} from 'lucide-react'
import { api } from '../lib/api'

export default function PersonnelSpecifiedPage({ type }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isPlayer = type === 'players'

  const { data: person, isLoading, error } = useQuery({
    queryKey: ['personnel-detail', type, id],
    queryFn: async () => {
      const result = await api(`/${type}/${id}`)
      return result.data
    },
    enabled: Boolean(id && (type === 'players' || type === 'staff'))
  })

  // Tambahkan ini
console.log('PERSONNEL DATA:', person)

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const photo = person?.photo_url || person?.profile_photo_url || person?.avatar_url
  const name = person?.full_name || 'Unknown Personnel'
  const status = isPlayer ? person?.status : person?.employment_status

  if (isLoading) {
    return <section className="page"><div className="state">Loading personnel details...</div></section>
  }

  if (error || !person) {
    return (
      <section className="page">
        <button className="detail-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className="state">{error?.message || 'Personnel not found.'}</div>
      </section>
    )
  }

  const details = [
    { label: 'Email', value: person.email, icon: Mail },
    { label: 'Phone Number', value: person.phone_number, icon: Phone },
    { label: 'Date of Birth', value: formatDate(person.date_of_birth), icon: CalendarDays },
    { label: 'Nationality', value: person.nationality, icon: Globe },
    { label: 'Address', value: person.address, icon: MapPin },
    { label: 'Join Date', value: formatDate(person.join_date), icon: CalendarDays }
  ]

  const playerDetails = [
    { label: 'Jersey Number', value: person.jersey_number ? `#${person.jersey_number}` : '—', icon: Shirt },
    { label: 'Primary Position', value: person.primary_position, icon: UserRound },
    { label: 'Preferred Foot', value: person.preferred_foot, icon: Footprints },
    { label: 'Height', value: person.height ? `${person.height} cm` : '—', icon: Ruler },
    { label: 'Weight', value: person.weight ? `${person.weight} kg` : '—', icon: Weight }
  ]

  const staffDetails = [
    { label: 'Department', value: person.department_name, icon: Building2 },
    { label: 'Job Title', value: person.job_title, icon: BriefcaseBusiness }
  ]

  const renderDetails = (items) => (
    <div className="specified-grid">
      {items.map(({ label, value, icon: Icon }) => (
        <div className="specified-item" key={label}>
          <div className="specified-icon"><Icon size={18} /></div>
          <div>
            <span>{label}</span>
            <strong>{value || '—'}</strong>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <section className="page personnel-specified">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back to {isPlayer ? 'Players' : 'Staff'}
      </button>

      <div className="specified-header">
        <div className="specified-profile">
          {photo ? (
            <img src={photo} alt={name} className="specified-photo" />
          ) : (
            <div className="specified-photo specified-placeholder">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="specified-heading">
            <span className="eyebrow">{isPlayer ? 'Player Profile' : 'Staff Profile'}</span>
            <h1>{name}</h1>
            <p>{isPlayer ? person.primary_position || 'Football Player' : person.job_title || 'Club Staff'}</p>
            <span className={`specified-status ${String(status || '').toLowerCase().replaceAll(' ', '-')}`}>
              {status || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      <div className="specified-section">
        <h2>Personal Information</h2>
        {renderDetails(details)}
      </div>

      <div className="specified-section">
        <h2>{isPlayer ? 'Player Information' : 'Employment Information'}</h2>
        {renderDetails(isPlayer ? playerDetails : staffDetails)}
      </div>
    </section>
  )
}
