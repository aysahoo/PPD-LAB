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

const profileSchema = z.object({
  name: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email'),
  phone: z.string().max(20).optional().or(z.literal('')),
})

type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Use at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm your new password'),
})

type PasswordValues = z.infer<typeof passwordSchema>

function AccountContent() {
  const { user, logout, refreshUser } = useAuth()

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', phone: '' },
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
          phone: data.phone || null,
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
            ? 'Update your name, email, and phone.'
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
