package com.haruon.groupware.adapter.webapi.message;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.application.message.service.command.dto.MessageCreateRequest;
import com.haruon.groupware.application.message.service.command.dto.MessageUpdateRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.message.Message;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MessageCommandApiTest extends IntegrationTestSupport {

    private static final String PASSWORD = "!Q2w3e4r5t";

    @Autowired private MessageRepository messageRepository;

    @AfterEach
    void tearDownMessage() {
        messageRepository.deleteAll();
        entityManager.clear();
    }

    @Test
    @DisplayName("MessageCommandApi 임시 쪽지 저장, 수정, 수신자 변경 및 발송 통합 테스트")
    void draftMessageCommands() throws Exception {
        String senderLoginId = "mdSender";
        activatedEmp(senderLoginId, PASSWORD);
        activatedEmp("mdReceiver1", PASSWORD);
        activatedEmp("mdReceiver2", PASSWORD);
        Emp firstReceiver = emp("mdReceiver1");
        Emp secondReceiver = emp("mdReceiver2");
        String accessToken = loginByIdAndPw(senderLoginId, PASSWORD);

        MessageCreateRequest createRequest = MessageCreateRequest.builder()
                .title("임시 쪽지")
                .content("임시 내용")
                .receiverIds(Set.of(firstReceiver.getId()))
                .build();

        MvcResult result = mockMvc.perform(post("/api/messages/drafts")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.messageId").isNumber())
                .andReturn();

        long messageId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("messageId")
                .asLong();

        MessageUpdateRequest updateRequest = new MessageUpdateRequest("수정된 내용", "수정된 제목");

        mockMvc.perform(patch("/api/messages/drafts/{messageId}", messageId)
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(updateRequest)))
                .andExpect(status().isNoContent());

        MessageCommandApi.ReceiversRequest receiversRequest =
                new MessageCommandApi.ReceiversRequest(Set.of(secondReceiver.getId()));

        mockMvc.perform(patch("/api/messages/drafts/{messageId}/receivers", messageId)
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(receiversRequest)))
                .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/messages/drafts/{messageId}/send", messageId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            Message message = messageRepository.findById(messageId).orElseThrow();
            assertThat(message.getTitle()).isEqualTo("수정된 제목");
            assertThat(message.getContent()).isEqualTo("수정된 내용");
            assertThat(message.getSentAt()).isNotNull();
            assertThat(message.getReceivings())
                    .extracting(receiving -> receiving.getEmp().getId())
                    .containsExactly(secondReceiver.getId());
        });
    }

    @Test
    @DisplayName("MessageCommandApi 쪽지 즉시 발송 통합 테스트")
    void createSentMessage() throws Exception {
        String senderLoginId = "msSender";
        activatedEmp(senderLoginId, PASSWORD);
        activatedEmp("msReceiver", PASSWORD);
        Emp receiver = emp("msReceiver");
        String accessToken = loginByIdAndPw(senderLoginId, PASSWORD);

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("즉시 발송")
                .content("즉시 발송 내용")
                .receiverIds(Set.of(receiver.getId()))
                .build();

        MvcResult result = mockMvc.perform(post("/api/messages")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.messageId").isNumber())
                .andReturn();

        long messageId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("messageId")
                .asLong();

        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            Message message = messageRepository.findById(messageId).orElseThrow();
            assertThat(message.getSentAt()).isNotNull();
            assertThat(message.getReceivings())
                    .extracting(receiving -> receiving.getEmp().getId())
                    .containsExactly(receiver.getId());
        });
    }

    @Test
    @DisplayName("MessageCommandApi 임시 쪽지 삭제 통합 테스트")
    void deleteDraftMessage() throws Exception {
        String senderLoginId = "delSender";
        activatedEmp(senderLoginId, PASSWORD);
        String accessToken = loginByIdAndPw(senderLoginId, PASSWORD);

        MessageCreateRequest request = MessageCreateRequest.builder()
                .title("삭제할 임시 쪽지")
                .content("삭제할 내용")
                .build();

        MvcResult result = mockMvc.perform(post("/api/messages/drafts")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andReturn();

        long messageId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("messageId")
                .asLong();

        mockMvc.perform(delete("/api/messages/drafts/{messageId}", messageId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        assertThat(messageRepository.findById(messageId)).isEmpty();
    }

    @Test
    @DisplayName("MessageCommandApi 인증되지 않은 요청 거부 통합 테스트")
    void rejectUnauthenticatedRequest() throws Exception {
        mockMvc.perform(post("/api/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "제목",
                                  "content": "내용",
                                  "receiverIds": [1]
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    private Emp emp(String loginId) {
        return empRepository.findByLoginId(loginId).orElseThrow();
    }
}
