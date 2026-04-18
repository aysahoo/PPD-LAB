import { Box, Container } from '@mui/material'
import { Outlet } from 'react-router-dom'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { SkipToContent } from '@/components/SkipToContent'

export function PublicLayout() {
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
      <SiteHeader />
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
      <SiteFooter />
    </Box>
  )
}
