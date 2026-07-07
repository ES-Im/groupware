import type { ComponentType, ReactNode, SVGProps } from 'react'
import { AtSign, Building2, Contact, FileText, Hash, IdCard, Mail, Phone, User } from 'lucide-react'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { getActiveProfilePicture } from '@/shared/lib/activeFiles'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import type { EmployeeInfoResponse } from '../model/me'

interface EmployeeInfoViewProps {
  data: EmployeeInfoResponse
  /**
   * 사원 식별 번호(numeric). BlobAvatar의 EMP_FILE_PREVIEW 조회에 사용한다.
   * 타 사원 상세(EmployeeDetailPage)는 라우트 파라미터로 보유해 전달하지만,
   * 내 정보 조회(MyInfoPage)는 numeric empId 소스가 없어(§리스크7) 미전달 → 이니셜 폴백.
   */
  empId?: number
  /**
   * 사원 프로필 카드(우측 탭 카드) 우측 상단 액션 슬롯(예: MyInfoPage의 "수정" 버튼). 없으면 렌더하지 않는다.
   * 버튼 자체의 로직(onClick/네비게이션)은 페이지 컨테이너가 주입한다 — 이 컴포넌트는 시각 배치만 담당.
   */
  actions?: ReactNode
  /**
   * 조회 주체가 본인인지 여부. 기본값 true(본인 조회, MyInfoPage).
   * false(타 사원 상세)면 개인정보 노출 범위를 좁힌다 — 아이디(loginId)·파일 탭·활성 파일 섹션 미노출.
   */
  viewerIsSelf?: boolean
}

/** 아이콘+라벨+값 필드 카드(기본정보 탭). 값이 길면 truncate로 넘침을 막는다. */
function FieldCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium text-foreground">{value}</dd>
      </div>
    </div>
  )
}

/** 좌측 요약 카드의 아이콘+라벨+값 한 줄(계정 정보 섹션). */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <div className="truncate text-sm text-foreground">{value}</div>
      </div>
    </div>
  )
}

/** 대표/겸직·활성/비활성 등 상태를 나타내는 알약 배지. tone으로 강조(primary)/보조(muted)를 구분. */
function Pill({ tone = 'primary', children }: { tone?: 'primary' | 'muted'; children: ReactNode }) {
  return (
    <span
      className={
        tone === 'primary'
          ? 'inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
          : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
      }
    >
      {children}
    </span>
  )
}

/** 작은 섹션 heading(좌측 카드용). 아이콘 + muted 소제목. */
function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  children: ReactNode
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </h3>
  )
}

