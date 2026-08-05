package com.haruon.groupware.adapter.persistence.chat;

import com.haruon.groupware.application.chat.required.ChatRoomQueryRepository;
import com.haruon.groupware.application.chat.service.query.dto.ChatRoomDetailResponse;
import com.haruon.groupware.application.chat.service.query.dto.MyChatRoomsResponse;
import com.haruon.groupware.domain.chat.QChatMember;
import com.haruon.groupware.domain.chat.QChatMessage;
import com.haruon.groupware.domain.chat.QChatRoom;
import com.haruon.groupware.domain.employee.QDept;
import com.haruon.groupware.domain.employee.QEmp;
import com.haruon.groupware.domain.employee.QEmpBelongings;
import com.haruon.groupware.domain.employee.QEmpFile;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.*;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;
import static com.haruon.groupware.domain.employee.enums.FileType.PROFILE_PICTURE;

@Repository
@RequiredArgsConstructor
public class ChatRoomQueryRepositoryAdapter implements ChatRoomQueryRepository {

    private final JPAQueryFactory query;
    private final QChatRoom room = QChatRoom.chatRoom;
    private final QChatMember member = QChatMember.chatMember;
    private final QEmp emp = QEmp.emp;
    private final QEmpBelongings belongings = QEmpBelongings.empBelongings;
    private final QDept dept = QDept.dept;
    private final QEmpFile profile = QEmpFile.empFile;

    @Override
    public Optional<ChatRoomDetailResponse> findChatRoomByRoomId(Long empId, Long roomId) {
        Optional<ChatRoomDetailResponse.ChatRoomInfo> chatRoomInfo = Optional.ofNullable(query
                .select(Projections.constructor(
                        ChatRoomDetailResponse.ChatRoomInfo.class,
                        room.id, member.roomName, room.isGroup, member.lastReadMessage.id
                )).from(room)
                .join(room.members, member).on(member.leftAt.isNull())
                .where(room.id.eq(roomId), member.emp.id.eq(empId))
                .fetchOne());

        if(chatRoomInfo.isEmpty()) return Optional.empty();

        List<ChatRoomDetailResponse.ChatRoomMember> members = query
                .select(Projections.constructor(
                        ChatRoomDetailResponse.ChatRoomMember.class,
                        emp.id, dept.deptName, emp.empName, profile.id
                ))
                .from(room)
                .join(room.members, member).on(member.leftAt.isNull())
                .join(member.emp, emp)
                .leftJoin(emp.empFiles, profile).on(profile.isActive.isTrue(), profile.fileType.eq(PROFILE_PICTURE))
                .leftJoin(emp.empBelongings, belongings).on(belongings.isPrimary.isTrue(), belongings.endAt.isNull())
                .leftJoin(belongings.dept, dept)
                .where(room.id.eq(roomId))
                .fetch();

        return Optional.of(new ChatRoomDetailResponse(chatRoomInfo.get(), members));
    }

