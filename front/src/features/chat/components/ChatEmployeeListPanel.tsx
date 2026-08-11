import { useEffect, useState } from 'react'
import { Building2, ChevronLeft, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useDepartmentMembersQuery } from '@/features/department/api/useDepartmentMembersQuery'
import { useDepartmentsQuery } from '@/features/department/api/useDepartmentsQuery'
import { useEmployeeNameSearchQuery } from '@/features/department/api/useEmployeeNameSearchQuery'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { handleApiError } from '@/shared/lib/apiError'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'
import { useChatRoomDetailQuery } from '../api/useChatRoomDetailQuery'
import { useCreateChatRoomMutation } from '../api/useCreateChatRoomMutation'
import { useInviteChatRoomMembersMutation } from '../api/useInviteChatRoomMembersMutation'
import { useChatOverlayStore } from '../lib/chatOverlayStore'

const SEARCH_DEBOUNCE_MS = 300

const ALL_DEPARTMENTS_PAGE_SIZE = 500

interface EmployeeRow {
  empId: number
  empName: string
  secondary: string
}

export function ChatEmployeeListPanel() {
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [drillDept, setDrillDept] = useState<{ deptId: number; deptName: string } | null>(null)

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => setKeyword(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword])

  useEffect(() => {
    setDrillDept(null)
  }, [keyword])

  const isSearching = keyword.length > 0

  const meQuery = useMeQuery()
  const me = meQuery.data
  const myEmpId = me?.empBasicInfo.empId
  const myPrimaryDept = me?.currentDepts.find((dept) => dept.isPrimary) ?? me?.currentDepts[0]
  const myPrimaryDeptId = myPrimaryDept?.deptId
  const myPrimaryDeptName = myPrimaryDept?.deptName

  const departmentsQuery = useDepartmentsQuery({ isActive: true, size: ALL_DEPARTMENTS_PAGE_SIZE })
  const departments = departmentsQuery.data?.content ?? []
  const deptSearchResults =
    isSearching && !drillDept
      ? departments.filter((dept) => dept.deptInfoResponse.deptName.includes(keyword))
      : []

  const membersDeptId = drillDept ? drillDept.deptId : isSearching ? undefined : myPrimaryDeptId
  const deptMembersQuery = useDepartmentMembersQuery(membersDeptId, { size: 50 })

  const searchQuery = useEmployeeNameSearchQuery(isSearching && !drillDept ? keyword : '')

  const inviteTargetRoomId = useChatOverlayStore((state) => state.inviteTargetRoomId)
  const selectRoom = useChatOverlayStore((state) => state.selectRoom)

  const detailQuery = useChatRoomDetailQuery(inviteTargetRoomId ?? undefined)
  const existingMemberIds = detailQuery.data?.members.map((member) => member.memberId) ?? []

  const inviteMutation = useInviteChatRoomMembersMutation(inviteTargetRoomId ?? 0)
  const createMutation = useCreateChatRoomMutation()

  function handleSelectEmployee(empId: number) {
    if (inviteTargetRoomId != null) {
      inviteMutation.mutate([empId], {
        onSuccess: () => selectRoom(inviteTargetRoomId),
        onError: (error) => handleApiError(error, { toast }),
      })
      return
    }
    createMutation.mutate(
      { memberIds: [empId] },
      {
        onSuccess: (result) => selectRoom(result.id),
        onError: (error) => handleApiError(error, { toast }),
      },
    )
  }

  const memberRows: EmployeeRow[] = (deptMembersQuery.data?.content ?? []).map((member) => ({
    empId: member.empId,
    empName: member.empName,
    secondary: member.position,
  }))
  const employeeSearchRows: EmployeeRow[] = searchQuery.items.map((item) => ({
    empId: item.empId,
    empName: item.empName,
    secondary: `${item.deptName} · ${item.position}`,
  }))

  function renderEmployeeRow(row: EmployeeRow) {
    const disabled = row.empId === myEmpId || existingMemberIds.includes(row.empId)
    return (
      <li key={row.empId}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectEmployee(row.empId)}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted',
            disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
          )}
        >
          <BlobAvatar empId={row.empId} fallbackText={row.empName} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{row.empName}</span>
            <span className="truncate text-xs text-muted-foreground">{row.secondary}</span>
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <div className="relative shrink-0">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="부서·사원 검색"
          aria-label="부서·사원 검색"
          className="rounded-xl pl-9"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {drillDept ? (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setDrillDept(null)}
              className="flex items-center gap-1 self-start rounded-lg px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              검색 결과로
            </button>
            <p className="px-1 text-xs font-medium text-muted-foreground">
              {drillDept.deptName} · {memberRows.length}명
            </p>
            {deptMembersQuery.isLoading ? (
              <p className="p-2 text-sm text-muted-foreground">불러오는 중...</p>
            ) : memberRows.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">부서에 사원이 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-0.5">{memberRows.map(renderEmployeeRow)}</ul>
            )}
          </div>
        ) : isSearching ? (
          <div className="flex flex-col gap-3">
            {deptSearchResults.length > 0 && (
              <section>
                <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
                  부서 {deptSearchResults.length}건
                </p>
                <ul className="flex flex-col gap-0.5">
                  {deptSearchResults.map((dept) => {
                    const info = dept.deptInfoResponse
                    return (
                      <li key={info.deptId}>
                        <button
                          type="button"
                          onClick={() => setDrillDept({ deptId: info.deptId, deptName: info.deptName })}
                          className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Building2 className="size-4" aria-hidden="true" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">{info.deptName}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {info.deptCode}
                              {dept.deptLeader?.empName ? ` · ${dept.deptLeader.empName}` : ''}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {searchQuery.isLoading ? (
              <p className="p-2 text-sm text-muted-foreground">불러오는 중...</p>
            ) : employeeSearchRows.length > 0 ? (
              <section>
                <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">
                  사원 {employeeSearchRows.length}명
                </p>
                <ul className="flex flex-col gap-0.5">{employeeSearchRows.map(renderEmployeeRow)}</ul>
              </section>
            ) : deptSearchResults.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">검색 결과가 없습니다.</p>
            ) : null}
          </div>
        ) : myPrimaryDeptId == null ? (
          <p className="p-2 text-sm text-muted-foreground">
            소속 부서가 없습니다. 부서·사원을 검색해 사원을 찾아보세요.
          </p>
        ) : deptMembersQuery.isLoading ? (
          <p className="p-2 text-sm text-muted-foreground">불러오는 중...</p>
        ) : memberRows.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">사원이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="px-1 text-xs font-medium text-muted-foreground">
              {myPrimaryDeptName ? `${myPrimaryDeptName} · ${memberRows.length}명` : `${memberRows.length}명`}
            </p>
            <ul className="flex flex-col gap-0.5">{memberRows.map(renderEmployeeRow)}</ul>
          </div>
        )}
      </div>
    </div>
  )
}
