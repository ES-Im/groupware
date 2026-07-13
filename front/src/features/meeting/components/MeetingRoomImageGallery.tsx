import { useEffect, useState } from 'react'
import { Download, Loader2, Maximize2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
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
}

/**
 * 갤러리 썸네일 카드. objectURL 생명주기는 `useMeetingRoomFilePreviewUrl`(T2.2)에 위임하고,
 * 이미지 영역(확대) + 파일명/다운로드/삭제 캡션을 렌더한다.
 *
 * 확대 트리거는 img를 감싸지 않는 별도 오버레이 버튼으로 둔다 — img(alt=파일명)를 감싼 버튼은
 * 접근성 이름이 파일명이 되어 다운로드 버튼과 충돌하기 때문이다.
 */
function GalleryThumb({
  meetingRoomId,
  file,
  showDeleteAction,
  isDeleting,
  onOpen,
  onDownload,
  onDelete,
}: GalleryThumbProps) {
  const { objectUrl, isLoading, isError } = useMeetingRoomFilePreviewUrl(meetingRoomId, file.fileId)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[16/10] bg-muted/40">
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
            <img src={objectUrl} alt={file.originalName} className="h-full w-full object-cover" />
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

interface MeetingRoomImageGalleryProps {
  meetingRoomId: number
  /**
   * 항목별 삭제 버튼 노출 여부(기본 false). P4(T2.4-b, 일반 열람)는 미지정으로 두어 삭제 액션이
   * 새지 않게 하고, P7(M7 T7.2-c, 관리자 상세)만 명시적으로 true를 넘겨 활성화한다 — 이 컴포넌트가
   * 두 화면에 공유 소비되므로(F808) 삭제(F816)는 반드시 opt-in이어야 한다.
   */
  showDeleteAction?: boolean
}

/**
 * 회의실 안내 이미지 갤러리 공유 컴포넌트(ROADMAP(MEETING-ROOMS) T2.4-a, F808 / 삭제는 T7.2-c, F816).
 *
 * `meetingRoomId` props만으로 독립 렌더 가능 — P4(T2.4-b)·P7(M7 T7.2)이 공유 소비한다.
 * 회의실 첨부는 정책상 이미지 전용(jpg/jpeg/png, PRD Open Q#3 확정)이라 board의 확장자 분기
 * (`isImageExtension`) 없이 전 항목을 썸네일로 렌더하고, 각 항목에 다운로드·삭제(opt-in) 버튼과
 * 클릭 확대 라이트박스를 둔다.
 */
export function MeetingRoomImageGallery({ meetingRoomId, showDeleteAction = false }: MeetingRoomImageGalleryProps) {
  const { data, error, isLoading } = useMeetingRoomFilesQuery(meetingRoomId)
  const deleteMutation = useMeetingRoomFileDeleteMutation()

  // 삭제 진행 중인 fileId 집합(BoardEditAttachments와 동일 이유) — 단일 deleteMutation 인스턴스의
  // variables/isPending은 "마지막 mutate 호출" 값만 반영해, A 삭제 중 B를 누르면 A행의 disabled가
  // 풀려 중복 DELETE가 나갈 수 있다. fileId별로 로컬 state에서 개별 추적한다.
  const [deletingFileIds, setDeletingFileIds] = useState<Set<number>>(new Set())
  // 라이트박스로 확대 중인 이미지(파일 + 프리뷰 objectURL). null이면 닫힘.
  const [activeImage, setActiveImage] = useState<{ file: MeetingRoomFile; url: string } | null>(null)

  // not-found는 본문에서 전용 문구로 안내하므로, 그 외 실패만 토스트로 알린다.
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

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>안내 이미지</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : error ? (
          <p className="text-sm text-muted-foreground">
            {isNotFound(normalizeApiError(error)) ? '회의실을 찾을 수 없습니다.' : '안내 이미지를 불러오지 못했습니다.'}
          </p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 안내 이미지가 없습니다.</p>
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
        )}
      </CardContent>

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
    </Card>
  )
}
