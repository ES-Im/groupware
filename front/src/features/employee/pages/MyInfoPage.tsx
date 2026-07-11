import { useEffect } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { getFileTypeLabel } from '@/shared/lib/activeFiles'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useMeQuery } from '../api/useMeQuery'
import { EmployeeProfileTabs } from '../components/EmployeeProfileTabs'
import { EmployeeSummaryCard } from '../components/EmployeeSummaryCard'
import { PersonalRecordsWidget } from '../components/PersonalRecordsWidget'
import { SignatureCard } from '../components/SignatureCard'

function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * 내 정보 조회 페이지(본인 상세, F003 RETRIEVE_ME_INFO, adapt-ui 리디자인).
 *
 * Ubold 레퍼런스(localhost:5174/apps/groupware/my-info)의 카드 배치를 이식한다 — 좌측에
 * 요약 카드(EmployeeSummaryCard)·전자서명 카드(SignatureCard)·활성 파일 카드(이 페이지 인라인)를
 * 쌓고, 우측에 사원 프로필 탭(EmployeeProfileTabs, 기본정보/부서이력/파일관리)과 개인 기록 조회
 * 위젯(PersonalRecordsWidget)을 배치한다. 공통 레이아웃(헤더/사이드바/푸터)은 우리 프로젝트
 * 것을 그대로 쓰고, 레퍼런스는 콘텐츠 프레임(카드 구성)만 참고했다.
 *
 * 레퍼런스에는 백엔드 계약에 없는 목업 요소가 섞여 있어 제거했다: "상태 메모"(RETRIEVE_ME_INFO
 * 응답에 없는 필드), "보관 파일"(사원 FileType은 PROFILE_PICTURE/SIGNATURE 2종뿐), 파일
 * 업로드 일시(activeFiles/filesInfos 응답에 날짜 필드 없음). 반대로 전자서명 노출·업로드·
 * 활성화·삭제, 개인 기록 조회(근태/연차/출장 요약)는 계약이 존재해 새로 구현했다(사용자 확인 완료).
 *
 * empId는 RETRIEVE_ME_INFO.empBasicInfo.empId(Number, PK)로 항상 내려오므로(스니펫 실측),
 * 아바타·서명 미리보기(EMP_FILE_PREVIEW)와 파일 삭제(경로 파라미터)에 그대로 사용한다.
 *
 * activeFiles는 이 페이지에서 SIGNATURE/PROFILE_PICTURE 구분 없이 전체를 보여준다(레퍼런스와
 * 동일 — 기존에는 SIGNATURE를 의도적으로 숨겼으나 이번 adapt-ui에서 노출하기로 확정했다).
 */
export function MyInfoPage() {
  const query = useMeQuery()

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
        <h1 className="mb-2 text-xl font-semibold tracking-tight">내 정보</h1>
        <p className="text-sm text-muted-foreground">내 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!query.data) {
    return null
  }

  const { empBasicInfo, activeFiles } = query.data
  const empId = empBasicInfo.empId

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* 좌측 컬럼: 요약 카드 + 전자서명 카드 + 활성 파일 카드(전체 타입, 읽기 전용) */}
        <div className="space-y-6">
          <EmployeeSummaryCard data={query.data} empId={empId} viewerIsSelf />
          <SignatureCard empId={empId} activeFiles={activeFiles} />
          <Card className="h-fit">
            <CardHeader className="border-b">
              <CardTitle>현재 활성 파일</CardTitle>
            </CardHeader>
            <CardContent>
              {activeFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">활성화된 파일이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {activeFiles.map((file) => (
                    <li key={file.file.fileId} className="rounded-lg border border-border p-3">
                      {/* 레퍼런스처럼 제목은 좌측, "활성" 배지는 우측 상단에 정렬(top-align). */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium text-foreground">
                          {getFileTypeLabel(file.type)}
                        </p>
                        <Badge className="shrink-0">활성</Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {file.file.originalName} · {formatFileSizeMb(file.file.fileSize)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 우측 컬럼: 사원 프로필 탭(기본정보/부서이력/파일관리) + 개인 기록 조회 위젯 */}
        <div className="space-y-6">
          <EmployeeProfileTabs
            data={query.data}
            empId={empId}
            viewerIsSelf
            actions={
              <Button asChild variant="outline" size="sm">
                <Link to="/me/edit">수정</Link>
              </Button>
            }
          />
          <PersonalRecordsWidget />
        </div>
      </div>
    </div>
  )
}
