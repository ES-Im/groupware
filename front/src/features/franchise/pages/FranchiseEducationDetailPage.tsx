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
import { Armchair, BookOpen, CalendarDays, MapPin, Store, Users } from 'lucide-react'
import { handleApiError, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useFranchiseEducationApplicantsQuery } from '../api/useFranchiseEducationApplicantsQuery'
import { useFranchiseEducationDetailQuery } from '../api/useFranchiseEducationDetailQuery'
import { FranchiseBackLink } from '../components/FranchiseBackLink'
import { FranchiseDetailHero, FranchiseHeroMetaItem } from '../components/FranchiseDetailHero'
import { FranchiseEducationActiveToggleButton } from '../components/FranchiseEducationActiveToggleButton'
import { FranchiseEducationAttachmentSection } from '../components/FranchiseEducationAttachmentSection'
import { FranchiseEducationUpdateDialog } from '../components/FranchiseEducationUpdateDialog'
import { FranchiseStatusPill } from '../components/FranchiseStatusPill'
import type { FranchiseEducationApplicant } from '../model/franchise'

const columnHelper = createColumnHelper<FranchiseEducationApplicant>()

export function FranchiseEducationDetailPage() {
  const { educationId: educationIdParam } = useParams<{ educationId: string }>()
  const [updateOpen, setUpdateOpen] = useState(false)

  const isDecimalPositiveInteger =
    educationIdParam !== undefined && /^[1-9][0-9]*$/.test(educationIdParam)
  const educationId = isDecimalPositiveInteger ? Number(educationIdParam) : undefined

  const detailQuery = useFranchiseEducationDetailQuery(educationId)

  const { page, size, onPageChange } = usePageState()
  const applicantsQuery = useFranchiseEducationApplicantsQuery(
    detailQuery.data ? educationId : undefined,
    { page, size },
  )

  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

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
        cell: (info) => (
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-3.5">
              <Store aria-hidden />
            </span>
            <span className="font-medium text-foreground">{info.getValue()}</span>
          </div>
        ),
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

  const isFull = education.remainingCapacity <= 0

  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6 lg:p-8 lg:min-h-full">
      <FranchiseBackLink to="/franchise-educations">가맹점 교육</FranchiseBackLink>

      <Card>
        <CardContent>
          <FranchiseDetailHero
            icon={<BookOpen aria-hidden />}
            title={education.title}
            status={
              <>
                <FranchiseStatusPill variant={education.isActive ? 'default' : 'outline'}>
                  {education.isActive ? '활성' : '비활성'}
                </FranchiseStatusPill>
                <FranchiseStatusPill variant={isFull ? 'destructive' : 'secondary'}>
                  {isFull ? '정원 마감' : '신청 가능'}
                </FranchiseStatusPill>
              </>
            }
            meta={
              <>
                <FranchiseHeroMetaItem icon={<CalendarDays aria-hidden />}>
                  <span>{education.date}</span>
                  <span aria-hidden className="px-1">
                    ·
                  </span>
                  <span>{education.startAt}</span>
                </FranchiseHeroMetaItem>
                <FranchiseHeroMetaItem icon={<MapPin aria-hidden />}>
                  {education.place}
                </FranchiseHeroMetaItem>
                <FranchiseHeroMetaItem icon={<Users aria-hidden />}>
                  신청 {education.appliedCount} / 정원 {education.capacity}
                </FranchiseHeroMetaItem>
                <FranchiseHeroMetaItem icon={<Armchair aria-hidden />}>
                  잔여 {education.remainingCapacity}석
                </FranchiseHeroMetaItem>
              </>
            }
            actions={
              <>
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
              </>
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:auto-rows-fr lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Store className="size-4 text-primary" aria-hidden />
              신청 가맹점
            </CardTitle>
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

        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-4 text-primary" aria-hidden />
                교육 개요
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{education.content}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <FranchiseEducationAttachmentSection educationId={education.id} files={files} />
            </CardContent>
          </Card>
        </div>
      </div>

      <FranchiseEducationUpdateDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        educationId={education.id}
        detail={education}
      />
    </div>
  )
}
