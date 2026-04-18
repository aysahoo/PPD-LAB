import type { ReactNode } from 'react'
import { Box, CircularProgress, Container, Stack, Typography } from '@mui/material'

/** ~ max-w-5xl (64rem) */
export const SHELL_MAX = 1024

/** ~ max-w-lg */
export const NARROW_MAX = 512

/** Search fields and compact in-page forms (~ max-w-md) */
export const maxWField = 448

export function ShellRow({ children }: { children: ReactNode }) {
  return (
    <Container maxWidth={false} sx={{ maxWidth: SHELL_MAX, mx: 'auto', px: { xs: 2, sm: 3 } }}>
      {children}
    </Container>
  )
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <Container maxWidth={false} sx={{ maxWidth: SHELL_MAX, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      <Stack spacing={4}>{children}</Stack>
    </Container>
  )
}

export function PageShellNarrow({ children }: { children: ReactNode }) {
  return (
    <Container maxWidth={false} sx={{ maxWidth: NARROW_MAX, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      <Stack spacing={4}>{children}</Stack>
    </Container>
  )
}

export function PageShellCentered({ children }: { children: ReactNode }) {
  return (
    <Container maxWidth={false} sx={{ maxWidth: SHELL_MAX, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          minHeight: '60vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 448 }}>{children}</Box>
      </Box>
    </Container>
  )
}

export function PageLoadingCenter({ children }: { children?: ReactNode }) {
  return (
    <Container maxWidth={false} sx={{ maxWidth: SHELL_MAX, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      <Box sx={{ display: 'flex', minHeight: 200, alignItems: 'center', justifyContent: 'center' }}>
        {children ?? (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        )}
      </Box>
    </Container>
  )
}

export function FullScreenLoading({ children }: { children?: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
      }}
    >
      {children ?? <CircularProgress size={28} />}
    </Box>
  )
}
