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
  /**
   * 이미지 영역을 고정 비율(aspect-[16/10]) 대신 부모가 준 남는 세로 공간으로 채운다(기본 false).
   * P7 병합 카드의 slider는 좁고 세로로 긴 트랙을 이미지로 꽉 채워야 해서 켠다(사용자 요청) — 단
   * 높이가 확정되는 lg 이상에서만 flex로 채우고, lg 미만(카드 높이 auto)에서는 채울 여유 높이가
   * 없어 이미지가 0으로 쭈그러들 수 있으므로 종전 aspect 비율을 유지한다.
   */
  fill?: boolean
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
      {/* fill(P7 slider)이면 lg에서 이미지 영역이 남는 높이를 flex로 채운다. 이미지는 object-cover라
          영역 중앙을 기준으로 채워지므로(슬라이스) 카드 센터에 놓인다. lg 미만은 종전 aspect 비율. */}
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
            {/* fill(P7/P4 slider)이면 이미지를 자르지 않고(object-contain) 카드 컨텐츠 영역에 맞게
                전체가 보이도록 축소한다(사용자 요청) — 남는 여백은 컨테이너 bg가 채운다. grid(P4 열람
                기본)는 종전대로 object-cover로 셀을 꽉 채운다. */}
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

/**
 * 안내 이미지 슬라이드(variant='slider', P7 관리 상세 전용 — 좌측 컬럼 3fr 트랙처럼 폭이 좁을 때
 * 여러 썸네일을 욱여넣기보다 큰 이미지 1장이 더 알아보기 쉽다). 한 번에 GalleryThumb 1장만 렌더하고,
 * 현재 인덱스는 이 컴포넌트 로컬 state(activeIndex)로만 관리한다 — 새 캐러셀 라이브러리를 도입하지
 * 않고(스택 고정 정책) 순수 좌우 버튼 + 조건부 렌더로 구현한다. 2장 이상일 때만 화살표·인디케이터를
 * 노출하고, 1장이면 그 이미지만 컨트롤 없이 보여준다. 다운로드·삭제·확대 라이트박스는 GalleryThumb를
 * 그대로 재사용해 동일하게 동작한다.
 */
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
  // 삭제 등으로 목록이 줄어들면 이전 인덱스가 범위를 벗어날 수 있어 매 렌더마다 안전하게 clamp한다.
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
    // lg에서 카드 높이를 채우도록 h-full flex-col. 이미지 트랙(flex-1)이 남는 높이를 가져가고
    // 인디케이터는 하단에 고정된다(shrink-0). lg 미만은 h auto라 GalleryThumb의 aspect가 높이를 정한다.
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
  /**
   * 항목별 삭제 버튼 노출 여부(기본 false). P4(T2.4-b, 일반 열람)는 미지정으로 두어 삭제 액션이
   * 새지 않게 하고, P7(M7 T7.2-c, 관리자 상세)만 명시적으로 true를 넘겨 활성화한다 — 이 컴포넌트가
   * 두 화면에 공유 소비되므로(F808) 삭제(F816)는 반드시 opt-in이어야 한다.
   */
  showDeleteAction?: boolean
  /**
   * 루트 Card에 얹을 추가 클래스(순수 시각). P7(관리 상세)이 좌측 컬럼 7:3 하단 트랙에서 이 카드가
   * 남는 높이를 채우도록(`lg:min-h-0`) 넘긴다 — 미지정(P4 열람)은 종전대로 콘텐츠 높이만 차지하는
   * 스택 배치라 영향이 없다.
   */
  className?: string
  /**
   * 카드 헤더 우측(CardAction 슬롯)에 렌더할 액션(순수 시각 슬롯). P7이 안내 이미지 업로드 버튼을
   * 이 카드 안으로 옮겨 배치하기 위해 주입한다(사용자 요청) — 미지정(P4 열람)은 헤더에 액션이
   * 노출되지 않는다(opt-in).
   */
  headerAction?: React.ReactNode
  /**
   * 미리보기 배치 방식(기본 'grid'). 'grid'는 종전처럼 여러 장을 격자로 나열한다(P4 일반 열람 —
   * 폭이 넉넉해 여러 썸네일을 한 번에 보여주는 편이 자연스럽다). 'slider'는 한 번에 1장을 크게
   * 보여주고 화살표·인디케이터로 넘긴다(P7 관리 상세, 좌측 컬럼 3fr 트랙 opt-in). 두 값 모두
   * GalleryThumb(확대 라이트박스·다운로드·삭제)를 그대로 재사용한다.
   */
  variant?: 'grid' | 'slider'
  /**
   * 카드 래퍼 없이 내용만 렌더한다(기본 false). P7(관리 상세)이 회의실 정보와 안내 이미지를 하나의
   * Card로 병합하기 위해(사용자 요청) 이 갤러리를 그 카드 안의 아래 섹션으로 끼워 넣을 때 켠다 —
   * 켜면 자체 `<Card>`/`<CardHeader>` 대신 제목(+headerAction) 행과 콘텐츠를 세로 flex 섹션으로
   * 렌더해 부모가 준 높이를 채운다. 미지정(P4 열람)은 종전대로 독립 Card 그대로다.
   */
  unwrapped?: boolean
}

