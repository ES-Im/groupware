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

/** 사원 검색 디바운스 지연(ms). EmployeeSearchOverlay/EmployeePicker와 동일 값. */
const SEARCH_DEBOUNCE_MS = 300

/** 전체 부서를 한 페이지에 담기 위한 size. EmployeeSearchOverlay의 ALL_DEPARTMENTS_PAGE_SIZE와 동일 값. */
const ALL_DEPARTMENTS_PAGE_SIZE = 500

/** 두 데이터 소스(부서 멤버 / 전사 검색 결과)를 하나의 행 형태로 정규화한 뷰 모델. */
interface EmployeeRow {
  empId: number
  empName: string
  /** 아바타 아래 보조 라벨(부서 멤버 목록=직급, 사원 검색 결과=부서 · 직급). */
  secondary: string
}

/**
 * 채팅 오버레이 홈 화면의 '사원목록' 탭(ChatHomeScreen).
 *
 * 검색은 헤더 "부서·사원 검색"(EmployeeSearchOverlay)과 동일하게 사원 이름과 부서명을 함께 찾는다
 * (사용자 요청). 검색어 유무·부서 파고들기(drill) 상태로 데이터 소스를 3분기한다:
 *   - 검색어 없음: 본인 주 소속 부서 멤버를 기본 노출(useDepartmentMembersQuery).
 *   - 검색어 있음(디바운스): 부서명 부분일치 결과(useDepartmentsQuery에서 필터) + 전사 사원 이름
 *     검색 결과(useEmployeeNameSearchQuery)를 두 섹션으로 보여준다.
 *   - 부서 결과를 클릭(drill): 그 부서 멤버 목록으로 파고들어 그 안에서 사원을 고른다.
 * 사원 행 클릭 동작은 chatOverlayStore.inviteTargetRoomId로 분기한다:
 *   - non-null(멤버 초대 진입): 대상 방의 현재 멤버(useChatRoomDetailQuery)를 disabled 처리하고,
 *     행 클릭 시 useInviteChatRoomMembersMutation으로 초대한다.
 *   - null(일반 브라우징): 행 클릭 시 useCreateChatRoomMutation으로 그 사원과의 1:1 방을 만든다.
 * 두 mutation 훅 모두 항상 호출한다(Hooks 규칙) — roomId가 없는 초대 mutation은 0으로 폴백해
 * 훅 자체는 항상 구성하되, 실제 mutate 호출만 모드에 따라 분기한다.
 */
export function ChatEmployeeListPanel() {
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  // 검색 결과에서 부서를 클릭하면 그 부서 멤버 목록으로 파고든다(null이면 검색 결과/기본 목록 화면).
  const [drillDept, setDrillDept] = useState<{ deptId: number; deptName: string } | null>(null)

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => setKeyword(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword])

  // 검색어가 바뀌면 부서 파고들기를 해제해 검색 결과 화면으로 되돌린다.
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

  // 부서명 검색용 전체 부서 목록(헤더 "부서·사원 검색"과 동일 소스라 React Query 캐시를 공유한다).
  const departmentsQuery = useDepartmentsQuery({ size: ALL_DEPARTMENTS_PAGE_SIZE })
  const departments = departmentsQuery.data?.content ?? []
  const deptSearchResults =
    isSearching && !drillDept
      ? departments.filter((dept) => dept.deptInfoResponse.deptName.includes(keyword))
      : []

  // 표시할 부서 멤버 대상 deptId: 파고든 부서 > (검색 아닐 때) 본인 부서. 검색 중 & drill 아니면
  // undefined로 넘겨 useDepartmentMembersQuery가 enabled:false로 대기한다(불필요한 요청 차단).
  const membersDeptId = drillDept ? drillDept.deptId : isSearching ? undefined : myPrimaryDeptId
  const deptMembersQuery = useDepartmentMembersQuery(membersDeptId, { size: 50 })

  // 사원 이름 검색: 검색 중 & drill 아닐 때만 동작(drill 중엔 그 부서 멤버를 보여준다). 빈 키워드면
  // 훅 내부에서 enabled:false로 대기하므로 '' 를 넘겨 비활성화한다.
  const searchQuery = useEmployeeNameSearchQuery(isSearching && !drillDept ? keyword : '')

  const inviteTargetRoomId = useChatOverlayStore((state) => state.inviteTargetRoomId)
  const selectRoom = useChatOverlayStore((state) => state.selectRoom)

  // 초대 모드가 아니면 roomId가 없어 enabled:false로 대기한다(useChatRoomDetailQuery 가드).
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
        onSuccess: (result) => selectRoom(result.roomId),
        onError: (error) => handleApiError(error, { toast }),
      },
    )
  }

  // 부서 멤버(기본/ drill)와 사원 검색 결과를 각각 공통 행 형태로 정규화한다.
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
          {/* 프로필 파일 필드가 없어(empId/empName/position) 이니셜 폴백만 렌더된다. */}
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
      {/* 통합 단일 검색창(헤더 "부서·사원 검색"과 동일 개념): 사원 이름과 부서명을 함께 찾는다. */}
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
          // 부서 파고들기: 검색 결과에서 부서를 클릭한 상태. 그 부서 멤버를 보여주고 사원을 고른다.
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
          // 검색 모드: 부서 결과 + 사원 결과 두 섹션을 함께 보여준다.
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
          // 기본 화면(검색어 없음): 본인 주 소속 부서 멤버.
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
