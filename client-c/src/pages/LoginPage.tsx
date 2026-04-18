import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Alert, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material'

import { PageShellCentered } from '@/lib/layout'
import { useAuth } from '@/contexts/auth-context'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/account'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login(data.email, data.password)
      navigate(from, { replace: true })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Login failed'
      setError('root', { message })
    }
  })

  if (user) {
    return <Navigate to={from} replace />
  }

  return (
    <PageShellCentered>
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mb: 2 }}>
            <Typography variant="h5" component="h1" fontWeight={600}>
              Sign in
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use your student account to continue.
            </Typography>
          </Stack>
          <form onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
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
                autoComplete="current-password"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password')}
              />
              {errors.root ? (
                <Alert severity="error" role="alert">
                  {errors.root.message}
                </Alert>
              ) : null}
              <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </form>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            No account?{' '}
            <Link component={RouterLink} to="/register" underline="hover">
              Register
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </PageShellCentered>
  )
}
