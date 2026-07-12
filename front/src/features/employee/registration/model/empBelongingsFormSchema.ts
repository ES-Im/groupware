import { z } from 'zod'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// 포맷 인자 파싱은 customParseFormat 플러그인이 있어야 동작한다(updateHrManagedInfoSchema.ts와 동일 이유) —
// 없으면 dayjs(value,'YYYY-MM-DD',true)의 포맷·strict 인자가 무시되고 느슨한 네이티브 Date 파싱으로
// 폴백해 '2024/01/01'·'2024-02-30'(존재하지 않는 날짜) 같은 값도 유효 판정된다.
dayjs.extend(customParseFormat)

/**
 * 소속 배정(신규 소속 등록) 폼 클라이언트 사전검증 스키마(`HR_UPDATE_EMP_BELONGINGS`).
 *
 * 필드 근거: back/build/generated-snippets/HR_UPDATE_EMP_BELONGINGS/request-fields.adoc 실측 —
 * deptId·position·isPrimary·startAt은 "신규 소속 등록 시에만 필수"(endAt은 이 폼 범위 밖).
 * - deptId: 네이티브 `<select>`는 항상 문자열 값을 내보내므로 폼 레벨은 string으로 두고
 *   min(1)으로 미선택을 차단한다(updateDepartmentParentSchema의 parentDeptId string 패턴과 동형).
 *   number 변환은 제출 시(T3.7) payload 조립 단계에서 처리한다.
 * - position: PositionCode 코드값(select value)이지만 폼 레벨은 string으로 두고 min(1)으로
 *   빈 문자열(미선택)을 차단한다(Open Q#3 확정 — 직급 옵션 전체 노출 + 미선택 강제, NONE도
 *   유효한 선택지가 아니라 "아직 고르지 않음"의 placeholder 취급).
 * - isPrimary: 이 폼에서 신규 등록하는 소속은 항상 주요 소속으로 간주하므로 리터럴 true로 고정한다.
 * - startAt: yyyy-MM-dd, dayjs strict 유효성 검사(updateHrManagedInfoSchema.ts의 hireAt 검증 패턴 복제).
 */
export const empBelongingsFormSchema = z.object({
  deptId: z.string().min(1, '부서를 선택해주세요'),
  position: z.string().min(1, '직급을 선택해주세요'),
  isPrimary: z.literal(true),
  startAt: z
    .string()
    .refine((value) => dayjs(value, 'YYYY-MM-DD', true).isValid(), '발령시작일을 올바르게 입력해주세요'),
})

export type EmpBelongingsFormValues = z.infer<typeof empBelongingsFormSchema>
