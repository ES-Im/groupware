package com.haruon.groupware.adapter.docs.webapi.draft;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.draft.DraftCommandApi;
import com.haruon.groupware.application.draft.provided.forCommand.*;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.BusinessTripDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.CommonDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.LeaveDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.createDraft.SalesDraftCreateRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.restdocs.snippet.Snippet;
import org.springframework.test.web.servlet.ResultHandler;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class DraftCommandApiDocsTest extends RestDocsSupport {

    private final GeneralDraftManagement generalDraftManagement = mock(GeneralDraftManagement.class);
    private final LeaveDraftManagement leaveDraftManagement = mock(LeaveDraftManagement.class);
    private final BusinessTripDraftManagement businessTripDraftManagement = mock(BusinessTripDraftManagement.class);
    private final SalesDraftManagement salesDraftManagement = mock(SalesDraftManagement.class);
    private final DraftManagementResolver draftManagementResolver = mock(DraftManagementResolver.class);
    private final String REQUEST_MAPPING_URL = "/api/drafts";

    @Override
    protected Object initController() {
        return new DraftCommandApi(
                generalDraftManagement,
                leaveDraftManagement,
                businessTripDraftManagement,
                salesDraftManagement,
                draftManagementResolver
        );
    }

    @Test
    @DisplayName("일반기안 임시저장 문서")
    void create_general_draft() throws Exception {
        Mockito.when(generalDraftManagement.createDraft(eq(1L), any(CommonDraftCreateRequest.class)))
                .thenReturn(10L);

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/generals")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(commonDraftCreateRequest())
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentDraftIdResponse(
                        "GENERAL_DRAFT_CREATE",
                        requestFields(commonCreateRequestFields())
                ));
    }

    @Test
    @DisplayName("휴가기안 임시저장 문서")
    void create_leave_draft() throws Exception {
        Mockito.when(leaveDraftManagement.createDraft(eq(1L), any(LeaveDraftCreateRequest.class)))
                .thenReturn(11L);

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/leaves")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(leaveDraftCreateRequest())
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentDraftIdResponse(
                        "LEAVE_DRAFT_CREATE",
                        requestFields(leaveCreateRequestFields())
                ));
    }

    @Test
    @DisplayName("출장기안 임시저장 문서")
    void create_business_trip_draft() throws Exception {
        Mockito.when(businessTripDraftManagement.createDraft(eq(1L), any(BusinessTripDraftCreateRequest.class)))
                .thenReturn(12L);

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/business-trips")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(businessTripDraftCreateRequest())
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentDraftIdResponse(
                        "BUSINESS_TRIP_DRAFT_CREATE",
                        requestFields(businessTripCreateRequestFields())
                ));
    }

    @Test
    @DisplayName("매출기안 임시저장 문서")
    void create_sales_draft() throws Exception {
        Mockito.when(salesDraftManagement.createDraft(eq(1L), any(SalesDraftCreateRequest.class)))
                .thenReturn(13L);

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/sales")
                                .with(franchiseAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(salesDraftCreateRequest())
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentDraftIdResponse(
                        "SALES_DRAFT_CREATE",
                        requestFields(salesCreateRequestFields())
                ));
    }

    @Test
    @DisplayName("일반기안 작성 즉시 상신 문서")
    void create_submitted_general_draft() throws Exception {
        Mockito.when(generalDraftManagement.createSubmitted(eq(1L), any(CommonDraftCreateRequest.class)))
                .thenReturn(20L);

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/generals/submission")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(commonDraftCreateRequest())
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentDraftIdResponse(
                        "GENERAL_DRAFT_CREATE_SUBMISSION",
                        requestFields(commonCreateRequestFields())
                ));
    }

    @Test
    @DisplayName("휴가기안 작성 즉시 상신 문서")
    void create_submitted_leave_draft() throws Exception {
        Mockito.when(leaveDraftManagement.createSubmitted(eq(1L), any(LeaveDraftCreateRequest.class)))
                .thenReturn(21L);

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/leaves/submission")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(leaveDraftCreateRequest())
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentDraftIdResponse(
                        "LEAVE_DRAFT_CREATE_SUBMISSION",
                        requestFields(leaveCreateRequestFields())
                ));
    }

    @Test
    @DisplayName("출장기안 작성 즉시 상신 문서")
    void create_submitted_business_trip_draft() throws Exception {
        Mockito.when(businessTripDraftManagement.createSubmitted(eq(1L), any(BusinessTripDraftCreateRequest.class)))
                .thenReturn(22L);

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/business-trips/submission")
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(businessTripDraftCreateRequest())
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentDraftIdResponse(
                        "BUSINESS_TRIP_DRAFT_CREATE_SUBMISSION",
                        requestFields(businessTripCreateRequestFields())
                ));
    }

    @Test
    @DisplayName("매출기안 작성 즉시 상신 문서")
    void create_submitted_sales_draft() throws Exception {
        Mockito.when(salesDraftManagement.createSubmitted(eq(1L), any(SalesDraftCreateRequest.class)))
                .thenReturn(23L);

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/sales/submission")
                                .with(franchiseAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(salesDraftCreateRequest())
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentDraftIdResponse(
                        "SALES_DRAFT_CREATE_SUBMISSION",
                        requestFields(salesCreateRequestFields())
                ));
    }

    @Test
    @DisplayName("일반기안 수정 문서")
    void update_general_draft() throws Exception {
        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/generals/{draftId}", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(commonDraftUpdateRequest())
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentNoContentWithRequest(
                        "GENERAL_DRAFT_UPDATE",
                        "draftId",
                        "기안서 식별 번호",
                        requestFields(commonUpdateRequestFields())
                ));
    }

    @Test
    @DisplayName("휴가기안 수정 문서")
    void update_leave_draft() throws Exception {
        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/leaves/{draftId}", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(leaveDraftUpdateRequest())
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentNoContentWithRequest(
                        "LEAVE_DRAFT_UPDATE",
                        "draftId",
                        "기안서 식별 번호",
                        requestFields(leaveUpdateRequestFields())
                ));
    }

    @Test
    @DisplayName("출장기안 수정 문서")
    void update_business_trip_draft() throws Exception {
        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/business-trips/{draftId}", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(businessTripDraftUpdateRequest())
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentNoContentWithRequest(
                        "BUSINESS_TRIP_DRAFT_UPDATE",
                        "draftId",
                        "기안서 식별 번호",
                        requestFields(businessTripUpdateRequestFields())
                ));
    }

    @Test
    @DisplayName("매출기안 수정 문서")
    void update_sales_draft() throws Exception {
        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/sales/{draftId}", 10L)
                                .with(franchiseAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(salesDraftUpdateRequest())
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentNoContentWithRequest(
                        "SALES_DRAFT_UPDATE",
                        "draftId",
                        "기안서 식별 번호",
                        requestFields(salesUpdateRequestFields())
                ));
    }

    @Test
    @DisplayName("임시저장 기안서 상신 문서")
    void submit_draft() throws Exception {
        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/{draftId}/submission", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(draftSubmitRequest())
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentNoContentWithRequest(
                        "DRAFT_SUBMIT",
                        "draftId",
                        "기안서 식별 번호",
                        requestFields(submitRequestFields())
                ));
    }

    @Test
    @DisplayName("상신 취소 문서")
    void withdraw_submission() throws Exception {
        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/{draftId}/submission-withdrawal", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentNoContent(
                        "DRAFT_SUBMISSION_WITHDRAWAL",
                        "draftId",
                        "기안서 식별 번호"
                ));
    }

    @Test
    @DisplayName("취소기안 임시저장 문서")
    void create_cancellation_draft() throws Exception {
        Mockito.when(draftManagementResolver.createCancelDraft(eq(1L), eq(10L), any(CommonDraftCreateRequest.class)))
                .thenReturn(30L);

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/{sourceDraftId}/cancellation-drafts", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(commonDraftCreateRequest())
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentDraftIdResponse(
                        "DRAFT_CANCELLATION_CREATE",
                        pathParameters(
                                parameterWithName("sourceDraftId").description("취소 대상 원본 기안서 식별 번호")
                        ),
                        requestFields(commonCreateRequestFields())
                ));
    }

    @Test
    @DisplayName("취소기안 작성 즉시 상신 문서")
    void create_submitted_cancellation_draft() throws Exception {
        Mockito.when(draftManagementResolver.createSubmittedCancelDraft(eq(1L), eq(10L), any(CommonDraftCreateRequest.class)))
                .thenReturn(31L);

        mockMvc.perform(
                        post(REQUEST_MAPPING_URL + "/{sourceDraftId}/cancellation-drafts/submission", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(commonDraftCreateRequest())
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentDraftIdResponse(
                        "DRAFT_CANCELLATION_CREATE_SUBMISSION",
                        pathParameters(
                                parameterWithName("sourceDraftId").description("취소 대상 원본 기안서 식별 번호")
                        ),
                        requestFields(commonCreateRequestFields())
                ));
    }

    @Test
    @DisplayName("출장기안 참여자 수정 문서")
    void update_business_trip_participants() throws Exception {
        mockMvc.perform(
                        patch(REQUEST_MAPPING_URL + "/business-trips/{draftId}/participants", 10L)
                                .with(employeeAuthentication())
                                .header("Authorization", "Bearer accessToken")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        [2, 3]
                                        """)
                )
                .andExpect(status().isNoContent())
                .andDo(MockMvcResultHandlers.print())
                .andDo(documentNoContentWithRequest(
                        "BUSINESS_TRIP_PARTICIPANTS_UPDATE",
                        "draftId",
                        "출장기안 식별 번호",
                        requestFields(
                                fieldWithPath("[]").type(JsonFieldType.ARRAY)
                                        .attributes(key("constraints").value("필수, 빈 배열 불가"))
                                        .description("참여자 사원 식별 번호 목록")
                        )
                ));

        Mockito.verify(businessTripDraftManagement)
                .updateParticipants(eq(10L), eq(1L), anySet());
    }

    private ResultHandler documentDraftIdResponse(String identifier, Snippet... snippets) {
        return document(
                identifier,
                preprocessRequest(prettyPrint()),
                preprocessResponse(prettyPrint()),
                concat(
                        new Snippet[] {
                                requestHeaders(
                                        headerWithName("Authorization").description("Bearer Access Token")
                                ),
                                responseFields(draftIdResponseFields())
                        },
                        snippets
                )
        );
    }

    private ResultHandler documentNoContentWithRequest(
            String identifier,
            String pathName,
            String pathDescription,
            Snippet requestFieldsSnippet
    ) {
        return document(
                identifier,
                preprocessRequest(prettyPrint()),
                preprocessResponse(prettyPrint()),
                requestHeaders(
                        headerWithName("Authorization").description("Bearer Access Token")
                ),
                pathParameters(
                        parameterWithName(pathName).description(pathDescription)
                ),
                requestFieldsSnippet
        );
    }

    private ResultHandler documentNoContent(
            String identifier,
            String pathName,
            String pathDescription
    ) {
        return document(
                identifier,
                preprocessRequest(prettyPrint()),
                preprocessResponse(prettyPrint()),
                requestHeaders(
                        headerWithName("Authorization").description("Bearer Access Token")
                ),
                pathParameters(
                        parameterWithName(pathName).description(pathDescription)
                )
        );
    }

    private FieldDescriptor[] commonCreateRequestFields() {
        return withDefaultConstraints(commonCreateFields(""));
    }

    private FieldDescriptor[] leaveCreateRequestFields() {
        return withDefaultConstraints(concat(
                nestedCommonCreateFields(),
                new FieldDescriptor[] {
                        fieldWithPath("startAt").type(JsonFieldType.STRING).description("휴가 시작 일시, yyyy-MM-dd'T'HH:mm:ss"),
                        fieldWithPath("endAt").type(JsonFieldType.STRING).description("휴가 종료 일시, yyyy-MM-dd'T'HH:mm:ss"),
                        fieldWithPath("leaveType").type(JsonFieldType.STRING).description("휴가 유형. 예: ANNUAL, HOURLY, SICK, OFFICIAL, COMPENSATORY, SPECIAL")
                }
        ));
    }

    private FieldDescriptor[] businessTripCreateRequestFields() {
        return withDefaultConstraints(concat(
                nestedCommonCreateFields(),
                new FieldDescriptor[] {
                        fieldWithPath("startAt").type(JsonFieldType.STRING).description("출장 시작 일시, yyyy-MM-dd'T'HH:mm:ss"),
                        fieldWithPath("endAt").type(JsonFieldType.STRING).description("출장 종료 일시, yyyy-MM-dd'T'HH:mm:ss"),
                        fieldWithPath("destination").type(JsonFieldType.STRING).description("출장지"),
                        fieldWithPath("purpose").type(JsonFieldType.STRING).description("출장 목적"),
                        fieldWithPath("participantIds").type(JsonFieldType.ARRAY).description("출장 참여자 사원 식별 번호 목록").optional()
                }
        ));
    }

    private FieldDescriptor[] salesCreateRequestFields() {
        return withDefaultConstraints(concat(
                nestedCommonCreateFields(),
                new FieldDescriptor[] {
                        fieldWithPath("franchiseId").type(JsonFieldType.NUMBER).description("가맹점 식별 번호"),
                        fieldWithPath("reportMonth").type(JsonFieldType.STRING).description("매출 보고 월, yyyy-MM"),
                        fieldWithPath("salesAmount").type(JsonFieldType.NUMBER).description("매출액")
                }
        ));
    }

    private FieldDescriptor[] commonUpdateRequestFields() {
        return withDefaultConstraints(commonUpdateFields(""));
    }

    private FieldDescriptor[] leaveUpdateRequestFields() {
        return withDefaultConstraints(concat(
                nestedCommonUpdateFields(),
                new FieldDescriptor[] {
                        fieldWithPath("startAt").type(JsonFieldType.STRING).description("수정할 휴가 시작 일시").optional(),
                        fieldWithPath("endAt").type(JsonFieldType.STRING).description("수정할 휴가 종료 일시").optional(),
                        fieldWithPath("leaveType").type(JsonFieldType.STRING).description("수정할 휴가 유형").optional()
                }
        ));
    }

    private FieldDescriptor[] businessTripUpdateRequestFields() {
        return withDefaultConstraints(concat(
                nestedCommonUpdateFields(),
                new FieldDescriptor[] {
                        fieldWithPath("startAt").type(JsonFieldType.STRING).description("수정할 출장 시작 일시").optional(),
                        fieldWithPath("endAt").type(JsonFieldType.STRING).description("수정할 출장 종료 일시").optional(),
                        fieldWithPath("destination").type(JsonFieldType.STRING).description("수정할 출장지").optional(),
                        fieldWithPath("purpose").type(JsonFieldType.STRING).description("수정할 출장 목적").optional()
                }
        ));
    }

    private FieldDescriptor[] salesUpdateRequestFields() {
        return withDefaultConstraints(concat(
                nestedCommonUpdateFields(),
                new FieldDescriptor[] {
                        fieldWithPath("franchiseId").type(JsonFieldType.NUMBER).description("수정할 가맹점 식별 번호").optional(),
                        fieldWithPath("reportMonth").type(JsonFieldType.STRING).description("수정할 매출 보고 월, yyyy-MM").optional(),
                        fieldWithPath("salesAmount").type(JsonFieldType.NUMBER).description("수정할 매출액").optional()
                }
        ));
    }

    private FieldDescriptor[] submitRequestFields() {
        return withDefaultConstraints(new FieldDescriptor[] {
                fieldWithPath("[]").type(JsonFieldType.ARRAY).description("상신 시 지정할 결재선. 기존 결재선으로 상신할 때는 body 생략 가능").optional(),
                fieldWithPath("[].approverId").type(JsonFieldType.NUMBER).description("결재자 사원 식별 번호").optional(),
                fieldWithPath("[].role").type(JsonFieldType.STRING).description("결재 역할. 예: APPROVER").optional(),
                fieldWithPath("[].order").type(JsonFieldType.NUMBER).description("결재 순서").optional()
        });
    }

    private FieldDescriptor[] commonCreateFields(String prefix) {
        return withDefaultConstraints(new FieldDescriptor[] {
                fieldWithPath(prefix + "title").type(JsonFieldType.STRING).description("기안서 제목"),
                fieldWithPath(prefix + "content").type(JsonFieldType.STRING).description("기안서 본문"),
                fieldWithPath(prefix + "approvers").type(JsonFieldType.ARRAY).description("결재선 목록").optional(),
                fieldWithPath(prefix + "approvers[].approverId").type(JsonFieldType.NUMBER).description("결재자 사원 식별 번호").optional(),
                fieldWithPath(prefix + "approvers[].role").type(JsonFieldType.STRING).description("결재 역할. 예: APPROVER").optional(),
                fieldWithPath(prefix + "approvers[].order").type(JsonFieldType.NUMBER).description("결재 순서").optional(),
                fieldWithPath(prefix + "submittedAt").ignored().optional()
        });
    }

    private FieldDescriptor[] nestedCommonCreateFields() {
        return withDefaultConstraints(concat(
                new FieldDescriptor[] {
                        fieldWithPath("param").type(JsonFieldType.OBJECT).description("기안서 공통 작성 정보")
                },
                commonCreateFields("param.")
        ));
    }

    private FieldDescriptor[] commonUpdateFields(String prefix) {
        return withDefaultConstraints(new FieldDescriptor[] {
                fieldWithPath(prefix + "title").type(JsonFieldType.STRING).description("수정할 기안서 제목").optional(),
                fieldWithPath(prefix + "content").type(JsonFieldType.STRING).description("수정할 기안서 본문").optional(),
                fieldWithPath(prefix + "approvers").type(JsonFieldType.ARRAY).description("수정할 결재선 목록").optional(),
                fieldWithPath(prefix + "approvers[].approverId").type(JsonFieldType.NUMBER).description("결재자 사원 식별 번호").optional(),
                fieldWithPath(prefix + "approvers[].role").type(JsonFieldType.STRING).description("결재 역할. 예: APPROVER").optional(),
                fieldWithPath(prefix + "approvers[].order").type(JsonFieldType.NUMBER).description("결재 순서").optional()
        });
    }

    private FieldDescriptor[] nestedCommonUpdateFields() {
        return withDefaultConstraints(concat(
                new FieldDescriptor[] {
                        fieldWithPath("param").type(JsonFieldType.OBJECT).description("수정할 기안서 공통 정보").optional()
                },
                commonUpdateFields("param.")
        ));
    }

    private FieldDescriptor[] draftIdResponseFields() {
        return new FieldDescriptor[] {
                fieldWithPath("draftId").type(JsonFieldType.NUMBER).description("생성된 기안서 식별 번호")
        };
    }

    private FieldDescriptor[] concat(FieldDescriptor[] first, FieldDescriptor[] second) {
        FieldDescriptor[] result = new FieldDescriptor[first.length + second.length];
        System.arraycopy(first, 0, result, 0, first.length);
        System.arraycopy(second, 0, result, first.length, second.length);
        return result;
    }

    private Snippet[] concat(Snippet[] first, Snippet[] second) {
        Snippet[] result = new Snippet[first.length + second.length];
        System.arraycopy(first, 0, result, 0, first.length);
        System.arraycopy(second, 0, result, first.length, second.length);
        return result;
    }

    private FieldDescriptor[] withDefaultConstraints(FieldDescriptor[] descriptors) {
        for (FieldDescriptor descriptor : descriptors) {
            descriptor.attributes(key("constraints").value("-"));
        }
        return descriptors;
    }

    private String commonDraftCreateRequest() {
        return """
                {
                  "title": "품의 문서",
                  "content": "품의 내용",
                  "approvers": [
                    {
                      "approverId": 2,
                      "role": "APPROVER",
                      "order": 1
                    }
                  ]
                }
                """;
    }

    private String leaveDraftCreateRequest() {
        return """
                {
                  "param": {
                    "title": "휴가 신청",
                    "content": "휴가 신청 내용",
                    "approvers": [
                      {
                        "approverId": 2,
                        "role": "APPROVER",
                        "order": 1
                      }
                    ]
                  },
                  "startAt": "2026-04-10T09:00:00",
                  "endAt": "2026-04-10T18:00:00",
                  "leaveType": "ANNUAL"
                }
                """;
    }

    private String businessTripDraftCreateRequest() {
        return """
                {
                  "param": {
                    "title": "출장 신청",
                    "content": "출장 신청 내용",
                    "approvers": [
                      {
                        "approverId": 2,
                        "role": "APPROVER",
                        "order": 1
                      }
                    ]
                  },
                  "startAt": "2026-04-10T09:00:00",
                  "endAt": "2026-04-12T18:00:00",
                  "destination": "서울",
                  "purpose": "고객 미팅",
                  "participantIds": [1, 3]
                }
                """;
    }

    private String salesDraftCreateRequest() {
        return """
                {
                  "param": {
                    "title": "매출 보고",
                    "content": "매출 보고 내용",
                    "approvers": [
                      {
                        "approverId": 2,
                        "role": "APPROVER",
                        "order": 1
                      }
                    ]
                  },
                  "franchiseId": 1,
                  "reportMonth": "2026-04",
                  "salesAmount": 1000000
                }
                """;
    }

    private String commonDraftUpdateRequest() {
        return """
                {
                  "title": "수정 품의 문서",
                  "content": "수정 품의 내용",
                  "approvers": [
                    {
                      "approverId": 2,
                      "role": "APPROVER",
                      "order": 1
                    }
                  ]
                }
                """;
    }

    private String leaveDraftUpdateRequest() {
        return """
                {
                  "param": {
                    "title": "수정 휴가 신청",
                    "content": "수정 휴가 신청 내용"
                  },
                  "startAt": "2026-04-11T09:00:00",
                  "endAt": "2026-04-11T18:00:00",
                  "leaveType": "ANNUAL"
                }
                """;
    }

    private String businessTripDraftUpdateRequest() {
        return """
                {
                  "param": {
                    "title": "수정 출장 신청",
                    "content": "수정 출장 신청 내용"
                  },
                  "startAt": "2026-04-11T09:00:00",
                  "endAt": "2026-04-13T18:00:00",
                  "destination": "부산",
                  "purpose": "지점 점검"
                }
                """;
    }

    private String salesDraftUpdateRequest() {
        return """
                {
                  "param": {
                    "title": "수정 매출 보고",
                    "content": "수정 매출 보고 내용"
                  },
                  "franchiseId": 1,
                  "reportMonth": "2026-05",
                  "salesAmount": 1200000
                }
                """;
    }

    private String draftSubmitRequest() {
        return """
                [
                  {
                    "approverId": 2,
                    "role": "APPROVER",
                    "order": 1
                  }
                ]
                """;
    }
}
