package com.haruon.groupware.application.message.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.message.MessageNotFoundException;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.application.message.service.dto.MessageCreateRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.message.Message;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
@TestIntegrationConfig
record ReceivedMessageManagementTest(
        ReceivedMessageManagement receivedMessageManagement,
        MessageDraftManagement messageDraftManagement,
        MessageRepository messageRepository,
        EmpRepository empRepository,
        EntityManager em
) {

    @AfterEach
    void tearDown() {
        messageRepository.deleteAll();
        empRepository.deleteAll();
    }

    @Test
    @DisplayName("수신자는 받은 쪽지를 읽음 처리할 수 있다")
    void mark_as_read_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        long messageId = createSentMessage(sender, receiver);

        em.flush(); em.clear();
        receivedMessageManagement.markAsRead(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );

        em.flush(); em.clear();
        Message message = messageRepository.findById(messageId).orElseThrow();

        assertThat(message.getReceivings()).singleElement().satisfies(r -> {
           assertThat(r.getReadAt()).isNotNull();
        });
    }

    @Test
    @DisplayName("존재하지 않는 메시지는 읽음 처리할 수 없다")
    void mark_as_read_fail_when_message_not_found() {
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();
        assertThatThrownBy(() ->
                receivedMessageManagement.markAsRead(
                        receiver.getId(),
                        999L,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(MessageNotFoundException.class);
    }

    @Test
    @DisplayName("수신자가 아니면 읽음 처리할 수 없다")
    void mark_as_read_fail_when_receiver_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        Emp other = saveApprovedEmp(empRepository, "202601003", "other");

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();
        assertThatThrownBy(() ->
                receivedMessageManagement.markAsRead(
                        other.getId(),
                        messageId,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("발송되지 않은 초안은 읽음 처리할 수 없다")
    void mark_as_read_fail_when_message_not_sent() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        long draftId = createDraftMessage(sender, receiver);
        em.flush(); em.clear();
        assertThatThrownBy(() ->
                receivedMessageManagement.markAsRead(
                        receiver.getId(),
                        draftId,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("읽음시각이 없으면 읽음 처리에 실패한다")
    void mark_as_read_fail_when_read_at_null() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();
        assertThatThrownBy(() ->
                receivedMessageManagement.markAsRead(
                        receiver.getId(),
                        messageId,
                        null
                )
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("이미 삭제한 메시지는 읽음 처리할 수 없다")
    void mark_as_read_fail_when_message_deleted_by_receiver() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        long messageId = createSentMessage(sender, receiver);

        receivedMessageManagement.deleteFromBoxByReceiver(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();
        assertThatThrownBy(() ->
                receivedMessageManagement.markAsRead(
                        receiver.getId(),
                        messageId,
                        LocalDateTime.of(2026, 1, 1, 11, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("수신자는 받은 쪽지를 휴지통으로 이동할 수 있다")
    void move_to_trash_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        em.flush(); em.clear();
        long messageId = createSentMessage(sender, receiver);

        receivedMessageManagement.moveToTrashByReceiver(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );

        em.flush(); em.clear();

        Message message = messageRepository.findById(messageId).orElseThrow();
        assertThat(message.getReceivings()).singleElement().satisfies(r -> {
           assertThat(r.getTrashedAt()).isNotNull();
        });
    }

    @Test
    @DisplayName("존재하지 않는 메시지는 휴지통으로 이동할 수 없다")
    void move_to_trash_fail_when_message_not_found() {
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();
        assertThatThrownBy(() ->
                receivedMessageManagement.moveToTrashByReceiver(
                        receiver.getId(),
                        999L,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(MessageNotFoundException.class);
    }

    @Test
    @DisplayName("수신자가 아니면 휴지통으로 이동할 수 없다")
    void move_to_trash_fail_when_receiver_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        Emp other = saveApprovedEmp(empRepository, "202601003", "other");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.moveToTrashByReceiver(
                        other.getId(),
                        messageId,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("발송되지 않은 초안은 휴지통으로 이동할 수 없다")
    void move_to_trash_fail_when_message_not_sent() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long draftId = createDraftMessage(sender, receiver);
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.moveToTrashByReceiver(
                        receiver.getId(),
                        draftId,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("휴지통 이동시각이 없으면 휴지통 이동에 실패한다")
    void move_to_trash_fail_when_moved_at_null() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.moveToTrashByReceiver(
                        receiver.getId(),
                        messageId,
                        null
                )
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("이미 삭제한 메시지는 휴지통으로 이동할 수 없다")
    void move_to_trash_fail_when_message_deleted_by_receiver() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        receivedMessageManagement.deleteFromBoxByReceiver(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.moveToTrashByReceiver(
                        receiver.getId(),
                        messageId,
                        LocalDateTime.of(2026, 1, 1, 11, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("이미 휴지통에 있는 메시지를 다시 휴지통으로 넣을때, 에러/상태변화 없이 넘어간다.")
    void move_to_trash_fail_when_message_already_in_trash() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        receivedMessageManagement.moveToTrashByReceiver(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();

        receivedMessageManagement.moveToTrashByReceiver(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 11, 0)
        );
    }

    @Test
    @DisplayName("수신자는 휴지통의 받은 쪽지를 복구할 수 있다")
    void restore_from_trash_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        receivedMessageManagement.moveToTrashByReceiver(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();

        receivedMessageManagement.restoreFromTrashByReceiver(receiver.getId(), messageId);
        em.flush(); em.clear();

        Message message = messageRepository.findById(messageId).orElseThrow();
        assertThat(message.getReceivings()).singleElement().satisfies(r -> {
           assertThat(r.getTrashedAt()).isNull();
        });
    }

    @Test
    @DisplayName("존재하지 않는 메시지는 휴지통에서 복구할 수 없다")
    void restore_from_trash_fail_when_message_not_found() {
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.restoreFromTrashByReceiver(receiver.getId(), 999L)
        ).isInstanceOf(MessageNotFoundException.class);
    }

    @Test
    @DisplayName("수신자가 아니면 휴지통에서 복구할 수 없다")
    void restore_from_trash_fail_when_receiver_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        Emp other = saveApprovedEmp(empRepository, "202601003", "other");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        receivedMessageManagement.moveToTrashByReceiver(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.restoreFromTrashByReceiver(other.getId(), messageId)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("발송되지 않은 초안은 휴지통에서 복구할 수 없다")
    void restore_from_trash_fail_when_message_not_sent() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long draftId = createDraftMessage(sender, receiver);
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.restoreFromTrashByReceiver(receiver.getId(), draftId)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("휴지통에 없는 메시지를 복구한다면 에러/상태변화 없이 넘어간다.")
    void restore_from_trash_fail_when_message_not_in_trash() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        receivedMessageManagement.restoreFromTrashByReceiver(receiver.getId(), messageId);
    }

    @Test
    @DisplayName("이미 삭제한 메시지는 휴지통에서 복구할 수 없다")
    void restore_from_trash_fail_when_message_deleted_by_receiver() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        receivedMessageManagement.moveToTrashByReceiver(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();

        receivedMessageManagement.deleteFromBoxByReceiver(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 11, 0)
        );
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.restoreFromTrashByReceiver(receiver.getId(), messageId)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("수신자는 받은 쪽지를 수신함에서 삭제할 수 있다")
    void delete_from_box_by_receiver_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        receivedMessageManagement.deleteFromBoxByReceiver(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );

        em.flush(); em.clear();

        Message message = messageRepository.findById(messageId).orElseThrow();
        assertThat(message.getReceivings()).singleElement().satisfies(r -> {
           assertThat(r.getDeletedAt()).isNotNull();
        });

    }

    @Test
    @DisplayName("존재하지 않는 메시지는 수신함에서 삭제할 수 없다")
    void delete_from_box_by_receiver_fail_when_message_not_found() {
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.deleteFromBoxByReceiver(
                        receiver.getId(),
                        999L,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(MessageNotFoundException.class);
    }

    @Test
    @DisplayName("수신자가 아니면 수신함에서 삭제할 수 없다")
    void delete_from_box_by_receiver_fail_when_receiver_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        Emp other = saveApprovedEmp(empRepository, "202601003", "other");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.deleteFromBoxByReceiver(
                        other.getId(),
                        messageId,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("발송되지 않은 초안은 수신함에서 삭제할 수 없다")
    void delete_from_box_by_receiver_fail_when_message_not_sent() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long draftId = createDraftMessage(sender, receiver);
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.deleteFromBoxByReceiver(
                        receiver.getId(),
                        draftId,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("삭제시각이 없으면 수신함 삭제에 실패한다")
    void delete_from_box_by_receiver_fail_when_deleted_at_null() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.deleteFromBoxByReceiver(
                        receiver.getId(),
                        messageId,
                        null
                )
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("이미 삭제한 메시지는 다시 수신함에서 삭제할 수 없다")
    void delete_from_box_by_receiver_fail_when_message_already_deleted_by_receiver() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        receivedMessageManagement.deleteFromBoxByReceiver(
                receiver.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                receivedMessageManagement.deleteFromBoxByReceiver(
                        receiver.getId(),
                        messageId,
                        LocalDateTime.of(2026, 1, 1, 11, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    private long createSentMessage(Emp sender, Emp receiver) {
        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .sentAt(LocalDateTime.of(2026, 1, 1, 9, 0))
                .build();

        return messageDraftManagement.sendMessage(sender.getId(), request);
    }

    private long createDraftMessage(Emp sender, Emp receiver) {
        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        return messageDraftManagement.saveMessageBeforeSend(sender.getId(), request);
    }

}