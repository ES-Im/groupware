import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import { MessageSquare, Send, Store } from 'lucide-react'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useFranchiseInquiryAnswerQuery } from '../api/useFranchiseInquiryAnswerQuery'
import { useFranchiseInquiryDetailQuery } from '../api/useFranchiseInquiryDetailQuery'
import { FranchiseBackLink } from '../components/FranchiseBackLink'
import { FranchiseInfoList, type FranchiseInfoItem } from '../components/FranchiseInfoList'
import { FranchiseInquiryAnswerForm } from '../components/FranchiseInquiryAnswerForm'
import { FranchiseInquiryManagerAssignDialog } from '../components/FranchiseInquiryManagerAssignDialog'
import { FranchiseStatusPill } from '../components/FranchiseStatusPill'

export function FranchiseInquiryDetailPage() {
  const { inquiryId: inquiryIdParam } = useParams<{ inquiryId: string }>()

  const isDecimalPositiveInteger =
    inquiryIdParam !== undefined && /^[1-9][0-9]*$/.test(inquiryIdParam)
  const inquiryId = isDecimalPositiveInteger ? Number(inquiryIdParam) : undefined

  const detailQuery = useFranchiseInquiryDetailQuery(inquiryId)
  const answerQuery = useFranchiseInquiryAnswerQuery(inquiryId)
  const meQuery = useMeQuery()
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  useEffect(() => {
    if (!answerQuery.error) {
      return
    }
    const apiError = normalizeApiError(answerQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [answerQuery.error])

  if (inquiryId === undefined) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">가맹점 문의 상세</h1>
        <p className="text-sm text-muted-foreground">잘못된 문의 식별자입니다.</p>
      </div>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (detailQuery.error) {
    if (isNotFound(normalizeApiError(detailQuery.error))) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">가맹점 문의 상세</h1>
          <p className="text-sm text-muted-foreground">문의를 찾을 수 없습니다.</p>
        </div>
      )
    }
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">가맹점 문의 상세</h1>
        <p className="text-sm text-muted-foreground">문의 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const inquiry = detailQuery.data

  const answer =
    answerQuery.data && typeof answerQuery.data !== 'string' ? answerQuery.data : undefined

  const myEmpId = meQuery.data?.empBasicInfo.empId
  const isAssigned = inquiry.assignedManagerId != null
  const isOwner = isAssigned && myEmpId === inquiry.assignedManagerId
  const canEditAnswer = isOwner && !answer?.isSubmitted

  const summaryItems: FranchiseInfoItem[] = [
    { label: '가맹점', value: inquiry.franchiseName },
    { label: '코드', value: inquiry.externalId, mono: true },
    { label: '문의자 연락처', value: inquiry.inquirerContact, mono: true },
    { label: '문의일시', value: inquiry.inquiryAt, mono: true },
  ]

  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6 lg:h-full lg:p-8">
      <FranchiseBackLink to="/franchise-inquiries">문의 관리</FranchiseBackLink>

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_360px]">
        <div className="flex min-h-0 flex-col gap-4">
          <Card className="flex flex-col lg:min-h-0 lg:flex-1">
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="flex min-w-0 items-center gap-2">
                  <MessageSquare className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="truncate">{inquiry.inquiryTitle}</span>
                </CardTitle>
                <div className="ml-auto flex items-center gap-2">
                  {!answerQuery.isLoading && (
                    <FranchiseStatusPill variant={answer?.isSubmitted ? 'default' : 'secondary'}>
                      {answer?.isSubmitted ? '답변완료' : '미답변'}
                    </FranchiseStatusPill>
                  )}
                  {inquiry.isDeleted && (
                    <FranchiseStatusPill variant="destructive">삭제 요청</FranchiseStatusPill>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                <span>{inquiry.franchiseName}</span>
                <span aria-hidden className="px-1.5">
                  ·
                </span>
                <span>{inquiry.inquiryAt}</span>
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{inquiry.inquiryContent}</p>
            </CardContent>
          </Card>

          <Card className="flex flex-col lg:min-h-0 lg:flex-1">
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Send className="size-4 text-primary" aria-hidden />
                  답변
                </CardTitle>
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <span>답변 담당</span>
                  <span className="font-medium text-foreground">
                    {inquiry.assignedManagerName ?? '미배정'}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAssignDialogOpen(true)}
                  >
                    담당자 배정
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {answerQuery.isLoading || meQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              ) : !isAssigned ? (
                <p className="text-sm text-muted-foreground">
                  담당자가 배정되지 않아 답변을 작성할 수 없습니다. 위 담당자 배정 버튼으로 먼저
                  담당자를 지정해주세요.
                </p>
              ) : canEditAnswer ? (
                <FranchiseInquiryAnswerForm inquiryId={inquiryId} answer={answer} />
              ) : answer ? (
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  <div className="space-y-0.5 sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">내용</dt>
                    <dd className="text-sm whitespace-pre-wrap">{answer.content}</dd>
                  </div>
                  <div className="space-y-0.5">
                    <dt className="text-xs text-muted-foreground">제출 여부</dt>
                    <dd className="text-sm">{answer.isSubmitted ? '제출됨' : '미제출'}</dd>
                  </div>
                  <div className="space-y-0.5">
                    <dt className="text-xs text-muted-foreground">제출 일시</dt>
                    <dd className="text-sm">{answer.answeredAt}</dd>
                  </div>
                  <div className="space-y-0.5">
                    <dt className="text-xs text-muted-foreground">답변 담당자</dt>
                    <dd className="text-sm">{answer.answeredEmpName}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">아직 작성된 답변이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:self-start">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Store className="size-4 text-primary" aria-hidden />
              가맹점 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FranchiseInfoList items={summaryItems} />
          </CardContent>
        </Card>
      </div>

      <FranchiseInquiryManagerAssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        inquiryId={inquiryId}
        currentManagerEmpId={inquiry.assignedManagerId}
      />
    </div>
  )
}
