import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import {
  DraftPrintDocument,
  type PrintApprovalColumn,
} from '../components/print/DraftPrintDocument'
import { getApprovalRoleLabel } from '../lib/approvalStatusBadge'
import { DRAFT_PRINT_PREVIEW_STORAGE_KEY, type DraftPrintPreviewPayload } from '../model/draftPreview'

/**
 * 기안서 작성 화면(draftId 없음)의 "기안서 미리보기" → 새 창(`/approval/drafts/preview`) 인쇄
 * 미리보기 페이지. 서버 재조회 없이 localStorage에 적재된 payload(작성 화면이 window.open
 * 직전 저장한 폼 스냅샷, `model/draftPreview.ts` 계약 — noopener 새 창은 sessionStorage 사본을
 * 받지 못해 localStorage를 쓴다)를 마운트 시 1회 읽어 렌더한다.
 *
 * 기안자 표기는 payload에 싣지 않고 이 페이지가 useMeQuery로 조회한다(작성자=현재 로그인 사용자,
 * ProtectedRoute 안이라 인증 보장 — 4개 작성 페이지가 각자 me를 배선하는 중복을 피한 설계).
 *
 * 문서 마크업은 공용 `DraftPrintDocument`(사기업 기안문 양식)에 위임한다 — 이 페이지는 상신 전
 * 스냅샷이라 문서번호/처리기한은 미정, 결재란은 기안자 서명 + 결재자 전원 "예정"으로 정규화한다.
 * 이미 만들어진 기안(draftId 있음)의 인쇄는 그 대칭짝인 `DraftPrintPreviewPage`가 담당한다.
 */
export function DraftCreatePreviewPage() {
  const [payload, setPayload] = useState<DraftPrintPreviewPayload | null>(null)
  const [isInvalid, setIsInvalid] = useState(false)
  const meQuery = useMeQuery()

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_PRINT_PREVIEW_STORAGE_KEY)
    if (raw == null) {
      setIsInvalid(true)
      return
    }
    try {
      // localStorage는 타입이 보장되지 않는 경계다(계약 개정 전 잔존 payload 가능) —
      // 누락 필드를 기본값으로 정규화해 렌더 단계의 undefined 접근을 막는다.
      const parsed = JSON.parse(raw) as Partial<DraftPrintPreviewPayload>
      setPayload({
        typeLabel: parsed.typeLabel ?? '',
        title: parsed.title ?? '',
        content: parsed.content ?? '',
        fields: parsed.fields ?? [],
        // 배열 원소 내부도 신뢰하지 않는다: 계약 개정(role 추가) 전 잔존 payload의 role 누락을
        // APPROVER로 정규화한다(as로 optional화 — Partial은 최상위 키만 optional로 만든다).
        approvers: (parsed.approvers ?? []).map((approver) => ({
          empId: approver.empId,
          empName: approver.empName,
          role: (approver as { role?: string }).role ?? 'APPROVER',
        })),
        circulations: parsed.circulations ?? [],
        attachments: parsed.attachments ?? [],
      })
    } catch {
      setIsInvalid(true)
    }
  }, [])

  if (isInvalid) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        미리보기 정보를 찾을 수 없습니다. 이 창을 닫고 다시 시도해주세요.
      </p>
    )
  }

  if (payload == null) {
    return null
  }

  // 기안자(=나) 표시 정보: 아직 조회 전이면 빈 값으로 두고 "-" 폴백은 아래에서 처리한다.
  const drafterName = meQuery.data?.empBasicInfo.name ?? ''
  const drafterDeptName =
    meQuery.data?.currentDepts.find((dept) => dept.isPrimary)?.deptName ??
    meQuery.data?.currentDepts[0]?.deptName ??
    ''

  // 결재란 첫 열은 기안자(작성 미리보기는 원본대로 서명 표시). 결재자는 결재 전이라 전원 "예정".
  const drafterColumn: PrintApprovalColumn = {
    header: '기안',
    name: drafterName || '-',
    mark: { kind: 'signature', variant: 'drafter', status: '상신' },
    date: dayjs().format('MM-DD'),
  }
  const approverColumns = payload.approvers.map(
    (approver, index): PrintApprovalColumn => ({
      // 역할 라벨 헤더(결재N/협조N) — 서버 기안 인쇄(DraftPrintPreviewPage)와 동형 표기.
      header: `${getApprovalRoleLabel(approver.role)}${index + 1}`,
      name: approver.empName,
      mark: { kind: 'stamp', label: '예정', tone: 'pending' },
      date: '-',
    }),
  )

  // 공람 예정자(아직 미등록 — 생성 성공 후 addCirculation으로 지정): 이름만 나열한다.
  const circulationText =
    payload.circulations.length > 0
      ? payload.circulations.map((circulation) => circulation.empName).join(', ')
      : null

  return (
    <DraftPrintDocument
      documentNumber="상신 후 자동 부여"
      retentionPeriod="5년"
      draftDate={dayjs().format('YYYY-MM-DD')}
      draftDept={drafterDeptName || '-'}
      drafterName={drafterName || '-'}
      documentType={payload.typeLabel}
      processingDeadline="-"
      title={payload.title || '-'}
      approvalColumns={[drafterColumn, ...approverColumns]}
      content={payload.content || '-'}
      detailFields={payload.fields}
      attachments={payload.attachments}
      companyStamp={null}
      circulationText={circulationText}
    />
  )
}
