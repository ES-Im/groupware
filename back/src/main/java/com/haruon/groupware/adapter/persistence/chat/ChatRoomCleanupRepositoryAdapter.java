package com.haruon.groupware.adapter.persistence.chat;

import com.haruon.groupware.application.chat.required.ChatRoomCleanupRepository;
import com.haruon.groupware.domain.chat.QChatMember;
import com.haruon.groupware.domain.chat.QChatMessage;
import com.haruon.groupware.domain.chat.QChatRoom;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class ChatRoomCleanupRepositoryAdapter implements ChatRoomCleanupRepository {

    private final JPAQueryFactory query;
    private final QChatMember member = QChatMember.chatMember;
    private final QChatMessage message = QChatMessage.chatMessage;
    private final QChatRoom room = QChatRoom.chatRoom;

    @Override
    public List<Long> findDeletableChatRoomId(LocalDateTime checkDate) {
        LocalDateTime deletableDate = checkDate.minusDays(30);

        return query
                .select(
                        room.id
                ).from(room)
                .where(
                        room.closedAt.isNotNull(),
                        room.closedAt.loe(deletableDate)
                )
                .fetch();
    }

    @Override
    public void deleteAllByRoomIds(List<Long> roomIds) {
        query.delete(member)
                .where(member.room.id.in(roomIds))
                .execute();

        query.delete(message)
                .where(message.chatRoom.id.in(roomIds))
                .execute();

        query.delete(room)
                .where(room.id.in(roomIds))
                .execute();
    }

}
