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

/**
 * P7 가맹점 문의 상세 페이지(F1618·F1619, ROADMAP(FRANCHISE) T5.2).
 * /franchise-inquiries/:inquiryId 라우트에 마운트된다(T1.2 배선 완료).
 *
 * 조회 실패 분기는 FranchiseDetailPage와 동일 패턴: route param은 순수 10진 양의 정수만 허용,
 * not-found(404) → 전용 not-found 문구, 그 외 → useEffect 1회성 토스트 + 실패 문구.
 *
 * 답변(F1619)은 상세와 별도 useEffect로 에러를 감시한다 — 미작성 답변은 실행 단계 실측(Open Q#5
 * 해소, test3456 계정·존재하지 않는 inquiryId로 재현) 결과 `204` 빈 바디로 확인됐다. 404 에러
 * 경로는 실측되지 않았지만 방어적으로 함께 처리한다 — 두 경로 모두 "작성 유도" 빈 상태로 렌더하고,
 * 404는 정상 흐름이므로 토스트를 띄우지 않는다(그 외 에러만 토스트).
 * answerQuery가 조회 중일 때 "미작성" 빈 상태가 먼저 깜빡이지 않도록 isLoading을 우선 확인한다.
 * 담당자 배정(F1620, T5.3)은 FranchiseInquiryManagerAssignDialog로 배선됐다.
 *
 * 답변 작성/수정/발송(F1621~F1623, T5.4)은 담당자 미배정/본인 여부/제출 여부 3축으로 분기한다:
 * assignedManagerId가 null이면 배정 유도 문구만 보이고(위 담당자 배정 버튼을 재사용), 본인
 * (useMeQuery의 empBasicInfo.empId===assignedManagerId, ApproverActions와 동일 판정 방식)이
 * 아니거나 이미 발송(isSubmitted=true)됐다면 기존 읽기전용 표시로 대체하며, 본인이고 미발송일
 * 때만 FranchiseInquiryAnswerForm(생성/수정 겸용)을 렌더한다. 소유자 판정·제출후수정불가는
 * 서버가 403/도메인 예외로 최종 판정하므로 이 분기는 UX 힌트일 뿐 방어 로직을 추가하지 않는다.
 */
export function FranchiseInquiryDetailPage() {
  const { inquiryId: inquiryIdParam } = useParams<{ inquiryId: string }>()

  // route param은 신뢰 불가 입력이다(FranchiseDetailPage와 동일 가드): 순수 10진 양의 정수
  // 형식만 허용해 지수/16진수/음수 표기가 다른 문의로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger =
    inquiryIdParam !== undefined && /^[1-9][0-9]*$/.test(inquiryIdParam)
  const inquiryId = isDecimalPositiveInteger ? Number(inquiryIdParam) : undefined

  const detailQuery = useFranchiseInquiryDetailQuery(inquiryId)
  const answerQuery = useFranchiseInquiryAnswerQuery(inquiryId)
  const meQuery = useMeQuery()
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  // not-found는 아래에서 전용 UX로 렌더하므로, 그 외 실패만 토스트로 알린다.
  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  // 답변 미작성(404)은 정상 흐름이므로 토스트를 띄우지 않는다. 그 외 에러만 알린다.
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
    // not-found가 아닌 실패는 위 useEffect가 토스트로 알렸으므로 화면은 안내 문구만 표시한다.
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

  // 답변 미작성은 실측 미확정 형태(404 에러 또는 200 성공+데이터 없음) 모두를 아우른다.
  const answer =
    answerQuery.data && typeof answerQuery.data !== 'string' ? answerQuery.data : undefined

  // 답변 작성 폼 노출 3축: 담당자 배정 여부·본인 여부·발송(제출) 여부(T5.4).
  const myEmpId = meQuery.data?.empBasicInfo.empId
  const isAssigned = inquiry.assignedManagerId != null
  const isOwner = isAssigned && myEmpId === inquiry.assignedManagerId
  const canEditAnswer = isOwner && !answer?.isSubmitted

  // 우측 가맹점 정보 요약 infolist(목업 가맹점 요약). 역조회 API 부재로 "이 가맹점 최근 문의"
  // 리스트는 제외한다. 담당자(답변 담당)는 목업 배치대로 답변 카드 헤더로 옮겼다.
  const summaryItems: FranchiseInfoItem[] = [
    { label: '가맹점', value: inquiry.franchiseName },
    { label: '코드', value: inquiry.externalId, mono: true },
    { label: '문의자 연락처', value: inquiry.inquirerContact, mono: true },
    { label: '문의일시', value: inquiry.inquiryAt, mono: true },
  ]

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <FranchiseBackLink to="/franchise-inquiries">문의 관리</FranchiseBackLink>

      {/* 본문 grid-cd: 좌 넓게 문의 본문 + 답변, 우 좁게 가맹점 정보 요약. */}
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* 문의 본문 카드. */}
          <Card>
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
            <CardContent className="space-y-4">
              {/* 가맹점명·문의일시를 개별 span으로 분리해 각 값을 독립 텍스트 노드로 유지한다
                  (가운뎃점은 장식). */}
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

          {/* 답변 카드(담당자 미배정/본인아님·발송됨/본인·미발송 3분기 — 배선 유지). 목업대로 답변
              담당(배정)을 카드 헤더에 인라인 배치하되, 사원 선택은 기존 배정 다이얼로그를 재사용한다. */}
          <Card>
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
            <CardContent>
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

        {/* 우측: 가맹점 정보 요약. */}
        <Card>
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
