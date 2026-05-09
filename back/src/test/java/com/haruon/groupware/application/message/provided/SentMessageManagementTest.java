package com.haruon.groupware.application.message.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.application.message.service.dto.MessageCreateRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.message.Message;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Slf4j
@Transactional
@TestIntegrationConfig
record SentMessageManagementTest(
        SentMessageManagement sentMessageManagement,
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
    @DisplayName("발신자는 보낸 쪽지를 휴지통으로 이동할 수 있다")
    void move_to_trash_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        sentMessageManagement.moveToTrashBySender(
                sender.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();


        Message message = messageRepository.findById(messageId).orElseThrow();

        assertThat(message.getSending().getTrashedAt()).isNotNull();
    }

    @Test
    @DisplayName("존재하지 않는 메시지는 휴지통으로 이동할 수 없다")
    void move_to_trash_fail_when_message_not_found() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                sentMessageManagement.moveToTrashBySender(
                        sender.getId(),
                        999L,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).hasMessage("해당 메시지를 찾을 수 없음");
    }

    @Test
    @DisplayName("발신자가 아니면 휴지통으로 이동할 수 없다")
    void move_to_trash_fail_when_sender_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        Emp other = saveApprovedEmp(empRepository, "202601003", "other");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                sentMessageManagement.moveToTrashBySender(
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
                sentMessageManagement.moveToTrashBySender(
                        sender.getId(),
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
                sentMessageManagement.moveToTrashBySender(
                        sender.getId(),
                        messageId,
                        null
                )
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("이미 삭제한 메시지는 휴지통으로 이동할 수 없다")
    void move_to_trash_fail_when_message_deleted_by_sender() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        sentMessageManagement.deleteFromBoxBySender(
                sender.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                sentMessageManagement.moveToTrashBySender(
                        sender.getId(),
                        messageId,
                        LocalDateTime.of(2026, 1, 1, 11, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("이미 휴지통에 있는 메시지는 다시 휴지통으로 보내면 상태변화/에러 없이 넘어간다.")
    void move_to_trash_fail_when_message_already_in_trash() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        sentMessageManagement.moveToTrashBySender(
                sender.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();

        sentMessageManagement.moveToTrashBySender(
                sender.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 11, 0)
        );
    }

    @Test
    @DisplayName("발신자는 휴지통의 보낸 쪽지를 복구할 수 있다")
    void restore_from_trash_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        sentMessageManagement.moveToTrashBySender(
                sender.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();

        sentMessageManagement.restoreFromTrashBySender(sender.getId(), messageId);

        Message message = messageRepository.findById(messageId).orElseThrow();

        assertThat(message.getSending().getTrashedAt()).isNull();
    }

    @Test
    @DisplayName("존재하지 않는 메시지는 휴지통에서 복구할 수 없다")
    void restore_from_trash_fail_when_message_not_found() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                sentMessageManagement.restoreFromTrashBySender(sender.getId(), 999L)
        ).hasMessage("해당 메시지를 찾을 수 없음");
    }

    @Test
    @DisplayName("발신자가 아니면 휴지통에서 복구할 수 없다")
    void restore_from_trash_fail_when_sender_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        Emp other = saveApprovedEmp(empRepository, "202601003", "other");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        sentMessageManagement.moveToTrashBySender(
                sender.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                sentMessageManagement.restoreFromTrashBySender(other.getId(), messageId)
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
                sentMessageManagement.restoreFromTrashBySender(sender.getId(), draftId)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("휴지통에 없는 메시지는 상태변화/에러 없이 넘어간다.")
    void restore_from_trash_fail_when_message_not_in_trash() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        sentMessageManagement.restoreFromTrashBySender(sender.getId(), messageId);
    }

    @Test
    @DisplayName("이미 삭제한 메시지를 복구할 수 없다.")
    void restore_from_trash_fail_when_message_deleted_by_sender() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        sentMessageManagement.deleteFromBoxBySender(
                sender.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );

        em.flush(); em.clear();
        assertThatThrownBy(() ->
                sentMessageManagement.restoreFromTrashBySender(sender.getId(), messageId)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("발신자는 보낸 쪽지를 보낸함에서 삭제할 수 있다")
    void delete_from_box_by_sender_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        sentMessageManagement.deleteFromBoxBySender(
                sender.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );

        Message message = messageRepository.findById(messageId).orElseThrow();

        assertThat(message.getSending().getDeletedAt()).isNotNull();
    }

    @Test
    @DisplayName("존재하지 않는 메시지는 보낸함에서 삭제할 수 없다")
    void delete_from_box_by_sender_fail_when_message_not_found() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                sentMessageManagement.deleteFromBoxBySender(
                        sender.getId(),
                        999L,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).hasMessage("해당 메시지를 찾을 수 없음");
    }

    @Test
    @DisplayName("발신자가 아니면 보낸함에서 삭제할 수 없다")
    void delete_from_box_by_sender_fail_when_sender_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        Emp other = saveApprovedEmp(empRepository, "202601003", "other");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                sentMessageManagement.deleteFromBoxBySender(
                        other.getId(),
                        messageId,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("발송되지 않은 초안은 보낸함에서 삭제할 수 없다")
    void delete_from_box_by_sender_fail_when_message_not_sent() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long draftId = createDraftMessage(sender, receiver);
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                sentMessageManagement.deleteFromBoxBySender(
                        sender.getId(),
                        draftId,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("삭제시각이 없으면 보낸함 삭제에 실패한다")
    void delete_from_box_by_sender_fail_when_deleted_at_null() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                sentMessageManagement.deleteFromBoxBySender(
                        sender.getId(),
                        messageId,
                        null
                )
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("이미 삭제한 메시지는 다시 보낸함에서 삭제할 수 없다")
    void delete_from_box_by_sender_fail_when_message_already_deleted_by_sender() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        long messageId = createSentMessage(sender, receiver);
        em.flush(); em.clear();

        sentMessageManagement.deleteFromBoxBySender(
                sender.getId(),
                messageId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        em.flush(); em.clear();

        assertThatThrownBy(() ->
                sentMessageManagement.deleteFromBoxBySender(
                        sender.getId(),
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