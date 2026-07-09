import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMyAccessibleDocumentsQuery } from '../api/useMyAccessibleDocumentsQuery'
import { DocumentBoxTable } from '../components/DocumentBoxTable'

/**
 * 결재함(조회 가능 문서) 페이지(F714, ROADMAP(DRAFT) T1.6, docs/prd/7.approval-common-prd.md §결재함 페이지).
 * 공용 DocumentBoxTable에 결재함 조회 훅만 주입하는 thin 래퍼다. 내가 조회할 수 있는 문서 전체
 * (내 기안·내가 결재한/할 문서·공람 대상)를 서버가 선별해 내려준다. 행 클릭 → 상세(읽기)는 M2 T2.5에서 배선했다.
 */
export function AccessibleDocumentsPage() {
  const navigate = useNavigate()

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">결재함</h1>
      </div>
      <Card className="h-fit">
        <CardHeader className="border-b">
          <CardTitle>조회 가능 문서 목록</CardTitle>
          <CardDescription>내가 조회할 수 있는 문서를 검색·열람합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentBoxTable
            useListQuery={useMyAccessibleDocumentsQuery}
            emptyMessage="조회 가능한 문서가 없습니다."
            searchId="accessible-documents"
            onRowClick={(draftId) => navigate(`/approval/drafts/${draftId}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
