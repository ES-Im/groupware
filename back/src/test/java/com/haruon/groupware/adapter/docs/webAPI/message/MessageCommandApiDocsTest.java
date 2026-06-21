package com.haruon.groupware.adapter.docs.webAPI.message;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.message.MessageCommandApi;
import com.haruon.groupware.application.message.provided.forCommand.MessageDraftManagement;
import com.haruon.groupware.application.message.service.command.dto.MessageCreateRequest;
import com.haruon.groupware.application.message.service.command.dto.MessageUpdateRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;

import java.time.LocalDateTime;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MessageCommandApiDocsTest extends RestDocsSupport {

    private static final String REQUEST_MAPPING_URL = "/api/messages";
    private final MessageDraftManagement messageDraftManagement = mock(MessageDraftManagement.class);

    @Override
    protected Object initController() {
        return new MessageCommandApi(messageDraftManagement);
    }

    @Test
    @DisplayName("임시 쪽지 저장 문서")
    void createDraft() throws Exception {
        MessageCreateRequest request = messageCreateRequest();
        when(messageDraftManagement.saveMessageBeforeSend(eq(1L), any(MessageCreateRequest.class)))
                .thenReturn(10L);

        mockMvc.perform(post(REQUEST_MAPPING_URL + "/drafts")
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andDo(document("MESSAGE_DRAFT_CREATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        requestFields(
                                fieldWithPath("title").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("필수, 공백 불가, 50자 이하"))
                                        .description("쪽지 제목"),
                                fieldWithPath("content").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("필수, 공백 불가"))
                                        .description("쪽지 내용"),
                                fieldWithPath("receiverIds").optional().type(JsonFieldType.ARRAY)
                                        .attributes(key("constraints").value("선택"))
                                        .description("수신자 식별 번호 목록")
                        ),
                        responseFields(fieldWithPath("messageId").type(JsonFieldType.NUMBER)
                                .description("쪽지 식별 번호"))
                ));
    }

    @Test
    @DisplayName("쪽지 즉시 발송 문서")
    void createSentMessage() throws Exception {
        MessageCreateRequest request = messageCreateRequest();
        when(messageDraftManagement.sendMessage(
                eq(1L), any(MessageCreateRequest.class), any(LocalDateTime.class)
        )).thenReturn(10L);

        mockMvc.perform(post(REQUEST_MAPPING_URL)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andDo(document("MESSAGE_SEND",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        requestFields(
                                fieldWithPath("title").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("필수, 공백 불가, 50자 이하"))
                                        .description("쪽지 제목"),
                                fieldWithPath("content").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("필수, 공백 불가"))
                                        .description("쪽지 내용"),
                                fieldWithPath("receiverIds").type(JsonFieldType.ARRAY)
                                        .attributes(key("constraints").value("필수, 빈 배열 불가"))
                                        .description("수신자 식별 번호 목록")
                        ),
                        responseFields(fieldWithPath("messageId").type(JsonFieldType.NUMBER)
                                .description("쪽지 식별 번호"))
                ));
    }

    @Test
    @DisplayName("임시 쪽지 발송 문서")
    void sendDraftMessage() throws Exception {
        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/drafts/{messageId}/send", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isNoContent())
                .andDo(document("MESSAGE_DRAFT_SEND",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("messageId").description("쪽지 식별 번호"))
                ));
    }

    @Test
    @DisplayName("임시 쪽지 삭제 문서")
    void deleteDraftMessage() throws Exception {
        mockMvc.perform(delete(REQUEST_MAPPING_URL + "/drafts/{messageId}", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isNoContent())
                .andDo(document("MESSAGE_DRAFT_DELETE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("messageId").description("쪽지 식별 번호"))
                ));
    }

    @Test
    @DisplayName("임시 쪽지 수정 문서")
    void changeDraftMessage() throws Exception {
        MessageUpdateRequest request = new MessageUpdateRequest("수정된 내용", "수정된 제목");

        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/drafts/{messageId}", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNoContent())
                .andDo(document("MESSAGE_DRAFT_UPDATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("messageId").description("쪽지 식별 번호")),
                        requestFields(
                                fieldWithPath("content").optional().type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("선택, 공백 불가"))
                                        .description("변경할 쪽지 내용"),
                                fieldWithPath("title").optional().type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("선택, 공백 불가, 50자 이하"))
                                        .description("변경할 쪽지 제목")
                        )
                ));
    }

    @Test
    @DisplayName("임시 쪽지 수신자 변경 문서")
    void changeMessageReceivers() throws Exception {
        MessageCommandApi.ReceiversRequest request = new MessageCommandApi.ReceiversRequest(Set.of(2L, 3L));

        mockMvc.perform(patch(REQUEST_MAPPING_URL + "/drafts/{messageId}/receivers", 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isNoContent())
                .andDo(document("MESSAGE_DRAFT_RECEIVERS_UPDATE",
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("messageId").description("쪽지 식별 번호")),
                        requestFields(fieldWithPath("receiverIds").type(JsonFieldType.ARRAY)
                                .attributes(key("constraints").value("필수, 빈 배열 및 null 요소 불가"))
                                .description("변경할 수신자 식별 번호 목록"))
                ));
    }

    private MessageCreateRequest messageCreateRequest() {
        return MessageCreateRequest.builder()
                .title("업무 협조 요청")
                .content("요청 내용을 확인해주세요.")
                .receiverIds(Set.of(2L, 3L))
                .build();
    }
}
