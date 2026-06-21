package com.haruon.groupware.adapter.docs.webAPI.franchise;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.franchise.FranchiseApi;
import com.haruon.groupware.adapter.webapi.franchise.FranchiseEducationApi;
import com.haruon.groupware.adapter.webapi.franchise.FranchiseInquiryApi;
import com.haruon.groupware.adapter.webapi.franchise.FranchiseSalesApi;
import com.haruon.groupware.application.franchise.provided.forCommand.AnswerManagement;
import com.haruon.groupware.application.franchise.provided.forCommand.EducationManagement;
import com.haruon.groupware.application.franchise.provided.forCommand.FranchiseManagement;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseEducationRetriever;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseInquiryRetriever;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseRetriever;
import com.haruon.groupware.application.franchise.provided.forRetriever.FranchiseSalesRetriever;
import com.haruon.groupware.application.franchise.service.command.dto.*;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.FranchisesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationApplicantsResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationsResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.AnswerResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquireDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.inquiry.InquiriesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseDailySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseMonthlySalesResponse;
import com.haruon.groupware.application.franchise.service.query.dto.sales.FranchiseYearlySalesResponse;
import com.haruon.groupware.domain.franchise.BusinessStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class FranchiseApiDocsTest extends RestDocsSupport {

    private static final String FRANCHISE_MAPPING = "/api/franchises";
    private static final String EDUCATION_MAPPING = "/api/franchise-educations";
    private static final String INQUIRY_MAPPING = "/api/franchise-inquiries";

    private final FranchiseRetriever franchiseRetriever = mock(FranchiseRetriever.class);
    private final FranchiseManagement franchiseManagement = mock(FranchiseManagement.class);
    private final FranchiseEducationRetriever franchiseEducationRetriever = mock(FranchiseEducationRetriever.class);
    private final EducationManagement educationManagement = mock(EducationManagement.class);
    private final FranchiseInquiryRetriever franchiseInquiryRetriever = mock(FranchiseInquiryRetriever.class);
    private final AnswerManagement answerManagement = mock(AnswerManagement.class);
    private final FranchiseSalesRetriever franchiseSalesRetriever = mock(FranchiseSalesRetriever.class);

    @Override
    protected Object[] initControllers() {
        return new Object[]{
                new FranchiseApi(franchiseRetriever, franchiseManagement),
                new FranchiseEducationApi(franchiseEducationRetriever, educationManagement),
                new FranchiseInquiryApi(franchiseInquiryRetriever, answerManagement),
                new FranchiseSalesApi(franchiseSalesRetriever)
        };
    }

    @Test
    @DisplayName("가맹점 목록 조회")
    void getFranchises() throws Exception {
        Mockito.when(franchiseRetriever.retrieveFranchises(anyLong(), nullable(String.class), nullable(BusinessStatus.class), nullable(Long.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(
                        List.of(new FranchisesResponse(1L, "테스트강남점", "서울특별시 강남구", "홍길동", BusinessStatus.OPEN, 1L, "김담당")),
                        PageRequest.of(0, 10),
                        1
                ));

        mockMvc.perform(
                get(FRANCHISE_MAPPING)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("keyword", "강남")
                        .queryParam("status", "OPEN")
                        .queryParam("managerId", "1")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("FRANCHISE_LIST",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        queryParameters(
                                parameterWithName("keyword").optional().description("가맹점명/주소 검색어"),
                                parameterWithName("status").optional().description("영업 상태"),
                                parameterWithName("managerId").optional().description("담당 사원 식별 번호"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),
                        responseFields(franchisePageFields())
                ));
    }

    @Test
    @DisplayName("가맹점 상세 조회")
    void getFranchise() throws Exception {
        Mockito.when(franchiseRetriever.retrieveFranchise(eq(1L), eq(1L)))
                .thenReturn(new FranchisesDetailResponse(
                        1L, "테스트강남점", "서울특별시 강남구", "홍길동",
                        "000-00-00000", "010-1234-5678", "owner@example.com",
                        BusinessStatus.OPEN, "메모", 1L, "김담당"
                ));

        mockMvc.perform(
                get(FRANCHISE_MAPPING + "/{franchiseId}", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("FRANCHISE_DETAIL",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("franchiseId").description("가맹점 식별 번호")),
                        responseFields(franchiseDetailFields())
                ));
    }

    @Test
    @DisplayName("가맹점 등록")
    void createFranchise() throws Exception {
        FranchiseCreateRequest request = FranchiseCreateRequest.builder()
                .businessNumber("000-00-00000")
                .franchiseName("테스트강남점")
                .address("서울특별시 강남구")
                .ownerName("홍길동")
                .contactNumber("010-1234-5678")
                .contactEmail("owner@example.com")
                .managerEmpId(1L)
                .build();
        Mockito.when(franchiseManagement.createFranchise(eq(1L), any(FranchiseCreateRequest.class))).thenReturn(1L);

        mockMvc.perform(
                post(FRANCHISE_MAPPING)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isCreated())
                .andDo(document("FRANCHISE_CREATE",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        requestFields(franchiseCreateRequestFields()),
                        responseFields(fieldWithPath("franchiseId").type(JsonFieldType.NUMBER).description("생성된 가맹점 식별 번호"))
                ));
    }

    @Test
    @DisplayName("가맹점 기본 정보 수정")
    void updateFranchise() throws Exception {
        FranchiseUpdateRequest request = FranchiseUpdateRequest.builder()
                .franchiseName("테스트역삼점")
                .address("서울특별시 강남구 역삼동")
                .build();

        mockMvc.perform(
                patch(FRANCHISE_MAPPING + "/{franchiseId}", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("FRANCHISE_UPDATE",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("franchiseId").description("가맹점 식별 번호")),
                        requestFields(franchiseUpdateRequestFields())
                ));
    }

    @Test
    @DisplayName("가맹점 영업 상태 변경")
    void updateFranchiseStatus() throws Exception {
        mockMvc.perform(
                patch(FRANCHISE_MAPPING + "/{franchiseId}/status", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("status", "OPEN")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("FRANCHISE_STATUS_UPDATE",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("franchiseId").description("가맹점 식별 번호")),
                        queryParameters(parameterWithName("status").description("변경할 영업 상태"))
                ));
    }

    @Test
    @DisplayName("가맹점 담당자 변경")
    void updateFranchiseManager() throws Exception {
        mockMvc.perform(
                patch(FRANCHISE_MAPPING + "/{franchiseId}/managers", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("newManagerId", "2")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("FRANCHISE_MANAGER_UPDATE",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("franchiseId").description("가맹점 식별 번호")),
                        queryParameters(parameterWithName("newManagerId").description("새 담당 사원 식별 번호"))
                ));
    }

    @Test
    @DisplayName("가맹점 메모 수정")
    void updateFranchiseMemo() throws Exception {
        FranchiseApi.MemoRequest request = new FranchiseApi.MemoRequest("특이사항");

        mockMvc.perform(
                patch(FRANCHISE_MAPPING + "/{franchiseId}/memo", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("FRANCHISE_MEMO_UPDATE",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("franchiseId").description("가맹점 식별 번호")),
                        requestFields(fieldWithPath("memo").type(JsonFieldType.STRING)
                                .attributes(key("constraints").value("필수, 공백 불가"))
                                .description("가맹점 특이사항"))
                ));
    }

    @Test
    @DisplayName("가맹점 메모 삭제")
    void clearFranchiseMemo() throws Exception {
        mockMvc.perform(
                patch(FRANCHISE_MAPPING + "/{franchiseId}/clear-memo", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("FRANCHISE_MEMO_CLEAR",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("franchiseId").description("가맹점 식별 번호"))
                ));
    }

    @Test
    @DisplayName("교육 캘린더 조회")
    void getEducations() throws Exception {
        LocalDateTime start = LocalDateTime.of(2026, 5, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 6, 1, 0, 0);
        Mockito.when(franchiseEducationRetriever.retrieveEducations(eq(1L), eq(start), eq(end)))
                .thenReturn(List.of(new EducationsResponse(1L, LocalDate.of(2026, 5, 1), "교육장", "교육 제목", false, true)));

        mockMvc.perform(
                get(EDUCATION_MAPPING + "/calendar")
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("start", start.toString())
                        .queryParam("end", end.toString())
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("FRANCHISE_EDUCATION_CALENDAR",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        queryParameters(
                                parameterWithName("start").optional().description("조회 시작 일시, yyyy-MM-dd'T'HH:mm:ss (포함), 미입력시, 당월 첫날의 0시 0분 0초"),
                                parameterWithName("end").optional().description("조회 종료 일시, yyyy-MM-dd'T'HH:mm:ss (미포함), 미입력시, 익월 첫날의 0시 0분 0초")
                        ),
                        responseFields(educationCalendarFields())
                ));
    }

    @Test
    @DisplayName("교육 상세 조회")
    void getEducation() throws Exception {
        Mockito.when(franchiseEducationRetriever.retrieveEducation(eq(1L), eq(1L)))
                .thenReturn(educationDetailResponse());

        mockMvc.perform(
                get(EDUCATION_MAPPING + "/{educationId}", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("FRANCHISE_EDUCATION_DETAIL",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("educationId").description("교육 식별 번호")),
                        responseFields(educationDetailFields())
                ));
    }

    @Test
    @DisplayName("교육 신청자 조회")
    void getEducationApplicants() throws Exception {
        Mockito.when(franchiseEducationRetriever.retrieveApplicantsByEducationId(eq(1L), eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(
                        List.of(new EducationApplicantsResponse(1L, "app-1", 1L, "테스트강남점", "010-1234-5678", "owner@example.com", 2L, LocalDateTime.of(2026, 5, 1, 10, 0))),
                        PageRequest.of(0, 10),
                        1
                ));

        mockMvc.perform(
                get(EDUCATION_MAPPING + "/{educationId}/applicants", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("FRANCHISE_EDUCATION_APPLICANTS",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("educationId").description("교육 식별 번호")),
                        queryParameters(
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),
                        responseFields(educationApplicantPageFields())
                ));
    }

    @Test
    @DisplayName("교육 등록")
    void createEducation() throws Exception {
        EducationCreateRequest request = EducationCreateRequest.builder()
                .educationDate(LocalDateTime.of(2026, 5, 1, 10, 0))
                .place("교육장")
                .title("교육 제목")
                .content("교육 내용")
                .capacity(30L)
                .build();
        Mockito.when(educationManagement.createEducation(eq(1L), any(EducationCreateRequest.class))).thenReturn(1L);

        mockMvc.perform(
                post(EDUCATION_MAPPING)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isCreated())
                .andDo(document("FRANCHISE_EDUCATION_CREATE",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        requestFields(educationCreateRequestFields()),
                        responseFields(fieldWithPath("educationId").type(JsonFieldType.NUMBER).description("생성된 교육 식별 번호"))
                ));
    }

    @Test
    @DisplayName("교육 수정")
    void updateEducation() throws Exception {
        EducationUpdateRequest request = EducationUpdateRequest.builder()
                .title("수정 교육 제목")
                .capacity(40L)
                .build();

        mockMvc.perform(
                patch(EDUCATION_MAPPING + "/{educationId}", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("FRANCHISE_EDUCATION_UPDATE",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("educationId").description("교육 식별 번호")),
                        requestFields(educationUpdateRequestFields())
                ));
    }

    @Test
    @DisplayName("교육 활성화")
    void activateEducation() throws Exception {
        mockMvc.perform(
                post(EDUCATION_MAPPING + "/{educationId}/activation", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("FRANCHISE_EDUCATION_ACTIVATE",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("educationId").description("교육 식별 번호"))
                ));
    }

    @Test
    @DisplayName("교육 비활성화")
    void deactivateEducation() throws Exception {
        mockMvc.perform(
                post(EDUCATION_MAPPING + "/{educationId}/deactivation", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("FRANCHISE_EDUCATION_DEACTIVATE",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("educationId").description("교육 식별 번호"))
                ));
    }

    @Test
    @DisplayName("문의 목록 조회")
    void getInquiries() throws Exception {
        Mockito.when(franchiseInquiryRetriever.retrieveInquiries(anyLong(), nullable(Boolean.class), nullable(Long.class), nullable(String.class), nullable(LocalDate.class), nullable(LocalDate.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(
                        List.of(new InquiriesResponse(1L, "inq-1", 1L, "테스트강남점", "문의 제목", LocalDateTime.of(2026, 5, 1, 10, 0), false, 1L, "김담당")),
                        PageRequest.of(0, 10),
                        1
                ));

        mockMvc.perform(
                get(INQUIRY_MAPPING)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("isAnswered", "false")
                        .queryParam("assignedManagerId", "1")
                        .queryParam("keyword", "문의")
                        .queryParam("from", "2026-05-01")
                        .queryParam("to", "2026-05-31")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("FRANCHISE_INQUIRY_LIST",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        queryParameters(
                                parameterWithName("isAnswered").optional().description("답변 완료 여부"),
                                parameterWithName("assignedManagerId").optional().description("담당 사원 식별 번호"),
                                parameterWithName("keyword").optional().description("문의 제목 검색어"),
                                parameterWithName("from").optional().description("조회 시작일, yyyy-MM-dd"),
                                parameterWithName("to").optional().description("조회 종료일, yyyy-MM-dd"),
                                parameterWithName("page").optional().description("페이지 번호"),
                                parameterWithName("size").optional().description("페이지 크기")
                        ),
                        responseFields(inquiryPageFields())
                ));
    }

    @Test
    @DisplayName("문의 상세 조회")
    void getInquiry() throws Exception {
        Mockito.when(franchiseInquiryRetriever.retrieveInquiry(eq(1L), eq(1L)))
                .thenReturn(new InquireDetailResponse(1L, "inq-1", 1L, "테스트강남점", "010-1234-5678", LocalDateTime.of(2026, 5, 1, 10, 0), "문의 제목", "문의 내용", 1L, "김담당"));

        mockMvc.perform(
                get(INQUIRY_MAPPING + "/{inquiryId}", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("FRANCHISE_INQUIRY_DETAIL",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("inquiryId").description("문의 식별 번호")),
                        responseFields(inquiryDetailFields())
                ));
    }

    @Test
    @DisplayName("답변 조회")
    void getAnswer() throws Exception {
        Mockito.when(franchiseInquiryRetriever.retrieveAnswer(eq(1L), eq(1L)))
                .thenReturn(Optional.of(new AnswerResponse(1L, "답변 내용", true, LocalDateTime.of(2026, 5, 1, 11, 0), 1L, "김담당")));

        mockMvc.perform(
                get(INQUIRY_MAPPING + "/{inquiryId}/answer", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("FRANCHISE_INQUIRY_ANSWER_DETAIL",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("inquiryId").description("문의 식별 번호")),
                        responseFields(answerFields())
                ));
    }

    @Test
    @DisplayName("답변 담당자 배정")
    void assignAnswer() throws Exception {
        mockMvc.perform(
                patch(INQUIRY_MAPPING + "/{inquiryId}/assign-answer", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .queryParam("assignedEmpId", "2")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("FRANCHISE_INQUIRY_ASSIGN_ANSWER",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("inquiryId").description("문의 식별 번호")),
                        queryParameters(parameterWithName("assignedEmpId").description("답변 담당 사원 식별 번호"))
                ));
    }

    @Test
    @DisplayName("답변 초안 생성")
    void createAnswer() throws Exception {
        AnswerRequest request = new AnswerRequest("답변 내용");

        mockMvc.perform(
                post(INQUIRY_MAPPING + "/{inquiryId}/answers", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isCreated())
                .andDo(document("FRANCHISE_INQUIRY_ANSWER_CREATE",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("inquiryId").description("문의 식별 번호")),
                        requestFields(answerRequestFields())
                ));
    }

    @Test
    @DisplayName("답변 초안 수정")
    void updateAnswer() throws Exception {
        AnswerRequest request = new AnswerRequest("수정 답변 내용");

        mockMvc.perform(
                patch(INQUIRY_MAPPING + "/{inquiryId}/answers", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("FRANCHISE_INQUIRY_ANSWER_UPDATE",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("inquiryId").description("문의 식별 번호")),
                        requestFields(answerRequestFields())
                ));
    }

    @Test
    @DisplayName("답변 발송")
    void sendAnswer() throws Exception {
        mockMvc.perform(
                patch(INQUIRY_MAPPING + "/{inquiryId}/answers/send", 1L)
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent())
                .andDo(document("FRANCHISE_INQUIRY_ANSWER_SEND",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(parameterWithName("inquiryId").description("문의 식별 번호"))
                ));
    }

    @Test
    @DisplayName("연 매출 조회")
    void getYearlySales() throws Exception {
        Mockito.when(franchiseSalesRetriever.retrieveFranchiseYearlySales(eq(1L), eq(1L), eq(Year.of(2026))))
                .thenReturn(Optional.of(new FranchiseYearlySalesResponse(1L, "테스트강남점", 2026, 1_000_000L, 100L, 10_000.0, 1.0, 1, List.of(new FranchiseYearlySalesResponse.MonthlySalesPoint(202605, 1_000_000L, 100L)))));

        mockMvc.perform(
                get(FRANCHISE_MAPPING + "/{franchiseId}/sales/years/{year}", 1L, "2026")
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("FRANCHISE_SALES_YEARLY",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(
                                parameterWithName("franchiseId").description("가맹점 식별 번호"),
                                parameterWithName("year").description("조회 연도, yyyy")
                        ),
                        responseFields(yearlySalesFields())
                ));
    }

    @Test
    @DisplayName("월 매출 조회")
    void getMonthlySales() throws Exception {
        Mockito.when(franchiseSalesRetriever.retrieveFranchiseMonthlySales(eq(1L), eq(1L), eq(YearMonth.of(2026, 5))))
                .thenReturn(Optional.of(new FranchiseMonthlySalesResponse(1L, "테스트강남점", 202605, 1_000_000L, 100L, 1.0, 10_000.0, 1, List.of(new FranchiseMonthlySalesResponse.DailySalesPoint(20260501, 1_000_000L, 100L)))));

        mockMvc.perform(
                get(FRANCHISE_MAPPING + "/{franchiseId}/sales/months/{yearMonth}", 1L, "2026-05")
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("FRANCHISE_SALES_MONTHLY",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(
                                parameterWithName("franchiseId").description("가맹점 식별 번호"),
                                parameterWithName("yearMonth").description("조회 년월, yyyy-MM")
                        ),
                        responseFields(monthlySalesFields())
                ));
    }

    @Test
    @DisplayName("일 매출 조회")
    void getDailySales() throws Exception {
        Mockito.when(franchiseSalesRetriever.retrieveFranchiseDailySales(eq(1L), eq(1L), eq(LocalDate.of(2026, 5, 1))))
                .thenReturn(Optional.of(new FranchiseDailySalesResponse(1L, "테스트강남점", LocalDate.of(2026, 5, 1), 1_000_000L, 100L)));

        mockMvc.perform(
                get(FRANCHISE_MAPPING + "/{franchiseId}/sales/dates/{date}", 1L, "2026-05-01")
                        .with(franchiseAuthentication())
                        .header("Authorization", "Bearer accessToken")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("FRANCHISE_SALES_DAILY",
                        preprocessRequest(prettyPrint()),
                        requestHeaders(headerWithName("Authorization").description("Bearer Access Token")),
                        pathParameters(
                                parameterWithName("franchiseId").description("가맹점 식별 번호"),
                                parameterWithName("date").description("조회 일자, yyyy-MM-dd")
                        ),
                        responseFields(dailySalesFields())
                ));
    }

    private EducationDetailResponse educationDetailResponse() {
        return new EducationDetailResponse(
                1L,
                LocalDate.of(2026, 5, 1),
                LocalTime.of(10, 0),
                "교육장",
                "교육 제목",
                "교육 내용",
                10L,
                30L,
                20L,
                true,
                null
        );
    }

    private FieldDescriptor[] franchisePageFields() {
        return concat(new FieldDescriptor[]{
                fieldWithPath("content").type(JsonFieldType.ARRAY).description("가맹점 목록"),
                fieldWithPath("content[].id").type(JsonFieldType.NUMBER).description("가맹점 식별 번호"),
                fieldWithPath("content[].name").type(JsonFieldType.STRING).description("가맹점명"),
                fieldWithPath("content[].address").type(JsonFieldType.STRING).description("주소"),
                fieldWithPath("content[].ownerName").type(JsonFieldType.STRING).description("대표자명"),
                fieldWithPath("content[].BusinessStatus").type(JsonFieldType.STRING).description("영업 상태 표시명"),
                fieldWithPath("content[].managerEmpId").type(JsonFieldType.NUMBER).description("담당 사원 식별 번호"),
                fieldWithPath("content[].managerEmpName").type(JsonFieldType.STRING).description("담당 사원명")
        }, pageMetadataFields());
    }

    private FieldDescriptor[] franchiseDetailFields() {
        return new FieldDescriptor[]{
                fieldWithPath("id").type(JsonFieldType.NUMBER).description("가맹점 식별 번호"),
                fieldWithPath("name").type(JsonFieldType.STRING).description("가맹점명"),
                fieldWithPath("address").type(JsonFieldType.STRING).description("주소"),
                fieldWithPath("ownerName").type(JsonFieldType.STRING).description("대표자명"),
                fieldWithPath("businessNumber").type(JsonFieldType.STRING).description("사업자번호"),
                fieldWithPath("contactNumber").type(JsonFieldType.STRING).description("연락처"),
                fieldWithPath("contactEmail").type(JsonFieldType.STRING).description("이메일"),
                fieldWithPath("BusinessStatus").type(JsonFieldType.STRING).description("영업 상태 표시명"),
                fieldWithPath("memo").type(JsonFieldType.STRING).description("특이사항"),
                fieldWithPath("managerEmpId").type(JsonFieldType.NUMBER).description("담당 사원 식별 번호"),
                fieldWithPath("managerEmpName").type(JsonFieldType.STRING).description("담당 사원명")
        };
    }

    private FieldDescriptor[] franchiseCreateRequestFields() {
        return new FieldDescriptor[]{
                fieldWithPath("businessNumber").type(JsonFieldType.STRING).attributes(key("constraints").value("12자 사업자번호 형식")).description("사업자번호"),
                fieldWithPath("franchiseName").type(JsonFieldType.STRING).attributes(key("constraints").value("50자 이하")).description("가맹점명"),
                fieldWithPath("address").type(JsonFieldType.STRING).attributes(key("constraints").value("200자 이하")).description("주소"),
                fieldWithPath("ownerName").type(JsonFieldType.STRING).attributes(key("constraints").value("50자 이하")).description("대표자명"),
                fieldWithPath("contactNumber").type(JsonFieldType.STRING).attributes(key("constraints").value("연락처 형식")).description("연락처"),
                fieldWithPath("contactEmail").type(JsonFieldType.STRING).attributes(key("constraints").value("이메일 형식")).description("이메일"),
                fieldWithPath("managerEmpId").optional().type(JsonFieldType.NUMBER)
                        .attributes(key("constraints").value("미입력 가능"))
                        .description("담당 사원 식별 번호")
        };
    }

    private FieldDescriptor[] franchiseUpdateRequestFields() {
        return new FieldDescriptor[]{
                fieldWithPath("businessNumber").optional().type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("12자 사업자번호 형식"))
                        .description("변경할 사업자번호"),
                fieldWithPath("franchiseName").optional().type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("50자 이하"))
                        .description("변경할 가맹점명"),
                fieldWithPath("address").optional().type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("200자 이하"))
                        .description("변경할 주소"),
                fieldWithPath("ownerName").optional().type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("50자 이하"))
                        .description("변경할 대표자명"),
                fieldWithPath("contactNumber").optional().type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("연락처 형식"))
                        .description("변경할 연락처"),
                fieldWithPath("contactEmail").optional().type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("이메일 형식"))
                        .description("변경할 이메일")
        };
    }

    private FieldDescriptor[] educationCalendarFields() {
        return new FieldDescriptor[]{
                fieldWithPath("[]").type(JsonFieldType.ARRAY).description("교육 목록"),
                fieldWithPath("[].id").type(JsonFieldType.NUMBER).description("교육 식별 번호"),
                fieldWithPath("[].date").type(JsonFieldType.STRING).description("교육 일자"),
                fieldWithPath("[].place").type(JsonFieldType.STRING).description("교육 장소"),
                fieldWithPath("[].title").type(JsonFieldType.STRING).description("교육 제목"),
                fieldWithPath("[].isFull").type(JsonFieldType.BOOLEAN).description("정원 마감 여부"),
                fieldWithPath("[].isActive").type(JsonFieldType.BOOLEAN).description("활성화 여부")
        };
    }

    private FieldDescriptor[] educationDetailFields() {
        return new FieldDescriptor[]{
                fieldWithPath("id").type(JsonFieldType.NUMBER).description("교육 식별 번호"),
                fieldWithPath("date").type(JsonFieldType.STRING).description("교육 일자"),
                fieldWithPath("startAt").type(JsonFieldType.STRING).description("교육 시작 시간"),
                fieldWithPath("place").type(JsonFieldType.STRING).description("교육 장소"),
                fieldWithPath("title").type(JsonFieldType.STRING).description("교육 제목"),
                fieldWithPath("content").type(JsonFieldType.STRING).description("교육 내용"),
                fieldWithPath("appliedCount").type(JsonFieldType.NUMBER).description("신청 인원"),
                fieldWithPath("capacity").type(JsonFieldType.NUMBER).description("정원"),
                fieldWithPath("remainingCapacity").type(JsonFieldType.NUMBER).description("잔여 정원"),
                fieldWithPath("isActive").type(JsonFieldType.BOOLEAN).description("활성화 여부"),
                fieldWithPath("fileListInfoList").type(JsonFieldType.NULL).description("첨부 파일 목록")
        };
    }

    private FieldDescriptor[] educationApplicantPageFields() {
        return concat(new FieldDescriptor[]{
                fieldWithPath("content").type(JsonFieldType.ARRAY).description("교육 신청자 목록"),
                fieldWithPath("content[].applicationId").type(JsonFieldType.NUMBER).description("교육 신청 식별 번호"),
                fieldWithPath("content[].externalId").type(JsonFieldType.STRING).description("외부 신청 식별 값"),
                fieldWithPath("content[].franchiseId").type(JsonFieldType.NUMBER).description("가맹점 식별 번호"),
                fieldWithPath("content[].franchiseName").type(JsonFieldType.STRING).description("가맹점명"),
                fieldWithPath("content[].contactNumber").type(JsonFieldType.STRING).description("가맹점 연락처"),
                fieldWithPath("content[].contactEmail").type(JsonFieldType.STRING).description("가맹점 이메일"),
                fieldWithPath("content[].appliedCount").type(JsonFieldType.NUMBER).description("신청 인원"),
                fieldWithPath("content[].appliedAt").type(JsonFieldType.STRING).description("신청 일시")
        }, pageMetadataFields());
    }

    private FieldDescriptor[] educationCreateRequestFields() {
        return new FieldDescriptor[]{
                fieldWithPath("educationDate").type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("필수, yyyy-MM-dd'T'HH:mm:ss"))
                        .description("교육 일시, yyyy-MM-dd'T'HH:mm:ss"),
                fieldWithPath("place").type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("필수, 50자 이하"))
                        .description("교육 장소"),
                fieldWithPath("title").type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("필수, 50자 이하"))
                        .description("교육 제목"),
                fieldWithPath("content").type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("필수"))
                        .description("교육 내용"),
                fieldWithPath("capacity").type(JsonFieldType.NUMBER)
                        .attributes(key("constraints").value("양수"))
                        .description("정원")
        };
    }

    private FieldDescriptor[] educationUpdateRequestFields() {
        return new FieldDescriptor[]{
                fieldWithPath("educationDate").optional().type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("yyyy-MM-dd'T'HH:mm:ss"))
                        .description("변경할 교육 일시"),
                fieldWithPath("place").optional().type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("50자 이하"))
                        .description("변경할 교육 장소"),
                fieldWithPath("title").optional().type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("50자 이하"))
                        .description("변경할 교육 제목"),
                fieldWithPath("content").optional().type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("공백 불가"))
                        .description("변경할 교육 내용"),
                fieldWithPath("capacity").optional().type(JsonFieldType.NUMBER)
                        .attributes(key("constraints").value("양수"))
                        .description("변경할 정원")
        };
    }

    private FieldDescriptor[] inquiryPageFields() {
        return concat(new FieldDescriptor[]{
                fieldWithPath("content").type(JsonFieldType.ARRAY).description("문의 목록"),
                fieldWithPath("content[].inquiryId").type(JsonFieldType.NUMBER).description("문의 식별 번호"),
                fieldWithPath("content[].externalId").type(JsonFieldType.STRING).description("외부 문의 식별 값"),
                fieldWithPath("content[].franchiseId").type(JsonFieldType.NUMBER).description("가맹점 식별 번호"),
                fieldWithPath("content[].franchiseName").type(JsonFieldType.STRING).description("가맹점명"),
                fieldWithPath("content[].inquiryTitle").type(JsonFieldType.STRING).description("문의 제목"),
                fieldWithPath("content[].inquiryAt").type(JsonFieldType.STRING).description("문의 일시"),
                fieldWithPath("content[].isAnswered").type(JsonFieldType.BOOLEAN).description("답변 완료 여부"),
                fieldWithPath("content[].assignedManagerId").type(JsonFieldType.NUMBER).description("담당 사원 식별 번호"),
                fieldWithPath("content[].assignedManagerName").type(JsonFieldType.STRING).description("담당 사원명")
        }, pageMetadataFields());
    }

    private FieldDescriptor[] inquiryDetailFields() {
        return new FieldDescriptor[]{
                fieldWithPath("inquiryId").type(JsonFieldType.NUMBER).description("문의 식별 번호"),
                fieldWithPath("externalId").type(JsonFieldType.STRING).description("외부 문의 식별 값"),
                fieldWithPath("franchiseId").type(JsonFieldType.NUMBER).description("가맹점 식별 번호"),
                fieldWithPath("franchiseName").type(JsonFieldType.STRING).description("가맹점명"),
                fieldWithPath("inquirerContact").type(JsonFieldType.STRING).description("문의자 연락처"),
                fieldWithPath("inquiryAt").type(JsonFieldType.STRING).description("문의 일시"),
                fieldWithPath("inquiryTitle").type(JsonFieldType.STRING).description("문의 제목"),
                fieldWithPath("inquiryContent").type(JsonFieldType.STRING).description("문의 내용"),
                fieldWithPath("assignedManagerId").type(JsonFieldType.NUMBER).description("담당 사원 식별 번호"),
                fieldWithPath("assignedManagerName").type(JsonFieldType.STRING).description("담당 사원명")
        };
    }

    private FieldDescriptor[] answerFields() {
        return new FieldDescriptor[]{
                fieldWithPath("answerId").type(JsonFieldType.NUMBER).description("답변 식별 번호"),
                fieldWithPath("content").type(JsonFieldType.STRING).description("답변 내용"),
                fieldWithPath("isSubmitted").type(JsonFieldType.BOOLEAN).description("제출 여부"),
                fieldWithPath("answeredAt").type(JsonFieldType.STRING).description("답변 제출 일시"),
                fieldWithPath("answeredEmpId").type(JsonFieldType.NUMBER).description("답변 담당 사원 식별 번호"),
                fieldWithPath("answeredEmpName").type(JsonFieldType.STRING).description("답변 담당 사원명")
        };
    }

    private FieldDescriptor[] answerRequestFields() {
        return new FieldDescriptor[]{
                fieldWithPath("answer").type(JsonFieldType.STRING)
                        .attributes(key("constraints").value("필수, 공백 불가"))
                        .description("답변 내용")
        };
    }

    private FieldDescriptor[] yearlySalesFields() {
        return new FieldDescriptor[]{
                fieldWithPath("franchiseId").type(JsonFieldType.NUMBER).description("가맹점 식별 번호"),
                fieldWithPath("franchiseName").type(JsonFieldType.STRING).description("가맹점명"),
                fieldWithPath("salesYear").type(JsonFieldType.NUMBER).description("매출 연도"),
                fieldWithPath("totalSalesAmount").type(JsonFieldType.NUMBER).description("연 총 매출액"),
                fieldWithPath("totalOrderCount").type(JsonFieldType.NUMBER).description("연 총 주문 수"),
                fieldWithPath("averageSalesAmount").type(JsonFieldType.NUMBER).description("연 일평균 매출"),
                fieldWithPath("averageOrderAmount").type(JsonFieldType.NUMBER).description("연 일평균 주문 수"),
                fieldWithPath("salesMonths").type(JsonFieldType.NUMBER).description("매출 데이터가 있는 월 수"),
                fieldWithPath("monthlySales").type(JsonFieldType.ARRAY).description("월별 매출 포인트"),
                fieldWithPath("monthlySales[].salesMonth").type(JsonFieldType.NUMBER).description("매출 월, yyyyMM"),
                fieldWithPath("monthlySales[].salesAmount").type(JsonFieldType.NUMBER).description("월 매출액"),
                fieldWithPath("monthlySales[].orderCount").type(JsonFieldType.NUMBER).description("월 주문 수")
        };
    }

    private FieldDescriptor[] monthlySalesFields() {
        return new FieldDescriptor[]{
                fieldWithPath("franchiseId").type(JsonFieldType.NUMBER).description("가맹점 식별 번호"),
                fieldWithPath("franchiseName").type(JsonFieldType.STRING).description("가맹점명"),
                fieldWithPath("salesMonth").type(JsonFieldType.NUMBER).description("매출 월, yyyyMM"),
                fieldWithPath("totalSalesAmount").type(JsonFieldType.NUMBER).description("월 총 매출액"),
                fieldWithPath("totalOrderCount").type(JsonFieldType.NUMBER).description("월 총 주문 수"),
                fieldWithPath("averageOrderAmount").type(JsonFieldType.NUMBER).description("월 일평균 주문 수"),
                fieldWithPath("averageDailySalesAmount").type(JsonFieldType.NUMBER).description("월 일평균 매출"),
                fieldWithPath("salesDays").type(JsonFieldType.NUMBER).description("매출 데이터가 있는 일수"),
                fieldWithPath("dailySales").type(JsonFieldType.ARRAY).description("일별 매출 포인트"),
                fieldWithPath("dailySales[].salesDate").type(JsonFieldType.NUMBER).description("매출 일자, yyyyMMdd"),
                fieldWithPath("dailySales[].salesAmount").type(JsonFieldType.NUMBER).description("일 매출액"),
                fieldWithPath("dailySales[].orderCount").type(JsonFieldType.NUMBER).description("일 주문 수")
        };
    }

    private FieldDescriptor[] dailySalesFields() {
        return new FieldDescriptor[]{
                fieldWithPath("franchiseId").type(JsonFieldType.NUMBER).description("가맹점 식별 번호"),
                fieldWithPath("franchiseName").type(JsonFieldType.STRING).description("가맹점명"),
                fieldWithPath("salesDate").type(JsonFieldType.STRING).description("매출 일자"),
                fieldWithPath("salesAmount").type(JsonFieldType.NUMBER).description("일 매출액"),
                fieldWithPath("orderCount").type(JsonFieldType.NUMBER).description("일 주문 수")
        };
    }

    private FieldDescriptor[] pageMetadataFields() {
        return new FieldDescriptor[]{
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
