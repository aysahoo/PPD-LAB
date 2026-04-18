import { useState } from 'react'
import { Link as RouterLink, NavLink } from 'react-router-dom'
import { Menu, UserRound } from 'lucide-react'
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Paper, Stack, Typography, useTheme } from '@mui/material'

import { BrandLink } from '@/components/BrandLink'
import { NotificationMenu } from '@/components/NotificationMenu'
import { useAuth } from '@/contexts/auth-context'

function PrimaryNav({
  onNavigate,
  vertical,
  showAccountLink,
  renderAuthLinks = false,
}: {
  onNavigate?: () => void
  vertical?: boolean
  showAccountLink?: boolean
  renderAuthLinks?: boolean
}) {
  const { user, loading } = useAuth()
  const theme = useTheme()

  const link = (to: string, label: string) => (
    <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <Typography
          component="span"
          variant="body2"
          color={isActive ? 'primary.main' : 'text.secondary'}
          fontWeight={isActive ? 600 : 500}
          sx={{
            display: 'block',
            py: vertical ? 1 : 0.5,
            px: vertical ? 1 : 1.5,
            borderRadius: 6,
            bgcolor: isActive ? `${theme.palette.primary.main}15` : 'transparent',
            transition: 'background-color 0.2s',
            '&:hover': {
               bgcolor: isActive ? `${theme.palette.primary.main}20` : 'action.hover'
            }
          }}
        >
          {label}
        </Typography>
      )}
    </NavLink>
  )

  return (
    <Stack
      component="nav"
      direction={vertical ? 'column' : 'row'}
      spacing={vertical ? 0 : 0.5}
      alignItems={vertical ? 'stretch' : 'center'}
      flexWrap="wrap"
      useFlexGap
      aria-label="Primary"
    >
      {link('/', 'Home')}
      {link('/courses', 'Courses')}
      {!loading && user?.role === 'student' ? link('/enrollments', 'My enrollments') : null}
      {!loading && user && showAccountLink ? link('/account', 'Account') : null}
      {!loading && user?.role === 'admin' ? link('/admin/dashboard', 'Admin') : null}
      {renderAuthLinks && !loading && !user ? (
        <>
          {link('/login', 'Sign in')}
          {link('/register', 'Register')}
        </>
      ) : null}
    </Stack>
  )
}

export function SiteHeader() {
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box
       component="header"
       sx={{
          position: 'sticky',
          top: 16,
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          px: 2,
          pointerEvents: 'none'
       }}
    >
      <Paper
        elevation={4}
        sx={{
           pointerEvents: 'auto',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'space-between',
           borderRadius: 8,
           px: { xs: 2, md: 3 },
           py: { xs: 1, md: 1.5 },
           width: '100%',
           maxWidth: 900,
           bgcolor: 'background.paper',
           backdropFilter: 'blur(12px)',
           backgroundColor: 'rgba(255, 255, 255, 0.85)',
        }}
      >
          <Stack direction="row" alignItems="center" spacing={3} sx={{ minWidth: 0 }}>
            <BrandLink onNavigate={() => setMobileOpen(false)} />
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <PrimaryNav />
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
            {!loading && !user ? (
              <Stack
                component="nav"
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ display: { xs: 'none', md: 'flex' } }}
                aria-label="Authentication"
              >
                <NavLink to="/login" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                  {({ isActive }) => (
                    <Typography
                      component="span"
                      variant="body2"
                      color={isActive ? 'primary.main' : 'text.secondary'}
                      fontWeight={isActive ? 600 : 500}
                      sx={{ px: 1.5, py: 0.5, borderRadius: 6, '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      Sign in
                    </Typography>
                  )}
                </NavLink>
                <NavLink to="/register" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                  {({ isActive }) => (
                    <Typography
                      component="span"
                      variant="body2"
                      color={isActive ? 'primary.main' : 'text.secondary'}
                      fontWeight={isActive ? 600 : 500}
                      sx={{ px: 1.5, py: 0.5, borderRadius: 6, '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      Register
                    </Typography>
                  )}
                </NavLink>
              </Stack>
            ) : null}
            {user ? (
              <>
                <NotificationMenu />
                <IconButton
                  component={RouterLink}
                  to="/account"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Account"
                  size="small"
                  sx={{ display: { xs: 'none', md: 'inline-flex' }, border: 1, borderColor: 'divider' }}
                >
                  <UserRound size={18} aria-hidden />
                </IconButton>
              </>
            ) : null}

            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <IconButton
                type="button"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-dialog"
                aria-label="Open menu"
                size="small"
                onClick={() => setMobileOpen(true)}
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <Menu size={18} aria-hidden />
              </IconButton>
              <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ textAlign: 'left' }}>Menu</DialogTitle>
                <DialogContent
                  id="mobile-nav-dialog"
                  sx={{ pt: 0, maxHeight: '80vh', overflow: 'auto' }}
                >
                  <PrimaryNav
                    vertical
                    showAccountLink
                    renderAuthLinks
                    onNavigate={() => setMobileOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </Box>
          </Stack>
      </Paper>
    </Box>
  )
}
