package com.haruon.groupware.adapter.docs.webAPI.draft;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.draft.DraftCirculationApi;
import com.haruon.groupware.application.draft.provided.forCommand.DraftManagementResolver;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class DraftCirculationApiDocsTest extends RestDocsSupport {

    private final DraftManagementResolver draftManagementResolver = mock(DraftManagementResolver.class);
    private final String REQUEST_MAPPING_URL = "/api/drafts";

    @Override
    protected Object initController() {
        return new DraftCirculationApi(draftManagementResolver);
    }

    @Test
    @DisplayName("공람자 추가 문서")
    void add_circulations() throws Exception {
        Mockito.doNothing()
                .when(draftManagementResolver).addCirculatedEmp(eq(10L), eq(1L), anyLong());

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/{draftId}/circulations", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "empIds": [2, 3]
                                        }
                                        """)
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("DRAFT_CIRCULATION_ADD",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        pathParameters(
                                parameterWithName("draftId").description("기안서 식별 번호")
                        ),
                        requestFields(
                                fieldWithPath("empIds").type(JsonFieldType.ARRAY)
                                        .attributes(key("constraints").value("필수, 빈 배열 불가"))
                                        .description("추가할 공람자 사원 식별 번호 목록")
                        )
                ));
    }

    @Test
    @DisplayName("공람자 삭제 문서")
    void remove_circulation() throws Exception {
        Mockito.doNothing()
                .when(draftManagementResolver).removeCirculatedEmp(eq(10L), eq(1L), eq(2L));

        mockMvc.perform(
                        delete(REQUEST_MAPPING_URL + "/{draftId}/circulations/{empId}", 10L, 2L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("DRAFT_CIRCULATION_REMOVE",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),
                        pathParameters(
                                parameterWithName("draftId").description("기안서 식별 번호"),
                                parameterWithName("empId").description("삭제할 공람자 사원 식별 번호")
                        )
                ));
    }

    @Test
    @DisplayName("공람 문서 읽음 처리 문서")
    void mark_read_by_circulation() throws Exception {
        Mockito.doNothing()
                .when(draftManagementResolver).markReadByCirculation(eq(10L), eq(1L), any(LocalDateTime.class));

        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/{draftId}/circulations/me/read", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("DRAFT_CIRCULATION_READ",
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
}
