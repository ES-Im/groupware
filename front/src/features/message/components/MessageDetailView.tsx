import { useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { ArrowLeft, Reply, Trash2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
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
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { useMarkMessageReadMutation } from '../api/useMarkMessageReadMutation'
import { useMessageDetailQuery } from '../api/useMessageDetailQuery'
import type { MailBox } from '../model/messageTypes'
import { MessageAttachmentSection } from './MessageAttachmentSection'

/**
 * 쪽지 일시 표시 포맷. 목록(MessageBoxTable)과 동일 포맷이되, 상세에서는 null(임시보관 미발송)을
 * 대시가 아니라 '미발송'으로 명시한다(PRD §쪽지 상세 뷰 — 상세는 상태를 문구로 설명할 지면이 있다).
 */
function formatMessageDateTime(value: string | null): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '미발송'
}

/** 부서명(널러블) + 이름 표기 — MessageBoxTable formatCounterpart의 발신자 표기 규칙과 동일. */
function formatPersonName(deptName: string | null, name: string): string {
  return deptName ? `${deptName} ${name}` : name
}

interface MessageDetailActionsProps {
  box: MailBox
  /** 휴지통 상세에서 복구/완전삭제 노출 판정(내가 버린 쪽지에만 생명주기 액션이 성립). */
  isTrashedByMe: boolean
  onReply?: () => void
  onTrash?: () => void
  onRestore?: () => void
  onDelete?: () => void
}

/**
 * 박스별 액션 버튼 셸(받은=답장+휴지통 이동, 보낸=휴지통 이동, 휴지통=복구+완전 삭제).
 * mutation 배선은 T3.4-b(휴지통 생명주기)·T4.4(답장) 몫이라 여기서는 optional 콜백 prop만 받고,
 * 미제공 시 disabled로 렌더한다(ROADMAP T3.3-a·T3.4-b Done 조건 "콜백 미제공 시 disabled").
 */
function MessageDetailActions({
  box,
  isTrashedByMe,
  onReply,
  onTrash,
  onRestore,
  onDelete,
}: MessageDetailActionsProps) {
  // 임시보관함 행은 상세가 아니라 편집(작성 뷰)으로 열린다(MessageBoxTable 행 분기) — 방어적 미노출.
  if (box === 'drafts') {
    return null
  }

  if (box === 'trash') {
    // 휴지통 목록은 내가 버린 쪽지만 내려오지만, 서버 판정 필드를 신뢰해 한 번 더 가드한다.
    if (!isTrashedByMe) {
      return null
    }
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRestore}
          disabled={onRestore == null}
        >
          <Undo2 />
          복구
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" size="sm" disabled={onDelete == null}>
              <Trash2 />
              완전 삭제
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>쪽지를 완전 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>삭제한 쪽지는 복구할 수 없습니다.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {box === 'received' && (
        <Button type="button" size="sm" onClick={onReply} disabled={onReply == null}>
          <Reply />
          답장
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onTrash}
        disabled={onTrash == null}
      >
        <Trash2 />
        휴지통 이동
      </Button>
    </div>
  )
}

interface MessageDetailViewProps {
  messageId: number
  box: MailBox
  onBack: () => void
  /** 액션 콜백은 T3.4-b(휴지통 생명주기)·T4.4(답장)가 상위(MessageBoxPage)에서 주입한다. */
  onReply?: () => void
  onTrash?: () => void
  onRestore?: () => void
  onDelete?: () => void
}

/**
 * 쪽지 상세 뷰 컨테이너(ROADMAP(MESSAGE) T3.3-a, F1505·F1511, PRD §페이지별 상세 쪽지 상세 뷰).
 *
 * MessageBoxPage(T2.2-a)가 activeView==='detail'일 때 카드 내 뷰 전환으로 마운트하는 read-only
 * 상세 화면이다. useMessageDetailQuery(T3.1)를 소비해 제목·발신자·수신자 전체·일시·본문을 렌더하고,
 * 보낸함에서는 수신자별 isRead 읽음 현황을 Badge로 표기한다(approval CirculationSection의
 * 읽음/미열람 Badge 패턴 이식). 첨부 영역은 T3.3-b(MessageAttachmentSection)에 messageId 단일
 * prop으로 위임한다.
 *
 * 받은쪽지 자동 읽음(F1511): box==='received'이고 상세 로드가 성공해 실제 열람이 성립한 시점에
 * useMarkMessageReadMutation(T3.1)을 messageId당 1회만 호출한다. 로드 실패(403/404)에는 호출하지
 * 않는다 — 열람하지 못한 쪽지를 읽음 처리하지 않고, GET·PATCH가 같은 원인으로 연달아 실패해
 * 에러 토스트가 중복되는 것도 막는다.
 *
 * 조회 실패 처리(DraftDetailPage 컨벤션): 404(MESSAGE_NOT_FOUND)·403은 목록 복귀 안내 UX로
 * 렌더하고, 그 외 실패만 토스트로 알린다(apiError 매핑 소비, 에러코드 추측 금지).
 */
export function MessageDetailView({
  messageId,
  box,
  onBack,
  onReply,
  onTrash,
  onRestore,
  onDelete,
}: MessageDetailViewProps) {
  const detailQuery = useMessageDetailQuery(messageId)
  const { mutate: markRead } = useMarkMessageReadMutation()
  // 자동 읽음을 이미 보낸 messageId 기록. 같은 쪽지의 재렌더·refetch(읽음 204 → messageKeys.all
  // invalidate로 상세가 다시 로드됨)에도 mutate가 반복되지 않게 가드한다. StrictMode(dev)의
  // 이중 이펙트 실행에서도 ref는 인스턴스에 유지되므로 정확히 1회만 호출된다.
  const autoReadMessageIdRef = useRef<number | null>(null)

  const detail = detailQuery.data

  useEffect(() => {
    if (box !== 'received' || detail == null) {
      return
    }
    if (autoReadMessageIdRef.current === messageId) {
      return
    }
    autoReadMessageIdRef.current = messageId
    markRead(messageId)
  }, [box, messageId, detail, markRead])

  // 404/403은 아래에서 목록 복귀 안내 UX로 렌더하므로, 그 외 실패만 토스트로 알린다.
  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  const backButton = (
    <Button type="button" variant="outline" size="sm" onClick={onBack}>
      <ArrowLeft />
      목록으로
    </Button>
  )

  if (detailQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div>{backButton}</div>
        <p className="py-8 text-center text-sm text-muted-foreground">쪽지를 불러오는 중...</p>
      </div>
    )
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    const guidance = isNotFound(apiError)
      ? '쪽지를 찾을 수 없습니다. 삭제되었거나 접근할 수 없는 쪽지입니다.'
      : isForbidden(apiError)
        ? '이 쪽지를 조회할 권한이 없습니다.'
        : '쪽지를 불러오지 못했습니다.'
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10">
        <p className="text-sm text-muted-foreground">{guidance}</p>
        {backButton}
      </div>
    )
  }

  // 로딩·에러 분기를 모두 통과한 렌더 직전 최종 가드. data! non-null 단언 없이 좁힌다.
  if (detail == null) {
    return null
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* 상단 액션 바: 좌 목록 복귀 / 우 박스별 액션 셸(DraftDetailPage 액션 바 배치 동형). */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {backButton}
        <MessageDetailActions
          box={box}
          isTrashedByMe={detail.isTrashedByMe}
          onReply={onReply}
          onTrash={onTrash}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      </div>

      <Card className="min-w-0">
        <CardContent className="space-y-5">
          <h2 className="text-xl font-bold tracking-tight break-all text-foreground">
            {detail.title}
          </h2>

          {/* 발신자 정보 줄: 아바타 + 이름/부서 + 우측 정렬 일시(레퍼런스 메일함 톤). */}
          <div className="flex items-center gap-3">
            <BlobAvatar
              empId={undefined}
              fileId={undefined}
              fallbackText={detail.senderName}
              className="size-11"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{detail.senderName}</p>
              {detail.senderDeptName && (
                <p className="truncate text-xs text-muted-foreground">{detail.senderDeptName}</p>
              )}
            </div>
            <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {formatMessageDateTime(detail.sentAt)}
            </time>
          </div>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">받는 사람</h3>
            {detail.receivers.length === 0 ? (
              <p className="text-sm text-muted-foreground">지정된 수신자가 없습니다.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {detail.receivers.map((receiver) => (
                  <li
                    key={receiver.receiverId}
                    className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {formatPersonName(receiver.receiverDeptName, receiver.receiverName)}
                    </span>
                    {/* 수신자별 읽음 현황은 발신자 관점 정보라 보낸함에서만 표기한다(F1502·PRD). */}
                    {box === 'sent' &&
                      (receiver.isRead ? (
                        <Badge variant="secondary">읽음</Badge>
                      ) : (
                        <Badge variant="outline">미열람</Badge>
                      ))}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">내용</h3>
            <div className="min-h-[160px] rounded-lg bg-muted/40 p-4 text-sm leading-7 break-words whitespace-pre-wrap">
              {detail.content}
            </div>
          </section>
        </CardContent>
      </Card>

      {/* 첨부 섹션(T3.3-b 소유): messageId 단일 prop 계약으로 마운트한다. */}
      <Card>
        <CardContent>
          <MessageAttachmentSection messageId={messageId} />
        </CardContent>
      </Card>
    </div>
  )
}
