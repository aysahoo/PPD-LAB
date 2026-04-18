import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PageHeading } from '@/components/PageHeading'
import { breadcrumbPresets } from '@/lib/breadcrumb-presets'
import { PageShellNarrow } from '@/lib/layout'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import * as storage from '@/lib/auth-storage'

/** Optional; if provided, 7–15 digits, common formatting chars only, ≤20 chars (matches server). */
const phoneFieldSchema = z
  .string()
  .max(20, 'Use at most 20 characters')
  .refine(
    (s) => {
      const v = s.trim()
      if (v === '') return true
      if (!/^[\d\s+().-]+$/.test(v)) return false
      const digits = v.replace(/\D/g, '')
      return digits.length >= 7 && digits.length <= 15
    },
    { message: 'Enter a valid phone number (7–15 digits).' },
  )

const profileSchema = z.object({
  name: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email'),
  phone: phoneFieldSchema,
  aadhaarNumber: z
    .string()
    .min(1, 'Aadhaar is required')
    .refine((s) => /^\d{12}$/.test(s.replace(/\D/g, '')), {
      message: 'Aadhaar must be exactly 12 digits.',
    }),
  studentRank: z
    .string()
    .min(1, 'Rank is required')
    .refine((s) => /^\d+$/.test(s.trim()), { message: 'Enter a valid whole number.' })
    .refine((s) => Number.parseInt(s.trim(), 10) > 0, {
      message: 'Rank must be a positive number.',
    }),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Use at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm your new password'),
})

type PasswordValues = z.infer<typeof passwordSchema>

