/**
 * 게시판/쪽지/채팅 더미 데이터 (Board / Message / Chat)
 * 실제 연동 시 services/board.js, message.js, chat.js 반환값으로 교체.
 */

// ── 게시판 ─────────────────────────────────────────────────
// CATEGORY_LIST
export const categories = [
  { categoryId: 1, name: '공지사항', visible: true },
  { categoryId: 2, name: '자유게시판', visible: true },
  { categoryId: 3, name: '자료실', visible: true },
  { categoryId: 4, name: '건의함', visible: false },
];

// BOARD_LIST
export const boards = [
  { boardId: 101, categoryName: '공지사항', title: '2026년 하반기 워크숍 안내', writerName: '김하루', viewCount: 152, likeCount: 12, commentCount: 4, createdAt: '2026-06-25' },
  { boardId: 102, categoryName: '공지사항', title: '여름 휴가 신청 기간 공지', writerName: '박서준', viewCount: 230, likeCount: 8, commentCount: 2, createdAt: '2026-06-20' },
  { boardId: 103, categoryName: '자유게시판', title: '점심 맛집 추천 받습니다', writerName: '이온유', viewCount: 88, likeCount: 21, commentCount: 15, createdAt: '2026-06-28' },
  { boardId: 104, categoryName: '자료실', title: '신규 브랜드 가이드라인 v2', writerName: '최민지', viewCount: 64, likeCount: 5, commentCount: 1, createdAt: '2026-06-27' },
];

// ── 쪽지 ───────────────────────────────────────────────────
export const receivedMessages = [
  { messageId: 201, senderName: '박서준', title: '출장 보고서 검토 요청', read: false, sentAt: '2026-06-29 09:12' },
  { messageId: 202, senderName: '이온유', title: '회의 자료 공유드립니다', read: true, sentAt: '2026-06-28 17:40' },
  { messageId: 203, senderName: '최민지', title: '점심 같이 하실래요?', read: true, sentAt: '2026-06-28 11:05' },
];

export const sentMessages = [
  { messageId: 301, receiverName: '박서준', title: '연차 신청 관련 문의', sentAt: '2026-06-27 14:20' },
  { messageId: 302, receiverName: '인사팀 전체', title: '교육 일정 안내', sentAt: '2026-06-26 10:00' },
];

// ── 채팅 ───────────────────────────────────────────────────
// CHAT_ROOM_LIST
export const chatRooms = [
  { roomId: 1, name: '개발팀', lastMessage: '내일 스프린트 리뷰 14시입니다', lastMessageAt: '10:32', unread: 2, bookmark: true },
  { roomId: 2, name: '김하루, 박서준', lastMessage: '확인했습니다 감사합니다', lastMessageAt: '09:15', unread: 0, bookmark: false },
  { roomId: 3, name: '워크숍 TF', lastMessage: '장소 예약 완료했어요', lastMessageAt: '어제', unread: 5, bookmark: true },
];

// CHAT_MESSAGES — 선택된 방의 메시지(가정)
export const chatMessages = [
  { messageId: 1, senderName: '박서준', content: '다들 내일 스프린트 리뷰 참석 가능하신가요?', sentAt: '10:20', mine: false },
  { messageId: 2, senderName: '김하루', content: '네 가능합니다', sentAt: '10:25', mine: true },
  { messageId: 3, senderName: '이온유', content: '저도 참석합니다', sentAt: '10:28', mine: false },
  { messageId: 4, senderName: '박서준', content: '내일 스프린트 리뷰 14시입니다', sentAt: '10:32', mine: false },
];
