import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Card, Stack, Text, TextInput } from '@mantine/core'
import { z } from 'zod'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PageHeading } from '@/components/PageHeading'
import { breadcrumbPresets } from '@/lib/breadcrumb-presets'
import { PageShellNarrow } from '@/lib/layout'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import * as storage from '@/lib/auth-storage'

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
      <Card withBorder shadow="sm" padding="lg">
        <Text fw={600} mb="xs">
          Role
        </Text>
        <Text size="sm" tt="capitalize">
          {user.role}
        </Text>
      </Card>

      {user.role === 'student' ? (
        <Card withBorder shadow="sm" padding="lg">
          <Stack gap="xs" mb="md">
            <Text fw={600}>Profile</Text>
            <Text size="sm" c="dimmed">
              Changes apply to your student record.
            </Text>
          </Stack>
          <form onSubmit={onProfileSubmit}>
            <Stack gap="md">
              <TextInput label="Name" id="profile-name" autoComplete="name" {...profileForm.register('name')} />
              <TextInput
                label="Email"
                id="profile-email"
                type="email"
                autoComplete="email"
                error={profileForm.formState.errors.email?.message}
                {...profileForm.register('email')}
              />
              <TextInput
                id="profile-phone"
                label="Phone"
                type="tel"
                autoComplete="tel"
                error={profileForm.formState.errors.phone?.message}
                {...profileForm.register('phone')}
              />
              <TextInput
                id="profile-aadhaar"
                label="Aadhaar number"
                placeholder="12-digit Aadhaar"
                autoComplete="off"
                error={profileForm.formState.errors.aadhaarNumber?.message}
                {...profileForm.register('aadhaarNumber')}
              />
              <TextInput
                id="profile-rank"
                label="Rank"
                placeholder="Exam rank (positive integer)"
                autoComplete="off"
                error={profileForm.formState.errors.studentRank?.message}
                {...profileForm.register('studentRank')}
              />
              {profileForm.formState.errors.root ? (
                <Text size="sm" c="red">
                  {profileForm.formState.errors.root.message}
                </Text>
              ) : null}
              <Button type="submit" loading={profileForm.formState.isSubmitting}>
                {profileForm.formState.isSubmitting ? 'Saving…' : 'Save profile'}
              </Button>
            </Stack>
          </form>
        </Card>
      ) : null}

      <Card withBorder shadow="sm" padding="lg">
        <Stack gap="xs" mb="md">
          <Text fw={600}>Change password</Text>
          <Text size="sm" c="dimmed">
            Requires your current password.
          </Text>
        </Stack>
        <form onSubmit={onPasswordSubmit}>
          <Stack gap="md">
            <TextInput
              label="Current password"
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <TextInput
              label="New password"
              id="newPassword"
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <TextInput
              label="Confirm new password"
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            {errors.root ? (
              <Text size="sm" c="red">
                {errors.root.message}
              </Text>
            ) : null}
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Updating…' : 'Update password'}
            </Button>
          </Stack>
        </form>
      </Card>

      <Button variant="default" type="button" onClick={() => void logout()}>
        Sign out
      </Button>
    </PageShellNarrow>
  )
}

export function AccountPage() {
  return <AccountContent />
}
