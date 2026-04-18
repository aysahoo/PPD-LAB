import { Link as RouterLink } from 'react-router-dom'
import { Box, Link, Stack, Typography } from '@mui/material'

import { ShellRow } from '@/lib/layout'

export function SiteFooter() {
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 3 }}>
      <ShellRow>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              PPD Lab — course enrollment
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Need help? Contact your course administrator or department office.
            </Typography>
          </Stack>
          <Box component="nav" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Link component={RouterLink} to="/" variant="body2" color="text.secondary" underline="hover">
              Home
            </Link>
            <Link component={RouterLink} to="/courses" variant="body2" color="text.secondary" underline="hover">
              Courses
            </Link>
          </Box>
        </Stack>
      </ShellRow>
    </Box>
  )
}
