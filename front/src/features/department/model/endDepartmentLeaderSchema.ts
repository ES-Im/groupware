import { z } from 'zod'

/**
 * 현재 부서장 종료 폼 클라이언트 사전검증 스키마(`DEPT_END_LEADER`, ROADMAP T9.3).
 *
 * 필드 근거: back/build/generated-snippets/DEPT_END_LEADER/query-parameters.adoc 실측 —
 * `endAt`(종료일, `yyyy-MM-dd`, 필수). `<input type="date">`가 항상 `yyyy-MM-dd` 문자열을
 * 내보내므로 정규식으로만 형식을 확인한다(appointDepartmentLeaderSchema의 appointedAt과 동일 패턴).
 */
export const endDepartmentLeaderSchema = z.object({
  endAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '종료일을 선택해주세요'),
})

export type EndDepartmentLeaderFormValues = z.infer<typeof endDepartmentLeaderSchema>
