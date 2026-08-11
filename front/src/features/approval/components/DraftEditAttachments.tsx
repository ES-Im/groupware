import { useRef, useState, type ChangeEvent } from 'react'
import { FileText, FileUp, Loader2, Paperclip, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useDraftFileDeleteMutation } from '../api/useDraftFileDeleteMutation'
import { useDraftFileUploadMutation } from '../api/useDraftFileUploadMutation'
import { DraftFileValidationError } from '../lib/draftFileValidation'
import type { DraftFile } from '../model/draftDetail'

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function DraftEditAttachments({ draftId, files }: { draftId: number; files: DraftFile[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useDraftFileUploadMutation()
  const deleteMutation = useDraftFileDeleteMutation()
  const [deletingFileIds, setDeletingFileIds] = useState<Set<number>>(new Set())

  function reportUploadError(error: unknown) {
    if (error instanceof DraftFileValidationError) {
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
      { draftId, files: selected, existingFiles: files },
      {
        onSuccess: () => toast.success('첨부파일을 업로드했습니다'),
        onError: reportUploadError,
      },
    )
  }

  function handleDelete(fileId: number) {
    setDeletingFileIds((prev) => new Set(prev).add(fileId))
    deleteMutation.mutate(
      { draftId, fileId },
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

  return (
    <Card className="rounded-2xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Paperclip className="size-4 text-muted-foreground" />
          첨부파일
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            {uploadMutation.isPending ? '업로드 중...' : '파일 추가'}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          aria-label="기안서 첨부파일"
          disabled={uploadMutation.isPending}
          onChange={handleFileInputChange}
        />
        {files.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-border py-4 text-center text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <FileUp className="size-6" />
            <p className="text-xs">파일을 드래그하거나 선택하세요</p>
          </button>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {files.map((file) => {
              const isDeleting = deletingFileIds.has(file.fileId)
              return (
                <li
                  key={file.fileId}
                  className="flex items-center gap-2 rounded-xl bg-muted/50 p-2.5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                    <FileText className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-sm font-medium"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {file.extension.toUpperCase()} · {formatFileSize(file.fileSize)}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`${file.originalName} 삭제`}
                    disabled={isDeleting}
                    onClick={() => handleDelete(file.fileId)}
                  >
                    {isDeleting ? <Loader2 className="animate-spin" /> : <X />}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
