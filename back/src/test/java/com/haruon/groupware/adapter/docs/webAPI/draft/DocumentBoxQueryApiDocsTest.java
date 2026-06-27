package com.haruon.groupware.adapter.docs.webapi.draft;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.draft.DocumentBoxQueryApi;
import com.haruon.groupware.application.draft.provided.forRetriever.DocumentBoxRetriever;
import com.haruon.groupware.application.draft.service.query.dto.response.DocumentBoxResponse;
import com.haruon.groupware.application.draft.service.query.dto.response.MyDocumentBoxSummaryResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.queryParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class DocumentBoxQueryApiDocsTest extends RestDocsSupport {

    private final DocumentBoxRetriever documentBoxRetriever = mock(DocumentBoxRetriever.class);
    private final String REQUEST_MAPPING_URL = "/api/document-boxes";

    @Override
    protected Object initController() {
        return new DocumentBoxQueryApi(documentBoxRetriever);
    }

    @Test
    @DisplayName("내 상신 기안서 목록 조회 문서")
    void retrieve_my_submitted_drafts() throws Exception {
        Mockito.when(documentBoxRetriever.retrieveMySubmittedDrafts(
                eq(1L),
                eq("문서"),
                any(Pageable.class)
        )).thenReturn(documentBoxPage());

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/me/submitted-drafts")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("keyword", "문서")
                                .queryParam("page", "0")
                                .queryParam("size", "10")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("MY_SUBMITTED_DRAFTS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(documentBoxQueryParameters()),

                        responseFields(documentBoxPageFields())
                ));
    }

    @Test
    @DisplayName("내 임시저장 기안서 목록 조회 문서")
    void retrieve_my_unsubmitted_drafts() throws Exception {
        Mockito.when(documentBoxRetriever.retrieveMyUnsubmittedDrafts(
                eq(1L),
                eq("문서"),
                any(Pageable.class)
        )).thenReturn(documentBoxPage());

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/me/unsubmitted-drafts")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("keyword", "문서")
                                .queryParam("page", "0")
                                .queryParam("size", "10")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("MY_UNSUBMITTED_DRAFTS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(documentBoxQueryParameters()),

                        responseFields(documentBoxPageFields())
                ));
    }

    @Test
    @DisplayName("내 결재 대기 기안서 목록 조회 문서")
    void retrieve_pending_my_approval_drafts() throws Exception {
        Mockito.when(documentBoxRetriever.retrievePendingMyApprovalDrafts(
                eq(1L),
                eq("문서"),
                any(Pageable.class)
        )).thenReturn(documentBoxPage());

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/me/pending-approval-drafts")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("keyword", "문서")
                                .queryParam("page", "0")
                                .queryParam("size", "10")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("MY_PENDING_APPROVAL_DRAFTS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(documentBoxQueryParameters()),

                        responseFields(documentBoxPageFields())
                ));
    }

    @Test
    @DisplayName("내 결재 대기 기안서 갯수 조회 문서")
    void retrieve_pending_my_approval_drafts_count() throws Exception {
        Mockito.when(documentBoxRetriever.retrievePendingMyApprovalDraftsCount(eq(1L)))
                .thenReturn(3L);

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/me/pending-approval-drafts/count")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("MY_PENDING_APPROVAL_DRAFTS_COUNT",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        )
                ));
    }

    @Test
    @DisplayName("내 문서함 요약 조회 문서")
    void retrieve_my_document_box_summary() throws Exception {
        MyDocumentBoxSummaryResponse response = new MyDocumentBoxSummaryResponse(
                3L,
                2L,
                7L,
                12L
        );

        Mockito.when(documentBoxRetriever.retrieveMyDocumentBoxSummary(eq(1L), anyList()))
                .thenReturn(response);

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/me/summary")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("MY_DOCUMENT_BOX_SUMMARY",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        responseFields(
                                fieldWithPath("pendingApprovalDraftCount").type(JsonFieldType.NUMBER).description("내 결재 순번으로 대기 중인 기안서 수"),
                                fieldWithPath("unsubmittedDraftCount").type(JsonFieldType.NUMBER).description("내 임시저장 기안서 수"),
                                fieldWithPath("submittedDraftCount").type(JsonFieldType.NUMBER).description("내 상신 기안서 수"),
                                fieldWithPath("accessibleDocumentCount").type(JsonFieldType.NUMBER).description("내 조회 가능 문서 수")
                        )
                ));
    }

    @Test
    @DisplayName("내 조회 가능 문서 목록 조회 문서")
    void retrieve_my_accessible_documents() throws Exception {
        Mockito.when(documentBoxRetriever.retrieveMyAccessibleDocuments(
                eq(1L),
                anyList(),
                eq("문서"),
                any(Pageable.class)
        )).thenReturn(documentBoxPage());

        mockMvc.perform(
                        get(REQUEST_MAPPING_URL + "/me/accessible-documents")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .queryParam("keyword", "문서")
                                .queryParam("page", "0")
                                .queryParam("size", "10")
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(document("MY_ACCESSIBLE_DOCUMENTS",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        queryParameters(documentBoxQueryParameters()),

                        responseFields(documentBoxPageFields())
                ));
    }

    private Page<DocumentBoxResponse> documentBoxPage() {
        DocumentBoxResponse response = new DocumentBoxResponse(
                10L,
                "홍길동",
                "품의 문서",
                LocalDateTime.of(2026, 4, 1, 9, 0),
                "김결재",
                true,
                "결재완료"
        );

        return new PageImpl<>(
                List.of(response),
                PageRequest.of(0, 10),
                1
        );
    }

    private org.springframework.restdocs.request.ParameterDescriptor[] documentBoxQueryParameters() {
        return new org.springframework.restdocs.request.ParameterDescriptor[] {
                parameterWithName("keyword").optional().description("문서 제목 검색어"),
                parameterWithName("page").optional().description("페이지 번호"),
                parameterWithName("size").optional().description("페이지 크기")
        };
    }

    private FieldDescriptor[] documentBoxPageFields() {
        return concat(new FieldDescriptor[] {
                fieldWithPath("content").type(JsonFieldType.ARRAY).description("문서 목록"),
                fieldWithPath("content[].draftId").type(JsonFieldType.NUMBER).description("기안서 식별 번호"),
                fieldWithPath("content[].drafterName").type(JsonFieldType.STRING).description("기안자 이름"),
                fieldWithPath("content[].draftTitle").type(JsonFieldType.STRING).description("문서 제목"),
                fieldWithPath("content[].submittedAt").type(JsonFieldType.VARIES).description("상신일시, yyyy-MM-dd'T'HH:mm:ss. 미상신 문서는 null"),
                fieldWithPath("content[].latestApproverName").type(JsonFieldType.VARIES).description("마지막 처리 결재자 이름. 없으면 null"),
                fieldWithPath("content[].isFileAttached").type(JsonFieldType.BOOLEAN).description("첨부파일 존재 여부"),
                fieldWithPath("content[].approvalStatus").type(JsonFieldType.STRING).description("결재 상태 표시명")
        }, pageMetadataFields());
    }

    private FieldDescriptor[] pageMetadataFields() {
        return new FieldDescriptor[] {
                fieldWithPath("totalElements").type(JsonFieldType.NUMBER).description("전체 데이터 수"),
                fieldWithPath("totalPages").type(JsonFieldType.NUMBER).description("전체 페이지 수"),
                fieldWithPath("number").type(JsonFieldType.NUMBER).description("현재 페이지 번호"),
                fieldWithPath("size").type(JsonFieldType.NUMBER).description("페이지 크기"),
                fieldWithPath("numberOfElements").type(JsonFieldType.NUMBER).description("현재 페이지의 데이터 수"),
                fieldWithPath("first").type(JsonFieldType.BOOLEAN).description("첫 페이지 여부"),
                fieldWithPath("last").type(JsonFieldType.BOOLEAN).description("마지막 페이지 여부"),
                fieldWithPath("empty").type(JsonFieldType.BOOLEAN).description("현재 페이지가 비어있는지 여부"),

                subsectionWithPath("pageable").ignored(),
                subsectionWithPath("sort").ignored()
        };
    }

    private FieldDescriptor[] concat(FieldDescriptor[] first, FieldDescriptor[] second) {
        FieldDescriptor[] result = new FieldDescriptor[first.length + second.length];
        System.arraycopy(first, 0, result, 0, first.length);
        System.arraycopy(second, 0, result, first.length, second.length);
        return result;
    }
}
