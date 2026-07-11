import { z } from 'zod'

/**
 * 수기 일정 등록 폼 클라이언트 사전검증 스키마(F003 `MANUAL_SCHEDULE_CREATE`, ROADMAP(SCHEDULE) T3.2).
 *
 * 필드 근거: back/build/generated-snippets/MANUAL_SCHEDULE_CREATE/request-fields.adoc(실측):
 *   - title: 필수, 공백 불가, 100자 이하
 *   - content: 필수, 공백 불가(길이 제한 없음)
 *   - startAt / endAt: 필수(String, `yyyy-MM-dd'T'HH:mm:ss`), endAt은 startAt 이후
 *
 * leaveDraftSchema.ts(전자결재) 관례(z.string().trim().min(1, 메시지) + object-level refine, path 지정)를 그대로 따른다.
 * datetime-local 입력의 분 단위 문자열을 그대로 다루고, 초 보정은 소비처(다이얼로그)가 수행한다.
 */
export const manualScheduleCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '제목을 입력해주세요')
      .max(100, '제목은 100자 이하로 입력해주세요'),
    content: z.string().trim().min(1, '내용을 입력해주세요'),
    startAt: z.string().min(1, '시작 일시를 입력해주세요'),
    endAt: z.string().min(1, '종료 일시를 입력해주세요'),
  })
  .refine(
    (data) =>
      data.startAt === '' || data.endAt === '' || new Date(data.startAt) < new Date(data.endAt),
    {
      message: '종료 일시는 시작 일시 이후여야 합니다',
      path: ['endAt'],
    },
  )

export type ManualScheduleCreateFormValues = z.infer<typeof manualScheduleCreateSchema>
