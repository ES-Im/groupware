import { useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { connectChatStomp, disconnectChatStomp } from '../lib/stompClient'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { ChatHomeScreen } from './ChatHomeScreen'
import { ChatRoomDetailPanel } from './ChatRoomDetailPanel'

export function ChatOverlayPanel() {
  const isOpen = useChatOverlayStore((state) => state.isOpen)

  if (!isOpen) {
    return null
  }

  return <ChatOverlayPanelContent />
}

function ChatOverlayPanelContent() {
  const screen = useChatOverlayStore((state) => state.screen)
  const selectedRoomId = useChatOverlayStore((state) => state.selectedRoomId)
  const close = useChatOverlayStore((state) => state.close)

  useEffect(() => {
    connectChatStomp()
    return () => {
      disconnectChatStomp()
    }
  }, [])

  return (
    <div className="fixed right-4 bottom-4 z-50 flex h-[760px] max-h-[calc(100vh-2rem)] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquare className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="text-[15px] font-semibold">채팅</span>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="채팅 닫기" onClick={close}>
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {screen === 'home' || selectedRoomId === null ? (
          <ChatHomeScreen />
        ) : (
          <ChatRoomDetailPanel roomId={selectedRoomId} />
        )}
      </div>
    </div>
  )
}
