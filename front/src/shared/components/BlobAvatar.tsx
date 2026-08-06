import { useEmpFilePreviewUrl } from '@/shared/lib/useEmpFilePreview'
import { cn } from '@/shared/lib/utils'

interface BlobAvatarProps {
  empId?: number
  fileId?: number
  fallbackText: string
  className?: string
}

export function BlobAvatar({ empId, fileId, fallbackText, className }: BlobAvatarProps) {
  const { objectUrl, isError } = useEmpFilePreviewUrl(empId, fileId)

  if (objectUrl && !isError) {
    return (
      <img
        src={objectUrl}
        alt={fallbackText}
        className={cn('size-8 shrink-0 rounded-full object-cover', className)}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      {fallbackText.slice(0, 1)}
    </span>
  )
}
