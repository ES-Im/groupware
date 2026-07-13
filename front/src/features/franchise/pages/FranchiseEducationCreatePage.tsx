import { useNavigate } from 'react-router'
import { BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { FranchiseBackLink } from '../components/FranchiseBackLink'
import { FranchiseEducationCreateForm } from '../components/FranchiseEducationCreateForm'
import { FranchisePageHeader } from '../components/FranchisePageHeader'

/**
 * 가맹점 교육 등록 페이지(`FRANCHISE_EDUCATION_CREATE`, F1612, ROADMAP(FRANCHISE) T4.2).
 * /franchise-educations/new 라우트에 마운트된다.
 *
 * 사용자 요청(2026-07-13 UI 개편)으로 기존 등록 다이얼로그를 전용 페이지로 전환했다. 폼 본문은
 * FranchiseEducationCreateForm으로 분리하고(BoardCreatePage/BoardCreateForm 분리 패턴 동형), 이
 * 페이지는 back-link·헤더 등 페이지 chrome만 담당한다. 등록 성공 시 생성된 교육 상세(P5)로,
 * 취소 시 교육 캘린더(목록)로 이동한다.
 */
export function FranchiseEducationCreatePage() {
  const navigate = useNavigate()

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <FranchiseBackLink to="/franchise-educations">가맹점 교육</FranchiseBackLink>

      <FranchisePageHeader
        title="교육 등록"
        description="가맹점 교육 일정을 등록합니다."
      />

      <Card className="max-w-3xl">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" aria-hidden />
            교육 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FranchiseEducationCreateForm
            onCancel={() => navigate('/franchise-educations')}
            onSuccess={(educationId) => navigate(`/franchise-educations/${educationId}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
