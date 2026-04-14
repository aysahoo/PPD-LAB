import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, ClipboardList, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { pageShell, sectionTitle } from '@/lib/layout'
import { useAuth } from '@/contexts/auth-context'

const steps = [
  {
    icon: BookOpen,
    title: 'Browse the catalog',
    body: 'Explore published courses, prerequisites, and capacity — no account required.',
  },
  {
    icon: UserRound,
    title: 'Sign in to enroll',
    body: 'Create a student account, then request enrollment on each course page.',
  },
  {
    icon: ClipboardList,
    title: 'Track your requests',
    body: 'See pending, approved, or rejected status from My enrollments.',
  },
] as const

export function HomePage() {
  const navigate = useNavigate()
  const { user, loading, logout } = useAuth()

  return (
    <div className={pageShell}>
      <section className="rounded-xl border bg-card px-6 py-8 text-card-foreground sm:px-8 sm:py-10">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Course enrollment
          </h1>
          <p className="text-pretty text-muted-foreground">
            Browse open courses, sign in to request a seat, and follow your enrollment status — all in
            one place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="button" size="lg" onClick={() => navigate('/courses')}>
              Browse courses
            </Button>
            {!loading && !user ? (
              <Button type="button" size="lg" variant="outline" onClick={() => navigate('/register')}>
                Create account
              </Button>
            ) : null}
            {!loading && user?.role === 'student' ? (
              <Button type="button" size="lg" variant="outline" onClick={() => navigate('/enrollments')}>
                My enrollments
              </Button>
            ) : null}
            {!loading && user?.role === 'admin' ? (
              <Button type="button" size="lg" variant="outline" onClick={() => navigate('/admin/dashboard')}>
                Admin dashboard
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="how-it-works-heading" className="space-y-4">
        <h2 id="how-it-works-heading" className={sectionTitle}>
          How it works
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-foreground" aria-hidden />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{body}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="account-heading">
        <Card>
          <CardHeader>
            <CardTitle id="account-heading">
              Your account
            </CardTitle>
            <CardDescription>
              {loading
                ? 'Checking session…'
                : user
                  ? 'Manage profile and security from your account page.'
                  : 'Sign in or register to enroll in courses.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading session…</p>
            ) : user ? (
              <div className="space-y-3 text-sm">
                <p>
                  Signed in as <span className="font-medium">{user.email}</span>{' '}
                  <span className="text-muted-foreground">({user.role})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => navigate('/account')}>
                    Account settings
                  </Button>
                  <Button variant="outline" type="button" onClick={() => void logout()}>
                    Sign out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => navigate('/login')}>
                  Sign in
                </Button>
                <Button variant="outline" type="button" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              The{' '}
              <Link to="/courses" className="text-primary underline-offset-4 hover:underline">
                course catalog
              </Link>{' '}
              is public — browse anytime without signing in.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
