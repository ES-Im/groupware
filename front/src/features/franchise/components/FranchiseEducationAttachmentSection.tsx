import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Loader2, Paperclip, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { downloadEducationFile } from '../api/downloadEducationFile'
import { useEducationFileDeleteMutation } from '../api/useEducationFileDeleteMutation'
import { useEducationFilePreviewUrl } from '../api/useEducationFilePreviewUrl'
import { useEducationFileUploadMutation } from '../api/useEducationFileUploadMutation'
import { EducationFileValidationError } from '../lib/educationFileValidation'
import { isEducationImageExtension } from '../lib/isEducationImageExtension'
import type { FranchiseEducationFileInfo } from '../model/franchise'

function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function EducationImagePreview({
  educationId,
  file,
}: {
  educationId: number
  file: FranchiseEducationFileInfo
}) {
  const { objectUrl, isLoading, isError } = useEducationFilePreviewUrl(educationId, file.fileId)

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

export function FranchiseEducationAttachmentSection({
  educationId,
  files,
}: {
  educationId: number
  files: FranchiseEducationFileInfo[] | null
}) {
  const fileList = files ?? []

  const uploadMutation = useEducationFileUploadMutation()
  const deleteMutation = useEducationFileDeleteMutation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deletingFileIds, setDeletingFileIds] = useState<Set<number>>(new Set())

  function reportUploadError(error: unknown) {
    if (error instanceof EducationFileValidationError) {
      toast.error(error.message)
      return
    }
    toast.error(normalizeApiError(error).message)
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) {
      return
    }
    uploadMutation.mutate(
      { educationId, files: selected, existingFiles: fileList },
      {
        onSuccess: () => toast.success('첨부파일을 업로드했습니다'),
        onError: reportUploadError,
      },
    )
  }

  function handleDelete(fileId: number) {
    setDeletingFileIds((prev) => new Set(prev).add(fileId))
    deleteMutation.mutate(
      { educationId, fileId },
      {
        onSuccess: () => toast.success('첨부파일을 삭제했습니다'),
        onError: (error) => toast.error(normalizeApiError(error).message),
        onSettled: () => {
          setDeletingFileIds((prev) => {
            const next = new Set(prev)
            next.delete(fileId)
            return next
          })
        },
      },
    )
  }

  function handleDownload(file: FranchiseEducationFileInfo) {
    downloadEducationFile(educationId, file.fileId, file.originalName).catch((error: unknown) => {
      toast.error(normalizeApiError(error).message)
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Paperclip className="size-4" />
          첨부파일{fileList.length > 0 ? ` ${fileList.length}개` : ''}
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          disabled={uploadMutation.isPending}
          onChange={handleFileInputChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          {uploadMutation.isPending ? '업로드 중...' : '파일 추가'}
        </Button>
      </div>

      {fileList.length === 0 ? (
        <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {fileList.map((file) => {
            const isImage = isEducationImageExtension(file.extension)
            const isDeleting = deletingFileIds.has(file.fileId)
            return (
              <li
                key={file.fileId}
                className="space-y-2 rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Paperclip
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
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
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    className="shrink-0"
                    disabled={isDeleting}
                    onClick={() => handleDelete(file.fileId)}
                    aria-label={`${file.originalName} 삭제`}
                  >
                    {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  </Button>
                </div>
                {isImage && <EducationImagePreview educationId={educationId} file={file} />}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
