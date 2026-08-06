import { useEffect, useRef, useState } from 'react'
import { Loader2, Paperclip, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Label } from '@/shared/ui/label'
import { useBoardFileDeleteMutation } from '../api/useBoardFileDeleteMutation'
import { useBoardFilesQuery } from '../api/useBoardFilesQuery'
import { useBoardFileUploadMutation } from '../api/useBoardFileUploadMutation'
import { BoardFileValidationError } from '../lib/fileValidation'

function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function BoardEditAttachments({
  boardId,
  flat = false,
}: {
  boardId: number
  flat?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const filesQuery = useBoardFilesQuery(boardId)
  const uploadMutation = useBoardFileUploadMutation()
  const deleteMutation = useBoardFileDeleteMutation()
  const files = filesQuery.data ?? []

  const [deletingFileIds, setDeletingFileIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!filesQuery.error) {
      return
    }
    toast.error(normalizeApiError(filesQuery.error).message)
  }, [filesQuery.error])

  function reportUploadError(error: unknown) {
    if (error instanceof BoardFileValidationError) {
      toast.error(error.message)
      return
    }
    toast.error(normalizeApiError(error).message)
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) {
      return
    }
    uploadMutation.mutate(
      { boardId, files: selected, existingFiles: files },
      {
        onSuccess: () => toast.success('첨부파일을 업로드했습니다'),
        onError: reportUploadError,
      },
    )
  }

  function handleDelete(fileId: number) {
    setDeletingFileIds((prev) => new Set(prev).add(fileId))
    deleteMutation.mutate(
      { boardId, fileId },
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

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      className="hidden"
      disabled={uploadMutation.isPending}
      onChange={handleFileInputChange}
    />
  )

  const attachmentList = filesQuery.isLoading ? (
    <p className="text-sm text-muted-foreground">첨부파일을 불러오는 중...</p>
  ) : files.length === 0 ? (
    <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>
  ) : (
    <ul className="flex flex-col gap-2">
      {files.map((file) => {
        const isDeleting = deletingFileIds.has(file.fileId)
        return (
          <li
            key={file.fileId}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <span className="min-w-0 truncate text-sm text-foreground">{file.originalName}</span>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-muted-foreground">{formatFileSizeMb(file.fileSize)}</span>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                disabled={isDeleting}
                onClick={() => handleDelete(file.fileId)}
                aria-label={`${file.originalName} 삭제`}
              >
                {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )

  if (flat) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>첨부파일{files.length > 0 && ` ${files.length}개`}</Label>
        {fileInput}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          {uploadMutation.isPending ? '업로드 중...' : '파일 추가'}
        </Button>
        {attachmentList}
      </div>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-1.5">
            <Paperclip className="size-4" />
            첨부파일{files.length > 0 && ` ${files.length}개`}
          </CardTitle>
          {fileInput}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            {uploadMutation.isPending ? '업로드 중...' : '파일 추가'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>{attachmentList}</CardContent>
    </Card>
  )
}
