package com.haruon.groupware.application.chat.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.chat.required.ChatRepository;
import com.haruon.groupware.application.chat.required.ChatRoomRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.chat.ChatMember;
import com.haruon.groupware.domain.chat.ChatRoom;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static java.time.LocalDateTime.of;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
@TestIntegrationConfig
record ChatRoomManagementTest(
        ChatRoomManagement chatRoomManagement,
        ChatSender chatSender,
        ChatRoomRepository chatRoomRepository,
        ChatRepository chatRepository,
        EmpRepository empRepository,
        EntityManager em
) {

    @AfterEach
    void tearDrop() {
        chatRepository.deleteAll();
        chatRoomRepository.deleteAll();
        empRepository.deleteAll();
    }

    @Test
    @DisplayName("채팅방 생성 테스트 - 방장과 참여자를 기준으로 채팅방을 생성한다")
    void makeRoom_success() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member1 = saveApprovedEmp(empRepository, "202601002", "member1");

        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 9, 10, 0);

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member1.getId()),
                createdAt
        );

        em.flush();
        em.clear();

        ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();

        assertThat(room.getId()).isEqualTo(roomId);
        assertThat(room.getMembers()).hasSize(2);
    }

    @Test
    @DisplayName("존재하지 않는 사원은 채팅방을 생성할 수 없다")
    void makeRoom_fail_when_owner_not_found() {
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");

        assertThatThrownBy(() ->
                chatRoomManagement.makeRoom(
                        999L,
                        Set.of(member.getId()),
                        of(2026, 5, 9, 10, 0)
                )
        ).hasMessage("해당 활성화된 사원이 존재하지 않음");
    }

    @Test
    @DisplayName("채팅방 참여자는 다른 사원을 초대할 수 있다")
    void inviteRoomByMember_success() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");
        Emp receiver = saveApprovedEmp(empRepository, "202601003", "receiver");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        em.flush();
        em.clear();

        chatRoomManagement.inviteRoomByMember(
                member.getId(),
                roomId,
                Set.of(receiver.getId()),
                of(2026, 5, 9, 11, 0)
        );

        em.flush();
        em.clear();

        ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();

        assertThat(room.getMembers()).hasSize(3);
    }

    @Test
    @DisplayName("채팅방 참여자가 아니면 다른 사원을 초대할 수 없다")
    void inviteRoomByMember_fail_when_inviter_is_not_member() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");
        Emp outsider = saveApprovedEmp(empRepository, "202601003", "outsider");
        Emp receiver = saveApprovedEmp(empRepository, "202601004", "receiver");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        assertThatThrownBy(() ->
                chatRoomManagement.inviteRoomByMember(
                        outsider.getId(),
                        roomId,
                        Set.of(receiver.getId()),
                        of(2026, 5, 9, 11, 0)
                )
        ).hasMessage("해당 참가자가 없음");
    }

    @Test
    @DisplayName("채팅방 참여자는 채팅방 표시명을 수정할 수 있다")
    void updateDisplayNameByMember_success() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        String newDisplayName = "수정된 채팅방";
        chatRoomManagement.updateDisplayNameByMember(
                roomId,
                member.getId(),
                newDisplayName
        );

        em.flush();
        em.clear();

        ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();

        assertThat(room.getMembers().getLast().getRoomName()).isEqualTo(newDisplayName);
    }

    @Test
    @DisplayName("채팅방 참여자는 채팅방을 나갈 수 있다")
    void leaveRoomByMember_success() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        chatRoomManagement.leaveRoomByMember(
                roomId,
                member.getId(),
                of(2026, 5, 9, 12, 0)
        );

        em.flush();
        em.clear();

        ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();

        assertThat(room.getMembers())
                .filteredOn(m -> m.getEmp().getId().equals(member.getId()))
                .allMatch(m -> !m.isParticipating());
    }

    @Test
    @DisplayName("채팅방 참여자는 채팅방을 즐겨찾기 할 수 있다")
    void markAsBookMarkedByMember_success() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        chatRoomManagement.markAsBookMarkedByMember(roomId, member.getId());

        em.flush();
        em.clear();

        ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();

        assertThat(room.getMembers())
                .filteredOn(m -> m.getEmp().getId().equals(member.getId()))
                .allMatch(ChatMember::isBookMarked);
    }

    @Test
    @DisplayName("채팅방 참여자는 채팅방 즐겨찾기를 해제할 수 있다")
    void unmarkAsBookMarkedByMember_success() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        chatRoomManagement.markAsBookMarkedByMember(roomId, member.getId());
        chatRoomManagement.unmarkAsBookMarkedByMember(roomId, member.getId());

        em.flush();
        em.clear();

        ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();

        assertThat(room.getMembers())
                .filteredOn(m -> m.getEmp().getId().equals(member.getId()))
                .allMatch(m -> !m.isBookMarked());
    }

    @Test
    @DisplayName("채팅방 참여자는 마지막으로 읽은 채팅을 갱신할 수 있다")
    void renewLatestReadChatByMember_success() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        long chatId = chatSender.send(
                roomId,
                owner.getId(),
                "test message",
                of(2026, 5, 9, 10, 10)
        );

        chatRoomManagement.renewLatestReadChatByMember(
                member.getId(),
                roomId,
                chatId
        );

        em.flush();
        em.clear();

        ChatRoom room = chatRoomRepository.findById(roomId).orElseThrow();

        assertThat(room.getMembers())
                .filteredOn(m -> m.getEmp().getId().equals(member.getId()))
                .allMatch(m -> m.getLatestReadChats().getId().equals(chatId));
    }

}