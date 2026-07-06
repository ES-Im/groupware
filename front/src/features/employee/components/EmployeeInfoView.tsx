import type { EmployeeInfoResponse } from '../model/me'

interface EmployeeInfoViewProps {
  data: EmployeeInfoResponse
}

/**
 * 사원 정보 표시 공유 컴포넌트(ROADMAP T2.2).
 * empBasicInfo + currentDepts를 렌더하며, activeFiles는 이번 스코프(파일 표시/업로드 UI 제외)에서
 * 완전히 숨긴다 — 이름 표기조차 하지 않는다(ROADMAP §Open Questions #4 확정 사항).
 * 타 사원 상세(T2.2)와 내 정보 조회(T2.3)가 특정 페이지에 종속되지 않는 형태로 함께 재사용한다.
 */
export function EmployeeInfoView({ data }: EmployeeInfoViewProps) {
  const { empBasicInfo, currentDepts } = data

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">기본정보</h2>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">사번</dt>
          <dd>{empBasicInfo.empNo}</dd>
          <dt className="text-muted-foreground">이름</dt>
          <dd>{empBasicInfo.name}</dd>
          <dt className="text-muted-foreground">아이디</dt>
          <dd>{empBasicInfo.loginId}</dd>
          <dt className="text-muted-foreground">이메일</dt>
          <dd>{empBasicInfo.email}</dd>
          <dt className="text-muted-foreground">내선번호</dt>
          <dd>{empBasicInfo.extensionNo}</dd>
        </dl>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">소속정보</h2>
        {currentDepts.length === 0 ? (
          <p className="text-sm text-muted-foreground">소속된 부서가 없습니다.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">부서명</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">직급</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">주요부서</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">발령 시작일</th>
              </tr>
            </thead>
            <tbody>
              {currentDepts.map((dept) => (
                <tr key={dept.deptId} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{dept.deptName}</td>
                  <td className="px-3 py-2">{dept.positionName}</td>
                  <td className="px-3 py-2">{dept.isPrimary ? '주요' : ''}</td>
                  <td className="px-3 py-2">{dept.startAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {/* activeFiles는 이번 스코프(파일 표시/업로드 UI 제외)에서 완전히 숨긴다 — 렌더링하지 않는다. */}
    </div>
  )
}
