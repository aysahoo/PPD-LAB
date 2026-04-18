import { Link } from '@mui/material'

/** WCAG: first focusable control lets keyboard users bypass repeated navigation */
export function SkipToContent() {
  return (
    <Link
      href="#main-content"
      sx={{
        position: 'fixed',
        top: 16,
        left: 16,
        zIndex: 9999,
        transform: 'translateY(-200%)',
        transition: 'transform 0.15s',
        px: 2,
        py: 1,
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'text.primary',
        textDecoration: 'none',
        fontSize: '0.875rem',
        '&:focus': {
          transform: 'translateY(0)',
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      Skip to main content
    </Link>
  )
}
