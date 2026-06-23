package com.haruon.groupware.adapter.persistence.chat;

import com.haruon.groupware.application.chat.required.ChatRoomQueryRepository;
import com.haruon.groupware.application.chat.service.query.dto.ChatRoomDetailResponse;
import com.haruon.groupware.domain.chat.QChatMember;
import com.haruon.groupware.domain.chat.QChatMessage;
import com.haruon.groupware.domain.chat.QChatRoom;
import com.haruon.groupware.domain.empInfo.QDept;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ChatRoomQueryRepositoryAdapter implements ChatRoomQueryRepository {

    private final JPAQueryFactory query;
    private final QChatRoom room = QChatRoom.chatRoom;
    private final QChatMember member = QChatMember.chatMember;
    private final QChatMessage message = QChatMessage.chatMessage;
    private final QEmp emp = QEmp.emp;
    private final QEmpBelongings belongings = QEmpBelongings.empBelongings;
    private final QDept dept = QDept.dept;

    @Override
    public ChatRoomDetailResponse findChatRoomByRoomId(Long roomId) {

        return null;
    }

    @Override
    public boolean existRoomByIdAndEmpId(Long empId, Long roomId) {
        return query
                .selectOne()
                .from(room)
                .join(room.members, member)
                .where(
                        member.emp.id.eq(empId),
                        room.id.eq(roomId)
                )
                .fetchFirst() > 0;
    }
}
