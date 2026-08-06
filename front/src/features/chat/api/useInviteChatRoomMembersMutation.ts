import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { chatKeys } from '../model/queryKeys'
import { inviteChatRoomMembers } from './inviteChatRoomMembers'

export function useInviteChatRoomMembersMutation(roomId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberIds: number[]) => inviteChatRoomMembers(roomId, { memberIds }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.detail(roomId), exact: true })
      toast.success('멤버를 초대했습니다')
    },
  })
}
