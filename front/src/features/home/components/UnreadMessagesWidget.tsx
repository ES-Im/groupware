import dayjs from 'dayjs'
import { Link } from 'react-router'
import { ArrowRight, Mail, MailOpen } from 'lucide-react'
import { useMessagesQuery } from '@/features/message/api/useMessagesQuery'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'

const WIDGET_ITEM_LIMIT = 3

/**
 * 안읽은 쪽지함 위젯(사용자 지시로 담당 가맹점 문의·다가오는 가맹점 교육 위젯을 대체, 2026-07-12) —
 * 그 둘과 달리 FRANCHISE 게이팅 없이 전 직원 공통으로 노출한다(쪽지함은 minRole EMPLOYEE, 사이드바
 * "쪽지함" 항목과 동일 대상). 받은함(received)만 isRead=false로 필터해 조회한다
 * (getMessages.ts 주석 — isRead 쿼리는 받은함 전용). 제목/발송인/발송시각만 표시하고(요구사항
 * 그대로), 상세/작성이 카드 내 뷰 전환이라 개별 쪽지로의 딥링크 라우트가 없어(router.tsx
 * /messages/:box 주석) 항목은 클릭 불가 표시 전용으로 두고 "쪽지함 보기" 버튼만 /messages로
 * 연결한다.
 */
export function UnreadMessagesWidget() {
  const { data } = useMessagesQuery('received', { isRead: false, page: 0, size: WIDGET_ITEM_LIMIT })
  const items = data?.content ?? []

  return (
    // 고정 높이(h-[420px]) + Card 기본 flex-col: header 고정 · content flex-1 스크롤 · footer 바닥 고정.
    <Card className="h-[420px]">
      <CardHeader className="flex shrink-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-4">
          <Mail />
        </span>
        <div>
          <CardTitle>안읽은 쪽지함</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">미확인 쪽지</p>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {items.length === 0 ? (
          // flex-1: 내용이 없을 때 남는 공간을 채워 안내를 세로 중앙에 둔다.
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
              <MailOpen />
            </span>
            <p className="text-sm text-muted-foreground">안읽은 쪽지가 없습니다.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.messageId}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              {/* 발신인 이니셜 아바타(레퍼런스 .msg .av — 10px 라운드 정사각). */}
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                {item.senderName.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <p className="truncate text-sm text-muted-foreground">{item.senderName}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <time className="text-xs text-muted-foreground">
                  {item.sentAt ? dayjs(item.sentAt).format('MM-DD HH:mm') : '-'}
                </time>
                {/* 미확인 표시 dot: 목록은 isRead=false만 조회하므로 전 항목에 표기(무채색 최고 강조=primary). */}
                <span className="size-2 rounded-full bg-primary" aria-hidden />
              </div>
            </div>
          ))
        )}
      </CardContent>
      {/* "더 보기" 링크는 세 카드 공통으로 하단 footer에 고정한다(내용량과 무관하게 바닥 정렬). */}
      <CardFooter className="justify-end">
        <Link
          to="/messages"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          쪽지함 보기
          <ArrowRight className="size-3.5" />
        </Link>
      </CardFooter>
    </Card>
  )
}
