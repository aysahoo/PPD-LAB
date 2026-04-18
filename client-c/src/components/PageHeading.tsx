import { Stack, Typography } from '@mui/material'

type PageHeadingProps = {
  title: string
  description?: string
}

/** Standard page title + optional lead (matches admin + public list pages) */
export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.35rem', sm: '1.5rem' }, fontWeight: 600, letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      ) : null}
    </Stack>
  )
}
