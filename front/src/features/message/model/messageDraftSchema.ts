import { z } from 'zod'

/**
 * 쪽지 작성 폼 클라이언트 사전검증 스키마(ROADMAP(MESSAGE) T4.1, F1506·F1507 근거).
 *
 * approval `leaveDraftSchema.ts`의 title/content 검증 패턴을 그대로 복제한다. 제목은 50자
 * 상한(도메인모델 실측), 본문은 공백만 입력 불가. 수신자(receiverIds)·첨부(attachments)는
 * EmployeePicker·로컬 File[] 스테이징으로 스키마 밖에서 관리한다(leaveDraftSchema가 결재선을
 * 스키마 밖에 두는 경계와 동일).
 */
export const messageDraftSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요').max(50, '제목은 50자 이하로 입력해주세요'),
  content: z.string().trim().min(1, '내용을 입력해주세요'),
})

export type MessageDraftFormValues = z.infer<typeof messageDraftSchema>
