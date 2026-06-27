package com.haruon.groupware.adapter.docs.webapi.message;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.message.ReceivedMessageCommandApi;
import com.haruon.groupware.application.message.provided.forCommand.ReceivedMessageManagement;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReceivedMessageCommandApiDocsTest extends RestDocsSupport {

    private static final String REQUEST_MAPPING_URL = "/api/messages/received";
    private final ReceivedMessageManagement receivedMessageManagement = mock(ReceivedMessageManagement.class);

    @Override
    protected Object initController() {
        return new ReceivedMessageCommandApi(receivedMessageManagement);
    }

    @Test
    @DisplayName("받은 쪽지 읽음 처리 문서")
    void markMessageAsRead() throws Exception {
        documentPatch("/{messageId}/read", "RECEIVED_MESSAGE_READ");
    }

    @Test
    @DisplayName("받은 쪽지 휴지통 이동 문서")
    void moveMessageToTrash() throws Exception {
        documentPatch("/{messageId}/trash", "RECEIVED_MESSAGE_TRASH");
    }

    @Test
    @DisplayName("받은 쪽지 휴지통 복구 문서")
    void restoreMessageFromTrash() throws Exception {
        documentPatch("/{messageId}/trash/restoration", "RECEIVED_MESSAGE_RESTORE");
    }

    @Test
    @DisplayName("받은 쪽지 삭제 문서")
    void deleteMessage() throws Exception {
        documentPatch("/{messageId}/deletion", "RECEIVED_MESSAGE_DELETE");
    }

    private void documentPatch(String path, String identifier) throws Exception {
        mockMvc.perform(patch(REQUEST_MAPPING_URL + path, 10L)
                        .with(employeeAuthentication())
                        .header("Authorization", "Bearer accessToken"))
                .andExpect(status().isNoContent())
                .andDo(document(identifier,
                        preprocessRequest(prettyPrint()), preprocessResponse(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("messageId").description("쪽지 식별 번호"))
                ));
    }
}
