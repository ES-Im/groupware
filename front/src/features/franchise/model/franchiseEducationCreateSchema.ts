import { z } from 'zod'

/**
 * 교육 등록 다이얼로그 폼 클라이언트 사전검증 스키마(`FRANCHISE_EDUCATION_CREATE`, ROADMAP(FRANCHISE) T4.2, F1612).
 *
 * 필드 근거: back/build/generated-snippets/FRANCHISE_EDUCATION_CREATE/request-fields.adoc(실측, 추측 금지) —
 * educationDate(필수, yyyy-MM-dd'T'HH:mm:ss)·place(필수, 50자 이하)·title(필수, 50자 이하)·
 * content(필수)·capacity(필수, 양수).
 *
 * educationDate는 서버에 단일 문자열로 전송되지만, 폼은 meeting 예약 검색(MeetingRoomSearchAndSelect)
 * 선례대로 날짜(educationDate)+시간(educationTime) 두 필드로 나눠 입력받고 제출 시 조합한다.
 *
 * place/title의 "공백 불가"는 meetingRoomCreateSchema.name과 동일하게 refine(trim 후 길이 검사)으로
 * 처리한다. content는 request-fields.adoc에 공백불가 명시가 없으므로(F1613 수정 계약과 다름) min(1)만
 * 적용하고 trim refine은 추가하지 않는다.
 *
 * capacity는 `<input type="number">` + `register(..., { valueAsNumber: true })` 조합이 빈 값을
 * `NaN`으로 방출하는 문제를 meetingRoomCreateSchema.capacity와 동일하게 zod v4 `error` 콜백으로
 * "미입력"과 "숫자 아님"을 구분해 처리한다.
 */
export const franchiseEducationCreateSchema = z.object({
  educationDate: z.string().min(1, '교육 날짜를 선택해주세요'),
  educationTime: z.string().min(1, '교육 시작 시각을 입력해주세요'),
  place: z
    .string()
    .min(1, '교육 장소를 입력해주세요')
    .max(50, '교육 장소는 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '교육 장소는 공백만으로 입력할 수 없습니다'),
  title: z
    .string()
    .min(1, '교육 제목을 입력해주세요')
    .max(50, '교육 제목은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '교육 제목은 공백만으로 입력할 수 없습니다'),
  content: z.string().min(1, '교육 내용을 입력해주세요'),
  capacity: z
    .number({
      error: (issue) => (Number.isNaN(issue.input) ? '정원을 입력해주세요' : '숫자를 입력해주세요'),
    })
    .positive('정원은 양수여야 합니다'),
})

export type FranchiseEducationCreateFormValues = z.infer<typeof franchiseEducationCreateSchema>
