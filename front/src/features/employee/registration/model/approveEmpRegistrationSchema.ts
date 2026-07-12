import { z } from 'zod'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// 포맷 인자 파싱은 customParseFormat 플러그인이 있어야 동작한다(updateHrManagedInfoSchema.ts와 동일 이유) —
// 없으면 dayjs(value,'YYYY-MM-DD',true)의 포맷·strict 인자가 무시되고 느슨한 네이티브 Date 파싱으로
// 폴백해 '2024/01/01'·'2024-02-30'(존재하지 않는 날짜) 같은 값도 유효 판정된다.
dayjs.extend(customParseFormat)

/**
 * 신규 사원 가입 승인 마법사 1단계 폼 클라이언트 사전검증 스키마(`HR_APPROVE_EMP_REGISTRATION`).
 *
 * hiredAt: yyyy-MM-dd, dayjs strict 유효성 검사(query-parameters.adoc 실측 — 필수).
 */
export const approveEmpRegistrationSchema = z.object({
  hiredAt: z
    .string()
    .refine((value) => dayjs(value, 'YYYY-MM-DD', true).isValid(), '입사일자를 올바르게 입력해주세요'),
})

export type ApproveEmpRegistrationFormValues = z.infer<typeof approveEmpRegistrationSchema>
