import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMyUnsubmittedDraftsQuery } from '../api/useMyUnsubmittedDraftsQuery'
import { DocumentBoxTable } from '../components/DocumentBoxTable'

/**
 * 임시저장함 페이지(F713, ROADMAP(DRAFT) T1.6, docs/prd/7.approval-common-prd.md §임시저장함 페이지).
 * 공용 DocumentBoxTable에 임시저장함 조회 훅만 주입하는 thin 래퍼다. 행 클릭 → 상세(기안자 상신/수정
 * 진입)는 M2 T2.5에서 배선했다.
 */
export function UnsubmittedDraftsPage() {
  const navigate = useNavigate()

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">임시저장함</h1>
      </div>
      <Card className="h-fit">
        <CardHeader className="border-b">
          <CardTitle>임시저장 기안 목록</CardTitle>
          <CardDescription>상신 전(미상신) 기안서를 검색·열람합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentBoxTable
            useListQuery={useMyUnsubmittedDraftsQuery}
            emptyMessage="임시저장한 기안이 없습니다."
            searchId="unsubmitted-drafts"
            onRowClick={(draftId) => navigate(`/approval/drafts/${draftId}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
