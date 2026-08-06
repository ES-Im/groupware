import { useEffect, useMemo, useState } from 'react'
import { Building2, Mail, Pencil, Phone, Search } from 'lucide-react'
import { useDeptEmpManagementListQuery } from '@/features/employee/api/useDeptEmpManagementListQuery'
import { DeptManagedInfoDialog } from '@/features/employee/components/DeptManagedInfoDialog'
import { HrManagedInfoDialog } from '@/features/employee/components/HrManagedInfoDialog'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import type { DeptInfoResponse, DeptLeader } from '../model/deptInfo'
import type { DeptMemberResponse, Page } from '../model/deptMember'

const SEARCH_DEBOUNCE_MS = 300

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const

interface DepartmentMembersViewProps {
  deptInfo: DeptInfoResponse
  deptLeader: DeptLeader | null
  members: DeptMemberResponse[]
  pageInfo: Page<unknown>
  canManageMembers: boolean
  canManageAsHr: boolean
  canManageAsDeptManager: boolean
  deptId: number
  keyword: string
  onKeywordChange: (value: string) => void
  page: number
  onPageChange: (page: number) => void
  size: number
  onSizeChange: (size: number) => void
  onRowClick: (empId: number) => void
}

export function DepartmentMembersView({
  deptInfo,
  deptLeader,
  members,
  pageInfo,
  canManageMembers,
  canManageAsHr,
  canManageAsDeptManager,
  deptId,
  keyword,
  onKeywordChange,
  page,
  onPageChange,
  size,
  onSizeChange,
  onRowClick,
}: DepartmentMembersViewProps) {
  const [searchInput, setSearchInput] = useState(keyword)

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => onKeywordChange(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword, onKeywordChange])

  const [manageTargetEmpId, setManageTargetEmpId] = useState<number | null>(null)

  const managementQuery = useDeptEmpManagementListQuery(deptId, canManageMembers)
  const recordMap = useMemo(() => {
    const map = new Map(
      (managementQuery.data?.content ?? []).map((record) => [record.empId, record]),
    )
    return map
  }, [managementQuery.data])

  const manageRecord = manageTargetEmpId === null ? undefined : recordMap.get(manageTargetEmpId)

  return (
    <div className="space-y-4">
      <Card className="h-fit">
        <CardContent className="flex flex-wrap items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-6" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight">{deptInfo.deptName}</h2>
              <span
                className={
                  deptInfo.isActive
                    ? 'inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
                    : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                }
              >
                {deptInfo.isActive ? '활성' : '비활성'}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              부서코드 {deptInfo.deptCode} · 부서장 {deptLeader?.empName ?? '미지정'}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">부서 인원</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {pageInfo.totalElements}
              <span className="ml-1 text-sm font-medium text-muted-foreground">명</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>구성원 목록</CardTitle>
            <div className="flex items-center gap-2">
              <label htmlFor="dept-members-page-size" className="sr-only">
                페이지 크기
              </label>
              <select
                id="dept-members-page-size"
                value={size}
                onChange={(event) => onSizeChange(Number(event.target.value))}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}개씩
                  </option>
                ))}
              </select>
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <label htmlFor="dept-members-search" className="sr-only">
                  부서원 이름 검색
                </label>
                <Input
                  id="dept-members-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="부서원 이름 검색..."
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex min-h-[56rem] flex-col">
            {members.length === 0 ? (
              <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                {keyword ? '검색 결과가 없습니다.' : '부서 멤버가 없습니다.'}
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      사번
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      이름
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      직급
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      이메일
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                      내선
                    </th>
                    {canManageMembers && (
                      <th className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap text-muted-foreground">
                        관리
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.empId}
                      role="button"
                      tabIndex={0}
                      onClick={() => onRowClick(member.empId)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          onRowClick(member.empId)
                        }
                      }}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                    >
                      <td className="px-3 py-3 align-middle font-mono text-xs whitespace-nowrap text-muted-foreground">
                        {member.empNo}
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <BlobAvatar
                            empId={member.empId}
                            fileId={undefined}
                            fallbackText={member.empName}
                            className="size-7"
                          />
                          <span className="font-medium text-foreground">{member.empName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground">
                        {member.position}
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="size-3.5 text-muted-foreground" />
                          {member.email}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground" />
                          {member.extensionNo || '-'}
                        </span>
                      </td>
                      {canManageMembers && (
                        <td className="px-3 py-3 text-right align-middle whitespace-nowrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={managementQuery.isLoading || !recordMap.has(member.empId)}
                            onClick={(event) => {
                              event.stopPropagation()
                              setManageTargetEmpId(member.empId)
                            }}
                          >
                            <Pencil />
                            정보 수정
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>

          <PaginationControls
            className="border-t pt-4"
            pageInfo={pageInfo}
            page={page}
            onPageChange={onPageChange}
            unit="명"
          />
        </CardContent>
      </Card>

      {manageTargetEmpId !== null && manageRecord && (
        canManageAsHr ? (
          <HrManagedInfoDialog
            open
            onOpenChange={(open) => {
              if (!open) {
                setManageTargetEmpId(null)
              }
            }}
            empId={manageTargetEmpId}
            record={manageRecord}
          />
        ) : canManageAsDeptManager ? (
          <DeptManagedInfoDialog
            open
            onOpenChange={(open) => {
              if (!open) {
                setManageTargetEmpId(null)
              }
            }}
            empId={manageTargetEmpId}
            record={manageRecord}
          />
        ) : null
      )}
    </div>
  )
}
