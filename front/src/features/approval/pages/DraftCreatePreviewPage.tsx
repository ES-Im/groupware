import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import {
  DraftPrintDocument,
  type PrintApprovalColumn,
} from '../components/print/DraftPrintDocument'
import { getApprovalRoleLabel } from '../lib/approvalStatusBadge'
import { DRAFT_PRINT_PREVIEW_STORAGE_KEY, type DraftPrintPreviewPayload } from '../model/draftPreview'

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
      const parsed = JSON.parse(raw) as Partial<DraftPrintPreviewPayload>
      setPayload({
        typeLabel: parsed.typeLabel ?? '',
        title: parsed.title ?? '',
        content: parsed.content ?? '',
        fields: parsed.fields ?? [],
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

  const drafterName = meQuery.data?.empBasicInfo.name ?? ''
  const drafterDeptName =
    meQuery.data?.currentDepts.find((dept) => dept.isPrimary)?.deptName ??
    meQuery.data?.currentDepts[0]?.deptName ??
    ''

  const drafterColumn: PrintApprovalColumn = {
    header: '기안',
    name: drafterName || '-',
    mark: { kind: 'signature', variant: 'drafter', status: '상신' },
    date: dayjs().format('MM-DD'),
  }
  const approverColumns = payload.approvers.map(
    (approver, index): PrintApprovalColumn => ({
      header: `${getApprovalRoleLabel(approver.role)}${index + 1}`,
      name: approver.empName,
      mark: { kind: 'stamp', label: '예정', tone: 'pending' },
      date: '-',
    }),
  )

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
