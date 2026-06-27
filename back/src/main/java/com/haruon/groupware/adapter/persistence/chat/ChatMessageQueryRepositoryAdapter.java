package com.haruon.groupware.adapter.persistence.chat;

import com.haruon.groupware.application.chat.required.ChatMessageQueryRepository;
import com.haruon.groupware.application.chat.service.query.dto.ChatMessagesResponse;
import com.haruon.groupware.domain.chat.QChatMember;
import com.haruon.groupware.domain.chat.QChatMessage;
import com.haruon.groupware.domain.chat.QChatRoom;
import com.haruon.groupware.domain.employee.QEmp;
import com.haruon.groupware.domain.employee.QEmpFile;
import com.haruon.groupware.domain.employee.enums.FileType;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class ChatMessageQueryRepositoryAdapter implements ChatMessageQueryRepository  {

    private final JPAQueryFactory query;
    private final QChatRoom room = QChatRoom.chatRoom;
    private final QChatMessage message = QChatMessage.chatMessage;


    @Override
    public ChatMessagesResponse findRecentMessagesByRoomIdAndEmpIdBeforeCursor(
            Long empId, Long roomId, @Nullable Long cursor, Integer size
    ) {
        QEmp sender = new QEmp("msgSender");
        QEmpFile profileFile = new QEmpFile("profileFile");
        QChatMember roomMember = new QChatMember("roomMember");

        List<ChatMessagesResponse.ChatMessageResponse> messageResponses = query
                .select(Projections.constructor(
                        ChatMessagesResponse.ChatMessageResponse.class,
                        message.id,
                        sender.id,
                        message.clientMessageId,
                        sender.empName,
                        message.content,
                        message.sentAt,
                        profileFile.id
                ))
                .from(message)
                .join(message.chatRoom, room)
                .join(room.members, roomMember).on(
                        roomMember.emp.id.eq(empId),
                        roomMember.leftAt.isNull()
                )
                .join(message.emp, sender)
                .leftJoin(sender.empFiles, profileFile).on(
                        profileFile.fileType.eq(FileType.PROFILE_PICTURE),
                        profileFile.isActive.isTrue()
                )
                .where(
                        room.id.eq(roomId),
                        message.sentAt.goe(roomMember.joinedAt),
                        ltCursor(cursor)
                )
                .limit(size)
                .orderBy(message.id.desc())
                .fetch();

        if(messageResponses.isEmpty()) return new ChatMessagesResponse(List.of(), null, false);

        Long nextCursor = messageResponses.getLast().id();

        boolean hasNext = query
                .selectOne()
                .from(message)
                .join(message.chatRoom, room)
                .join(room.members, roomMember).on(
                        roomMember.emp.id.eq(empId),
                        roomMember.leftAt.isNull()
                )
                .where(
                        room.id.eq(roomId),
                        message.sentAt.goe(roomMember.joinedAt),
                        message.id.lt(nextCursor)
                )
                .fetchFirst() != null;


        return new ChatMessagesResponse(messageResponses, nextCursor, hasNext);
    }

    private BooleanExpression ltCursor(@Nullable Long nextCursor) {
        return nextCursor == null
                ? null
                : message.id.lt(nextCursor);
    }

    /* List<> message : </>query.fetch()
     * select m.id,
     *        msgSender.id,
     *        m.clientMessageId,
     *        msgSender.eName,
     *        m.content,
     *        m.sentAt,
     *        profileFile.id
     *   From message m
     *   Join emp msgSender on m.empId = msgEnder.Id
     *   LeftJoin empFile profileFile ON profileFile.empId = msgSender.id AND profileFile.fileType like "PROFILE_FILE"
     *   WHERE m.chatRoomId == :roomId and m.id < :nextCursor
     *   Limit :size
     */
}
