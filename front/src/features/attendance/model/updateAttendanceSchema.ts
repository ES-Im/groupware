import { z } from 'zod'

const TIME_FORMAT_REGEX = /^\d{2}:\d{2}:\d{2}$/
const TIME_FORMAT_MESSAGE = '시각 형식이 올바르지 않습니다'

/**
 * `<input type="time" step="1">`이 값이 없을 때 방출하는 빈 문자열(`''`)은 "미입력"으로 간주해 형식
 * 검증을 건너뛰고(비어있음 자체는 object-level `.refine()`이 "최소 1개 필수"로 별도 처리), 값이 있을
 * 때만 `HH:mm:ss` 형식을 검증한다.
 *
 * 이전에 시도한 두 방식은 모두 폐기했다:
 * 1. `.optional().or(z.literal(''))` union — 형식이 실제로 잘못된 값(예: "09:00")이 들어오면 zod가
 *    커스텀 regex 메시지 대신 union 기본 에러("Invalid input")를 던져 한국어 메시지가 가려짐(T4.1
 *    code-reviewer 1차 지적).
 * 2. `z.preprocess`로 `''`→`undefined` 정규화 — zod v4.4.3에서 `ZodPreprocess<U>`는 콜백 파라미터
 *    타입을 반환 타입에 전파하지 않아 Input이 항상 `unknown`으로 넓혀짐(실측 확인). 결과적으로 폼 필드
 *    타입이 `string | undefined`가 아니라 `unknown`으로 후퇴(T4.1 code-reviewer 2차 지적).
 *
 * `.refine()`은 값을 변형하지 않는 순수 검증이라 zod v4에서 `this`(원본 스키마와 동일 타입)를 그대로
 * 반환한다 — Input/Output 타입이 계속 `string | undefined`로 유지되어 useZodForm의
 * `ZodType<TFieldValues, TFieldValues>` 제약(Input=Output)을 실제로 충족한다.
 */
function optionalTimeField() {
  return z
    .string()
    .refine((value) => value === '' || TIME_FORMAT_REGEX.test(value), TIME_FORMAT_MESSAGE)
    .optional()
}

/**
 * 부서 근태 수정 폼 클라이언트 사전검증 스키마(`DEPT_ATTENDANCE_UPDATE`, ROADMAP T4.1, F307).
 *
 * 필드 근거: back/build/generated-snippets/DEPT_ATTENDANCE_UPDATE/request-fields.adoc(실측, 추측 금지) —
 * targetEmpId(필수)·startAt(선택, HH:mm:ss)·endAt(선택, HH:mm:ss, startAt 또는 endAt 중 하나 이상 필수)·
 * editReason(필수, 100자 이하). editedAt은 이 스키마에 포함하지 않는다(boardCreateSchema의 publishedAt과
 * 동일한 이유 — 제출 시각에 결정되는 값이라 폼 입력 필드가 아니다. 제출 핸들러가
 * `dayjs().format('YYYY-MM-DDTHH:mm:ss')`로 합성해 mutation payload에 직접 동봉한다 — 서버가
 * `LocalDateTime`으로 파싱하는 오프셋 없는 로컬 wall-clock 형식이라 `toISOString()`(UTC `...Z`)을
 * 쓰면 안 된다, contract-conformance-reviewer 지적/T4.4에서 정정).
 *
 * targetEmpId는 대상 행(승인대기/월별 목록)에서 이미 number로 확정돼 defaultValues로만 주입되는 값이며
 * 사용자가 직접 타이핑하는 네이티브 입력 요소가 없어(appointDepartmentLeaderSchema.leaderEmpId와 달리
 * `<input>`/`<select>` 문자열 출력을 거치지 않는다) number로 그대로 검증한다.
 *
 * startAt/endAt은 `<input type="time" step="1">`이 `HH:mm:ss` 문자열(빈 값이면 `''`)을 내보내는 것을
 * optionalTimeField()로 검증한다(값을 변형하지 않고 빈 문자열은 형식 검증만 건너뛴다). 둘 다 비어 있으면
 * 서버 제약(request-fields.adoc)과 동일하게 object-level refine으로 폼 에러를 발생시킨다.
 *
 * 서버 판정(VALIDATION_ERROR/COMMON_00x 등)은 submitWithErrorMapping이 handleApiError로 위임해
 * 폼 루트 에러/토스트로 처리하므로 여기서는 클라 사전검증 수준만 다룬다(registerDepartmentSchema와 동일 컨벤션).
 */
export const updateAttendanceSchema = z
  .object({
    targetEmpId: z.number(),
    startAt: optionalTimeField(),
    endAt: optionalTimeField(),
    editReason: z
      .string()
      .min(1, '수정 사유를 입력해주세요')
      .max(100, '수정 사유는 100자 이하로 입력해주세요'),
  })
  .refine((data) => !!data.startAt || !!data.endAt, {
    message: '시작 또는 종료 시각 중 하나는 입력해야 합니다',
    path: ['startAt'],
  })

export type UpdateAttendanceFormValues = z.infer<typeof updateAttendanceSchema>
