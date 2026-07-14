import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { ArrowLeft, MailPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { handleApiError } from '@/shared/lib/apiError'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useDeleteDraftMutation } from '../api/useDeleteDraftMutation'
import { useMailboxCountsQuery } from '../api/useMailboxCountsQuery'
import { useMessageDeleteMutation } from '../api/useMessageDeleteMutation'
import { useMessageDetailQuery } from '../api/useMessageDetailQuery'
import { useMessageRestoreMutation } from '../api/useMessageRestoreMutation'
import { useMessageTrashMutation } from '../api/useMessageTrashMutation'
import { useSendDraftMutation } from '../api/useSendDraftMutation'
import { MailboxNav } from '../components/MailboxNav'
import { MessageBoxTable } from '../components/MessageBoxTable'
import { MessageComposeView, type MessageComposeInitialValues } from '../components/MessageComposeView'
import { MessageDetailView } from '../components/MessageDetailView'
import { BOX_ORDER, BOX_TABS, isMailBox } from '../lib/mailboxConfig'
import type { MailBox } from '../model/messageTypes'

/**
 * 카드 내 뷰 전환 상태. 상세/작성은 별도 라우트가 아니라 이 카드 안에서 전환한다
 * (채팅 오버레이와 동일 철학, router.tsx /messages/:box 주석 참고). 페이지 로컬 useState로
 * 충분해 zustand는 도입하지 않는다(PRD §기술스택 "필요 시" 조건 미해당).
 */
type MessageBoxView = 'list' | 'detail' | 'compose'

interface MessageViewPlaceholderProps {
  view: 'detail' | 'compose'
  /** 대상 쪽지 id — T5.1(편집 진입)이 소비할 계약. placeholder는 표시하지 않는다. */
  messageId?: number
  /** 편집 모드 플래그 — T4.1(작성)·T5.1(편집)이 소비할 계약. placeholder는 표시하지 않는다. */
  isEditMode?: boolean
  onBack: () => void
}

/**
 * 작성(T4.1·T5.1) 뷰가 채워질 자리의 최소 placeholder. 상세는 MessageDetailView(T3.3-a)가
 * 담당하고, 여기서 'detail'은 messageId 미확정 진입에 대한 방어적 fallback으로만 남는다.
 * 실제 UI는 각 후속 태스크 몫이므로 "목록으로" 복귀 버튼만 둔다(과잉 구현 금지).
 */
function MessageViewPlaceholder({ view, onBack }: MessageViewPlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10">
      <p className="text-sm text-muted-foreground">
        {view === 'detail' ? '쪽지 상세 화면을 준비 중입니다.' : '쪽지 작성 화면을 준비 중입니다.'}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onBack}>
        <ArrowLeft />
        목록으로
      </Button>
    </div>
  )
}

/**
 * 쪽지함 통합 페이지 컨테이너(ROADMAP(MESSAGE) T2.2-a, PRD §페이지별 상세 쪽지함 페이지).
 * 받은/보낸/임시보관/휴지통 4박스를 shadcn Tabs 하나로 통합하고, 탭 전환은 URL 세그먼트
 * (/messages/:box) 이동으로 구현한다(문서함 DocumentBoxHomePage 컨벤션 복제). 탭별 건수 배지는
 * T1.4 useMailboxCountsQuery(F1510)를 소비하고, 목록·검색·페이징은 MessageBoxTable(T2.2-b)이
 * 담당한다. 상세/작성은 별도 라우트 없이 카드 내 뷰 전환(activeView)으로 처리한다.
 *
 * box 세그먼트가 4종 밖이면 받은 쪽지함(received)으로 정규화한다(사용자가 가장 먼저 확인해야 할
 * 기본 진입 박스 — router.tsx /messages 인덱스 리다이렉트와 동일 근거). 훅은 조기 반환 전에
 * 모두 호출해 Rules of Hooks를 지킨다.
 */
