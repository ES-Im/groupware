import { z } from 'zod'

/**
 * 게시글 수정 폼 클라이언트 사전검증 스키마(`BOARD_UPDATE`, ROADMAP T13.3-a, F307).
 *
 * 필드 근거: back/build/generated-snippets/BOARD_UPDATE/request-fields.adoc(실측, 추측 금지) —
 * categoryId/title/content는 요청 계약상 전부 optional(변경 필드만 전송)이지만, 값이 존재하면
 * 공백 불가(서버 `BlankValueNotAllowedException`)다. 이 폼은 편집 초기값(`BOARD_EDIT_MODE`)으로
 * 항상 채워진 값을 보여주는 "전체 표시 + 변경분만 전송" UX이므로, 클라 검증 규칙은
 * boardCreateSchema(BOARD_REGISTER)와 동일하게 "화면에 보이는 값은 항상 비어있으면 안 된다"를
 * 그대로 적용한다 — 실제 "변경 필드만 payload에 포함"은 스키마가 아니라 BoardEditPage가
 * RHF dirtyFields로 판단한다(department 도메인이 register/update 스키마를 분리하는 컨벤션과
 * 동일하게 BOARD_REGISTER용 boardCreateSchema를 재사용하지 않고 별도 파일로 둔다).
 */
export const boardEditSchema = z.object({
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(50, '제목은 50자 이하로 입력해주세요')
    .refine((value) => value.trim().length > 0, '제목은 공백만으로 입력할 수 없습니다'),
  content: z
    .string()
    .min(1, '본문을 입력해주세요')
    .refine((value) => value.trim().length > 0, '본문은 공백만으로 입력할 수 없습니다'),
})

export type BoardEditFormValues = z.infer<typeof boardEditSchema>
