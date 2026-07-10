import { Fragment, useEffect, useLayoutEffect, useRef } from 'react'
import type { UIEvent } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { useChatMessagesQuery } from '../api/useChatMessagesQuery'
import { useChatRoomDetailQuery } from '../api/useChatRoomDetailQuery'
import { useChatRoomSubscription } from '../hooks/useChatRoomSubscription'
import { useReadPositionSync } from '../hooks/useReadPositionSync'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { parseEmpFilePreviewFileId } from '../lib/parseEmpFilePreviewFileId'
import type { ChatMessage } from '../model/chatMessage'
import { ChatMessageInput } from './ChatMessageInput'
import { ChatRoomAvatar } from './ChatRoomAvatar'
import { ChatRoomSettingsMenu } from './ChatRoomSettingsMenu'

/** 상단 스크롤 도달 판정 여유값(px). 정확히 0에서만 반응하면 관성 스크롤 끝에서 씹힐 수 있다. */
const SCROLL_TOP_THRESHOLD = 24

/**
 * 채팅방 대화 화면(F902, ROADMAP(CHAT) T2.1, docs/prd/9.chat-prd.md §페이지별 상세(대화 화면)).
 *
 * 채팅 오버레이(`ChatOverlayPanel`)에서 `selectedRoomId`가 정해지면 그 값을 `roomId` prop으로
 * 받아 렌더된다. `useChatRoomDetailQuery`(CHAT_ROOM_DETAIL)로 상세를 조회해 헤더(방 표시명·
 * isGroup 파생 문구)와 참여자 목록(BlobAvatar)을 렌더하고, `ChatMessageArea`(F903, T2.2)가
 * 과거 메시지 cursor 무한스크롤 본문을 담당한다. `useChatRoomSubscription`(F904, T2.3-a·
 * T2.3-b)이 방 토픽 SUBSCRIBE/UNSUBSCRIBE lifecycle과 수신 메시지 append/dedup을,
 * `ChatMessageInput`(F905, T2.4)이 발신(낙관 렌더+SEND)을 담당한다. `useReadPositionSync`
 * (F911, T2.5)가 방 진입·실시간 수신 시 읽음 위치를 갱신해 목록의 unreadMessageCount를
 * 해소한다(ChatMessageArea 내부에서 호출 — 최신 확정 메시지 id를 이미 그 컴포넌트가 계산해
 * 두었다). `ChatRoomSettingsMenu`(T4.1)가 헤더에 방 설정 메뉴(초대/표시명 수정/나가기 진입점 +
 * 즐겨찾기 토글 재사용)를 담당한다.
 *
 * roomId는 오버레이 스토어(`chatOverlayStore`)가 이미 number 타입만 담으므로, 과거 라우트
 * param 시절의 10진 양의 정수 형식 가드(route param은 신뢰 불가 문자열이었다)는 죽은 코드라
 * 제거했다.
 *
 * 이 UI는 이후 adapt-ui 스킬로 비주얼이 교체될 예정이라, ChatRoomListPanel(T1.2)과 동일하게
 * shadcn 컴포넌트 기본형만 사용하고 레이아웃/비주얼 디테일에는 투자하지 않는다.
 *
 * 조회 실패 처리(apiError 매핑 소비·reissue 금지): 비멤버 접근은 서버가 403 또는 `CHAT_*`
 * 도메인 에러(404 계열)로 거부하므로, not-found(404)·forbidden(403)은 전용 안내 UX로 렌더하고
 * 그 외 실패만 토스트로 알린다(DraftDetailPage/BoardDetailPage 컨벤션 복제).
 */
