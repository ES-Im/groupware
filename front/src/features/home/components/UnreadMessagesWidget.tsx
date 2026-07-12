import dayjs from 'dayjs'
import { Link } from 'react-router'
import { ArrowRight, Mail, MailOpen } from 'lucide-react'
import { useMessagesQuery } from '@/features/message/api/useMessagesQuery'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

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
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-4">
            <Mail />
          </span>
          <div>
            <CardTitle>안읽은 쪽지함</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">미확인 쪽지</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/messages">
            쪽지함 보기
            <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
              <MailOpen />
            </span>
            <p className="text-sm text-muted-foreground">안읽은 쪽지가 없습니다.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.messageId} className="rounded-lg border p-3">
              <p className="truncate font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.senderName}</p>
              <p className="text-sm text-muted-foreground">
                {item.sentAt ? dayjs(item.sentAt).format('YYYY-MM-DD HH:mm') : '-'}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
