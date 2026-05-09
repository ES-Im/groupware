package com.haruon.groupware.application.chat.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.chat.required.ChatRepository;
import com.haruon.groupware.application.chat.required.ChatRoomRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.chat.ChatMessage;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static java.time.LocalDateTime.of;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;


@TestIntegrationConfig
record ChatSenderTest(
    ChatSender chatSender,
    ChatRoomManagement chatRoomManagement,
    ChatRoomRepository chatRoomRepository,
    ChatRepository chatRepository,
    EmpRepository empRepository,
    EntityManager em
) {


    @AfterEach
    void tearDown() {
        chatRepository.deleteAll();
        chatRoomRepository.deleteAll();
        empRepository.deleteAll();
    }

    @Transactional
    @Test
    @DisplayName("채팅방 참여자는 채팅을 발송할 수 있다")
    void send_success() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        String content = "안녕하세요";
        long chatId = chatSender.send(
                roomId,
                member.getId(),
                content,
                of(2026, 5, 9, 10, 10)
        );

        em.flush(); em.clear();

        ChatMessage chat = chatRepository.findById(chatId).orElseThrow();

        assertThat(chat.getId()).isEqualTo(chatId);
        assertThat(chat.getContent()).isEqualTo(content);
        assertThat(chat.getEmp().getId()).isEqualTo(member.getId());
        assertThat(chat.getChatRoom().getId()).isEqualTo(roomId);
    }

    @Test
    @DisplayName("존재하지 않는 채팅방에는 채팅을 발송할 수 없다")
    void send_fail_when_room_not_found() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");

        assertThatThrownBy(() ->
                chatSender.send(
                        999L,
                        sender.getId(),
                        "안녕하세요",
                        of(2026, 5, 9, 10, 10)
                )
        ).hasMessage("조회된 채팅방이 없음");
    }

    @Test
    @DisplayName("존재하지 않는 사원은 채팅을 발송할 수 없다")
    void send_fail_when_sender_not_found() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        assertThatThrownBy(() ->
                chatSender.send(
                        roomId,
                        999L,
                        "안녕하세요",
                        of(2026, 5, 9, 10, 10)
                )
        ).hasMessage("해당 활성화된 사원이 존재하지 않음");
    }

    @Test
    @DisplayName("채팅방 참여자가 아니면 채팅을 발송할 수 없다")
    void send_fail_when_sender_is_not_room_member() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");
        Emp outsider = saveApprovedEmp(empRepository, "202601003", "outsider");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        assertThatThrownBy(() ->
                chatSender.send(
                        roomId,
                        outsider.getId(),
                        "안녕하세요",
                        of(2026, 5, 9, 10, 10)
                )
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("채팅 내용이 null이면 발송할 수 없다")
    void send_fail_when_message_null() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        assertThatThrownBy(() ->
                chatSender.send(
                        roomId,
                        member.getId(),
                        null,
                        of(2026, 5, 9, 10, 10)
                )
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("채팅 발송시각이 null이면 발송할 수 없다")
    void send_fail_when_sendAt_null() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");

        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        assertThatThrownBy(() ->
                chatSender.send(
                        roomId,
                        member.getId(),
                        "안녕하세요",
                        null
                )
        ).isInstanceOf(NullPointerException.class);
    }
}