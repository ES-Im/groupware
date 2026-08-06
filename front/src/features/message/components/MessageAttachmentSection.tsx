import { Download, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { downloadMessageFile } from '../api/downloadMessageFile'
import { useMessageFilesQuery } from '../api/useMessageFilesQuery'
import { isMessageImageExtension } from '../lib/messageImageExtension'
import type { FileListInfo } from '../model/messageTypes'
import { MessageFilePreviewDialog } from './MessageFilePreviewDialog'

function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface MessageAttachmentSectionProps {
  messageId: number
}

export function MessageAttachmentSection({ messageId }: MessageAttachmentSectionProps) {
  const filesQuery = useMessageFilesQuery(messageId)
  const files = filesQuery.data ?? []

  function handleDownload(file: FileListInfo) {
    downloadMessageFile(messageId, file.fileId, file.originalName).catch((error: unknown) => {
      toast.error(normalizeApiError(error).message)
    })
  }

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <Paperclip className="size-4" />
        첨부파일{files.length > 0 ? ` ${files.length}개` : ''}
      </h3>

      {filesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">첨부파일을 불러오는 중...</p>
      ) : filesQuery.isError ? (
        <p className="text-sm text-muted-foreground">
          {normalizeApiError(filesQuery.error).message}
        </p>
      ) : files.length === 0 ? (
        <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => {
            const isImage = isMessageImageExtension(file.extension)
            return (
              <li
                key={file.fileId}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-foreground">{file.originalName}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatFileSizeMb(file.fileSize)}
                </span>
                {isImage && <MessageFilePreviewDialog messageId={messageId} file={file} />}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleDownload(file)}
                  aria-label={`${file.originalName} 다운로드`}
                >
                  <Download />
                  다운로드
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
