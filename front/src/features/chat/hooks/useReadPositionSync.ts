import { useEffect, useRef } from 'react'
import { useUpdateReadPositionMutation } from '../api/useUpdateReadPositionMutation'
import type { ChatMessage } from '../model/chatMessage'

export function useReadPositionSync(roomId: number, messages: ChatMessage[]): void {
  const { mutate } = useUpdateReadPositionMutation(roomId)

  const roomIdRef = useRef(roomId)
  roomIdRef.current = roomId
  const mutateRef = useRef(mutate)
  mutateRef.current = mutate

  const lastSyncedRef = useRef<{ roomId: number; messageId: number } | null>(null)
  const inFlightRef = useRef(false)
  const pendingRef = useRef<{ roomId: number; messageId: number } | null>(null)

  let latestConfirmedId: number | null = null
  for (const message of messages) {
    if (message.id > 0 && (latestConfirmedId === null || message.id > latestConfirmedId)) {
      latestConfirmedId = message.id
    }
  }

  useEffect(() => {
    if (latestConfirmedId === null) {
      return
    }
    const last = lastSyncedRef.current
    if (last && last.roomId === roomId && latestConfirmedId <= last.messageId) {
      return
    }
    lastSyncedRef.current = { roomId, messageId: latestConfirmedId }

    if (inFlightRef.current) {
      pendingRef.current = { roomId, messageId: latestConfirmedId }
      return
    }

    fireSync(latestConfirmedId)
  }, [roomId, latestConfirmedId])

  function fireSync(targetMessageId: number) {
    inFlightRef.current = true
    pendingRef.current = null
    mutateRef.current(targetMessageId, {
      onSettled: () => {
        inFlightRef.current = false
        const pending = pendingRef.current
        if (!pending || pending.roomId !== roomIdRef.current) {
          return
        }
        fireSync(pending.messageId)
      },
    })
  }
}
