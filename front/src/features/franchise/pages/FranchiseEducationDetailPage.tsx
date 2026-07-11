import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Armchair, Users } from 'lucide-react'
import { handleApiError, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useFranchiseEducationApplicantsQuery } from '../api/useFranchiseEducationApplicantsQuery'
import { useFranchiseEducationDetailQuery } from '../api/useFranchiseEducationDetailQuery'
import { FranchiseEducationActiveToggleButton } from '../components/FranchiseEducationActiveToggleButton'
import { FranchiseEducationAttachmentSection } from '../components/FranchiseEducationAttachmentSection'
import { FranchiseEducationUpdateDialog } from '../components/FranchiseEducationUpdateDialog'
import { FranchiseMetricCard } from '../components/FranchiseMetricCard'
import { FranchisePageHeader } from '../components/FranchisePageHeader'
import type { FranchiseEducationApplicant } from '../model/franchise'

const columnHelper = createColumnHelper<FranchiseEducationApplicant>()

/**
 * P5 가맹점 교육 상세 페이지(F1610 FRANCHISE_EDUCATION_DETAIL + F1611
 * FRANCHISE_EDUCATION_APPLICANTS, ROADMAP(FRANCHISE) T4.3).
 * /franchise-educations/:educationId 라우트에 마운트된다(T1.2 배선 완료).
 *
 * 조회 실패 분기는 FranchiseDetailPage(T2.3)와 동일 패턴: 무효 param → 안내, not-found(404) →
 * 전용 문구, 그 외 → useEffect 1회성 토스트 + 실패 문구. 신청자 표는
 * MeetingRoomManagementPage의 react-table+usePageState+PaginationControls 배선을 동형
 * 복제한다(필터 UI 없음). 신청자 쿼리는 상세 조회 성공 후에만 educationId를 넘겨(enabled 가드)
 * 상세 404 시 신청자 요청이 중복 실패하지 않게 한다.
 *
 * fileListInfoList shape는 T1.1-b **가정** 타입(Open Q#3 미해소 — 첨부 있는 교육 더미데이터로
 * 런타임 확인 필요)이며 null(첨부 없음)을 방어한다. 첨부 업로드/삭제/미리보기/다운로드는
 * T4.5 FranchiseEducationAttachmentSection이 담당한다.
 *
 * mutation 배선(T4.4): 수정(F1613 — FranchiseEducationUpdateDialog)은 isActive===false &&
 * appliedCount===0일 때만 트리거 버튼을 노출한다 — 상세 응답에 등록자 식별자가 없어(Open Q#6)
 * 이 조건은 노출 힌트일 뿐이고, 등록자 본인 여부를 포함한 최종 판정은 서버 403·도메인 에러가
 * 전담한다(handleApiError 토스트). 활성/비활성 토글(F1614 —
 * FranchiseEducationActiveToggleButton)은 항상 노출한다.
 */
