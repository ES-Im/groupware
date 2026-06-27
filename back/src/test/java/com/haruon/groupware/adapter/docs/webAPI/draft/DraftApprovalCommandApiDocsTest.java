package com.haruon.groupware.adapter.docs.webapi.draft;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.draft.DraftApprovalCommandApi;
import com.haruon.groupware.application.draft.provided.forCommand.DraftManagementResolver;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class DraftApprovalCommandApiDocsTest extends RestDocsSupport {

    private final DraftManagementResolver draftManagementResolver = mock(DraftManagementResolver.class);
    private final String REQUEST_MAPPING_URL = "/api/drafts";

    @Override
    protected Object initController() {
        return new DraftApprovalCommandApi(draftManagementResolver);
    }

    @Test
    @DisplayName("기안서 승인 문서")
    void approve_draft() throws Exception {
        Mockito.doNothing()
                .when(draftManagementResolver).approve(eq(10L), eq(1L), any(LocalDateTime.class));

        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/{draftId}/approval", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("DRAFT_APPROVE",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        pathParameters(
                                parameterWithName("draftId").description("기안서 식별 번호")
                        )
                ));
    }

    @Test
    @DisplayName("기안서 반려 문서")
    void reject_draft() throws Exception {
        Mockito.doNothing()
                .when(draftManagementResolver).reject(eq(10L), eq(1L), eq("보완 후 재상신해주세요."), any(LocalDateTime.class));

        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/{draftId}/rejection", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "reason": "보완 후 재상신해주세요."
                                        }
                                        """)
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("DRAFT_REJECT",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        pathParameters(
                                parameterWithName("draftId").description("기안서 식별 번호")
                        ),
                        requestFields(
                                fieldWithPath("reason").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("필수, 공백 불가"))
                                        .description("반려 사유")
                        )
                ));
    }
}
