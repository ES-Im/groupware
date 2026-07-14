import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { useMeQuery } from '../api/useMeQuery'
import { DeptHistoryCard } from '../components/DeptHistoryCard'
import { EmployeeProfileTabs } from '../components/EmployeeProfileTabs'
import { EmployeeSummaryCard } from '../components/EmployeeSummaryCard'
import { PersonalRecordsWidget } from '../components/PersonalRecordsWidget'
import { SignatureCard } from '../components/SignatureCard'
import { UpdateMeDialog } from '../components/UpdateMeDialog'

/**
 * 내 정보 조회 페이지(본인 상세, F003 RETRIEVE_ME_INFO, adapt-ui 리디자인 3차 — Magic Patterns
 * 목업(me-page.html) 이식).
 *
 * 좌측 레일: 요약 카드(EmployeeSummaryCard, 역할 배지+정보/비밀번호 수정 진입점 포함)·전자서명
 * 카드(SignatureCard). 우측 컬럼: 사원 프로필 탭(EmployeeProfileTabs, showDeptTab=false로
 * 기본정보/파일관리 2탭만)·소속·발령 카드(DeptHistoryCard, 부서이력 탭에서 분리한 타임라인)·
 * 근태·휴가 위젯(PersonalRecordsWidget, 근태/휴가·출장 2탭). 공통 레이아웃(헤더/사이드바/푸터)은
 * 우리 프로젝트 것을 그대로 쓰고, 목업은 메인 콘텐츠 카드 배치만 참고했다.
 *
 * EmployeeProfileTabs/EmployeeSummaryCard는 EmployeeDetailPage(타 사원 상세)와 공유하는
 * 컴포넌트라 이 페이지 전용 변경(showDeptTab/onEditClick)은 옵션 prop으로만 추가했다 — 기존
 * 타 사원 상세 화면은 회귀 없이 그대로 동작한다.
 *
 * 목업에 있던 "재직중" 상태 배지·"신규 입사" 발령 이력은 RETRIEVE_ME_INFO에 대응 필드/계약이
 * 없어(empBasicInfo에 status 없음, currentDepts는 현재 소속만 응답) 렌더하지 않는다(계약에
 * 없는 값 발명 금지, 기존 adapt-ui 방침 유지). 역할 배지는 대신 세션 roles(JWT 스냅샷,
 * useAuthStore)로 실제 데이터에 기반해 보여준다.
 *
 * "정보/비밀번호 수정" 버튼은 UpdateMeDialog를 연다 — UpdateMeForm이 내선번호·비밀번호를 한
 * 폼에서 함께 처리하므로 새 라우트/모달을 만들지 않았다(애초 "정보 수정"/"비밀번호" 2버튼안은
 * 같은 다이얼로그를 여는 중복 진입점이라 사용자 요청으로 버튼 1개로 통합했다). `/attendance/me`·
 * `/leaves/me`·`/approval/business-trips/me/history` 라우트도 그대로 유지한다(PersonalRecordsWidget의
 * Dialog 오버레이가 계속 재사용). 세 가지 모두 react-router-developer 에이전트 검토로 라우팅
 * 변경 불필요를 확정했다(router.tsx 미수정).
 *
 * empId는 RETRIEVE_ME_INFO.empBasicInfo.empId(Number, PK)로 항상 내려오므로(스니펫 실측),
 * 아바타·서명 미리보기(EMP_FILE_PREVIEW)와 파일 삭제(경로 파라미터)에 그대로 사용한다.
 */
export function MyInfoPage() {
  const query = useMeQuery()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    if (!query.error) {
      return
    }
    toast.error(normalizeApiError(query.error).message)
  }, [query.error])

  if (query.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (query.error) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">내 정보</h1>
        <p className="text-sm text-muted-foreground">내 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!query.data) {
    return null
  }

  const { empBasicInfo, activeFiles, currentDepts } = query.data
  const empId = empBasicInfo.empId

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">내 정보</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          내 계정과 소속 정보를 확인합니다
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* 좌측 레일: 요약 카드(역할 배지+정보/비밀번호 수정) + 전자서명 카드 */}
        <div className="space-y-6">
          <EmployeeSummaryCard
            data={query.data}
            empId={empId}
            viewerIsSelf
            onEditClick={() => setEditDialogOpen(true)}
          />
          <SignatureCard empId={empId} activeFiles={activeFiles} />
        </div>

        {/* 우측 컬럼: 사원 프로필 탭(기본정보/파일관리) + 소속·발령 카드 + 근태·휴가 위젯 */}
        <div className="space-y-6">
          <EmployeeProfileTabs data={query.data} empId={empId} viewerIsSelf showDeptTab={false} />
          <DeptHistoryCard currentDepts={currentDepts} />
          <PersonalRecordsWidget />
        </div>
      </div>

      <UpdateMeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        defaultExtensionNo={empBasicInfo.extensionNo ?? ''}
      />
    </div>
  )
}
