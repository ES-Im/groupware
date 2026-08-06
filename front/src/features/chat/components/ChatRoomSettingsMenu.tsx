import { useRef, useState } from 'react'
import { LogOut, Pencil, Settings, UserPlus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { ChatRoomNameUpdateDialog } from './ChatRoomNameUpdateDialog'
import { LeaveChatRoomDialog } from './LeaveChatRoomDialog'

const HOVER_CLOSE_DELAY_MS = 150

export function ChatRoomSettingsMenu({ roomId }: { roomId: number }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startInviteFlow = useChatOverlayStore((state) => state.startInviteFlow)

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  function handleMouseEnter() {
    clearCloseTimer()
    setIsMenuOpen(true)
  }

  function handleMouseLeave() {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setIsMenuOpen(false), HOVER_CLOSE_DELAY_MS)
  }

  function handleInvite() {
    startInviteFlow(roomId)
  }

  function handleUpdateName() {
    setIsNameDialogOpen(true)
  }

  function handleLeave() {
    setIsLeaveDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="채팅방 설정">
              <Settings aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <DropdownMenuItem onSelect={handleInvite}>
              <UserPlus aria-hidden="true" />
              멤버초대
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleUpdateName}>
              <Pencil aria-hidden="true" />
              채팅방이름 변경
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleLeave}>
              <LogOut aria-hidden="true" />
              방퇴장하기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
      <LeaveChatRoomDialog roomId={roomId} open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen} />
      <ChatRoomNameUpdateDialog roomId={roomId} open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen} />
    </>
  )
}