/**
 * 회의실 안내 이미지 갤러리 공유 컴포넌트(ROADMAP(MEETING-ROOMS) T2.4-a, F808 / 삭제는 T7.2-c, F816).
 *
 * `meetingRoomId` props만으로 독립 렌더 가능 — P4(T2.4-b)·P7(M7 T7.2)이 공유 소비한다.
 * 회의실 첨부는 정책상 이미지 전용(jpg/jpeg/png, PRD Open Q#3 확정)이라 board의 확장자 분기
 * (`isImageExtension`) 없이 전 항목을 썸네일로 렌더하고, 각 항목에 다운로드·삭제(opt-in) 버튼과
 * 클릭 확대 라이트박스를 둔다. 미리보기 배치는 variant로 분기한다(기본 'grid' — P4는 미지정으로
 * 두어 종전 그리드 그대로, P7만 'slider'를 opt-in).
 */
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

  // 콘텐츠(로딩/에러/빈/슬라이더/그리드)와 라이트박스는 wrapped(P4)·unwrapped(P7) 양쪽이 공유한다.
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

  // unwrapped(P7 병합 카드): 자체 Card 없이 제목 행 + 콘텐츠를 세로 flex 섹션으로 렌더한다. 부모
  // (병합 카드의 안내 이미지 트랙)가 준 높이를 h-full로 채우고, 콘텐츠가 남는 높이를 flex-1로
  // 가져가 slider 이미지가 트랙을 꽉 채운다. 제목 행 스타일은 wrapped의 CardHeader/CardTitle과 맞춘다.
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
    // className은 P7이 넘기는 높이 제어(`lg:min-h-0`)를 루트 Card에 얹기 위한 통로다 — P7의 3fr
    // 그리드 트랙이 이 Card를 그 높이로 stretch하므로, min-h-0이 있어야 내용이 넘칠 때 아래
    // CardContent의 overflow-y-auto가 실제로 동작한다(없으면 min-content가 트랙을 밀어낸다).
    <Card className={className}>
      <CardHeader className="border-b">
        <CardTitle>안내 이미지</CardTitle>
        {/* headerAction: P7이 주입한 이미지 업로드 버튼 자리(P4 열람은 미지정이라 비노출). */}
        {headerAction ? <CardAction>{headerAction}</CardAction> : null}
      </CardHeader>
      {/* P7처럼 Card가 그리드 트랙 높이로 stretch되면 이 본문이 남는 높이를 채우고 넘칠 때만 세로
          스크롤한다. P4(Card 높이 auto)에서는 채울 여유 높이가 없어 flex-1/overflow가 무효라
          종전과 동일하다. */}
      <CardContent className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto">{content}</CardContent>
      {lightbox}
    </Card>
  )
}
