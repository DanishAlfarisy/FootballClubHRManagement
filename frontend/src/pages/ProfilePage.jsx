
import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserRound,
  Mail,
  GraduationCap,
  FileText,
  Pencil,
  X,
  Save,
  LoaderCircle,
  Camera,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import PhotoCropModal from '../components/PhotoCropModal'

const AVATAR_BUCKET = 'personnel-photos'

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const [editing, setEditing] = useState(false)
  const [cropSource, setCropSource] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    nim: '',
    description: '',
  })
  const [error, setError] = useState('')

  // GET LOGGED-IN USER PROFILE
  const {
    data: profile,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError) throw authError

      const user = authData.user

      if (!user) {
        throw new Error('User is not authenticated')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, nim, description, avatar_url')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Generate signed URL for profile picture
      // Generate signed URL for profile picture
let avatarDisplayUrl = null

if (data.avatar_url) {
  const { data: signedData, error: signedError } =
    await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(data.avatar_url, 3600)

  if (signedError) {
    console.error('Failed to generate signed URL:', signedError)
    throw signedError
  }

  avatarDisplayUrl = signedData.signedUrl

  console.log('Avatar path:', data.avatar_url)
  console.log('Avatar URL:', avatarDisplayUrl)
}

      return {
        ...data,
        email: user.email,
        avatarDisplayUrl,
      }
    },
  })

  // UPDATE PERSONAL INFORMATION
  const updateMutation = useMutation({
    mutationFn: async (values) => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError) throw authError

      const user = authData.user

      if (!user) {
        throw new Error('User is not authenticated')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name.trim(),
          nim: values.nim.trim() || null,
          description: values.description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id, full_name, nim, description, avatar_url')
        .single()

      if (error) throw error

      return data
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['my-profile'],
      })

      setEditing(false)
      setError('')
    },

    onError: (err) => {
      setError(err.message)
    },
  })

  
