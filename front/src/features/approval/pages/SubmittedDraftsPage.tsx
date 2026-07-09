import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMySubmittedDraftsQuery } from '../api/useMySubmittedDraftsQuery'
import { DocumentBoxTable } from '../components/DocumentBoxTable'

/**
 * 상신함 페이지(F712, ROADMAP(DRAFT) T1.6, docs/prd/7.approval-common-prd.md §상신함 페이지).
 * 공용 DocumentBoxTable(검색·페이징·조회·에러 토스트를 캡슐화)에 상신함 조회 훅만 주입하는 thin 래퍼다.
 * 행 클릭 → 상세 네비게이션은 M2 T2.5에서 onRowClick으로 배선했다.
 */
export function SubmittedDraftsPage() {
  const navigate = useNavigate()

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">상신함</h1>
      </div>
      <Card className="h-fit">
        <CardHeader className="border-b">
          <CardTitle>상신 기안 목록</CardTitle>
          <CardDescription>내가 상신한 기안서를 검색·열람합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentBoxTable
            useListQuery={useMySubmittedDraftsQuery}
            emptyMessage="상신한 기안이 없습니다."
            searchId="submitted-drafts"
            onRowClick={(draftId) => navigate(`/approval/drafts/${draftId}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
