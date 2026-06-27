package com.haruon.groupware.adapter.webapi.message;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.message.provided.forCommand.MessageDraftManagement;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.application.message.service.command.dto.MessageCreateRequest;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.message.Message;
import com.haruon.groupware.domain.message.MessageReceiving;
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

class ReceivedMessageCommandApiTest extends IntegrationTestSupport {

    private static final String PASSWORD = "!Q2w3e4r5t";

    @Autowired private MessageDraftManagement messageDraftManagement;
    @Autowired private MessageRepository messageRepository;

    @AfterEach
    void tearDownMessage() {
        messageRepository.deleteAll();
        entityManager.clear();
    }

    @Test
    @DisplayName("ReceivedMessageCommandApi 읽음, 휴지통 이동, 복구 및 삭제 통합 테스트")
    void receivedMessageCommands() throws Exception {
        activatedEmp("recvSender", PASSWORD);
        String receiverLoginId = "recvReceiver";
        activatedEmp(receiverLoginId, PASSWORD);
        Emp sender = emp("recvSender");
        Emp receiver = emp(receiverLoginId);
        long messageId = createSentMessage(sender, receiver);
        String accessToken = loginByIdAndPw(receiverLoginId, PASSWORD);

        mockMvc.perform(patch("/api/messages/received/{messageId}/read", messageId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        assertThat(receiving(messageId).getReadAt()).isNotNull();

        mockMvc.perform(patch("/api/messages/received/{messageId}/trash", messageId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        assertThat(receiving(messageId).getTrashedAt()).isNotNull();

        mockMvc.perform(patch("/api/messages/received/{messageId}/trash/restoration", messageId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        assertThat(receiving(messageId).getTrashedAt()).isNull();

        mockMvc.perform(patch("/api/messages/received/{messageId}/deletion", messageId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        assertThat(receiving(messageId).getDeletedAt()).isNotNull();
    }

    private long createSentMessage(Emp sender, Emp receiver) {
        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("받은 쪽지")
                .content("받은 쪽지 내용")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        return messageDraftManagement.sendMessage(
                sender.getId(), request, LocalDateTime.now(ZONE_SEOUL).minusMinutes(1)
        );
    }

    private MessageReceiving receiving(long messageId) {
        return new TransactionTemplate(transactionManager).execute(status -> {
            Message message = messageRepository.findById(messageId).orElseThrow();
            return message.getReceivings().getFirst();
        });
    }

    private Emp emp(String loginId) {
        return empRepository.findByLoginId(loginId).orElseThrow();
    }
}
