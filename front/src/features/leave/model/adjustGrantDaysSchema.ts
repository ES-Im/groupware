import { z } from 'zod'

/**
 * 부여일수 조정 다이얼로그 폼 클라이언트 사전검증 스키마(ROADMAP(LEAVE) M5 T5.3, F749·F750).
 *
 * 필드 근거: back/build/generated-snippets/EMP_LEAVE_ADJUST_{SPECIAL,COMPENSATORY}_GRANT_DAYS/
 * query-parameters.adoc 실측 — plusMinusDays(필수, 음수 입력 시 차감, http-request.adoc 예시값이
 * 1.5로 **0.5일 단위 소수를 허용**한다). 로드맵이 명시적으로 "`.int()` 금지"라 정수 강제를 두지 않는다.
 *
 * `<input type="number" step="0.5">` + `register(..., { valueAsNumber: true })` 조합은 빈 값을
 * `NaN`으로 방출한다(HTML5 `input.valueAsNumber` 표준 동작). z.number()가 NaN을 기본적으로
 * invalid_type으로 거부하므로, zod v4 `error` 콜백(issue.input)으로 "미입력"과 "숫자 아님"을
 * 구분한 한국어 메시지를 낸다(updateAttendanceSchema.ts가 시도했다가 폐기한 preprocess/union
 * 방식 대신 — 여기서는 단일 number 필드라 그 문제가 재현되지 않는다).
 *
 * 0이면 서버에 증감 요청을 보낼 이유가 없으므로(도메인상 무의미) 0을 거부하고, 0.5일 단위인지는
 * `value * 2`가 정수인지로 검증한다(0.5는 배정밀도로 정확히 표현되어 부동소수점 오차가 없다).
 */
export const adjustGrantDaysSchema = z.object({
  plusMinusDays: z
    .number({
      error: (issue) => (Number.isNaN(issue.input) ? '증감 일수를 입력해주세요' : '숫자를 입력해주세요'),
    })
    .refine((value) => value !== 0, '0이 아닌 값을 입력해주세요(음수는 차감)')
    .refine((value) => Number.isInteger(value * 2), '0.5일 단위로 입력해주세요'),
})

export type AdjustGrantDaysFormValues = z.infer<typeof adjustGrantDaysSchema>
