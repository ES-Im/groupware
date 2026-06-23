package com.haruon.groupware.adapter.persistence.chat;

import com.haruon.groupware.application.chat.required.ChatMemberReader;
import com.haruon.groupware.domain.chat.QChatMember;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ChatMemberQueryRepository implements ChatMemberReader {

    private final JPAQueryFactory query;
    private final QChatMember member = QChatMember.chatMember;

    @Override
    public boolean isActiveMember(Long empId, Long roomId) {
        Long exist = query
                .select(member.id.countDistinct())
                .from(member)
                .where(
                        member.room.id.eq(roomId),
                        member.emp.id.eq(empId),
                        member.leftAt.isNull()
                )
                .fetchOne();

        return exist != null && exist > 0L;
    }
}
