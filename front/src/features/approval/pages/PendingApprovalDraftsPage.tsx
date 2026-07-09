import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMyPendingApprovalDraftsQuery } from '../api/useMyPendingApprovalDraftsQuery'
import { DocumentBoxTable } from '../components/DocumentBoxTable'

/**
 * 결재대기함 페이지(F710, ROADMAP(DRAFT) T1.6, docs/prd/7.approval-common-prd.md §결재대기함 페이지).
 * 공용 DocumentBoxTable에 결재대기함 조회 훅만 주입하는 thin 래퍼다. 전 기안 유형이 혼재하나 목록
 * 응답에 draftType이 없어 유형 뱃지는 미표시한다(Open Q#7 — 상세 진입 후 분기). 행 클릭 → 상세(승인/반려
 * 진입)는 M2 T2.5에서 배선했다.
 */
export function PendingApprovalDraftsPage() {
  const navigate = useNavigate()

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">결재대기함</h1>
      </div>
      <Card className="h-fit">
        <CardHeader className="border-b">
          <CardTitle>결재 대기 목록</CardTitle>
          <CardDescription>내 결재 차례 문서를 검색·열람합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentBoxTable
            useListQuery={useMyPendingApprovalDraftsQuery}
            emptyMessage="결재 대기 중인 문서가 없습니다."
            searchId="pending-approval-drafts"
            onRowClick={(draftId) => navigate(`/approval/drafts/${draftId}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
