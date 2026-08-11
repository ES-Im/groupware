import { Download, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { downloadDraftFile } from '../../api/downloadDraftFile'
import type { DraftFile } from '../../model/draftDetail'
import type { DraftDetailSectionProps } from './types'

function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentSection({ draft }: DraftDetailSectionProps) {
  const { draftId, files } = draft

  function handleDownload(file: DraftFile) {
    downloadDraftFile(draftId, file.fileId, file.originalName).catch((error: unknown) => {
      toast.error(normalizeApiError(error).message)
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-base font-bold text-foreground">
          <Paperclip className="size-4 text-muted-foreground" />
          첨부파일{files.length > 0 ? ` ${files.length}개` : ''}
        </h3>
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.fileId}
              className="space-y-2 rounded-xl bg-muted/50 px-3 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                  <Paperclip className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 truncate text-foreground">{file.originalName}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatFileSizeMb(file.fileSize)}
                </span>
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
