import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useDepartmentMembersQuery } from '@/features/department/api/useDepartmentMembersQuery'
import { useDepartmentsQuery } from '@/features/department/api/useDepartmentsQuery'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { handleApiError } from '@/shared/lib/apiError'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'
import { useChatRoomDetailQuery } from '../api/useChatRoomDetailQuery'
import { useCreateChatRoomMutation } from '../api/useCreateChatRoomMutation'
import { useInviteChatRoomMembersMutation } from '../api/useInviteChatRoomMembersMutation'
import { useChatOverlayStore } from '../lib/chatOverlayStore'

/** 부서원 검색 디바운스 지연(ms). EmployeePicker(approval)와 동일 값. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * 채팅 오버레이 홈 화면의 '사원목록' 탭(ChatHomeScreen). 부서 선택 → 부서원 검색까지
 * EmployeePicker(approval, cross-feature 재사용은 하지 않고 동일 패턴만 최소 이식 — Picker는
 * '선택 후 확정' 다이얼로그 흐름이라 행 클릭 즉시 액션이 발생하는 이 화면과 상호작용 모델이
 * 달라 그대로 재사용하지 않는다)와 동일한 부서/부서원 조회 훅(useDepartmentsQuery·
 * useDepartmentMembersQuery)을 그대로 재사용한다.
 *
 * chatOverlayStore.inviteTargetRoomId로 두 모드를 분기한다:
 *   - non-null(멤버 초대 진입): 대상 방의 현재 멤버(useChatRoomDetailQuery)를 이미 참여 중인
 *     사원으로 간주해 disabled 처리하고, 행 클릭 시 useInviteChatRoomMembersMutation으로 초대한다.
 *   - null(일반 브라우징): 행 클릭 시 useCreateChatRoomMutation으로 그 사원과의 1:1 방을 새로
 *     만든다(기존 CreateChatRoomDialog의 다중 인원 그룹 생성과는 별개 경로).
 * 두 mutation 훅 모두 항상 호출한다(Hooks 규칙) — roomId가 없는 초대 mutation은 0으로 폴백해
 * 훅 자체는 항상 구성하되, 실제 mutate 호출만 모드에 따라 분기한다.
 */
export function ChatEmployeeListPanel() {
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined)
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

  const deptsQuery = useDepartmentsQuery({ isActive: true, size: 100 })
  const membersQuery = useDepartmentMembersQuery(selectedDeptId, {
    keyword: keyword || undefined,
    size: 50,
  })
  const depts = deptsQuery.data?.content ?? []
  const members = membersQuery.data?.content ?? []
  // 그룹 라벨("OO팀 · N명")용 부서명 — 이미 페칭된 목록에서 선택 부서를 찾는 순수 파생값이다.
  const selectedDeptName = depts.find(
    (dept) => dept.deptInfoResponse.deptId === selectedDeptId,
  )?.deptInfoResponse.deptName

  const meQuery = useMeQuery()
  const myEmpId = meQuery.data?.empBasicInfo.empId
  const myPrimaryDeptId =
    meQuery.data?.currentDepts.find((dept) => dept.isPrimary)?.deptId ??
    meQuery.data?.currentDepts[0]?.deptId

  // 사원목록 탭을 열면 본인 소속 부서를 기본 선택값으로 미리 채운다(요청 사항). useMeQuery가
  // 비동기로 채워지므로 마운트 시점엔 아직 myPrimaryDeptId가 없을 수 있어 effect로 늦게라도
  // 한 번 적용한다 — hasAppliedDefaultDeptRef로 "이미 적용했는지"만 기억해, 이후 사용자가
  // select를 직접 '부서 선택'(빈 값)으로 되돌려도 이 기본값이 다시 끼어들지 않게 한다.
  const hasAppliedDefaultDeptRef = useRef(false)
  useEffect(() => {
    if (hasAppliedDefaultDeptRef.current || myPrimaryDeptId == null) {
      return
    }
    hasAppliedDefaultDeptRef.current = true
    setSelectedDeptId(myPrimaryDeptId)
  }, [myPrimaryDeptId])

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

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      {/* native select에 shadcn Input 톤(rounded-lg·border-input·focus 링·dark bg)을 맞추고,
          appearance-none으로 OS 화살표를 감춘 뒤 우측에 lucide ChevronDown을 겹쳐 얹는다. */}
      <div className="relative">
        <select
          value={selectedDeptId ?? ''}
          onChange={(event) =>
            setSelectedDeptId(event.target.value ? Number(event.target.value) : undefined)
          }
          aria-label="부서 선택"
          className="h-9 w-full appearance-none rounded-lg border border-input bg-transparent pr-8 pl-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">부서 선택</option>
          {depts.map((dept) => (
            <option key={dept.deptInfoResponse.deptId} value={dept.deptInfoResponse.deptId}>
              {dept.deptInfoResponse.deptName}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <Input
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        placeholder="이름 검색"
        disabled={selectedDeptId === undefined}
        aria-label="사원 이름 검색"
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {selectedDeptId === undefined ? (
          <p className="p-2 text-sm text-muted-foreground">부서를 먼저 선택해주세요.</p>
        ) : membersQuery.isLoading ? (
          <p className="p-2 text-sm text-muted-foreground">불러오는 중...</p>
        ) : members.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">사원이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {/* 부서 그룹 라벨(레퍼런스 "IT팀 · 3명"). 부서명이 아직 없으면 인원수만 노출한다. */}
            <p className="px-2 text-xs font-medium text-muted-foreground">
              {selectedDeptName ? `${selectedDeptName} · ${members.length}명` : `${members.length}명`}
            </p>
            <ul className="flex flex-col gap-0.5">
              {members.map((member) => {
                const disabled =
                  member.empId === myEmpId || existingMemberIds.includes(member.empId)
                return (
                  <li key={member.empId}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelectEmployee(member.empId)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-muted',
                        disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                      )}
                    >
                      {/* member 타입에 프로필 파일 필드가 없어(empId/empName/position만) 이니셜 폴백만 렌더된다. */}
                      <BlobAvatar empId={member.empId} fallbackText={member.empName} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{member.empName}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {member.position}
                        </span>
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
