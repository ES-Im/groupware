package com.haruon.groupware.adapter.webapi.chat;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.chat.provided.forCommand.ChatSender;
import com.haruon.groupware.application.chat.service.command.dto.ChatMessageResponse;
import com.haruon.groupware.domain.empInfo.Emp;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ChatApiTest extends IntegrationTestSupport {

    private static final String PASSWORD = "!Q2w3e4r5t";

    @Autowired private ChatSender chatSender;

    @BeforeEach
    void setUpChat() {
        cleanChat();
    }

    @AfterEach
    void tearDownChat() {
        cleanChat();
    }

    private void cleanChat() {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        transactionTemplate.executeWithoutResult(status -> {
            entityManager.createQuery("update ChatMember cm set cm.lastReadMessage = null").executeUpdate();
            entityManager.createQuery("delete from ChatMessage").executeUpdate();
            entityManager.createQuery("delete from ChatMember").executeUpdate();
            entityManager.createQuery("delete from ChatRoom").executeUpdate();
            entityManager.clear();
        });
    }

    @Test
    @DisplayName("ChatApi 조회 및 명령 API 통합 테스트")
    void chatApis() throws Exception {
        String ownerLoginId = "chatOwner";
        String memberLoginId = "chatMember";
        String inviteeLoginId = "chatInvitee";
        activatedEmp(ownerLoginId, PASSWORD);
        activatedEmp(memberLoginId, PASSWORD);
        activatedEmp(inviteeLoginId, PASSWORD);
        Emp owner = emp(ownerLoginId);
        Emp member = emp(memberLoginId);
        Emp invitee = emp(inviteeLoginId);
        String accessToken = loginByIdAndPw(ownerLoginId, PASSWORD);

        MvcResult createResult = mockMvc.perform(post("/api/chat/rooms")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                new ChatCommandApi.RoomMemberIdsRequest(Set.of(member.getId()))
                        )))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomId").isNumber())
                .andReturn();

        long roomId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("roomId")
                .asLong();

        mockMvc.perform(get("/api/chat/rooms")
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].chatRoomId").value(roomId));

        mockMvc.perform(get("/api/chat/rooms/{roomId}", roomId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomId").value(roomId))
                .andExpect(jsonPath("$.members.length()").value(2));

        mockMvc.perform(patch("/api/chat/rooms/{roomId}/name", roomId)
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                new ChatCommandApi.RoomNameRequest("업무 채팅방")
                        )))
                .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/chat/rooms/{roomId}/bookmark", roomId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/chat/rooms/{roomId}/unbookmark", roomId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/chat/rooms/{roomId}/invite", roomId)
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                new ChatCommandApi.RoomMemberIdsRequest(Set.of(invitee.getId()))
                        )))
                .andExpect(status().isNoContent());

        ChatMessageResponse sentMessage = chatSender.send(
                roomId,
                owner.getId(),
                UUID.randomUUID().toString(),
                "안녕하세요.",
                LocalDateTime.now(SEOUL_ZONE)
        );

        mockMvc.perform(get("/api/chat/rooms/{roomId}/messages", roomId)
                        .header("Authorization", BEARER + accessToken)
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages.length()").value(1))
                .andExpect(jsonPath("$.messages[0].id").value(sentMessage.chatId()));

        mockMvc.perform(patch("/api/chat/rooms/{roomId}/read-position", roomId)
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                new ChatCommandApi.LastReadIdRequest(sentMessage.chatId())
                        )))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/chat/rooms/{roomId}", roomId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastReadMessageId").value(sentMessage.chatId()));

        mockMvc.perform(patch("/api/chat/rooms/{roomId}/leave", roomId)
                        .header("Authorization", BEARER + accessToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("ChatApi 인증되지 않은 요청 거부 통합 테스트")
    void rejectUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/api/chat/rooms"))
                .andExpect(status().isUnauthorized());
    }

    private Emp emp(String loginId) {
        return empRepository.findByLoginId(loginId).orElseThrow();
    }
}
