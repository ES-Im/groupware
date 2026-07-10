import { useEffect, useState } from 'react'
import { Download, Loader2, Trash2 } from 'lucide-react'
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
import { downloadMeetingRoomFile } from '../api/downloadMeetingRoomFile'
import { useMeetingRoomFileDeleteMutation } from '../api/useMeetingRoomFileDeleteMutation'
import { useMeetingRoomFilePreviewUrl } from '../api/useMeetingRoomFilePreviewUrl'
import { useMeetingRoomFilesQuery } from '../api/useMeetingRoomFilesQuery'
import type { MeetingRoomFile } from '../model/meeting'

/**
 * 첨부 이미지 인라인 미리보기. objectURL 생명주기는 `useMeetingRoomFilePreviewUrl`(T2.2)에
 * 전부 위임하고, 이 컴포넌트는 로딩/실패/성공 3분기 렌더만 담당한다(board `BoardImagePreview`와 동형).
 */
function MeetingRoomImagePreview({
  meetingRoomId,
  file,
}: {
  meetingRoomId: number
  file: MeetingRoomFile
}) {
  const { objectUrl, isLoading, isError } = useMeetingRoomFilePreviewUrl(meetingRoomId, file.fileId)

  if (isLoading) {
    return (
      <div className="flex h-40 w-full max-w-sm items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        불러오는 중...
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
      className="max-h-64 w-auto max-w-full rounded-lg border object-contain"
    />
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
 * (`isImageExtension`) 없이 전 항목을 미리보기로 렌더하고, 각 항목에 다운로드 버튼을 함께 둔다.
 */
export function MeetingRoomImageGallery({ meetingRoomId, showDeleteAction = false }: MeetingRoomImageGalleryProps) {
  const { data, error, isLoading } = useMeetingRoomFilesQuery(meetingRoomId)
  const deleteMutation = useMeetingRoomFileDeleteMutation()

  // 삭제 진행 중인 fileId 집합(BoardEditAttachments와 동일 이유) — 단일 deleteMutation 인스턴스의
  // variables/isPending은 "마지막 mutate 호출" 값만 반영해, A 삭제 중 B를 누르면 A행의 disabled가
  // 풀려 중복 DELETE가 나갈 수 있다. fileId별로 로컬 state에서 개별 추적한다.
  const [deletingFileIds, setDeletingFileIds] = useState<Set<number>>(new Set())

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
      <CardHeader>
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
          <div className="flex flex-wrap gap-4">
            {files.map((file) => {
              const isDeleting = deletingFileIds.has(file.fileId)
              return (
                <div key={file.fileId} className="flex flex-col items-start gap-2">
                  <MeetingRoomImagePreview meetingRoomId={meetingRoomId} file={file} />
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleDownload(file)}>
                      <Download />
                      {file.originalName}
                    </Button>
                    {showDeleteAction && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            disabled={isDeleting}
                            aria-label={`${file.originalName} 삭제`}
                          >
                            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>안내 이미지를 삭제하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription>
                              삭제한 이미지는 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(file.fileId)} disabled={isDeleting}>
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
