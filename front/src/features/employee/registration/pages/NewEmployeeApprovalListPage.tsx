import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { employeeKeys } from '../../model/queryKeys'
import { useNewEmployeesQuery } from '../api/useNewEmployeesQuery'
import { EmpApprovalWizardDialog } from '../components/EmpApprovalWizardDialog'
import { NewEmployeesTable } from '../components/NewEmployeesTable'

/** 검색 디바운스 지연(ms). BoardListPage/DepartmentsPage와 동일 값. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * 가입대기자 목록 페이지(F001, ROADMAP T1.6, /employees/new — 라우트 배선은 T1.7 소관).
 *
 * FranchiseInquiryListPage와 동형(단일 Card, 검색어 300ms 디바운스 + usePageState +
 * PaginationControls). 빈 목록 안내는 이 페이지가 전담한다 — NewEmployeesTable(T1.5)은
 * 빈 배열을 그대로 렌더(헤더만 있는 빈 표)하므로, 여기서 content.length===0을 먼저 가드한다.
 *
 * selected: [승인] 클릭 시 대상 empId·name·loginId를 보관하고 EmpApprovalWizardDialog를 호스팅한다
 * (ROADMAP T2.5). 승인 성공 시 다이얼로그가 내부적으로 2단계로 전진하고(2단계 본체는 M3),
 * 실패(도메인 에러) 시에는 에러 토스트를 띄운 뒤 다이얼로그를 닫고 가입대기자 목록을 재조회한다.
 */
export function NewEmployeeApprovalListPage() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const { page, size, onPageChange, resetPage } = usePageState()
  const [selected, setSelected] = useState<{ empId: number; name: string; loginId: string } | undefined>()

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => {
      setKeyword(trimmed)
      resetPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword, resetPage])

  const newEmployeesQuery = useNewEmployeesQuery({ keyword, page, size })

  useEffect(() => {
    if (!newEmployeesQuery.error) {
      return
    }
    handleApiError(newEmployeesQuery.error, { toast })
  }, [newEmployeesQuery.error])

  const rows = newEmployeesQuery.data?.content ?? []
  const pageInfo: PageMeta = newEmployeesQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  /** 1단계 승인 실패(도메인 에러): 토스트로 알리고 다이얼로그를 닫은 뒤 가입대기자 목록을 재조회한다. */
  function handleApproveError(error: unknown) {
    handleApiError(error, { toast })
    setSelected(undefined)
    queryClient.invalidateQueries({ queryKey: employeeKeys.newEmployees() })
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">신규 사원 승인</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          가입 대기 중인 사원을 승인하고 조직 소속을 배정합니다 (HR · ADMIN)
        </p>
      </div>

      <Card className="h-fit">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>가입 대기자 목록</CardTitle>
            {newEmployeesQuery.data && (
              <Badge variant="secondary">{pageInfo.totalElements}건</Badge>
            )}

            <div className="relative ml-auto w-full sm:w-64">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="이름 검색"
                aria-label="이름 검색"
                className="h-8 w-full pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex min-h-[56rem] flex-col">
            {newEmployeesQuery.isLoading ? (
              <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                불러오는 중...
              </p>
            ) : newEmployeesQuery.error ? (
              <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                가입대기자 목록을 불러오지 못했습니다.
              </p>
            ) : rows.length === 0 ? (
              <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                가입 대기 중인 사원이 없습니다.
              </p>
            ) : (
              <NewEmployeesTable
                data={rows}
                onApprove={(empId, name, loginId) => setSelected({ empId, name, loginId })}
              />
            )}
          </div>

          <PaginationControls
            className="border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="건"
          />
        </CardContent>
      </Card>

      {selected && (
        <EmpApprovalWizardDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              setSelected(undefined)
            }
          }}
          empId={selected.empId}
          empName={selected.name}
          loginId={selected.loginId}
          onApproveSuccess={() => {
            // 2단계 본체는 M3(T3.7)이 채운다. 다이얼로그가 이미 내부적으로 2단계로 전진하므로
            // 이 배선은 현재 아무 것도 하지 않는다.
          }}
          onApproveError={handleApproveError}
        />
      )}
    </div>
  )
}
