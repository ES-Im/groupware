import type { ReactNode } from 'react'
import { EmployeeProfileTabs } from './EmployeeProfileTabs'
import { EmployeeSummaryCard } from './EmployeeSummaryCard'
import type { EmployeeInfoResponse } from '../model/me'

interface EmployeeInfoViewProps {
  data: EmployeeInfoResponse
  /**
   * 사원 식별 번호(numeric). BlobAvatar의 EMP_FILE_PREVIEW 조회, 파일관리 탭의 업로드/삭제 경로에 사용한다.
   */
  empId?: number
  /**
   * 사원 프로필 카드(우측 탭 카드) 우측 상단 액션 슬롯(예: MyInfoPage의 "수정" 버튼). 없으면 렌더하지 않는다.
   * 버튼 자체의 로직(onClick/네비게이션)은 페이지 컨테이너가 주입한다 — 이 컴포넌트는 시각 배치만 담당.
   */
  actions?: ReactNode
  /**
   * 조회 주체가 본인인지 여부. 기본값 true(본인 조회, MyInfoPage).
   * false(타 사원 상세)면 개인정보 노출 범위를 좁힌다 — 아이디(loginId)·파일관리 탭 미노출.
   */
  viewerIsSelf?: boolean
}

/**
 * 사원 정보 표시 공유 컴포넌트(ROADMAP T2.2·T2.3 / adapt-ui 리디자인).
 * 좌측 요약 카드(`EmployeeSummaryCard`) + 우측 탭 카드(`EmployeeProfileTabs`)를 2열로 묶는 얇은
 * 래퍼다 — `MyInfoPage`(본인)와 `EmployeeDetailPage`(타 사원)가 함께 쓰므로, 본인 전용 카드
 * (전자서명·활성 파일 요약)는 이 컴포넌트가 아니라 `MyInfoPage`가 별도로 조합한다
 * (EmployeeDetailPage 회귀 없음 — 원래도 그 카드들은 타 사원 조회에 노출되지 않았다).
 *
 * viewerIsSelf에 따른 개인정보 노출 차등은 하위 두 컴포넌트가 각자 담당한다:
 * - `EmployeeSummaryCard`: 아이디(loginId) 필드.
 * - `EmployeeProfileTabs`: 아이디 필드(기본정보 탭) + 파일관리 탭(전체를 미노출).
 *
 * 다크모드는 시맨틱 토큰이 자동 처리한다. 데이터는 props로만 받는 순수 프레젠테이셔널 컴포넌트다.
 */
export function EmployeeInfoView({ data, empId, actions, viewerIsSelf = true }: EmployeeInfoViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <EmployeeSummaryCard data={data} empId={empId} viewerIsSelf={viewerIsSelf} />
      <EmployeeProfileTabs data={data} empId={empId} actions={actions} viewerIsSelf={viewerIsSelf} />
    </div>
  )
}
