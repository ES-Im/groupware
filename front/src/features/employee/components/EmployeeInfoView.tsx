import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { getActiveProfilePicture } from '@/shared/lib/activeFiles'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { EmployeeInfoResponse } from '../model/me'

interface EmployeeInfoViewProps {
  data: EmployeeInfoResponse
  /**
   * 사원 식별 번호(numeric). BlobAvatar의 EMP_FILE_PREVIEW 조회에 사용한다.
   * 타 사원 상세(EmployeeDetailPage)는 라우트 파라미터로 보유해 전달하지만,
   * 내 정보 조회(MyInfoPage)는 numeric empId 소스가 없어(§리스크7) 미전달 → 이니셜 폴백.
   */
  empId?: number
}

/**
 * 기본정보 라벨↔값 한 줄(순수 시각 요소). 라벨은 작은 muted 텍스트, 값은 본문 톤으로 위계를 준다.
 */
function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  )
}

/**
 * 사원 정보 표시 공유 컴포넌트(ROADMAP T2.2, 아바타는 T5.2에서 추가).
 * 상단 프로필 헤더(아바타+이름+식별정보) → 기본정보 카드 → 소속정보 카드 순으로 렌더한다.
 * activeFiles 중 PROFILE_PICTURE만 BlobAvatar로 노출하고, SIGNATURE는 이번 스코프(파일 표시/업로드
 * UI 제외)에서 완전히 숨긴다 — 어떤 형태로도 렌더하지 않는다(ROADMAP §Open Questions #4 확정 사항).
 * 타 사원 상세(T2.2)와 내 정보 조회(T2.3)가 특정 페이지에 종속되지 않는 형태로 함께 재사용한다.
 */
export function EmployeeInfoView({ data, empId }: EmployeeInfoViewProps) {
  const { empBasicInfo, currentDepts, activeFiles } = data
  const profilePictureFileId = getActiveProfilePicture(activeFiles)

  return (
    <div className="space-y-6">
      {/* 프로필 헤더: 아바타 + 이름 + 식별 정보(사번·아이디). 모바일은 중앙, sm 이상은 좌측 정렬. */}
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <BlobAvatar
          empId={empId}
          fileId={profilePictureFileId}
          fallbackText={empBasicInfo.name}
          className="size-20 text-2xl"
        />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight">{empBasicInfo.name}</h2>
          <p className="truncate text-sm text-muted-foreground">
            사번 {empBasicInfo.empNo} · {empBasicInfo.loginId}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>기본정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <InfoField label="사번" value={empBasicInfo.empNo} />
            <InfoField label="이름" value={empBasicInfo.name} />
            <InfoField label="아이디" value={empBasicInfo.loginId} />
            <InfoField label="이메일" value={empBasicInfo.email} />
            <InfoField label="내선번호" value={empBasicInfo.extensionNo || '-'} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>소속정보</CardTitle>
        </CardHeader>
        <CardContent>
          {currentDepts.length === 0 ? (
            <p className="text-sm text-muted-foreground">소속된 부서가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">부서명</th>
                    <th className="py-2 pr-3 font-medium">직급</th>
                    <th className="py-2 pr-3 font-medium">주요부서</th>
                    <th className="py-2 font-medium">발령 시작일</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDepts.map((dept) => (
                    <tr key={dept.deptId} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-3">{dept.deptName}</td>
                      <td className="py-2.5 pr-3">{dept.positionName}</td>
                      <td className="py-2.5 pr-3">
                        {dept.isPrimary ? (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            주요
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2.5">{dept.startAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {/*
        activeFiles 중 PROFILE_PICTURE는 위 BlobAvatar가 소비한다. SIGNATURE는 이번 스코프(파일
        표시/업로드 UI 제외)에서 완전히 숨긴다 — 목록/이름 표기 등 어떤 형태로도 렌더하지 않는다.
      */}
    </div>
  )
}
