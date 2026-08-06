import { useState, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { useSendChatMessage } from '../hooks/useSendChatMessage'

export function ChatMessageInput({ roomId }: { roomId: number }) {
  const [content, setContent] = useState('')
  const { sendMessage } = useSendChatMessage(roomId)

  function handleSend() {
    if (sendMessage(content)) {
      setContent('')
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        handleSend()
      }}
      className="flex shrink-0 items-end gap-2 border-t border-border p-3"
    >
      <label htmlFor="chat-message-input" className="sr-only">
        메시지 입력
      </label>
      <Textarea
        id="chat-message-input"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요"
        className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl bg-muted/40"
      />
      <Button type="submit" size="icon" className="rounded-full" aria-label="전송">
        <Send aria-hidden="true" />
      </Button>
    </form>
  )
}
