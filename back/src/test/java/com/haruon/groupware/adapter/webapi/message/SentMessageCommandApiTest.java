package com.haruon.groupware.adapter.webapi.message;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.message.provided.forCommand.MessageDraftManagement;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.application.message.service.command.dto.MessageCreateRequest;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.message.Message;
import com.haruon.groupware.domain.message.MessageSending;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.Set;

import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SentMessageCommandApiTest extends IntegrationTestSupport {

    private static final String PASSWORD = "!Q2w3e4r5t";

    @Autowired private MessageDraftManagement messageDraftManagement;
    @Autowired private MessageRepository messageRepository;

    @AfterEach
    void tearDownMessage() {
        messageRepository.deleteAll();
        entityManager.clear();
    }

    @Test
    @DisplayName("SentMessageCommandApi 휴지통 이동, 복구 및 삭제 통합 테스트")
    void sentMessageCommands() throws Exception {
        String senderLoginId = "sentSender";
        activatedEmp(senderLoginId, PASSWORD);
        activatedEmp("sentReceiver", PASSWORD);
        Emp sender = emp(senderLoginId);
        Emp receiver = emp("sentReceiver");
        long messageId = createSentMessage(sender, receiver);
        String accessToken = loginByIdAndPw(senderLoginId, PASSWORD);

        mockMvc.perform(patch("/api/messages/sent/{messageId}/trash", messageId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        assertThat(sending(messageId).getTrashedAt()).isNotNull();

        mockMvc.perform(patch("/api/messages/sent/{messageId}/trash/restoration", messageId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        assertThat(sending(messageId).getTrashedAt()).isNull();

        mockMvc.perform(patch("/api/messages/sent/{messageId}/deletion", messageId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        assertThat(sending(messageId).getDeletedAt()).isNotNull();
    }

    private long createSentMessage(Emp sender, Emp receiver) {
        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("보낸 쪽지")
                .content("보낸 쪽지 내용")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        return messageDraftManagement.sendMessage(
                sender.getId(), request, LocalDateTime.now(ZONE_SEOUL).minusMinutes(1)
        );
    }

    private MessageSending sending(long messageId) {
        return new TransactionTemplate(transactionManager).execute(status -> {
            Message message = messageRepository.findById(messageId).orElseThrow();
            return message.getSending();
        });
    }

    private Emp emp(String loginId) {
        return empRepository.findByLoginId(loginId).orElseThrow();
    }
}