export function MessageBoxPage() {
  const navigate = useNavigate()
  const { box } = useParams<{ box: string }>()
  const countsQuery = useMailboxCountsQuery()
  // 좌측 박스 네비 사용자 카드 표시용(기존 me 캐시 재사용 — 신규 데이터 로직 아님).
  const meQuery = useMeQuery()
  const [activeView, setActiveView] = useState<MessageBoxView>('list')
  const [activeMessageId, setActiveMessageId] = useState<number | undefined>(undefined)
  const [isEditMode, setIsEditMode] = useState(false)
  // 답장(T4.4) 프리필 값. openDetail·openCompose 양쪽에서 undefined로 초기화해 무관한 세션으로
  // 새지 않는다 — compose로 들어오는 모든 경로가 openCompose(초기화)나 handleReply(새로 설정) 중
  // 하나를 반드시 거치므로 별도 리셋 지점이 더 필요하지 않다.
  const [replyPrefill, setReplyPrefill] = useState<MessageComposeInitialValues | undefined>(
    undefined,
  )
  // compose 세션 구분자(T4.4 버그 수정). 헤더의 [새 쪽지] 버튼은 activeView와 무관하게 항상
  // 렌더되므로, 답장 프리필이 뜬 상태에서 바로 [새 쪽지]를 누르면 activeView가 이미 'compose'라
  // <MessageComposeView>가 리마운트되지 않고(같은 타입·같은 위치) React가 인스턴스를 재사용한다.
  // 그 결과 initialValues prop만 undefined로 바뀌고 컴포넌트 내부 state(마운트 시 1회 시딩되는
  // selectedEmployees·useZodForm defaultValues)는 이전 답장값이 그대로 남는다. 신규 작성/편집/
  // 답장 진입마다 이 값을 증가시켜 key로 넘기면 React가 매번 완전히 새 인스턴스로 마운트한다.
  const [composeSessionId, setComposeSessionId] = useState(0)
  // MessageDetailView(T3.3-a)와 동일 queryKey(messageKeys.detail)라 캐시를 공유한다(추가 네트워크
  // 요청 없음) — 휴지통 생명주기 콜백(T3.4-b)이 isSentByMe를 여기서 캡처해 mutate에 넘긴다.
  const detailQuery = useMessageDetailQuery(activeMessageId)
  const trashMutation = useMessageTrashMutation()
  const restoreMutation = useMessageRestoreMutation()
  const deleteMutation = useMessageDeleteMutation()
  const sendDraftMutation = useSendDraftMutation()
  const deleteDraftMutation = useDeleteDraftMutation()

  useEffect(() => {
    if (!countsQuery.error) {
      return
    }
    handleApiError(countsQuery.error, { toast })
  }, [countsQuery.error])

  // 유효하지 않은 box는 기본 박스(받은 쪽지함)로 정규화한다 — URL을 정직하게 유지한다.
  if (!isMailBox(box)) {
    return <Navigate to="/messages/received" replace />
  }

  const counts = countsQuery.data
  const me = meQuery.data
  // 사용자 카드 보조 라벨: 주 소속(isPrimary) 우선, 없으면 첫 소속의 "부서명 · 직급".
  const primaryDept = me?.currentDepts.find((dept) => dept.isPrimary) ?? me?.currentDepts[0]
  const userDept = primaryDept ? `${primaryDept.deptName} · ${primaryDept.positionName}` : undefined
  // 활성 박스 메타(메인 헤더 3요소: 박스명·부제·건수 배지).
  const activeConfig = BOX_TABS[box]

  function selectBox(next: MailBox) {
    backToList() // 박스 전환 시 상세/작성 뷰를 닫고 목록으로 복귀한다
    navigate(`/messages/${next}`)
  }

  function openDetail(messageId: number) {
    setActiveMessageId(messageId)
    setIsEditMode(false)
    setReplyPrefill(undefined)
    setActiveView('detail')
  }

  function openCompose(messageId?: number, isEdit = false) {
    setActiveMessageId(messageId)
    setIsEditMode(isEdit)
    setReplyPrefill(undefined)
    setComposeSessionId((id) => id + 1)
    setActiveView('compose')
  }

  // 답장(T4.4, F1506 경로 재사용): 받은쪽지 상세의 [답장]에서만 호출된다(box==='received'일
  // 때만 onReply를 전달하므로). detailQuery는 이미 activeMessageId로 상세 뷰와 동일 queryKey를
  // 공유해 캐시돼 있으므로(T3.4-b가 이미 페이지 레벨로 끌어올림) 추가 네트워크 요청이 없다.
  function handleReply() {
    const detail = detailQuery.data
    if (detail == null) {
      return
    }
    setReplyPrefill({
      receiverId: detail.senderId,
      receiverName: detail.senderName,
      title: `RE: ${detail.title}`,
      quotedContent: detail.content,
    })
    setActiveMessageId(undefined)
    setIsEditMode(false)
    setComposeSessionId((id) => id + 1)
    setActiveView('compose')
  }

  function backToList() {
    setActiveView('list')
    setActiveMessageId(undefined)
    setIsEditMode(false)
  }

  // 휴지통 생명주기 콜백(T3.4-b): mutate onSuccess는 목록 복귀 네비게이션만 담당한다
  // (messageKeys.all invalidate는 각 mutation 훅 내부가 이미 수행).
  function handleTrash() {
    if (activeMessageId == null || detailQuery.data == null) {
      return
    }
    trashMutation.mutate(
      { messageId: activeMessageId, isSentByMe: detailQuery.data.isSentByMe },
      { onSuccess: backToList },
    )
  }

  function handleRestore() {
    if (activeMessageId == null || detailQuery.data == null) {
      return
    }
    restoreMutation.mutate(
      { messageId: activeMessageId, isSentByMe: detailQuery.data.isSentByMe },
      { onSuccess: backToList },
    )
  }

  function handleDelete() {
    if (activeMessageId == null || detailQuery.data == null) {
      return
    }
    deleteMutation.mutate(
      { messageId: activeMessageId, isSentByMe: detailQuery.data.isSentByMe },
      { onSuccess: backToList },
    )
  }

  // 임시 발송/삭제(T5.3-b): sendDraft(T4.3-a 재사용)·deleteDraft(T5.3-a)는 둘 다 onError 없이
  // 에러를 전파하는 컨벤션이다(다른 소비처가 submitWithErrorMapping으로 위임받는 구조라서) —
  // 여기서는 편집 뷰의 self-contained 버튼 액션이라 handleApiError를 mutate onError 옵션으로
  // 직접 연결한다(신규 에러분기 발명 아님, 표준 진입점 재사용). onSuccess는 backToList()로
  // activeView를 'list'로 되돌린 뒤 navigate한다 — navigate만으로는 :box URL 세그먼트만
  // 바뀌고 activeView·activeMessageId는 그대로 남아 편집 뷰가 계속 보이는(재발송/재삭제
  // 위험까지 있는) 문제가 있어, 이미 확립된 handleSend/handleSaveDraft(T4.3-b, MessageComposeView)
  // 의 "onBack()+navigate()" 조합 패턴을 그대로 따른다.
  function handleSendDraft() {
    if (activeMessageId == null) {
      return
    }
    sendDraftMutation.mutate(activeMessageId, {
      onSuccess: () => {
        backToList()
        navigate('/messages/sent')
      },
      onError: (error) => handleApiError(error, { toast }),
    })
  }

  function handleDeleteDraft() {
    if (activeMessageId == null) {
      return
    }
    deleteDraftMutation.mutate(
      { messageId: activeMessageId },
      {
        onSuccess: () => {
          backToList()
          navigate('/messages/drafts')
        },
        onError: (error) => handleApiError(error, { toast }),
      },
    )
  }

  return (
    // min-h-full 플렉스 컬럼: 콘텐츠가 짧아도 탭 카드(flex-1)가 남는 높이를 흡수해
    // 카드 하단과 푸터 사이 간격이 페이지 인셋만 남는다(문서함 레이아웃 컨벤션).
    <div className="flex min-h-full w-full flex-col p-4 sm:p-6 lg:p-8">
      {/* 헤더: 페이지 타이틀 + 새 쪽지 작성 진입. xl 이상에서는 좌측 박스 네비의 [새 쪽지 작성]
          버튼이 이 역할을 대체하므로 여기서는 숨긴다(xl:hidden). */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">쪽지함</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            받은·보낸·임시보관·휴지통 쪽지를 한 곳에서 관리하세요
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => openCompose()}
          className="w-full sm:w-auto xl:hidden"
        >
          <MailPlus />
          새 쪽지
        </Button>
      </header>

      {/* 2단 레이아웃(옵션 B): xl 이상에서만 좌측 박스 네비(MailboxNav) + 메인 카드를 좌우로 놓고,
          xl 미만에서는 박스 네비를 숨기고 메인 카드 상단의 폴백 탭으로 박스를 전환한다. 전역
          사이드바(w-56~64)에 더해 서브사이드바(w-52)까지 놓으면 1280 미만에서 리스트 폭이 과하게
          눌리므로, 2단 강화는 xl(1280) 이상으로 한정한다(폭 실측 근거). */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
        <MailboxNav
          box={box}
          counts={counts}
          userName={me?.empBasicInfo.name}
          userDept={userDept}
          onCompose={() => openCompose()}
          onSelectBox={selectBox}
          onBack={backToList}
          showBack={activeView !== 'list'}
          className="sticky top-3 hidden w-52 shrink-0 self-start xl:flex"
        />

        {/* 메인 카드: 폴백 탭(또는 박스 네비) + 활성 박스 목록(또는 상세/작성 뷰)을 묶는다.
            탭·뷰를 바꿔도 카드 높이가 출렁이지 않도록 최소 높이를 두고, flex-1로 남는 높이를 흡수한다. */}
        <Card className="flex min-h-[540px] min-w-0 flex-1 flex-col gap-0 py-0">
          <Tabs
            value={box}
            onValueChange={(value) => {
              backToList() // 탭 전환 시 상세/작성 뷰를 닫고 목록으로 복귀한다
              navigate(`/messages/${value}`)
            }}
            className="flex flex-1 flex-col gap-0"
          >
            {/* 폴백 탭(xl 미만 전용): xl 이상에서는 좌측 박스 네비가 이 역할을 대체한다. */}
            <div className="border-b border-border px-4 py-3 xl:hidden">
              <div className="min-w-0 overflow-x-auto">
                <TabsList variant="line" className="justify-start">
                  {BOX_ORDER.map((key) => {
                    const tabConfig = BOX_TABS[key]
                    const Icon = tabConfig.icon
                    const badge = counts ? tabConfig.getBadge(counts) : 0
                    const emphasizedBadge =
                      counts && tabConfig.getEmphasizedBadge
                        ? tabConfig.getEmphasizedBadge(counts)
                        : 0
                    return (
                      <TabsTrigger key={key} value={key} className="flex-none">
                        <Icon />
                        {tabConfig.navLabel}
                        {badge > 0 && (
                          <Badge variant="secondary" className="ml-1 tabular-nums">
                            {badge}
                          </Badge>
                        )}
                        {/* 받은함 안읽음 강조 배지: 전체 건수와 구분되는 primary 톤으로 표기 */}
                        {emphasizedBadge > 0 && (
                          <Badge
                            className="ml-0.5 tabular-nums"
                            aria-label={`안읽음 ${emphasizedBadge}건`}
                          >
                            {emphasizedBadge}
                          </Badge>
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>
            </div>

            {/* 메인 헤더 3요소(활성 박스명 + 부제 + 건수 배지): 목록 뷰에서만 노출한다
                (상세/작성 뷰는 자체 헤더가 있어 중복을 피한다). */}
            {activeView === 'list' && (
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
                    {activeConfig.navLabel}
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {activeConfig.description}
                  </p>
                </div>
                {counts && (
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {activeConfig.getBadge(counts)}건
                  </Badge>
                )}
              </div>
            )}

          {/* 패널을 박스별 4개로 나누지 않고 value={box}인 단일 TabsContent로 둔다: Radix는
              비활성 패널을 언마운트하므로 4개로 나누면 탭 전환마다 테이블이 리마운트돼,
              useMessagesQuery keepPreviousData의 이전 박스 placeholder(dimming 처리,
              2026-07-10 사용자 확정)가 무력화된다. 단일 패널은 항상 활성이라 테이블 인스턴스가
              유지되고, 박스별 검색어·필터·페이지 초기화는 테이블이 box prop 변화로 직접 수행한다. */}
          <TabsContent value={box} className="flex flex-1 flex-col p-4">
            {activeView === 'list' ? (
              <MessageBoxTable box={box} onOpenDetail={openDetail} onOpenCompose={openCompose} />
            ) : activeView === 'detail' && activeMessageId != null ? (
              // 상세 뷰(T3.3-a): 휴지통 생명주기 콜백(T3.4-b) + 답장(T4.4, 받은함에서만 활성) 배선.
              <MessageDetailView
                messageId={activeMessageId}
                box={box}
                onBack={backToList}
                onReply={box === 'received' ? handleReply : undefined}
                onTrash={handleTrash}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            ) : activeView === 'compose' ? (
              // 작성 뷰(T4.1·T4.3-b·T4.4·T5.2·T5.3-b): 편집 프리필은 T5.1 몫. 답장 프리필
              // (replyPrefill)은 새 작성 세션(activeMessageId==null)에서만 유효 — 편집 진입과는
              // 상호 배타적이라 activeMessageId!=null이면 넘기지 않는다(호출부 보장, 컴포넌트
              // 내부 방어 없음). key={composeSessionId}가 신규작성/편집/답장 진입마다 강제
              // 리마운트해 이전 세션 값이 잔존하지 않게 한다(T4.4가 발견·수정한 리마운트 버그
              // 해결책). onSend/onDelete는 편집모드([발송]/[삭제] 버튼)에서만 소비되고
              // 신규작성 모드에서는 무시된다.
              <MessageComposeView
                key={composeSessionId}
                messageId={activeMessageId}
                onBack={backToList}
                initialValues={activeMessageId == null ? replyPrefill : undefined}
                onSend={handleSendDraft}
                onDelete={handleDeleteDraft}
              />
            ) : (
              <MessageViewPlaceholder
                view={activeView}
                messageId={activeMessageId}
                isEditMode={isEditMode}
                onBack={backToList}
              />
            )}
          </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
