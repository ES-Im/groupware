import { z } from 'zod'

/**
 * 회사 기본정보 수정 폼 클라이언트 사전검증 스키마(`COMPANY_UPDATE_INFO`, ROADMAP-COMPANY T3.1-a, F1403).
 *
 * 필드 근거: back/build/generated-snippets/COMPANY_UPDATE_INFO/request-fields.adoc(실측, 추측 금지) —
 * companyName(선택, 50자 이하)·location(선택, 200자 이하)·ownerName(선택, 20자 이하) 전부 optional.
 * editedAt(필수, `yyyy-MM-dd'T'HH:mm:ss`)은 제출 시각에 결정되는 값이라 폼 입력 필드로 두지 않는다
 * (updateAttendanceSchema의 editedAt 처리와 동일 컨벤션) — mutation 훅(T3.1-a)이 dayjs로 합성해 동봉한다.
 *
 * 도메인 규칙("변경 요청에는 하나 이상의 변경 값이 있어야 한다")을 object-level refine으로
 * 클라 사전검증한다: 세 필드가 전부 비어 있으면 폼 에러(updateAttendanceSchema의
 * startAt/endAt "최소 1개 필수" refine과 동일 패턴).
 *
 * 세 필드 모두 공백만("   ") 입력 시 빈 문자열(미입력)과 달리 truthy로 판정돼 그대로 서버에
 * 전송될 수 있는 문제를 막기 위해, companyContactUpdateSchema(T3.1-b)와 동일하게
 * ''(미입력)는 통과시키되 공백-only는 거부하는 refine을 각 필드에 둔다.
 */
export const companyInfoUpdateSchema = z
  .object({
    companyName: z
      .string()
      .max(50, '회사명은 50자 이하로 입력해주세요')
      .refine(
        (value) => value === '' || value.trim().length > 0,
        '회사명은 공백만으로 입력할 수 없습니다',
      )
      .optional(),
    location: z
      .string()
      .max(200, '위치는 200자 이하로 입력해주세요')
      .refine(
        (value) => value === '' || value.trim().length > 0,
        '위치는 공백만으로 입력할 수 없습니다',
      )
      .optional(),
    ownerName: z
      .string()
      .max(20, '대표자명은 20자 이하로 입력해주세요')
      .refine(
        (value) => value === '' || value.trim().length > 0,
        '대표자명은 공백만으로 입력할 수 없습니다',
      )
      .optional(),
  })
  .refine((data) => !!data.companyName || !!data.location || !!data.ownerName, {
    message: '변경할 값을 하나 이상 입력해주세요',
    path: ['companyName'],
  })

export type CompanyInfoUpdateFormValues = z.infer<typeof companyInfoUpdateSchema>
