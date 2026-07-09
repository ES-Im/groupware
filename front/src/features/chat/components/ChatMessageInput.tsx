import { useState, type KeyboardEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { useSendChatMessage } from '../hooks/useSendChatMessage'

/**
 * 채팅방 메시지 입력창(F905, ROADMAP(CHAT) T2.4). Enter로 전송(IME 조합 중 Enter는 무시),
 * Shift+Enter로 줄바꿈. 실제 발신 로직(낙관 렌더+SEND+2000자 클라 제한+연결 끊김 안내)은
 * `useSendChatMessage`가 전담하고, 이 컴포넌트는 로컬 입력 상태와 키보드 UX만 담당한다.
 *
 * ChatRoomListPage(T1.2)의 검색 입력과 동일하게 순수 `useState`로 로컬 문자열만 관리한다 —
 * CLAUDE.md §6의 RHF+zod 폼 표준은 상신 후에도 유지되는 다필드 폼(게시글/기안 작성 등)에
 * 적용하는 패턴이고, 이 입력은 Enter 한 번으로 즉시 제출·초기화되는 단발성 텍스트 입력이라
 * 폼 상태 관리 오버헤드가 맞지 않는다고 판단해 로컬 state로 유지한다.
 *
 * 이 입력창/전송 버튼은 이후 adapt-ui 스킬로 비주얼이 교체될 예정이라, 지금은 shadcn
 * 컴포넌트 기본형만 사용하고 레이아웃/비주얼 디테일에는 투자하지 않는다(작업 지시).
 */
export function ChatMessageInput({ roomId }: { roomId: number }) {
  const [content, setContent] = useState('')
  const { sendMessage } = useSendChatMessage(roomId)

  function handleSend() {
    // sendMessage는 검증 실패(빈 값/2000자 초과/연결 끊김 등)면 false를 반환한다 — 이 경우
    // 사용자가 입력을 고쳐 재시도할 수 있도록 입력값을 비우지 않는다.
    if (sendMessage(content)) {
      setContent('')
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // 한글 등 IME 조합 확정 Enter까지 전송으로 오인하지 않도록 isComposing을 함께 확인한다.
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
      className="flex items-end gap-2 border-t p-3"
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
        className="min-h-10 flex-1 resize-none"
      />
      <Button type="submit" size="sm">
        전송
      </Button>
    </form>
  )
}
