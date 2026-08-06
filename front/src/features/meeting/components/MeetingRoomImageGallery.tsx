import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Loader2, Maximize2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { handleApiError, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { downloadMeetingRoomFile } from '../api/downloadMeetingRoomFile'
import { useMeetingRoomFileDeleteMutation } from '../api/useMeetingRoomFileDeleteMutation'
import { useMeetingRoomFilePreviewUrl } from '../api/useMeetingRoomFilePreviewUrl'
import { useMeetingRoomFilesQuery } from '../api/useMeetingRoomFilesQuery'
import type { MeetingRoomFile } from '../model/meeting'

interface GalleryThumbProps {
  meetingRoomId: number
  file: MeetingRoomFile
  showDeleteAction: boolean
  isDeleting: boolean
  onOpen: (objectUrl: string) => void
  onDownload: () => void
  onDelete: () => void
  fill?: boolean
}

function GalleryThumb({
  meetingRoomId,
  file,
  showDeleteAction,
  isDeleting,
  onOpen,
  onDownload,
  onDelete,
  fill = false,
}: GalleryThumbProps) {
  const { objectUrl, isLoading, isError } = useMeetingRoomFilePreviewUrl(meetingRoomId, file.fileId)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card',
        fill && 'lg:flex lg:h-full lg:min-h-0 lg:flex-col',
      )}
    >
      <div className={cn('relative bg-muted/40', fill ? 'aspect-[16/10] lg:aspect-auto lg:min-h-0 lg:flex-1' : 'aspect-[16/10]')}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            불러오는 중...
          </div>
        ) : isError || !objectUrl ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            이미지를 불러오지 못했습니다.
          </div>
        ) : (
          <>
            <img
              src={objectUrl}
              alt={file.originalName}
              className={cn('h-full w-full', fill ? 'object-contain' : 'object-cover')}
            />
            <button
              type="button"
              aria-label="안내 이미지 크게 보기"
              onClick={() => onOpen(objectUrl)}
              className="group absolute inset-0 flex items-center justify-center bg-foreground/25 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
            >
              <Maximize2 className="size-5 text-background" />
            </button>
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
        <span className="truncate text-xs font-medium text-muted-foreground">{file.originalName}</span>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${file.originalName} 다운로드`}
            onClick={onDownload}
          >
            <Download />
          </Button>
          {showDeleteAction && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  disabled={isDeleting}
                  aria-label={`${file.originalName} 삭제`}
                >
                  {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>안내 이미지를 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>삭제한 이미지는 되돌릴 수 없습니다.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  )
}

interface MeetingRoomImageSliderProps {
  meetingRoomId: number
  files: MeetingRoomFile[]
  showDeleteAction: boolean
  deletingFileIds: Set<number>
  onOpen: (file: MeetingRoomFile, url: string) => void
  onDownload: (file: MeetingRoomFile) => void
  onDelete: (fileId: number) => void
}

function MeetingRoomImageSlider({
  meetingRoomId,
  files,
  showDeleteAction,
  deletingFileIds,
  onOpen,
  onDownload,
  onDelete,
}: MeetingRoomImageSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const safeIndex = Math.min(activeIndex, files.length - 1)
  const file = files[safeIndex]
  const hasMultiple = files.length > 1

  function goPrev() {
    setActiveIndex((safeIndex - 1 + files.length) % files.length)
  }
  function goNext() {
    setActiveIndex((safeIndex + 1) % files.length)
  }

  return (
    <div className="flex flex-col gap-3 lg:h-full">
      <div className="relative lg:min-h-0 lg:flex-1">
        <GalleryThumb
          key={file.fileId}
          meetingRoomId={meetingRoomId}
          file={file}
          showDeleteAction={showDeleteAction}
          isDeleting={deletingFileIds.has(file.fileId)}
          onOpen={(url) => onOpen(file, url)}
          onDownload={() => onDownload(file)}
          onDelete={() => onDelete(file.fileId)}
          fill
        />
        {hasMultiple && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              aria-label="이전 이미지"
              onClick={goPrev}
              className="absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full shadow-sm"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              aria-label="다음 이미지"
              onClick={goNext}
              className="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full shadow-sm"
            >
              <ChevronRight />
            </Button>
          </>
        )}
      </div>
      {hasMultiple && (
        <div className="flex shrink-0 items-center justify-center gap-1.5">
          {files.map((item, index) => (
            <button
              key={item.fileId}
              type="button"
              aria-label={`${index + 1}번째 이미지로 이동`}
              aria-current={index === safeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'size-2 rounded-full transition-colors',
                index === safeIndex ? 'bg-primary' : 'bg-muted-foreground/30',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface MeetingRoomImageGalleryProps {
  meetingRoomId: number
  showDeleteAction?: boolean
  className?: string
  headerAction?: React.ReactNode
  variant?: 'grid' | 'slider'
  unwrapped?: boolean
}

export function MeetingRoomImageGallery({
  meetingRoomId,
  showDeleteAction = false,
  className,
  headerAction,
  variant = 'grid',
  unwrapped = false,
}: MeetingRoomImageGalleryProps) {
  const { data, error, isLoading } = useMeetingRoomFilesQuery(meetingRoomId)
  const deleteMutation = useMeetingRoomFileDeleteMutation()

  const [deletingFileIds, setDeletingFileIds] = useState<Set<number>>(new Set())
  const [activeImage, setActiveImage] = useState<{ file: MeetingRoomFile; url: string } | null>(null)

  useEffect(() => {
    if (!error) {
      return
    }
    const apiError = normalizeApiError(error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [error])

  function handleDownload(file: MeetingRoomFile) {
    downloadMeetingRoomFile(meetingRoomId, file.fileId, file.originalName).catch((downloadError: unknown) => {
      toast.error(normalizeApiError(downloadError).message)
    })
  }

  function handleDelete(fileId: number) {
    setDeletingFileIds((prev) => new Set(prev).add(fileId))
    deleteMutation.mutate(
      { meetingRoomId, fileId },
      {
        onSuccess: () => toast.success('안내 이미지를 삭제했습니다'),
        onError: (deleteError) => handleApiError(deleteError, { toast }),
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

  const files = data ?? []

  const content = isLoading ? (
    <p className="text-sm text-muted-foreground">불러오는 중...</p>
  ) : error ? (
    <p className="text-sm text-muted-foreground">
      {isNotFound(normalizeApiError(error)) ? '회의실을 찾을 수 없습니다.' : '안내 이미지를 불러오지 못했습니다.'}
    </p>
  ) : files.length === 0 ? (
    <p className="text-sm text-muted-foreground">등록된 안내 이미지가 없습니다.</p>
  ) : variant === 'slider' ? (
    <MeetingRoomImageSlider
      meetingRoomId={meetingRoomId}
      files={files}
      showDeleteAction={showDeleteAction}
      deletingFileIds={deletingFileIds}
      onOpen={(file, url) => setActiveImage({ file, url })}
      onDownload={handleDownload}
      onDelete={handleDelete}
    />
  ) : (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file) => (
        <GalleryThumb
          key={file.fileId}
          meetingRoomId={meetingRoomId}
          file={file}
          showDeleteAction={showDeleteAction}
          isDeleting={deletingFileIds.has(file.fileId)}
          onOpen={(url) => setActiveImage({ file, url })}
          onDownload={() => handleDownload(file)}
          onDelete={() => handleDelete(file.fileId)}
        />
      ))}
    </div>
  )

  const lightbox = (
    <Dialog
      open={activeImage !== null}
      onOpenChange={(open) => {
        if (!open) {
          setActiveImage(null)
        }
      }}
    >
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <DialogTitle className="truncate">{activeImage?.file.originalName ?? ''}</DialogTitle>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="이미지 다운로드"
              onClick={() => activeImage && handleDownload(activeImage.file)}
            >
              <Download />
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="미리보기 닫기">
                <X />
              </Button>
            </DialogClose>
          </div>
        </div>
        {activeImage && (
          <img
            src={activeImage.url}
            alt={activeImage.file.originalName}
            className="max-h-[72vh] w-full bg-foreground/90 object-contain"
          />
        )}
      </DialogContent>
    </Dialog>
  )

  if (unwrapped) {
    return (
      <div className={cn('flex h-full min-h-0 flex-col gap-4 px-(--card-spacing) py-(--card-spacing)', className)}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b pb-4">
          <div className="font-heading text-base leading-snug font-medium text-foreground">안내 이미지</div>
          {headerAction ?? null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
        {lightbox}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <CardTitle>안내 이미지</CardTitle>
        {headerAction ? <CardAction>{headerAction}</CardAction> : null}
      </CardHeader>
      <CardContent className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto">{content}</CardContent>
      {lightbox}
    </Card>
  )
}
