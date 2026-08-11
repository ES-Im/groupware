import { Download, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { downloadDraftFile } from '../../api/downloadDraftFile'
import { useDraftFilePreviewUrl } from '../../api/useDraftFilePreviewUrl'
import { isDraftImageExtension } from '../../lib/isDraftImageExtension'
import type { DraftFile } from '../../model/draftDetail'
import type { DraftDetailSectionProps } from './types'

function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DraftImagePreview({ draftId, file }: { draftId: number; file: DraftFile }) {
  const { objectUrl, isLoading, isError } = useDraftFilePreviewUrl(draftId, file.fileId)

  if (isLoading) {
    return (
      <div className="flex h-40 w-full max-w-sm items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        미리보기를 불러오는 중...
      </div>
    )
  }

  if (isError || !objectUrl) {
    return (
      <div className="flex h-40 w-full max-w-sm items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        이미지를 불러오지 못했습니다.
      </div>
    )
  }

  return (
    <img
      src={objectUrl}
      alt={file.originalName}
      className="max-h-80 w-auto max-w-full rounded-lg border object-contain"
    />
  )
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
          {files.map((file) => {
            const isImage = isDraftImageExtension(file.extension)
            return (
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
                  {!isImage && (
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
                  )}
                </div>
                {isImage && <DraftImagePreview draftId={draftId} file={file} />}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
