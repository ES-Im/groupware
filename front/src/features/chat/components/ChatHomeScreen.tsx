import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { getActiveProfilePicture } from '@/shared/lib/activeFiles'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { ChatEmployeeListPanel } from './ChatEmployeeListPanel'
import { ChatRoomListPanel } from './ChatRoomListPanel'

/**
 * 채팅 오버레이 홈 화면(screen==='home'). 상단 프로필 + 사원목록/채팅창목록 탭으로 구성된다.
 * 탭 선택 상태는 chatOverlayStore가 소유한다 — 방 상세에서 '멤버 초대'로 진입할 때
 * (startInviteFlow) 이 화면의 사원목록 탭이 초대 모드로 강제 전환되어야 하므로 로컬 상태로 두지
 * 않는다. presence(온라인 상태 배지·상태 메시지)는 이 프로젝트에 없는 기능이라 발명하지 않는다.
 */
export function ChatHomeScreen() {
  const activeTab = useChatOverlayStore((state) => state.activeTab)
  const setActiveTab = useChatOverlayStore((state) => state.setActiveTab)

  const meQuery = useMeQuery()
  const me = meQuery.data
  const primaryDept = me?.currentDepts.find((dept) => dept.isPrimary) ?? me?.currentDepts[0]

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-4">
        <BlobAvatar
          empId={me?.empBasicInfo.empId}
          fileId={me ? getActiveProfilePicture(me.activeFiles) : undefined}
          fallbackText={me?.empBasicInfo.name ?? ''}
          className="size-11 text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">
            {me?.empBasicInfo.name ?? ''}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {primaryDept ? `${primaryDept.deptName} · ${primaryDept.positionName}` : ''}
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'employees' | 'rooms')}
        className="min-h-0 flex-1"
      >
        {/* 두 탭이 패널 폭을 꽉 채우도록 block-level flex(w-auto)로 확장해 활성 탭 구분을 뚜렷하게 한다. */}
        <TabsList className="mx-4 mt-3 flex w-auto">
          <TabsTrigger value="employees">사원목록</TabsTrigger>
          <TabsTrigger value="rooms">채팅창목록</TabsTrigger>
        </TabsList>
        <TabsContent value="employees" className="flex min-h-0 flex-col">
          <ChatEmployeeListPanel />
        </TabsContent>
        <TabsContent value="rooms" className="flex min-h-0 flex-col">
          <ChatRoomListPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