export function ChatRoomDetailPanel({ roomId }: { roomId: number }) {
  const backToList = useChatOverlayStore((state) => state.backToList)
  const startInviteFlow = useChatOverlayStore((state) => state.startInviteFlow)

  const detailQuery = useChatRoomDetailQuery(roomId)
  // 방 진입 시 방 토픽 SUBSCRIBE, 방 이탈/전환·연결 끊김 시 UNSUBSCRIBE(ROADMAP(CHAT) T2.3-a).
  // 조건부 이른 반환보다 앞서 호출해야 하는 훅이라 detailQuery 로딩/에러 분기와 무관하게 항상 호출한다.
  useChatRoomSubscription(roomId)

  // not-found/forbidden은 아래에서 전용 UX로 렌더하므로, 그 외 실패만 토스트로 알린다.
  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  function handleBack() {
    backToList()
  }

  const backButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0 text-muted-foreground hover:text-foreground"
      aria-label="목록으로"
      onClick={handleBack}
    >
      <ChevronLeft aria-hidden="true" />
    </Button>
  )

  if (detailQuery.isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        {backButton}
        <p className="text-sm text-muted-foreground">채팅방을 불러오는 중...</p>
      </div>
    )
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="flex h-full flex-col gap-4 p-4">
          {backButton}
          <p className="text-sm text-muted-foreground">채팅방을 찾을 수 없습니다.</p>
        </div>
      )
    }
    // todo : isForbidden은 code==='ROLE_003'만 인식하는데 비멤버 접근의 실제 서버 코드는
    // CHAT_003(403)이라(getChatRoomDetail.ts 상단 주석 참조) 이 분기가 실질적으로 도달하지
    // 않는다 — 아래 일반 실패 분기로 폴백된다.
    if (isForbidden(apiError)) {
      return (
        <div className="flex h-full flex-col gap-4 p-4">
          {backButton}
          <p className="text-sm text-muted-foreground">이 채팅방을 조회할 권한이 없습니다.</p>
        </div>
      )
    }
    // not-found/forbidden이 아닌 실패는 위 useEffect가 토스트로 알렸으므로 화면은 빈 상태로만 표시한다.
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        {backButton}
        <p className="text-sm text-muted-foreground">채팅방을 불러오지 못했습니다.</p>
      </div>
    )
  }

  // 로딩·에러 분기를 모두 통과한 렌더 직전 최종 가드. data! non-null 단언 없이 좁힌다.
  if (!detailQuery.data) {
    return null
  }

  const room = detailQuery.data

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
        {backButton}
        <ChatRoomAvatar isGroup={room.isGroup} className="size-9" />
        <div className="min-w-0 flex-1">
          {/* todo: Open Q#3(PRD §❓, chatRoomDetail.ts 동일 주석) roomName null 가능 여부/폴백
              구성 미확정 — 서버 응답 문자열을 그대로 표시하고 members[] 기반 폴백을 임의로
              발명하지 않는다. */}
          <h1 className="truncate text-sm font-semibold">{room.roomName}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {room.isGroup ? `참여 ${room.members.length}명` : '1:1 대화'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="멤버 초대"
          onClick={() => startInviteFlow(room.roomId)}
        >
          <UserPlus aria-hidden="true" />
        </Button>
        <ChatRoomSettingsMenu roomId={room.roomId} />
      </header>

      <div className="flex shrink-0 items-start gap-3 overflow-x-auto border-b border-border px-3 py-2.5">
        {room.members.map((member) => (
          <div
            key={member.memberId}
            className="flex w-14 shrink-0 flex-col items-center gap-1 text-center"
          >
            <BlobAvatar
              empId={member.memberId}
              fileId={parseEmpFilePreviewFileId(member.profileImageUrl)}
              fallbackText={member.memberName}
            />
            <span className="max-w-full truncate text-xs font-medium">{member.memberName}</span>
            {member.deptName && (
              <span className="max-w-full truncate text-[10px] text-muted-foreground">
                {member.deptName}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 방 토픽 SUBSCRIBE/UNSUBSCRIBE lifecycle+수신 append/dedup(T2.3-a·T2.3-b)은
          useChatRoomSubscription이 이미 담당한다. 읽음 위치 갱신(F911, T2.5)은 ChatMessageArea
          내부(useReadPositionSync)가 담당한다 — 최신 확정 메시지 id는 messages 목록에서 직접
          도출하므로 room.lastReadMessageId(서버가 기억한 이전 읽음 위치)를 별도로 참조하지
          않는다. 이미 최신까지 읽은 상태에서도 방 진입 시 PATCH가 한 번 발생하지만(멱등),
          ROADMAP(CHAT) T2.5 요구사항이 허용하는 두 트리거 시점(방 진입 직후·새 메시지 도달
          시) 중 하나라 과도한 호출로 보지 않는다(과잉 설계 금지 — 굳이 이전 값과 비교해
          스킵하는 최적화까지는 하지 않는다).

          lastReadMessageId는 "안 읽은 메시지" 구분선 위치 계산에만 쓴다(별도 prop으로 전달) —
          useUpdateReadPositionMutation(T2.5)의 onSuccess는 rooms 목록 쿼리만 invalidate하고
          chatKeys.detail(roomId)는 건드리지 않으므로(그 훅 파일 상단 주석 참조), 방을 보는 동안
          room.lastReadMessageId 값은 읽음 위치 갱신 자체로는 바뀌지 않는다 — 진입 시점 값을 그대로
          구분선 기준점으로 써도 방문 중 사라지지 않는다. */}
      <ChatMessageArea roomId={room.roomId} lastReadMessageId={room.lastReadMessageId} />
      <ChatMessageInput roomId={room.roomId} />
    </div>
  )
}

/**
 * 채팅방 대화 본문(F903, ROADMAP(CHAT) T2.2). `useChatMessagesQuery`(CHAT_MESSAGES)로 cursor
 * 무한스크롤 메시지 목록을 조회해 렌더하고, 컨테이너 상단 스크롤 도달 시 과거 페이지를 추가 로드한다.
 * 실시간 수신(T2.3-a·T2.3-b)·발신(T2.4)은 캐시(`chatKeys.messages(roomId)`)를 직접 갱신하는
 * `useChatRoomSubscription`/`useSendChatMessage`가 담당하고, 이 컴포넌트는 그 결과로 리렌더된
 * `messagesQuery.data`를 그대로 그린다 — 새 메시지를 append하는 로직 자체는 이 컴포넌트 범위가
 * 아니다.
 *
 * 읽음 위치 갱신(F911, ROADMAP(CHAT) T2.5)도 여기서 트리거한다: 아래에서 계산하는 `messages`가
 * "방 진입 시 초기 로드 결과"와 "이후 실시간 수신으로 늘어난 결과"를 모두 반영하는 단일 소스라,
 * `useReadPositionSync`에 그대로 넘기면 두 트리거 시점을 별도 구현 없이 함께 커버한다.
 *
 * "안 읽은 메시지" 구분선: `lastReadMessageId`(방 진입 시점 값, ChatRoomDetailPanel 참조)보다
 * id가 큰 첫 확정 메시지(id>0 — 낙관 발신 중인 음수 id는 항상 본인 메시지라 대상에서 제외) 앞에
 * 렌더한다. `lastReadMessageId`가 null(아직 아무것도 읽은 적 없는 신규 참여 등)이면 "읽은 지점"
 * 자체가 없어 구분선을 임의로 어디에 둘지 추측할 근거가 없으므로 렌더하지 않는다.
 *
 * 구분선의 위치·개수는 방 진입 시점(최초 메시지 로드 완료 시점)에 한 번만 계산해 고정한다(요청
 * 사항) — 방에 머무는 동안 실시간으로 도착하는 새 메시지는 이 구분선 계산에 반영되지 않는다.
 * unreadSnapshotRef 참조.
 */
function ChatMessageArea({
  roomId,
  lastReadMessageId,
}: {
  roomId: number
  lastReadMessageId: number | null
}) {
  const messagesQuery = useChatMessagesQuery(roomId)
  const meQuery = useMeQuery()
  const myEmpId = meQuery.data?.empBasicInfo.empId
  const containerRef = useRef<HTMLDivElement>(null)
  // 과거 페이지 fetch 직전의 scrollHeight를 기억해둔다(용도 1: prepend 보정, 용도 2: 아래
  // 스크롤 effect가 "과거 페이지 prepend로 인한 messages 변화"와 "최신 페이지 끝 append로 인한
  // messages 변화(T2.4 낙관 발신·T2.3-b 실시간 수신)"를 구분하는 판별값 — null이 아니면 prepend).
  const prevScrollHeightRef = useRef<number | null>(null)

  // not-found/forbidden은 아래에서 전용 문구로 렌더하므로, 그 외 실패만 토스트로 알린다
  // (ChatRoomDetailPanel 본문 useEffect와 동일 패턴).
  useEffect(() => {
    if (!messagesQuery.error) {
      return
    }
    const apiError = normalizeApiError(messagesQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [messagesQuery.error])

  // pages는 fetch 순서(최초 페이지=cursor 없음이 최신 배치, 이후 페이지가 cursor로 가리키는 과거
  // 배치)로 쌓인다(useChatMessagesQuery 참조). 대화창은 위=과거·아래=최신으로 쌓아야 하므로 페이지
  // 자체는 fetch 역순으로 나열한다. 각 페이지 내부 messages[] 배열 순서는 서버 응답을 그대로
  // 유지한다 — 정렬 순서 자체가 Open Q#5로 미확정이므로 임의로 뒤집지 않는다(추측 조작 금지).
  const pages = messagesQuery.data?.pages ?? []
  const messages = pages.slice().reverse().flatMap((page) => page.messages)

  // 방 진입(초기 로드)·실시간 수신(T2.3-b) 모두로 인한 messages 변화를 감지해 읽음 위치를
  // 갱신한다(ROADMAP(CHAT) T2.5, F911). 자세한 트리거 통합 근거는 useReadPositionSync 참조.
  useReadPositionSync(roomId, messages)

  // "안 읽은 메시지" 구분선은 방 입장 시점(최초 메시지 로드 완료 시점)에 한 번만 계산해 고정한다
  // (요청 사항: 방에 머무는 동안은 갱신하지 않는다) — 실시간으로 도착하는 새 메시지는 이미
  // "보고 있는" 상태라 안 읽은 메시지로 취급하지 않는다. clientMessageId로 위치를 저장하는
  // 이유: 과거 페이지를 prepend해도(무한스크롤) 배열 인덱스가 밀리므로 인덱스 자체는 저장할 수
  // 없다. roomId가 바뀌면(방 전환) 다시 계산한다.
  const unreadSnapshotRef = useRef<{
    roomId: number
    firstUnreadClientMessageId: string | null
    count: number
  } | null>(null)
  if (!messagesQuery.isLoading && unreadSnapshotRef.current?.roomId !== roomId) {
    const unreadAtEntry =
      lastReadMessageId == null
        ? []
        : messages.filter((message) => message.id > 0 && message.id > lastReadMessageId)
    unreadSnapshotRef.current = {
      roomId,
      firstUnreadClientMessageId: unreadAtEntry[0]?.clientMessageId ?? null,
      count: unreadAtEntry.length,
    }
  }
  const unreadSnapshot =
    unreadSnapshotRef.current?.roomId === roomId ? unreadSnapshotRef.current : null
  const firstUnreadIndex =
    unreadSnapshot?.firstUnreadClientMessageId == null
      ? -1
      : messages.findIndex((message) => message.clientMessageId === unreadSnapshot.firstUnreadClientMessageId)
  const unreadCount = unreadSnapshot?.count ?? 0

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const el = event.currentTarget
    if (el.scrollTop > SCROLL_TOP_THRESHOLD) {
      return
    }
    if (!messagesQuery.hasNextPage || messagesQuery.isFetchingNextPage) {
      return
    }
    prevScrollHeightRef.current = el.scrollHeight
    messagesQuery.fetchNextPage()
  }

  // messages 변화에 따른 스크롤 위치 조정. prevScrollHeightRef가 채워져 있으면(위 handleScroll에서
  // fetchNextPage 직전 기록) 과거 페이지 prepend이므로 늘어난 높이만큼 scrollTop을 보정해 보던
  // 위치를 유지한다. 그 외의 모든 변화(최초 로드, T2.4 낙관 발신, T2.3-b 실시간 수신 — 셋 다 최신
  // 페이지 끝에 append되므로 구조적으로 동일하게 취급 가능·upsertChatMessage 참조)는 맨 아래로
  // 스크롤한다. MVP 단순화: 사용자가 과거 메시지를 읽으려 위로 스크롤해 둔 상태에서 새 메시지가
  // 와도 무조건 맨 아래로 끌어내린다(근접도 판별 등 추가 정교화는 이 태스크 범위 밖 — 과잉 설계 금지).
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) {
      return
    }
    if (prevScrollHeightRef.current != null) {
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = null
      return
    }
    if (messages.length === 0) {
      return
    }
    el.scrollTop = el.scrollHeight
  }, [messages.length])

  if (messagesQuery.isLoading) {
    return <div className="flex-1 p-4 text-sm text-muted-foreground">메시지를 불러오는 중...</div>
  }

  if (messagesQuery.error) {
    const apiError = normalizeApiError(messagesQuery.error)
    // todo : isForbidden이 CHAT_003을 인식 못하는 문제(getChatRoomDetail.ts 참조)로 비멤버
    // 메시지 조회 403도 이 분기를 못 타 아래 폴백 분기+useEffect 토스트가 함께 뜬다.
    if (isNotFound(apiError) || isForbidden(apiError)) {
      return (
        <div className="flex-1 p-4 text-sm text-muted-foreground">메시지를 불러올 수 없습니다.</div>
      )
    }
    // not-found/forbidden이 아닌 실패는 위 useEffect가 토스트로 알렸으므로 본문은 빈 상태로만 표시한다.
    return (
      <div className="flex-1 p-4 text-sm text-muted-foreground">메시지를 불러오지 못했습니다.</div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
    >
      {messagesQuery.isFetchingNextPage && (
        <p className="pb-2 text-center text-xs text-muted-foreground">이전 메시지를 불러오는 중...</p>
      )}
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">메시지가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((message, index) => (
            // key는 message.id가 아니라 clientMessageId를 쓴다 — T2.4 낙관 메시지는 서버 확정
            // 전까지 임시 음수 id(useSendChatMessage 참조)를 쓰는 반면 clientMessageId는 생성
            // 시점부터 항상 고유해 낙관→확정 전환 중에도 React key가 안정적으로 유지된다.
            <Fragment key={message.clientMessageId}>
              {index === firstUnreadIndex && (
                <li aria-hidden="true" className="flex items-center gap-2 py-1">
                  <span className="h-px flex-1 bg-border" />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    안 읽은 메시지 {unreadCount}개
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </li>
              )}
              <ChatMessageRow message={message} isMine={message.senderId === myEmpId} />
            </Fragment>
          ))}
        </ul>
      )}
    </div>
  )
}

