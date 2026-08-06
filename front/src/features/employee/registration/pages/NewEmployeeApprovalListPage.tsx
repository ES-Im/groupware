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

const SEARCH_DEBOUNCE_MS = 300

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

  function handleApproveError(error: unknown) {
    handleApiError(error, { toast })
    setSelected(undefined)
    queryClient.invalidateQueries({ queryKey: employeeKeys.newEmployees() })
  }

  return (
    <div className="flex w-full flex-col p-4 sm:p-6 lg:h-full lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">신규 사원 승인</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          가입 대기 중인 사원을 승인하고 조직 소속을 배정합니다 (HR · ADMIN)
        </p>
      </div>

      <Card className="flex flex-col lg:min-h-0 lg:flex-1">
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
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex min-h-[20rem] flex-col overflow-y-auto lg:min-h-0 lg:flex-1">
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
            className="shrink-0 border-t pt-4"
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
          }}
          onApproveError={handleApproveError}
        />
      )}
    </div>
  )
}
