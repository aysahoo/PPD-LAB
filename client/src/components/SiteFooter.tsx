import { Link } from 'react-router-dom'

import { shellInnerRow } from '@/lib/layout'
import { cn } from '@/lib/utils'

export function SiteFooter() {
  return (
    <footer className="border-t py-6">
      <div
        className={cn(
          shellInnerRow,
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">PPD Lab — course enrollment</p>
          <p className="text-xs text-muted-foreground">
            Need help? Contact your course administrator or department office.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link to="/" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Home
          </Link>
          <Link
            to="/courses"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Courses
          </Link>
        </nav>
      </div>
    </footer>
  )
}