function ChatMessageRow({ message, isMine }: { message: ChatMessage; isMine: boolean }) {
  // 서버 확정 메시지의 id는 항상 양의 정수(DB PK)다 — 음수면 아직 브로드캐스트 echo로 확정되지
  // 않은 T2.4 낙관 메시지라는 뜻이라(useSendChatMessage 참조), 옅게 표시해 "전송 중" 상태를
  // 최소한으로 구분한다(스타일 투자 최소화 — 이후 adapt-ui에서 교체될 수 있는 임시 표기).
  const isPending = message.id < 0
  return (
    <li
      className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : ''} ${isPending ? 'opacity-60' : ''}`}
    >
      <BlobAvatar
        empId={message.senderId}
        fileId={parseEmpFilePreviewFileId(message.profileImageUrl)}
        fallbackText={message.senderName}
      />
      <div className={`flex min-w-0 flex-col gap-1 ${isMine ? 'items-end' : ''}`}>
        <div className={`flex items-baseline gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-medium">{message.senderName}</span>
          <span className="text-[10px] text-muted-foreground">
            {isPending ? '전송 중...' : dayjs(message.sentAt).format('MM-DD HH:mm')}
          </span>
        </div>
        <p
          className={`w-fit max-w-full whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
            isMine
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm bg-muted'
          }`}
        >
          {message.content}
        </p>
      </div>
    </li>
  )
}
