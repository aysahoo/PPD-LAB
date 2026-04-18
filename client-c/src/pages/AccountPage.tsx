import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Alert,
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
            ? 'Update your profile — name, email, phone, Aadhaar, and rank are required before enrolling.'
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
