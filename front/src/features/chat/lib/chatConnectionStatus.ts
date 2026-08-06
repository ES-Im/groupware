import { create } from 'zustand'

export type ChatStompStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'

interface ChatStompStatusState {
  status: ChatStompStatus
}

const useChatStompStatusStore = create<ChatStompStatusState>(() => ({
  status: 'idle',
}))

export function setChatStompStatus(status: ChatStompStatus): void {
  useChatStompStatusStore.setState({ status })
}

export function useChatStompStatus(): ChatStompStatus {
  return useChatStompStatusStore((state) => state.status)
}
