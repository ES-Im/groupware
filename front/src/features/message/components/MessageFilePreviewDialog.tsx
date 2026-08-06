import { useState } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { useMessageFilePreviewUrl } from '../api/useMessageFilePreviewUrl'
import type { FileListInfo } from '../model/messageTypes'

function PreviewBody({ messageId, file }: { messageId: number; file: FileListInfo }) {
  const { objectUrl, isLoading, isError } = useMessageFilePreviewUrl(messageId, file.fileId)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        미리보기를 불러오는 중...
      </div>
    )
  }

  if (isError || !objectUrl) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        이미지를 불러오지 못했습니다.
      </div>
    )
  }

  return (
    <img
      src={objectUrl}
      alt={file.originalName}
      className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
    />
  )
}

interface MessageFilePreviewDialogProps {
  messageId: number
  file: FileListInfo
  compact?: boolean
}

export function MessageFilePreviewDialog({
  messageId,
  file,
  compact = false,
}: MessageFilePreviewDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            aria-label={`${file.originalName} 미리보기`}
          >
            <Eye />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" className="shrink-0">
            <Eye />
            미리보기
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{file.originalName}</DialogTitle>
        </DialogHeader>
        <PreviewBody messageId={messageId} file={file} />
      </DialogContent>
    </Dialog>
  )
}