const avatarMutation = useMutation({
  mutationFn: async (croppedBlob) => {
    const { data: authData, error: authError } =
      await supabase.auth.getUser()

    if (authError) throw authError

    const user = authData.user

    if (!user) {
      throw new Error('User is not authenticated')
    }

    if (!(croppedBlob instanceof Blob)) {
      throw new Error('Invalid cropped image')
    }

    if (croppedBlob.size > 5 * 1024 * 1024) {
      throw new Error('Image size must not exceed 5 MB')
    }

    // Get existing avatar path
    const { data: currentProfile, error: profileError } =
      await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()

    if (profileError) throw profileError

    const oldFilePath = currentProfile.avatar_url

    // Fixed storage path
    const filePath = `profile/${user.id}.jpg`

    // Upload and overwrite existing image
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, croppedBlob, {
        cacheControl: '0',
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) throw uploadError

    // Update avatar path in profiles
    const { data: updatedProfile, error: updateError } =
      await supabase
        .from('profiles')
        .update({
          avatar_url: filePath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id, avatar_url')
        .single()

    if (updateError) throw updateError

    // Delete previous image if it used another path
    if (oldFilePath && oldFilePath !== filePath) {
      const { error: deleteError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([oldFilePath])

      if (deleteError) {
        console.error('Old avatar deletion failed:', deleteError)
      }
    }

    console.log('Avatar successfully updated:', updatedProfile)

    return filePath
  },

  onSuccess: async () => {
    await queryClient.invalidateQueries({
      queryKey: ['my-profile'],
    })

    setError('')
  },

  onError: (err) => {
    console.error('Avatar upload error:', err)
    setError(err.message)
  },
})

  // FORM HANDLERS
  const startEditing = () => {
    setForm({
      full_name: profile.full_name || '',
      nim: profile.nim || '',
      description: profile.description || '',
    })

    setError('')
    setEditing(true)
  }

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.full_name.trim()) {
      setError('Full name is required')
      return
    }

    updateMutation.mutate(form)
  }

  // CHOOSE PROFILE PHOTO - SAME FLOW AS PERSONNEL PAGE
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPG, PNG, or WebP image.')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be 5 MB or smaller.')
      e.target.value = ''
      return
    }

    setError('')

    const reader = new FileReader()

    reader.onload = () => {
      setCropSource(reader.result)
    }

    reader.onerror = () => {
      setError('Failed to read the selected photo.')
    }

    reader.readAsDataURL(file)

    // Allow selecting the same file again
    e.target.value = ''
  }

  // CONFIRM CROPPED PHOTO
  const handleCropConfirm = (blob) => {
    setCropSource('')
    avatarMutation.mutate(blob)
  }

  // LOADING & ERROR STATES
  if (isLoading) {
    return (
      <section className="page">
        <div className="state">Loading profile...</div>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="page">
        <div className="error">{loadError.message}</div>
      </section>
    )
  }

  // PROFILE DATA
  const initials = (profile.full_name || profile.email || 'U')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <section className="page">
      {/* Page Header */}
      <header>
        <div>
          <p className="eyebrow">Account Settings</p>
          <h1>My Profile</h1>
        </div>

        {!editing && (
          <button
            className="primary"
            onClick={startEditing}
          >
            <Pencil size={17} />
            Edit Profile
          </button>
        )}
      </header>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError('')}>
            <X size={17} />
          </button>
        </div>
      )}

      <div className="personnel-specified">
        {/* PROFILE HEADER */}
        <div className="specified-header">
          <div className="specified-profile">
            {profile.avatarDisplayUrl ? (
              <img
                src={profile.avatarDisplayUrl}
                alt="Profile Picture"
                className="specified-photo"
              />
            ) : (
              <div className="specified-photo specified-placeholder">
                {initials}
              </div>
            )}

            <div className="specified-heading">
              <p className="eyebrow">Account Profile</p>

              <h1>
                {profile.full_name || 'Your Name'}
              </h1>

              <p>{profile.email}</p>

              <span className="specified-status">
                Active Account
              </span>

              {/* Upload Profile Picture */}
{editing && (
  <>
    <div style={{ marginTop: '14px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={handleAvatarChange}
      />

      <button
        type="button"
        className="secondary-button"
        onClick={() => fileInputRef.current?.click()}
        disabled={avatarMutation.isPending}
      >

        {avatarMutation.isPending
          ? 'Uploading...'
          : 'Change Photo'}
      </button>
    </div>

    <small>
      JPG, PNG or WebP. Maximum 5 MB.
    </small>
  </>
)}
            </div>
          </div>
        </div>

        {/* PERSONAL INFORMATION */}
        <div className="specified-section">
          {editing ? (
            <form onSubmit={handleSubmit}>
              <h2>Edit Personal Information</h2>

              <div className="form-grid">
                <label>
                  Full Name *
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </label>

                <label>
                  Email Address
                  <input
                    value={profile.email || ''}
                    disabled
                  />
                </label>

                <label>
                  NIM
                  <input
                    name="nim"
                    value={form.nim}
                    onChange={handleChange}
                    placeholder="Enter your NIM (optional)"
                  />
                </label>

                <label className="wide">
                  Description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Tell us something about yourself"
                    rows={4}
                  />
                </label>
              </div>

              <div className="profile-actions">
                

                <button
                  type="submit"
                  className="primary"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <LoaderCircle size={17} />
                  ) : (
                    <Save size={17} />
                  )}

                  {updateMutation.isPending
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2>Personal Information</h2>

              <div className="specified-grid">
                <div className="specified-item">
                  <div className="specified-icon">
                    <UserRound size={20} />
                  </div>

                  <div>
                    <span>Full Name</span>
                    <strong>
                      {profile.full_name || 'Not provided'}
                    </strong>
                  </div>
                </div>

                <div className="specified-item">
                  <div className="specified-icon">
                    <Mail size={20} />
                  </div>

                  <div>
                    <span>Email Address</span>
                    <strong>
                      {profile.email || 'Not available'}
                    </strong>
                  </div>
                </div>

                <div className="specified-item">
                  <div className="specified-icon">
                    <GraduationCap size={20} />
                  </div>

                  <div>
                    <span>NIM</span>
                    <strong>
                      {profile.nim || 'Not provided'}
                    </strong>
                  </div>
                </div>

                <div className="specified-item">
                  <div className="specified-icon">
                    <FileText size={20} />
                  </div>

                  <div>
                    <span>Description</span>
                    <strong>
                      {profile.description || 'Not provided'}
                    </strong>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PHOTO CROP MODAL - SAME AS PERSONNEL PAGE */}
      {cropSource && (
        <PhotoCropModal
          source={cropSource}
          onCancel={() => setCropSource('')}
          onConfirm={handleCropConfirm}
        />
      )}
    </section>
  )
}