/** 바이트 크기를 MB 단위 문자열로 변환(소수 1자리). 예: 1572864 → "1.5 MB". */
function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * 사원 정보 표시 공유 컴포넌트(ROADMAP T2.2·T2.3 / 리디자인).
 * 좌측 요약 카드 + 우측 탭(기본정보/부서/파일) 2열 구조(커버 배너 없음 — 사용자 요청으로 제거,
 * 이름/사번 등 식별 정보는 좌측 요약 카드가 그대로 표시하므로 정보 손실 없음).
 *
 * activeFiles 노출 정책: PROFILE_PICTURE만 노출하고, SIGNATURE는 목록/이름 표기 등 어떤
 * 형태로도 렌더하지 않는다(ROADMAP §Open Questions #4 확정 사항).
 *
 * viewerIsSelf에 따른 개인정보 노출 차등:
 * - true(본인 조회, 기본값): 아이디·파일 탭·활성 파일 섹션 모두 노출(단, 파일은 PROFILE_PICTURE만).
 * - false(타 사원 상세): 아이디(loginId) 필드(좌측 카드·기본정보 탭)·파일 탭·활성 파일 섹션 미노출.
 *
 * 다크모드는 시맨틱 토큰이 자동 처리한다. 데이터는 props로만 받는 순수 프레젠테이셔널 컴포넌트다.
 */
export function EmployeeInfoView({ data, empId, actions, viewerIsSelf = true }: EmployeeInfoViewProps) {
  const { empBasicInfo, currentDepts, activeFiles } = data
  const profilePictureFileId = getActiveProfilePicture(activeFiles)
  // 대표(주요) 부서: 좌측 요약 카드 배지에 사용. 없으면 undefined → 배지 미노출.
  const primaryDept = currentDepts.find((dept) => dept.isPrimary)
  // 활성 파일/파일 탭에서 노출할 대상: SIGNATURE는 항상 제외하고 PROFILE_PICTURE만 남긴다.
  const profileFiles = activeFiles.filter((file) => file.type === 'PROFILE_PICTURE')

  return (
    <div className="space-y-6">
      {/* 2열 그리드: 모바일 1열 스택, lg 이상에서 좌측 고정 폭 요약 + 우측 가변 폭 탭. */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* 좌측 요약 카드 */}
        <Card className="h-fit">
          <CardContent className="space-y-5">
            {/* 아바타 + 이름 + 사번 + 대표부서 배지 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <BlobAvatar
                empId={empId}
                fileId={profilePictureFileId}
                fallbackText={empBasicInfo.name}
                className="size-24 text-3xl"
              />
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold tracking-tight">{empBasicInfo.name}</h3>
                <p className="truncate text-sm text-muted-foreground">사번 {empBasicInfo.empNo}</p>
              </div>
              {primaryDept && (
                <Pill>
                  {primaryDept.deptName} · {primaryDept.positionName}
                </Pill>
              )}
            </div>

            {/* 계정 정보 섹션 */}
            <div className="space-y-3 border-t pt-5">
              <SectionHeading icon={Contact}>계정 정보</SectionHeading>
              <div className="space-y-2.5">
                {/* 아이디: 본인 조회일 때만 노출(타 사원 프로필 미노출). */}
                {viewerIsSelf && <InfoRow icon={IdCard} label="아이디" value={empBasicInfo.loginId} />}
                <InfoRow
                  icon={Mail}
                  label="이메일"
                  value={
                    <a href={`mailto:${empBasicInfo.email}`} className="hover:underline">
                      {empBasicInfo.email}
                    </a>
                  }
                />
                <InfoRow icon={Phone} label="직통번호" value={empBasicInfo.extensionNo || '-'} />
              </div>
            </div>

            {/* 현재 부서 섹션 */}
            <div className="space-y-3 border-t pt-5">
              <SectionHeading icon={Building2}>현재 부서</SectionHeading>
              {currentDepts.length === 0 ? (
                <p className="text-sm text-muted-foreground">소속된 부서가 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {currentDepts.map((dept) => (
                    <li key={dept.deptId} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{dept.deptName}</p>
                        <p className="truncate text-xs text-muted-foreground">{dept.positionName}</p>
                      </div>
                      <Pill tone={dept.isPrimary ? 'primary' : 'muted'}>
                        {dept.isPrimary ? '대표' : '겸직'}
                      </Pill>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 활성 파일 섹션: 본인 조회일 때만, PROFILE_PICTURE만 노출(SIGNATURE 항상 제외). */}
            {viewerIsSelf && (
              <div className="space-y-3 border-t pt-5">
                <SectionHeading icon={FileText}>활성 파일</SectionHeading>
                {profileFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">표시할 파일이 없습니다.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {profileFiles.map((file) => (
                      <li key={file.file.fileId}>
                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          <FileText className="size-3.5 shrink-0" />
                          <span className="truncate">{file.file.originalName}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 우측 탭 카드 */}
        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle>사원 프로필</CardTitle>
            {actions && <CardAction>{actions}</CardAction>}
          </CardHeader>
          <CardContent>
            {/* viewerIsSelf면 기본정보/부서/파일 3탭, 아니면 기본정보/부서 2탭. */}
            <Tabs defaultValue="basic">
              <TabsList>
                <TabsTrigger value="basic">기본정보</TabsTrigger>
                <TabsTrigger value="dept">부서</TabsTrigger>
                {viewerIsSelf && <TabsTrigger value="files">파일</TabsTrigger>}
              </TabsList>

              {/* 기본정보 탭: 아이콘 필드 카드 2열 그리드. */}
              <TabsContent value="basic" className="pt-4">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <FieldCard icon={Hash} label="사번" value={empBasicInfo.empNo} />
                  <FieldCard icon={User} label="이름" value={empBasicInfo.name} />
                  {/* 아이디: 본인 조회일 때만 노출. */}
                  {viewerIsSelf && (
                    <FieldCard icon={IdCard} label="아이디" value={empBasicInfo.loginId} />
                  )}
                  <FieldCard
                    icon={AtSign}
                    label="이메일"
                    value={
                      <a href={`mailto:${empBasicInfo.email}`} className="hover:underline">
                        {empBasicInfo.email}
                      </a>
                    }
                  />
                  <FieldCard icon={Phone} label="직통번호" value={empBasicInfo.extensionNo || '-'} />
                </dl>
              </TabsContent>

              {/* 부서 탭: 6열 테이블(부서명/부서코드/직위/대표부서/시작일/종료일). */}
              <TabsContent value="dept" className="pt-4">
                {currentDepts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">소속된 부서가 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="py-2 pr-3 font-medium">부서명</th>
                          <th className="py-2 pr-3 font-medium">부서코드</th>
                          <th className="py-2 pr-3 font-medium">직위</th>
                          <th className="py-2 pr-3 font-medium">대표부서</th>
                          <th className="py-2 pr-3 font-medium">시작일</th>
                          <th className="py-2 font-medium">종료일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDepts.map((dept) => (
                          <tr key={dept.deptId} className="border-b border-border last:border-0">
                            <td className="py-2.5 pr-3">{dept.deptName}</td>
                            <td className="py-2.5 pr-3 text-muted-foreground">{dept.deptCode}</td>
                            <td className="py-2.5 pr-3">{dept.positionName}</td>
                            <td className="py-2.5 pr-3">
                              <Pill tone={dept.isPrimary ? 'primary' : 'muted'}>
                                {dept.isPrimary ? '대표' : '겸직'}
                              </Pill>
                            </td>
                            <td className="py-2.5 pr-3">{dept.startAt}</td>
                            <td className="py-2.5">{dept.endAt || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* 파일 탭: 본인 조회 전용. PROFILE_PICTURE만 표시(SIGNATURE 항상 제외). */}
              {viewerIsSelf && (
                <TabsContent value="files" className="pt-4">
                  {profileFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">표시할 파일이 없습니다.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-muted-foreground">
                            <th className="py-2 pr-3 font-medium">유형</th>
                            <th className="py-2 pr-3 font-medium">파일명</th>
                            <th className="py-2 pr-3 font-medium">확장자</th>
                            <th className="py-2 pr-3 font-medium">크기</th>
                            <th className="py-2 pr-3 font-medium">상태</th>
                            <th className="py-2 font-medium">파일ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profileFiles.map((file) => (
                            <tr key={file.file.fileId} className="border-b border-border last:border-0">
                              <td className="py-2.5 pr-3">프로필 사진</td>
                              <td className="max-w-[16rem] truncate py-2.5 pr-3">
                                {file.file.originalName}
                              </td>
                              <td className="py-2.5 pr-3 text-muted-foreground">{file.file.extension}</td>
                              <td className="py-2.5 pr-3">{formatFileSizeMb(file.file.fileSize)}</td>
                              <td className="py-2.5 pr-3">
                                <Pill tone={file.isActive ? 'primary' : 'muted'}>
                                  {file.isActive ? '활성' : '비활성'}
                                </Pill>
                              </td>
                              <td className="py-2.5 text-muted-foreground">{file.file.fileId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