    @Override
    public List<MyChatRoomsResponse> findJoinedChatRoomsByEmpId(
            Long empId, @Nullable String keyword, @Nullable Boolean isBookmark
    ) {
        QChatRoom outerRoom = new QChatRoom("outer_room");
        QChatRoom innerRoom = new QChatRoom("inner_room");
        QChatMessage unreadMsg = new QChatMessage("unreadMessage");
        QChatMessage lastReadMsg = new QChatMessage("lastReadMsg");
        QChatMessage lastMessage = new QChatMessage("lastMessage");
        QChatMember joinedMember = new QChatMember("joinedMember");

        Expression<String> lastMessageContent = JPAExpressions
                .select(lastMessage.content)
                .from(lastMessage)
                .where(
                        lastMessage.chatRoom.eq(outerRoom),
                        lastMessage.sentAt.eq(outerRoom.lastMessageAt)
                );

        Expression<Long> unreadMessageCount = JPAExpressions
                .select(unreadMsg.id.count())
                .from(unreadMsg)
                .where(
                        unreadMsg.chatRoom.eq(outerRoom),
                        unreadMsg.sentAt.goe(member.joinedAt),
                        lastReadMsg.id.isNull()
                                .or(unreadMsg.sentAt.gt(lastReadMsg.sentAt))
                );

        Expression<Long> joinedMemberCount = JPAExpressions
                .select(joinedMember.id.count())
                .from(joinedMember)
                .where(
                        joinedMember.room.eq(outerRoom),
                        joinedMember.leftAt.isNull()
                );

        BooleanExpression isPastRoom = JPAExpressions
                .selectOne()
                .from(innerRoom)
                .where(
                        innerRoom.eq(outerRoom),
                        innerRoom.lastMessageAt.lt(LocalDateTime.now(SEOUL_ZONE).minusDays(30))
                )
                .exists();

        List<MyChatRoomsResponse> rooms = query
                .select(Projections.constructor(
                        MyChatRoomsResponse.class,
                        outerRoom.id, member.roomName,
                        lastMessageContent, outerRoom.lastMessageAt, unreadMessageCount,
                        outerRoom.isGroup, isPastRoom, member.isBookMarked,
                        joinedMemberCount
                ))
                .from(outerRoom)
                .join(outerRoom.members, member).on(member.leftAt.isNull())
                .join(member.emp, emp)
                .leftJoin(member.lastReadMessage, lastReadMsg)
                .where(
                        emp.id.eq(empId),
                        isBookmarked(isBookmark),
                        isKeywordContains(keyword, member, outerRoom)
                )
                .fetch();

        if (rooms.isEmpty()) {
            return rooms;
        }

        // 채팅방 표시명(roomName)이 없는 방을 화면에서 참여자 이름으로 폴백 표시하기 위해, 조회된
        // 방들의 참여자 이름(본인 제외)을 배치로 모아 응답에 주입한다. 방마다 상세 조회를 반복하면
        // N+1이므로 roomId in (...) 한 번으로 취합한다.
        List<Long> roomIds = rooms.stream().map(MyChatRoomsResponse::chatRoomId).toList();
        Map<Long, List<String>> participantNamesByRoom = findParticipantNamesByRoom(roomIds, empId);

        return rooms.stream()
                .map(room -> room.withParticipantNames(
                        participantNamesByRoom.getOrDefault(room.chatRoomId(), List.of())))
                .toList();
    }

    // 여러 채팅방의 참여자 이름을 한 번에 조회해 roomId → 이름 목록(본인 제외, 참여 순)으로 묶는다.
    private Map<Long, List<String>> findParticipantNamesByRoom(List<Long> roomIds, Long empId) {
        QChatMember nameMember = new QChatMember("nameMember");
        QEmp nameEmp = new QEmp("nameEmp");

        List<Tuple> rows = query
                .select(nameMember.room.id, nameEmp.empName)
                .from(nameMember)
                .join(nameMember.emp, nameEmp)
                .where(
                        nameMember.room.id.in(roomIds),
                        nameMember.leftAt.isNull(),
                        nameEmp.id.ne(empId)
                )
                .orderBy(nameMember.joinedAt.asc())
                .fetch();

        Map<Long, List<String>> namesByRoom = new LinkedHashMap<>();
        for (Tuple row : rows) {
            Long roomId = row.get(nameMember.room.id);
            String name = row.get(nameEmp.empName);
            namesByRoom.computeIfAbsent(roomId, key -> new ArrayList<>()).add(name);
        }
        return namesByRoom;
    }


    private BooleanExpression isKeywordContains(
            @Nullable String keyword,
            QChatMember chatMember,
            QChatRoom outerRoom
    ) {
        QChatMember searchMember = new QChatMember("searchMember");
        QEmp searchEmp = new QEmp("searchEmp");

        return keyword == null || keyword.isBlank()
                ? null
                : chatMember.roomName.containsIgnoreCase(keyword)
                  .or(
                          JPAExpressions
                                .selectOne()
                                .from(searchMember)
                                .join(searchMember.emp, searchEmp)
                           .where(
                                   searchMember.room.eq(outerRoom),
                                   searchMember.leftAt.isNull(),
                                   searchEmp.empName.containsIgnoreCase(keyword)
                           )
                           .exists()
                   );
    }

    private BooleanExpression isBookmarked(
            @Nullable Boolean isBookmark
    ) {

        return isBookmark == null
                ? null
                : member.isBookMarked.eq(isBookmark);
    }
}
