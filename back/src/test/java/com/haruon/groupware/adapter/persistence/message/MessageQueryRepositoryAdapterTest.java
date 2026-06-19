package com.haruon.groupware.adapter.persistence.message;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.message.provided.forCommand.MessageDraftManagement;
import com.haruon.groupware.application.message.provided.forCommand.ReceivedMessageManagement;
import com.haruon.groupware.application.message.provided.forCommand.SentMessageManagement;
import com.haruon.groupware.application.message.required.MessageQueryRepository;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.application.message.service.command.dto.MessageCreateRequest;
import com.haruon.groupware.application.message.service.query.dto.MessageCountResponse;
import com.haruon.groupware.application.message.service.query.dto.MessagesResponse;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.Set;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;

@Transactional
@TestIntegrationConfig
record MessageQueryRepositoryAdapterTest(
        MessageQueryRepository messageQueryRepository,
        MessageDraftManagement messageDraftManagement,
        SentMessageManagement sentMessageManagement,
        ReceivedMessageManagement receivedMessageManagement,
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
    void query_mailboxes_through_subselect_read_model() {
        Emp draftWriter = saveApprovedEmp(empRepository, "202601001", "draftWriter");
        Emp draftReceiver = saveApprovedEmp(empRepository, "202601002", "draftReceiver");
        Emp sender = saveApprovedEmp(empRepository, "202601003", "sender");
        Emp receiver = saveApprovedEmp(empRepository, "202601004", "receiver");
        em.flush();
        em.clear();

        long draftId = messageDraftManagement.saveMessageBeforeSend(
                draftWriter.getId(),
                createRequest(draftReceiver)
        );
        long sentMessageId = messageDraftManagement.sendMessage(
                sender.getId(),
                createRequest(receiver),
                LocalDateTime.of(2026, 6, 19, 9, 0)
        );
        em.flush();
        em.clear();

        PageRequest pageable = PageRequest.of(0, 10);
        Page<MessagesResponse> drafts = messageQueryRepository
                .findDraftMessageByEmpId(draftWriter.getId(), null, pageable);
        Page<MessagesResponse> sent = messageQueryRepository
                .findSentMessageByEmpId(sender.getId(), null, pageable);
        Page<MessagesResponse> received = messageQueryRepository
                .findReceivedMessageByEmpId(receiver.getId(), null, null, pageable);

        assertThat(messageQueryRepository)
                .isInstanceOf(MessageQueryRepositoryAdapter.class);
        assertThat(drafts.getContent())
                .extracting(MessagesResponse::messageId)
                .containsExactly(draftId);
        assertThat(sent.getContent())
                .extracting(MessagesResponse::messageId)
                .containsExactly(sentMessageId);
        assertThat(received.getContent())
                .extracting(MessagesResponse::messageId)
                .containsExactly(sentMessageId);

        assertThat(messageQueryRepository.findMessageSummaryCountsByEmpId(draftWriter.getId()))
                .isEqualTo(new MessageCountResponse(0L, 0L, 0L, 1L, 0L));
        assertThat(messageQueryRepository.findMessageSummaryCountsByEmpId(sender.getId()))
                .isEqualTo(new MessageCountResponse(0L, 0L, 1L, 0L, 0L));
        assertThat(messageQueryRepository.findMessageSummaryCountsByEmpId(receiver.getId()))
                .isEqualTo(new MessageCountResponse(1L, 1L, 0L, 0L, 0L));
        assertThat(messageQueryRepository.findMessageFilesById(sender.getId(), sentMessageId))
                .isEmpty();

        sentMessageManagement.moveToTrashBySender(
                sender.getId(),
                sentMessageId,
                LocalDateTime.of(2026, 6, 19, 10, 0)
        );
        receivedMessageManagement.moveToTrashByReceiver(
                receiver.getId(),
                sentMessageId,
                LocalDateTime.of(2026, 6, 19, 11, 0)
        );

        // No explicit flush: @Synchronize must flush both mailbox state tables before querying.
        Page<MessagesResponse> senderTrash = messageQueryRepository
                .findMessageInTrashByEmpId(sender.getId(), null, pageable);
        Page<MessagesResponse> receiverTrash = messageQueryRepository
                .findMessageInTrashByEmpId(receiver.getId(), null, pageable);

        assertThat(senderTrash.getContent()).singleElement().satisfies(response -> {
            assertThat(response.messageId()).isEqualTo(sentMessageId);
            assertThat(response.isSentByMe()).isTrue();
        });
        assertThat(receiverTrash.getContent()).singleElement().satisfies(response -> {
            assertThat(response.messageId()).isEqualTo(sentMessageId);
            assertThat(response.isSentByMe()).isFalse();
        });
        assertThat(messageQueryRepository.findMessageSummaryCountsByEmpId(sender.getId()).trashCount())
                .isEqualTo(1L);
        assertThat(messageQueryRepository.findMessageSummaryCountsByEmpId(receiver.getId()).trashCount())
                .isEqualTo(1L);
    }

    private MessageCreateRequest createRequest(Emp receiver) {
        return MessageCreateRequest.builder()
                .title("test title")
                .content("test content")
                .receiverIds(Set.of(receiver.getId()))
                .build();
    }
}