function AccountContent() {
  const { user, logout, refreshUser } = useAuth()
  const [docError, setDocError] = useState<string | null>(null)
  const [aadhaarUploading, setAadhaarUploading] = useState(false)
  const [rankUploading, setRankUploading] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<null | 'aadhaar' | 'rank'>(null)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', phone: '', aadhaarNumber: '', studentRank: '' },
  })

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(
      passwordSchema.refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      }),
    ),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (!user) return
    profileForm.reset({
      name: user.name ?? '',
      email: user.email,
      phone: user.phone ?? '',
      aadhaarNumber: user.aadhaarNumber ?? '',
      studentRank: user.studentRank != null ? String(user.studentRank) : '',
    })
  }, [user, profileForm])

  const onProfileSubmit = profileForm.handleSubmit(async (data) => {
    const token = storage.getToken()
    if (!token || !user) {
      profileForm.setError('root', { message: 'Not signed in' })
      return
    }
    if (user.role !== 'student') {
      profileForm.setError('root', { message: 'Profile editing is for student accounts.' })
      return
    }
    try {
      await api.putJson(
        `/students/${user.id}`,
        {
          name: data.name || null,
          email: data.email,
          phone: (data.phone?.trim() ?? '') || null,
          aadhaarNumber: data.aadhaarNumber.replace(/\D/g, ''),
          studentRank: Number.parseInt(data.studentRank.trim(), 10),
        },
        token,
      )
      await refreshUser()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update profile'
      profileForm.setError('root', { message })
    }
  })

  const onPasswordSubmit = handleSubmit(async (data) => {
    const token = storage.getToken()
    if (!token) {
      setError('root', { message: 'Not signed in' })
      return
    }
    try {
      await api.postJson(
        '/auth/change-password',
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        token,
      )
      reset()
      await refreshUser()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update password'
      setError('root', { message })
    }
  })

  async function uploadAadhaarPdf(file: File) {
    const token = storage.getToken()
    if (!token || !user || user.role !== 'student') return
    setDocError(null)
    setAadhaarUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.postFormData(`/students/${user.id}/documents/aadhaar`, fd, token)
      await refreshUser()
    } catch (e) {
      setDocError(e instanceof Error ? e.message : 'Could not upload Aadhaar PDF')
    } finally {
      setAadhaarUploading(false)
    }
  }

  async function uploadRankPdf(file: File) {
    const token = storage.getToken()
    if (!token || !user || user.role !== 'student') return
    setDocError(null)
    setRankUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.postFormData(`/students/${user.id}/documents/rank`, fd, token)
      await refreshUser()
    } catch (e) {
      setDocError(e instanceof Error ? e.message : 'Could not upload rank PDF')
    } finally {
      setRankUploading(false)
    }
  }

  async function viewPdf(kind: 'aadhaar' | 'rank') {
    const token = storage.getToken()
    if (!token || !user || user.role !== 'student') return
    setDocError(null)
    setViewingDoc(kind)
    try {
      const blob = await api.getBlob(`/students/${user.id}/documents/${kind}`, token)
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank', 'noopener,noreferrer')
      if (!win) {
        URL.revokeObjectURL(url)
        setDocError('Popup blocked — allow popups for this site to view the PDF.')
        return
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000)
    } catch (e) {
      setDocError(e instanceof Error ? e.message : 'Could not open PDF')
    } finally {
      setViewingDoc(null)
    }
  }

  if (!user) {
    return null
  }

  return (
    <PageShellNarrow>
      <Breadcrumbs items={breadcrumbPresets.account} />
      <PageHeading
        title="Account"
        description={
          user.role === 'student'
            ? 'Update your profile — name, email, phone, Aadhaar, rank, and Aadhaar and rank PDFs are required before enrolling.'
            : 'Administrator — edit admin users under Admin → Admins.'
        }
      />

      <Card variant="outlined">
        <CardHeader title="Role" />
        <CardContent>
          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
            {user.role}
          </Typography>
        </CardContent>
      </Card>

      {user.role === 'student' ? (
        <Card variant="outlined">
          <CardHeader title="Profile" subheader="Changes apply to your student record." />
          <CardContent>
            <form onSubmit={onProfileSubmit} noValidate>
              <Stack spacing={2}>
                <TextField
                  id="profile-name"
                  label="Name"
                  autoComplete="name"
                  fullWidth
                  {...profileForm.register('name')}
                  error={!!profileForm.formState.errors.name}
                  helperText={profileForm.formState.errors.name?.message}
                />
                <TextField
                  id="profile-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  fullWidth
                  {...profileForm.register('email')}
                  error={!!profileForm.formState.errors.email}
                  helperText={profileForm.formState.errors.email?.message}
                />
                <TextField
                  id="profile-phone"
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  fullWidth
                  {...profileForm.register('phone')}
                  error={!!profileForm.formState.errors.phone}
                  helperText={profileForm.formState.errors.phone?.message}
                />
                <TextField
                  id="profile-aadhaar"
                  label="Aadhaar number"
                  placeholder="12-digit Aadhaar"
                  autoComplete="off"
                  fullWidth
                  {...profileForm.register('aadhaarNumber')}
                  error={!!profileForm.formState.errors.aadhaarNumber}
                  helperText={profileForm.formState.errors.aadhaarNumber?.message}
                />
                <TextField
                  id="profile-rank"
                  label="Rank"
                  placeholder="Exam rank (positive integer)"
                  autoComplete="off"
                  fullWidth
                  {...profileForm.register('studentRank')}
                  error={!!profileForm.formState.errors.studentRank}
                  helperText={profileForm.formState.errors.studentRank?.message}
                />
                {profileForm.formState.errors.root ? (
                  <Alert severity="error">{profileForm.formState.errors.root.message}</Alert>
                ) : null}
                <Button type="submit" variant="contained" disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting ? 'Saving…' : 'Save profile'}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {user.role === 'student' ? (
        <Card variant="outlined">
          <CardHeader
            title="Documents"
            subheader="Upload PDF copies of your Aadhaar and rank certificate (required for enrollment)."
          />
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Aadhaar PDF
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Status: {user.aadhaarPdfUploaded ? 'uploaded' : 'not uploaded'}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                  {user.aadhaarPdfUploaded ? (
                    <Button
                      type="button"
                      variant="contained"
                      color="secondary"
                      size="small"
                      disabled={viewingDoc !== null || aadhaarUploading}
                      onClick={() => void viewPdf('aadhaar')}
                    >
                      {viewingDoc === 'aadhaar' ? 'Opening…' : 'View PDF'}
                    </Button>
                  ) : null}
                  <Button variant="outlined" component="label" disabled={aadhaarUploading}>
                    Choose PDF
                    <input
                      type="file"
                      hidden
                      accept="application/pdf,.pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        if (f) void uploadAadhaarPdf(f)
                      }}
                    />
                  </Button>
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Rank PDF
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Status: {user.rankPdfUploaded ? 'uploaded' : 'not uploaded'}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                  {user.rankPdfUploaded ? (
                    <Button
                      type="button"
                      variant="contained"
                      color="secondary"
                      size="small"
                      disabled={viewingDoc !== null || rankUploading}
                      onClick={() => void viewPdf('rank')}
                    >
                      {viewingDoc === 'rank' ? 'Opening…' : 'View PDF'}
                    </Button>
                  ) : null}
                  <Button variant="outlined" component="label" disabled={rankUploading}>
                    Choose PDF
                    <input
                      type="file"
                      hidden
                      accept="application/pdf,.pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        if (f) void uploadRankPdf(f)
                      }}
                    />
                  </Button>
                </Stack>
              </Box>
              {docError ? <Alert severity="error">{docError}</Alert> : null}
              {aadhaarUploading || rankUploading ? (
                <Typography variant="body2" color="text.secondary">
                  Uploading…
                </Typography>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Card variant="outlined">
        <CardHeader title="Change password" subheader="Requires your current password." />
        <CardContent>
          <form onSubmit={onPasswordSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                id="currentPassword"
                label="Current password"
                type="password"
                autoComplete="current-password"
                fullWidth
                {...register('currentPassword')}
                error={!!errors.currentPassword}
                helperText={errors.currentPassword?.message}
              />
              <TextField
                id="newPassword"
                label="New password"
                type="password"
                autoComplete="new-password"
                fullWidth
                {...register('newPassword')}
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
              />
              <TextField
                id="confirmPassword"
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                fullWidth
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />
              {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Updating…' : 'Update password'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      <Button variant="outlined" color="inherit" type="button" onClick={() => void logout()}>
        Sign out
      </Button>
    </PageShellNarrow>
  )
}

export function AccountPage() {
  return <AccountContent />
}
