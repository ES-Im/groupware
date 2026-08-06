import { Folder } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'

interface CategoryBadgeProps {
  name: string
  className?: string
}

export function CategoryBadge({ name, className }: CategoryBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('gap-1 bg-primary/10 font-semibold text-primary', className)}
    >
      <Folder aria-hidden="true" />
      {name}
    </Badge>
  )
}
