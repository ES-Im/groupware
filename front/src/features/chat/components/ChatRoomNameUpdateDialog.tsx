import { useEffect } from 'react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useChatRoomDetailQuery } from '../api/useChatRoomDetailQuery'
import { useUpdateChatRoomNameMutation } from '../api/useUpdateChatRoomNameMutation'
import {
  updateChatRoomNameSchema,
  type UpdateChatRoomNameFormValues,
} from '../model/updateChatRoomNameSchema'

interface ChatRoomNameUpdateDialogProps {
  /** 다이얼로그 열림 상태(제어형, ChatRoomSettingsMenu가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: number
}

/**
 * 채팅방 표시명 수정 다이얼로그(F908, ROADMAP(CHAT) T4.3, `CHAT_ROOM_NAME_UPDATE`).
 *
 * `AppointDepartmentLeaderDialog`(department)의 T1.1 표준 폼 패턴(단일 필드 RHF+zod, 열릴
 * 때마다 reset, 제출 중 닫기 무시)을 그대로 복제한다.
 *
 * 이 표시명은 멤버별 커스텀 표시명이다(도메인모델 규칙, T1.1/T2.1에서 이미 다룬 내용 — 여기서
 * 재서술하지 않는다). 현재 표시값을 프리필하려고 `useChatRoomDetailQuery(roomId)`를 그대로
 * 재사용한다 — `ChatRoomDetailPage`가 같은 roomId로 이미 조회해둔 캐시를 그대로 히트하므로
 * (동일 queryKey) 이 다이얼로그 때문에 별도 네트워크 요청이 추가로 발생하지 않는다. 조회가
 * 아직 로딩 중이면 빈 문자열로 시작한다(빈 값 제출은 클라 zod가 막는다).
 *
 * 성공(204) 시: mutation의 onSuccess가 `chatKeys.all`을 invalidate(상세·목록 갱신)한 뒤, 이
 * 컴포넌트가 성공 토스트를 띄우고 다이얼로그를 닫는다. 서버 검증 실패는
 * `submitWithErrorMapping` → `handleApiError`가 폼 루트 에러로 매핑한다.
 */
export function ChatRoomNameUpdateDialog({
  open,
  onOpenChange,
  roomId,
}: ChatRoomNameUpdateDialogProps) {
  const detailQuery = useChatRoomDetailQuery(roomId)
  const mutation = useUpdateChatRoomNameMutation()
  const form = useZodForm(updateChatRoomNameSchema, { defaultValues: { name: '' } })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다 현재 표시명으로 초기화한다 — 제어형 다이얼로그라 언마운트되지 않으므로 이전
  // 세션의 입력값·에러가 남지 않게 하고, 전체 재입력 없이 일부만 고쳐 제출할 수 있게 한다
  // (AppointDepartmentLeaderDialog의 reset 관례 + UpdateMeForm의 현재값 프리필 관례를 합친 것).
  useEffect(() => {
    if (open) {
      reset({ name: detailQuery.data?.roomName ?? '' })
    }
  }, [open, reset, detailQuery.data?.roomName])

  async function handleSubmit(values: UpdateChatRoomNameFormValues) {
    await mutation.mutateAsync({ roomId, name: values.name })
    toast.success('표시명을 수정했습니다')
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다
  // (AppointDepartmentLeaderDialog와 동일 이유 — 뒤늦게 도착하는 실패가 삼켜지지 않게 한다).
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>표시명 수정</DialogTitle>
          <DialogDescription>
            나에게만 보이는 채팅방 표시명을 변경합니다(20자 이하).
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chat-room-name">
              표시명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="chat-room-name"
              maxLength={20}
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
