import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Alert, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material'

import { PageShellCentered } from '@/lib/layout'
import { useAuth } from '@/contexts/auth-context'

const registerSchema = z.object({
  name: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  phone: z.string().max(20).optional().or(z.literal('')),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser, user } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', phone: '' },
  })

  const onSubmit = handleSubmit(async (data) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name || undefined,
        phone: data.phone || undefined,
      })
      navigate('/account', { replace: true })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Registration failed'
      setError('root', { message })
    }
  })

  if (user) {
    return <Navigate to="/account" replace />
  }

  return (
    <PageShellCentered>
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mb: 2 }}>
            <Typography variant="h5" component="h1" fontWeight={600}>
              Create account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Register as a student to browse and enroll in courses.
            </Typography>
          </Stack>
          <form onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              <TextField id="name" label="Name (optional)" autoComplete="name" fullWidth {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
              <TextField
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <TextField
                id="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password')}
              />
              <TextField id="phone" label="Phone (optional)" type="tel" autoComplete="tel" fullWidth {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} />
              {errors.root ? (
                <Alert severity="error" role="alert">
                  {errors.root.message}
                </Alert>
              ) : null}
              <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Creating account…' : 'Sign up'}
              </Button>
            </Stack>
          </form>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </PageShellCentered>
  )
}
