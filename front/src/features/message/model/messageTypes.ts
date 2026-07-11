/**
 * message(쪽지함) 도메인 조회 응답 공용 타입(ROADMAP(MESSAGE) T1.2 / §참조 계약 매핑).
 * 조회(GET) 7종은 REST Docs 미커버(api-endpoint.md 미등재)라 백엔드 DTO 소스를 실측해
 * 1:1로 옮긴다(추측 금지) — MessagesResponse/MessageDetailResponse/MessageCountResponse는
 * message 패키지, FileListInfo는 file 공용 패키지 소속이지만 프론트에는 아직 공용 file
 * 타입이 없어(board 등 타 도메인도 개별 로컬 정의 선례) message 도메인 로컬에 독립 정의한다.
 *
 * LocalDateTime(sentAt·trashedAt)은 string(ISO)으로 받는다 — dayjs 파싱은 소비 컴포넌트 책임.
 */

/** 4박스 목록(받은함/보낸함/임시보관함/휴지통) 행 1건. */
export interface MessagesResponse {
  messageId: number
  title: string
  senderId: number
  senderDeptName: string | null
  senderName: string
  representativeReceiverId: number | null
  representativeReceiverDeptName: string | null
  representativeReceiverName: string | null
  receiverCount: number
  /** null이면 미발송(임시보관). */
  sentAt: string | null
  /** 받은함에서만 유의미. */
  isRead: boolean | null
  /** non-null이면 휴지통. */
  trashedAt: string | null
  isSentByMe: boolean
  fileCount: number
}

/** 상세 조회의 수신자 1건(백엔드에서는 MessageDetailResponse의 nested record, TS는 top-level로 선언). */
export interface ReceiverInfo {
  receiverId: number
  receiverDeptName: string | null
  receiverName: string
  isRead: boolean
}

/** 쪽지 상세 조회 응답. */
export interface MessageDetailResponse {
  messageId: number
  title: string
  content: string
  senderId: number
  senderDeptName: string | null
  senderName: string
  receivers: ReceiverInfo[]
  sentAt: string | null
  isSentByMe: boolean
  isTrashedByMe: boolean
  fileCount: number
}

/** 사이드바 배지·목록 탭 건수 배지 공용(F1510). */
export interface MessageCountResponse {
  receivedCount: number
  unreadReceivedCount: number
  sentCount: number
  draftCount: number
  trashCount: number
}

/** 첨부 목록 1건(file 공용 패키지 소속 DTO의 message 도메인 로컬 정의). */
export interface FileListInfo {
  fileId: number
  originalName: string
  extension: string
  fileSize: number
}

/** 4박스 라우트 세그먼트(`/messages/:box`)와 동형. */
export type MailBox = 'received' | 'sent' | 'drafts' | 'trash'
