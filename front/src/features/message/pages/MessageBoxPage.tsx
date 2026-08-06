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

type MessageBoxView = 'list' | 'detail' | 'compose'

interface MessageViewPlaceholderProps {
  view: 'detail' | 'compose'
  messageId?: number
  isEditMode?: boolean
  onBack: () => void
}

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

export function MessageBoxPage() {
  const navigate = useNavigate()
  const { box } = useParams<{ box: string }>()
  const countsQuery = useMailboxCountsQuery()
  const meQuery = useMeQuery()
  const [activeView, setActiveView] = useState<MessageBoxView>('list')
  const [activeMessageId, setActiveMessageId] = useState<number | undefined>(undefined)
  const [isEditMode, setIsEditMode] = useState(false)
  const [replyPrefill, setReplyPrefill] = useState<MessageComposeInitialValues | undefined>(
    undefined,
  )
  const [composeSessionId, setComposeSessionId] = useState(0)
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

  if (!isMailBox(box)) {
    return <Navigate to="/messages/received" replace />
  }

  const counts = countsQuery.data
  const me = meQuery.data
  const primaryDept = me?.currentDepts.find((dept) => dept.isPrimary) ?? me?.currentDepts[0]
  const userDept = primaryDept ? `${primaryDept.deptName} · ${primaryDept.positionName}` : undefined
  const activeConfig = BOX_TABS[box]

  function selectBox(next: MailBox) {
    backToList()
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
    <div className="flex min-h-full w-full flex-col p-4 sm:p-6 lg:p-8">
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

        <Card className="flex min-h-[540px] min-w-0 flex-1 flex-col gap-0 py-0">
          <Tabs
            value={box}
            onValueChange={(value) => {
              backToList()
              navigate(`/messages/${value}`)
            }}
            className="flex flex-1 flex-col gap-0"
          >
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

          <TabsContent value={box} className="flex flex-1 flex-col p-4">
            {activeView === 'list' ? (
              <MessageBoxTable box={box} onOpenDetail={openDetail} onOpenCompose={openCompose} />
            ) : activeView === 'detail' && activeMessageId != null ? (
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
