import { ChevronRight } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Link, Typography } from '@mui/material'

export type BreadcrumbItem = { label: string; to?: string }

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

/** NN/g pattern: show hierarchy on deeper views (catalog → course, etc.) */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <Box component="nav" aria-label="Breadcrumb">
      <Box component="ol" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, m: 0, p: 0, listStyle: 'none' }}>
        {items.map((item, i) => (
          <Box component="li" key={`${item.label}-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {i > 0 ? <ChevronRight size={14} style={{ opacity: 0.5 }} aria-hidden /> : null}
            {item.to ? (
              <Link component={RouterLink} to={item.to} variant="body2" color="text.secondary" underline="hover">
                {item.label}
              </Link>
            ) : (
              <Typography variant="body2" color="text.primary" fontWeight={500} component="span" aria-current="page">
                {item.label}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
