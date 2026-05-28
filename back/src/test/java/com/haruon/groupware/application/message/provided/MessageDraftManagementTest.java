package com.haruon.groupware.application.message.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.exception.message.MessageNotFoundException;
import com.haruon.groupware.application.exception.message.MessageReceiverRequiredException;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.application.message.service.dto.MessageCreateRequest;
import com.haruon.groupware.application.message.service.dto.MessageFileRequest;
import com.haruon.groupware.application.message.service.dto.MessageUpdateRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.message.Message;
import com.haruon.groupware.domain.message.MessageReceiving;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@TestIntegrationConfig
record MessageDraftManagementTest(
    MessageDraftManagement messageDraftManagement,
    MessageRepository messageRepository,
    EmpRepository empRepository,
    EntityManager em
) {

    @AfterEach
    void tearDrop() {
        messageRepository.deleteAll();
        empRepository.deleteAll();
    }

    @Transactional
    @Test
    @DisplayName("쪽지 초안을 저장할 수 있다 - 발신자, 제목, 내용는 필수")
    void save_message_before_send_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        em.flush();
        em.clear();

        String title = "test title";
        String content = "test content";
        Set<Long> empId = Set.of(receiver.getId());

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title(title)
                .content(content)
                .receiverIds(empId)
                .build();

        long messageId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), request);

        em.flush();
        em.clear();

        Message message = messageRepository.findById(messageId).orElseThrow();

        assertThat(message).extracting(
                Message::getTitle, Message::getContent
        ).containsExactly(
                title, content
        );

        assertThat(message.getSending().getEmp())
                .as("초안을 만들면 발신자 정보 엔티티도 같이 생성")
                .isEqualTo(sender);
        
        assertThat(message.getReceivings())
                .as("발송 전이라도, 수신자정보를 입력했다면 수신자 수만큼 엔티티 생성")
                .hasSize(1);
    }


    @Transactional
    @Test
    @DisplayName("수신자가 없어도 쪽지 초안 저장이 가능하다")
    void save_message_before_send_fail_when_receivers_empty() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        em.flush(); em.clear();

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .build();

        long draft = messageDraftManagement.saveMessageBeforeSend(sender.getId(), request);

        em.flush(); em.clear();
        Message message = messageRepository.findById(draft).orElseThrow();

        assertThat(message.getReceivings()).isEmpty();
    }

    @Test
    @DisplayName("발신자가 없으면 쪽지 초안 저장에 실패한다")
    void save_message_before_send_fail_when_sender_not_found() {
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        assertThatThrownBy(() ->
                messageDraftManagement.saveMessageBeforeSend(null, request)
        ).isInstanceOf(RequiredValueMissingException.class);
    }


    @Test
    @DisplayName("존재하지 않는 수신자가 포함되면 쪽지 초안 저장에 실패한다")
    void save_message_before_send_fail_when_receiver_not_found() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(999L))
                .build();

        assertThatThrownBy(() ->
                messageDraftManagement.saveMessageBeforeSend(sender.getId(), request)
        ).isInstanceOf(ActiveEmployeeNotFoundException.class);
    }

    @Transactional
    @Test
    @DisplayName("쪽지를 즉시 발송할 수 있다")
    void send_message_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        String title = "test title";
        String content = "test content";
        LocalDateTime sentAt = LocalDateTime.of(2026, 1, 1, 10, 0);
        Set<Long> receiverIds = Set.of(receiver.getId());
        MessageCreateRequest request = MessageCreateRequest.builder()
                .title(title)
                .content(content)
                .receiverIds(receiverIds)
                .sentAt(sentAt)
                .build();

        long messageId = messageDraftManagement.sendMessage(sender.getId(), request);

        em.flush();
        em.clear();

        Message message = messageRepository.findById(messageId).orElseThrow();

        assertThat(message).extracting(
                Message::getTitle, Message::getContent, Message::getSentAt
        ).containsExactly(
                title, content, sentAt
        );

        assertThat(message)
                .as("즉시 발송 시, 수신자와 발신자 엔티티도 같이 저장")
                .satisfies(m -> {
                assertEquals(m.getSending().getEmp(), sender);
                assertEquals(m.getReceivings().stream()
                        .map(MessageReceiving::getEmp)
                        .map(Emp::getId)
                        .collect(Collectors.toSet()),
                        receiverIds
                );
        });
    }

    @Test
    @DisplayName("발송시각이 없으면 즉시 발송에 실패한다")
    void send_message_fail_when_sent_at_null() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        assertThatThrownBy(() ->
                messageDraftManagement.sendMessage(sender.getId(), MessageCreateRequest.builder()
                        .title("test title")
                        .content("test content")
                        .receiverIds(Set.of(receiver.getId()))
                        .build())
        ).isInstanceOf(RequiredValueMissingException.class);
    }

    @Test
    @DisplayName("수신자가 없으면 즉시 발송에 실패한다")
    void send_message_fail_when_receivers_empty() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");

        assertThatThrownBy(() ->
                messageDraftManagement.sendMessage(sender.getId(), MessageCreateRequest.builder()
                        .title("test title")
                        .content("test content")
                        .receiverIds(Set.of())
                        .sentAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                        .build())
        ).isInstanceOf(MessageReceiverRequiredException.class);
    }

    @Test
    @DisplayName("저장된 초안을 발송할 수 있다")
    void send_draft_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build());

        messageDraftManagement.sendDraft(
                sender.getId(),
                draftId,
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );

        Message message = messageRepository.findById(draftId).orElseThrow();

        assertNotNull(message.getSentAt());

    }

    @Test
    @DisplayName("존재하지 않는 초안은 발송할 수 없다")
    void send_draft_fail_when_draft_not_found() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");

        assertThatThrownBy(() ->
                messageDraftManagement.sendDraft(
                        sender.getId(),
                        999L,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("작성자가 아니면 초안을 발송할 수 없다")
    void send_draft_fail_when_writer_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp other = saveApprovedEmp(empRepository, "202601002", "other");
        Emp receiver = saveApprovedEmp(empRepository, "202601003", "receiver");

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), request);

        assertThatThrownBy(() ->
                messageDraftManagement.sendDraft(
                        other.getId(),
                        draftId,
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("이미 발송된 메시지는 초안 발송할 수 없다")
    void send_draft_fail_when_message_already_sent() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .sentAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .build();

        long messageId = messageDraftManagement.sendMessage(sender.getId(), request);

        assertThatThrownBy(() ->
                messageDraftManagement.sendDraft(
                        sender.getId(),
                        messageId,
                        LocalDateTime.of(2026, 1, 1, 11, 0)
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("발송시각이 없으면 초안 발송에 실패한다")
    void send_draft_fail_when_sent_at_null() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), request);

        assertThatThrownBy(() ->
                messageDraftManagement.sendDraft(sender.getId(), draftId, null)
        ).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("수신자가 없는 초안은 발송할 수 없다")
    void send_draft_fail_when_receivers_empty() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of())
                .build();

        assertThatThrownBy(() -> {
            long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), request);

            messageDraftManagement.sendDraft(
                    sender.getId(),
                    draftId,
                    LocalDateTime.of(2026, 1, 1, 10, 0)
            );
        }).isInstanceOf(RequiredValueMissingException.class);
    }

    @Test
    @DisplayName("작성자는 저장된 초안을 삭제할 수 있다")
    void delete_draft_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), request);

        messageDraftManagement.deleteDraft(sender.getId(), draftId);

        assertThat(messageRepository.findById(draftId)).isEmpty();
    }

    @Test
    @DisplayName("존재하지 않는 초안은 삭제할 수 없다")
    void delete_draft_fail_when_draft_not_found() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");

        assertThatThrownBy(() ->
                messageDraftManagement.deleteDraft(sender.getId(), 999L)
        ).isInstanceOf(MessageNotFoundException.class);
    }

    @Test
    @DisplayName("작성자가 아니면 초안을 삭제할 수 없다")
    void delete_draft_fail_when_writer_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp other = saveApprovedEmp(empRepository, "202601002", "other");
        Emp receiver = saveApprovedEmp(empRepository, "202601003", "receiver");

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), request);

        assertThatThrownBy(() ->
                messageDraftManagement.deleteDraft(other.getId(), draftId)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("이미 발송된 메시지는 초안 삭제할 수 없다")
    void delete_draft_fail_when_message_already_sent() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .sentAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .build();

        long messageId = messageDraftManagement.sendMessage(sender.getId(), request);

        assertThatThrownBy(() ->
                messageDraftManagement.deleteDraft(sender.getId(), messageId)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("작성자는 저장된 초안의 제목과 내용을 수정할 수 있다")
    void change_draft_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("old title")
                .content("old content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), createRequest);

        String newTitle = "new title";
        String newContent = "new content";
        messageDraftManagement.changeDraft(
                sender.getId(), draftId,
                new MessageUpdateRequest(newContent, newTitle)
        );

        Message message = messageRepository.findById(draftId).orElseThrow();

        assertThat(message.getTitle()).isEqualTo(newTitle);
        assertThat(message.getContent()).isEqualTo(newContent);
    }

    @Test
    @DisplayName("존재하지 않는 초안은 수정할 수 없다")
    void change_draft_fail_when_draft_not_found() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");

        MessageUpdateRequest request = new MessageUpdateRequest(
                "new content",
                "new title"
        );

        assertThatThrownBy(() ->
                messageDraftManagement.changeDraft(sender.getId(), 999L, request)
        ).isInstanceOf(MessageNotFoundException.class);
    }

    @Test
    @DisplayName("작성자가 아니면 초안을 수정할 수 없다")
    void change_draft_fail_when_writer_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp other = saveApprovedEmp(empRepository, "202601002", "other");
        Emp receiver = saveApprovedEmp(empRepository, "202601003", "receiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("old title")
                .content("old content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), createRequest);

        MessageUpdateRequest updateRequest = new MessageUpdateRequest(
                "new content",
                "new title"
        );

        assertThatThrownBy(() ->
                messageDraftManagement.changeDraft(other.getId(), draftId, updateRequest)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("이미 발송된 메시지는 초안 수정할 수 없다")
    void change_draft_fail_when_message_already_sent() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .sentAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .build();

        long messageId = messageDraftManagement.sendMessage(sender.getId(), createRequest);

        MessageUpdateRequest updateRequest = new MessageUpdateRequest(
                "new content",
                "new title"
        );

        assertThatThrownBy(() ->
                messageDraftManagement.changeDraft(sender.getId(), messageId, updateRequest)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("제목/내용 둘다 수정할 내용이 없으면 초안 수정에 실패한다")
    void change_draft_fail_when_title_null() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("old title")
                .content("old content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), createRequest);

        assertThatThrownBy(() ->
                messageDraftManagement.changeDraft(sender.getId(), draftId, new MessageUpdateRequest(
                        null,
                        null
                ))
        ).isInstanceOf(RequiredValueMissingException.class);
    }

    @Transactional
    @Test
    @DisplayName("작성자는 저장된 초안의 수신자를 변경할 수 있다")
    void change_receivers_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp oldReceiver = saveApprovedEmp(empRepository, "202601002", "oldReceiver");
        Emp newReceiver = saveApprovedEmp(empRepository, "202601003", "newReceiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(oldReceiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), createRequest);

        messageDraftManagement.changeReceivers(
                sender.getId(),
                draftId,
                Set.of(newReceiver.getId())
        );

        em.flush(); em.clear();

        Message message = messageRepository.findById(draftId).orElseThrow();

        assertEquals(message.getReceivings().stream()
                .map(MessageReceiving::getEmp)
                .findFirst().orElseThrow(), newReceiver);
    }

    @Test
    @DisplayName("존재하지 않는 초안은 수신자를 변경할 수 없다")
    void change_receivers_fail_when_draft_not_found() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        assertThatThrownBy(() ->
                messageDraftManagement.changeReceivers(
                        sender.getId(),
                        999L,
                        Set.of(receiver.getId())
                )
        ).isInstanceOf(MessageNotFoundException.class);
    }

    @Test
    @DisplayName("작성자가 아니면 초안 수신자를 변경할 수 없다")
    void change_receivers_fail_when_writer_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp other = saveApprovedEmp(empRepository, "202601002", "other");
        Emp receiver = saveApprovedEmp(empRepository, "202601003", "receiver");
        Emp newReceiver = saveApprovedEmp(empRepository, "202601004", "newReceiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), createRequest);

        assertThatThrownBy(() ->
                messageDraftManagement.changeReceivers(
                        other.getId(),
                        draftId,
                        Set.of(newReceiver.getId())
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("이미 발송된 메시지는 수신자를 변경할 수 없다")
    void change_receivers_fail_when_message_already_sent() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        Emp newReceiver = saveApprovedEmp(empRepository, "202601003", "newReceiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .sentAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .build();

        long messageId = messageDraftManagement.sendMessage(sender.getId(), createRequest);

        assertThatThrownBy(() ->
                messageDraftManagement.changeReceivers(
                        sender.getId(),
                        messageId,
                        Set.of(newReceiver.getId())
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("수신자가 비어 있으면 수신자 변경에 실패한다")
    void change_receivers_fail_when_receiver_ids_empty() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), createRequest);

        assertThatThrownBy(() ->
                messageDraftManagement.changeReceivers(
                        sender.getId(),
                        draftId,
                        Set.of()
                )
        ).isInstanceOf(RequiredValueMissingException.class);
    }

    @Test
    @DisplayName("존재하지 않는 수신자가 포함되면 수신자 변경에 실패한다")
    void change_receivers_fail_when_receiver_not_found() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), createRequest);

        assertThatThrownBy(() ->
                messageDraftManagement.changeReceivers(
                        sender.getId(),
                        draftId,
                        Set.of(999L)
                )
        ).isInstanceOf(ActiveEmployeeNotFoundException.class);
    }

    @Test
    @DisplayName("작성자는 저장된 초안에 파일을 추가할 수 있다")
    void add_file_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), createRequest);

        MessageFileRequest fileRequest = MessageFileRequest.builder()
                .file(FileDto.builder()
                        .mimeType("application/pdf")
                        .originalFileFullName("test.pdf")
                        .fileSize(1024L)
                        .bytes(new byte[]{1})
                        .build())
                .build();

        messageDraftManagement.addFile(sender.getId(), draftId, fileRequest);

        assertThat(messageRepository.findById(draftId)).isPresent();
    }

    @Test
    @Transactional
    @DisplayName("작성자는 저장된 초안에 파일을 삭제할 수 있다")
    void remove_file_success() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");
        em.flush(); em.clear();

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), createRequest);
        em.flush(); em.clear();

        MessageFileRequest fileRequest = MessageFileRequest.builder()
                .file(FileDto.builder()
                        .mimeType("application/pdf")
                        .originalFileFullName("test.pdf")
                        .fileSize(1024L)
                        .bytes(new byte[]{1})
                        .build())
                .build();

        messageDraftManagement.addFile(sender.getId(), draftId, fileRequest);
        em.flush(); em.clear();

        Message message = messageRepository.findById(draftId).orElseThrow();

        messageDraftManagement.removeFile(sender.getId(), draftId, message.getMessageFiles().getFirst().getId());
        em.flush(); em.clear();

        assertThat(messageRepository.findById(draftId)).isPresent();
    }

    @Test
    @DisplayName("존재하지 않는 초안에는 파일을 추가할 수 없다")
    void add_file_fail_when_draft_not_found() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");

        MessageFileRequest fileRequest = MessageFileRequest.builder()
                .file(FileDto.builder()
                        .mimeType("application/pdf")
                        .originalFileFullName("test.pdf")
                        .fileSize(1024L)
                        .bytes(new byte[]{1})
                        .build())
                .build();

        assertThatThrownBy(() ->
                messageDraftManagement.addFile(sender.getId(), 999L, fileRequest)
        ).isInstanceOf(MessageNotFoundException.class);
    }

    @Test
    @DisplayName("작성자가 아니면 초안에 파일을 추가할 수 없다")
    void add_file_fail_when_writer_mismatch() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp other = saveApprovedEmp(empRepository, "202601002", "other");
        Emp receiver = saveApprovedEmp(empRepository, "202601003", "receiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), createRequest);

        MessageFileRequest fileRequest = MessageFileRequest.builder()
                .file(FileDto.builder()
                        .mimeType("application/pdf")
                        .originalFileFullName("test.pdf")
                        .fileSize(1024L)
                        .bytes(new byte[]{1})
                        .build())
                .build();

        assertThatThrownBy(() ->
                messageDraftManagement.addFile(other.getId(), draftId, fileRequest)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("이미 발송된 메시지에는 파일을 추가할 수 없다")
    void add_file_fail_when_message_already_sent() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .sentAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .build();

        long messageId = messageDraftManagement.sendMessage(sender.getId(), createRequest);

        MessageFileRequest fileRequest = MessageFileRequest.builder()
                .file(FileDto.builder()
                        .mimeType("application/pdf")
                        .originalFileFullName("test.pdf")
                        .fileSize(1024L)
                        .bytes(new byte[]{1})
                        .build())
                .build();

        assertThatThrownBy(() ->
                messageDraftManagement.addFile(sender.getId(), messageId, fileRequest)
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("파일 정보가 없으면 파일 추가에 실패한다")
    void add_file_fail_when_file_request_null() {
        Emp sender = saveApprovedEmp(empRepository, "202601001", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601002", "receiver");

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        long draftId = messageDraftManagement.saveMessageBeforeSend(sender.getId(), createRequest);

        assertThatThrownBy(() ->
                messageDraftManagement.addFile(sender.getId(), draftId, null)
        ).isInstanceOf(NullPointerException.class);
    }


}
