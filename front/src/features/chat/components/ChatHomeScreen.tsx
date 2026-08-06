import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { getActiveProfilePicture } from '@/shared/lib/activeFiles'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { ChatEmployeeListPanel } from './ChatEmployeeListPanel'
import { ChatRoomListPanel } from './ChatRoomListPanel'

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
