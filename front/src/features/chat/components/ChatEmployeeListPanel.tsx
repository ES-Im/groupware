import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { useDepartmentMembersQuery } from '@/features/department/api/useDepartmentMembersQuery'
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

/** 두 데이터 소스(본인 부서 멤버 / 전사 검색 결과)를 하나의 행 형태로 정규화한 뷰 모델. */
interface EmployeeRow {
  empId: number
  empName: string
  /** 아바타 아래 보조 라벨(본인 부서 목록=직급, 검색 결과=부서 · 직급). */
  secondary: string
}

/**
 * 채팅 오버레이 홈 화면의 '사원목록' 탭(ChatHomeScreen).
 *
 * 이전에는 [부서 select 드롭다운 + 그 부서 안에서의 이름 검색]이라는 2단 구조였으나, 헤더의
 * "부서·사원 검색"이 쓰는 전사 이름 검색(useEmployeeNameSearchQuery)을 차용해 **단일 검색창**으로
 * 통합했다. 검색어 유무로 데이터 소스를 분기해 기존의 "본인 부서 기본 노출" UX는 유지한다:
 *   - 검색어 없음: 본인 주 소속 부서 멤버를 기본 노출(useDepartmentMembersQuery).
 *   - 검색어 있음(디바운스): 전사 사원 이름 검색(useEmployeeNameSearchQuery, 부서 무관).
 *
 * chatOverlayStore.inviteTargetRoomId로 두 동작 모드를 분기한다:
 *   - non-null(멤버 초대 진입): 대상 방의 현재 멤버(useChatRoomDetailQuery)를 disabled 처리하고,
 *     행 클릭 시 useInviteChatRoomMembersMutation으로 초대한다.
 *   - null(일반 브라우징): 행 클릭 시 useCreateChatRoomMutation으로 그 사원과의 1:1 방을 만든다.
 * 두 mutation 훅 모두 항상 호출한다(Hooks 규칙) — roomId가 없는 초대 mutation은 0으로 폴백해
 * 훅 자체는 항상 구성하되, 실제 mutate 호출만 모드에 따라 분기한다.
 */
export function ChatEmployeeListPanel() {
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => setKeyword(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword])

  const isSearching = keyword.length > 0

  const meQuery = useMeQuery()
  const me = meQuery.data
  const myEmpId = me?.empBasicInfo.empId
  const myPrimaryDept = me?.currentDepts.find((dept) => dept.isPrimary) ?? me?.currentDepts[0]
  const myPrimaryDeptId = myPrimaryDept?.deptId
  const myPrimaryDeptName = myPrimaryDept?.deptName

  // 검색 중이 아닐 때만 본인 소속 부서 멤버를 기본 노출한다(검색 중이면 deptId undefined로 넘겨
  // useDepartmentMembersQuery가 enabled:false로 대기 → 불필요한 요청을 막는다).
  const myDeptMembersQuery = useDepartmentMembersQuery(isSearching ? undefined : myPrimaryDeptId, {
    size: 50,
  })
  // 검색어가 있을 때만 전사 이름 검색이 동작한다(빈 키워드면 훅 내부에서 enabled:false로 대기).
  const searchQuery = useEmployeeNameSearchQuery(keyword)

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

  // 두 소스를 공통 행 형태로 정규화한다.
  const rows: EmployeeRow[] = isSearching
    ? searchQuery.items.map((item) => ({
        empId: item.empId,
        empName: item.empName,
        secondary: `${item.deptName} · ${item.position}`,
      }))
    : (myDeptMembersQuery.data?.content ?? []).map((member) => ({
        empId: member.empId,
        empName: member.empName,
        secondary: member.position,
      }))

  const isLoading = isSearching ? searchQuery.isLoading : myDeptMembersQuery.isLoading

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      {/* 통합 단일 검색창(헤더 "부서·사원 검색"과 동일한 톤): 연한 배경 + 좌측 돋보기 아이콘. */}
      <div className="relative shrink-0">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="이름으로 사원 검색"
          aria-label="사원 이름 검색"
          className="rounded-xl pl-9"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!isSearching && myPrimaryDeptId == null ? (
          <p className="p-2 text-sm text-muted-foreground">
            소속 부서가 없습니다. 이름으로 검색해 사원을 찾아보세요.
          </p>
        ) : isLoading ? (
          <p className="p-2 text-sm text-muted-foreground">불러오는 중...</p>
        ) : rows.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">
            {isSearching ? '검색 결과가 없습니다.' : '사원이 없습니다.'}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {/* 그룹 라벨: 검색 중이면 "검색 결과 · N명", 아니면 본인 부서명 기준("OO팀 · N명"). */}
            <p className="px-1 text-xs font-medium text-muted-foreground">
              {isSearching
                ? `검색 결과 · ${rows.length}명`
                : myPrimaryDeptName
                  ? `${myPrimaryDeptName} · ${rows.length}명`
                  : `${rows.length}명`}
            </p>
            <ul className="flex flex-col gap-0.5">
              {rows.map((row) => {
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
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
