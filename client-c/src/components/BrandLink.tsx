import { Link as RouterLink } from 'react-router-dom'
import { Link, Typography } from '@mui/material'

type BrandLinkProps = {
  onNavigate?: () => void
}

export function BrandLink({ onNavigate }: BrandLinkProps) {
  return (
    <Link
      component={RouterLink}
      to="/"
      onClick={onNavigate}
      underline="none"
      color="inherit"
      sx={{ flexShrink: 0 }}
    >
      <Typography component="span" variant="body2" fontWeight={600} letterSpacing="-0.02em">
        PPD Lab
      </Typography>
    </Link>
  )
}
