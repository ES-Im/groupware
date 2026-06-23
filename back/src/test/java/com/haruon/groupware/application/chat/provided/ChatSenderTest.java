package com.haruon.groupware.application.chat.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.chat.provided.forCommand.ChatRoomManagement;
import com.haruon.groupware.application.chat.provided.forCommand.ChatSender;
import com.haruon.groupware.application.chat.required.ChatRepository;
import com.haruon.groupware.application.chat.required.ChatRoomRepository;
import com.haruon.groupware.application.chat.service.command.dto.ChatMessageResponse;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.chat.ChatRoomNotFoundException;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
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

    private static final String CLIENT_MESSAGE_ID =
            "2f641962-29a9-4a44-8f9d-e815d37d3ee8";

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
        ChatMessageResponse response = chatSender.send(
                roomId,
                member.getId(),
                CLIENT_MESSAGE_ID,
                content,
                of(2026, 5, 9, 10, 10)
        );

        em.flush(); em.clear();

        ChatMessage chat = chatRepository.findById(response.chatId()).orElseThrow();

        assertThat(chat.getId()).isEqualTo(response.chatId());
        assertThat(chat.getClientMessageId()).isEqualTo(CLIENT_MESSAGE_ID);
        assertThat(response.clientMessageId()).isEqualTo(CLIENT_MESSAGE_ID);
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
                        CLIENT_MESSAGE_ID,
                        "안녕하세요",
                        of(2026, 5, 9, 10, 10)
                )
        ).isInstanceOf(ChatRoomNotFoundException.class);
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
                        CLIENT_MESSAGE_ID,
                        "안녕하세요",
                        of(2026, 5, 9, 10, 10)
                )
        ).isInstanceOf(ActiveEmployeeNotFoundException.class);
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
                        CLIENT_MESSAGE_ID,
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
                        CLIENT_MESSAGE_ID,
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
                        CLIENT_MESSAGE_ID,
                        "안녕하세요",
                        null
                )
        ).isInstanceOf(NullPointerException.class);
    }

    @Transactional
    @Test
    @DisplayName("같은 clientMessageId 재전송은 기존 메시지를 반환한다")
    void send_returns_existing_message_when_retried() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");
        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        ChatMessageResponse first = chatSender.send(
                roomId, member.getId(), CLIENT_MESSAGE_ID,
                "안녕하세요", of(2026, 5, 9, 10, 10)
        );
        ChatMessageResponse retried = chatSender.send(
                roomId, member.getId(), CLIENT_MESSAGE_ID,
                "안녕하세요", of(2026, 5, 9, 10, 11)
        );

        assertThat(retried.chatId()).isEqualTo(first.chatId());
        assertThat(retried.clientMessageId()).isEqualTo(CLIENT_MESSAGE_ID);
    }

    @Transactional
    @Test
    @DisplayName("같은 clientMessageId를 다른 요청에 재사용할 수 없다")
    void send_rejects_reused_client_message_id_for_different_request() {
        Emp owner = saveApprovedEmp(empRepository, "202601001", "owner");
        Emp member = saveApprovedEmp(empRepository, "202601002", "member");
        long roomId = chatRoomManagement.makeRoom(
                owner.getId(),
                Set.of(member.getId()),
                of(2026, 5, 9, 10, 0)
        );

        chatSender.send(
                roomId, member.getId(), CLIENT_MESSAGE_ID,
                "첫 번째 내용", of(2026, 5, 9, 10, 10)
        );

        assertThatThrownBy(() -> chatSender.send(
                roomId, member.getId(), CLIENT_MESSAGE_ID,
                "변경된 내용", of(2026, 5, 9, 10, 11)
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessage("clientMessageId가 다른 채팅 요청에 이미 사용됨");
    }
}
