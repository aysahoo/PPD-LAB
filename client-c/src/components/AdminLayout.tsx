import { NavLink, Outlet } from 'react-router-dom'
import { Box, Container, Paper, Stack, Typography, useTheme } from '@mui/material'

import { BrandLink } from '@/components/BrandLink'
import { NotificationMenu } from '@/components/NotificationMenu'
import { SkipToContent } from '@/components/SkipToContent'

function AdminNavLink({ to, children }: { to: string; children: string }) {
  const theme = useTheme()
  return (
    <NavLink to={to} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <Typography
          component="span"
          variant="body2"
          color={isActive ? 'primary.main' : 'text.secondary'}
          fontWeight={isActive ? 600 : 500}
          sx={{
             px: 1.5,
             py: 0.5,
             borderRadius: 6,
             display: 'inline-block',
             bgcolor: isActive ? `${theme.palette.primary.main}15` : 'transparent',
             transition: 'background-color 0.2s',
             '&:hover': {
                bgcolor: isActive ? `${theme.palette.primary.main}20` : 'action.hover'
             }
          }}
        >
          {children}
        </Typography>
      )}
    </NavLink>
  )
}

export function AdminLayout() {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        bgcolor: '#f8fafc',
        backgroundImage: 'radial-gradient(at 50% 0%, rgba(25, 118, 210, 0.08) 0vw, transparent 50vw)',
      }}
    >
      <SkipToContent />
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
             maxWidth: 'lg',
             bgcolor: 'background.paper',
             backdropFilter: 'blur(12px)',
             backgroundColor: 'rgba(255, 255, 255, 0.85)',
          }}
        >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              sx={{ width: '100%' }}
            >
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
                <BrandLink />
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10, fontWeight: 700 }}>
                  Admin
                </Typography>
              </Stack>
              <Stack component="nav" direction="row" flexWrap="wrap" alignItems="center" spacing={1} useFlexGap>
                <NotificationMenu />
                <AdminNavLink to="/admin/dashboard">Dashboard</AdminNavLink>
                <AdminNavLink to="/admin/students">Students</AdminNavLink>
                <AdminNavLink to="/admin/courses">Courses</AdminNavLink>
                <AdminNavLink to="/admin/enrollments">Enrollments</AdminNavLink>
                <AdminNavLink to="/admin/reports">Reports</AdminNavLink>
                <AdminNavLink to="/admin/admins">Admins</AdminNavLink>
              </Stack>
            </Stack>
        </Paper>
      </Box>
      <Container
         maxWidth="lg"
         sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            mt: 4,
            mb: 8,
         }}
      >
        <Box
          component="main"
          id="main-content"
          tabIndex={-1}
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', outline: 'none' }}
        >
          <Outlet />
        </Box>
      </Container>
    </Box>
  )
}
