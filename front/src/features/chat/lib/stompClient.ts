import { Client } from '@stomp/stompjs'
import { getAccessToken } from '@/shared/api/tokenStore'
import { setChatStompStatus } from './chatConnectionStatus'

const CHAT_WS_URL = `${import.meta.env.VITE_WS_URL}/ws-chat`

let chatStompClient: Client | null = null

export function getChatStompClient(): Client {
  chatStompClient ??= new Client({
    brokerURL: CHAT_WS_URL,
    connectHeaders: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
    beforeConnect: (client) => {
      client.connectHeaders = { Authorization: `Bearer ${getAccessToken() ?? ''}` }
    },
    reconnectDelay: 0,
    onConnect: () => {
      setChatStompStatus('connected')
    },
    onWebSocketClose: () => {
      setChatStompStatus('disconnected')
    },
  })
  return chatStompClient
}

export function connectChatStomp(): void {
  const client = getChatStompClient()
  if (!client.active) {
    setChatStompStatus('connecting')
  }
  client.activate()
}

export function disconnectChatStomp(): void {
  if (!chatStompClient) return
  void chatStompClient.deactivate({ force: true })
}