export function FranchiseEducationDetailPage() {
  const { educationId: educationIdParam } = useParams<{ educationId: string }>()
  const [updateOpen, setUpdateOpen] = useState(false)

  // route param은 신뢰 불가 입력이다(FranchiseDetailPage와 동일 가드): 순수 10진 양의 정수
  // 형식만 허용해 지수/16진수/음수 표기가 다른 교육으로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger =
    educationIdParam !== undefined && /^[1-9][0-9]*$/.test(educationIdParam)
  const educationId = isDecimalPositiveInteger ? Number(educationIdParam) : undefined

  const detailQuery = useFranchiseEducationDetailQuery(educationId)

  const { page, size, onPageChange } = usePageState()
  // 상세 조회 성공 전에는 undefined를 넘겨 신청자 조회를 지연한다(중복 404 방지).
  const applicantsQuery = useFranchiseEducationApplicantsQuery(
    detailQuery.data ? educationId : undefined,
    { page, size },
  )

  // 상세 not-found는 아래에서 전용 UX로 렌더하므로, 그 외 실패만 토스트로 알린다.
  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  // 신청자 목록 실패는 표 영역 안내 문구 + 토스트로 처리한다(MeetingRoomManagementPage 동형).
  useEffect(() => {
    if (!applicantsQuery.error) {
      return
    }
    handleApiError(applicantsQuery.error, { toast })
  }, [applicantsQuery.error])

  const applicants = applicantsQuery.data?.content ?? []
  const pageInfo: PageMeta = applicantsQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('franchiseName', {
        header: '가맹점명',
        cell: (info) => <span className="font-medium text-foreground">{info.getValue()}</span>,
      }),
      columnHelper.accessor('contactNumber', {
        header: '연락처',
      }),
      columnHelper.accessor('contactEmail', {
        header: '이메일',
      }),
      columnHelper.accessor('appliedCount', {
        header: '신청인원',
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
      }),
      columnHelper.accessor('appliedAt', {
        header: '신청일시',
        cell: (info) => dayjs(info.getValue()).format('YYYY-MM-DD HH:mm'),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: applicants,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (educationId === undefined) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">가맹점 교육 상세</h1>
        <p className="text-sm text-muted-foreground">잘못된 교육 식별자입니다.</p>
      </div>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (detailQuery.error) {
    if (isNotFound(normalizeApiError(detailQuery.error))) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">가맹점 교육 상세</h1>
          <p className="text-sm text-muted-foreground">교육을 찾을 수 없습니다.</p>
        </div>
      )
    }
    // not-found가 아닌 실패는 위 useEffect가 토스트로 알렸으므로 화면은 안내 문구만 표시한다.
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">가맹점 교육 상세</h1>
        <p className="text-sm text-muted-foreground">교육 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const education = detailQuery.data
  const files = education.fileListInfoList

  // 상세 응답의 잔여정원으로 정원 마감 여부를 파생한다(상세 응답에는 isFull 필드가 없다).
  const isFull = education.remainingCapacity <= 0

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <FranchisePageHeader
        title="가맹점 교육 상세"
        description="교육 정보와 신청 현황을 확인합니다."
      />

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{education.title}</CardTitle>
                <Badge variant={education.isActive ? 'default' : 'outline'}>
                  {education.isActive ? '활성' : '비활성'}
                </Badge>
                <Badge variant={isFull ? 'destructive' : 'secondary'}>
                  {isFull ? '정원 마감' : '신청 가능'}
                </Badge>
              </div>
              {/* 일자·시각·장소를 개별 span으로 분리해 각 값을 독립 텍스트 노드로 유지한다
                  (가운뎃점은 장식). */}
              <p className="text-sm text-muted-foreground">
                <span>{education.date}</span>
                <span aria-hidden className="px-1.5">
                  ·
                </span>
                <span>{education.startAt}</span>
                <span aria-hidden className="px-1.5">
                  ·
                </span>
                <span>{education.place}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!education.isActive && education.appliedCount === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUpdateOpen(true)}
                >
                  수정
                </Button>
              )}
              <FranchiseEducationActiveToggleButton
                educationId={education.id}
                isActive={education.isActive}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">내용</p>
            <p className="text-sm whitespace-pre-wrap">{education.content}</p>
          </div>

          <FranchiseEducationAttachmentSection educationId={education.id} files={files} />
        </CardContent>
      </Card>

      {/* 신청 현황 KPI: 상세 응답의 실데이터. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FranchiseMetricCard
          title="신청 인원"
          value={`${education.appliedCount}명`}
          description={`정원 ${education.capacity}명`}
          icon={<Users />}
          accent="primary"
        />
        <FranchiseMetricCard
          title="잔여 좌석"
          value={`${education.remainingCapacity}석`}
          description="실시간 신청 현황 기준"
          icon={<Armchair />}
          accent={education.remainingCapacity > 0 ? 'muted' : 'destructive'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>신청자 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {applicantsQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : applicantsQuery.error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              신청자 목록을 불러오지 못했습니다.
            </p>
          ) : applicants.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">신청자가 없습니다.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-border">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <PaginationControls
            className="border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="건"
          />
        </CardContent>
      </Card>

      <FranchiseEducationUpdateDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        educationId={education.id}
        detail={education}
      />
    </div>
  )
}
