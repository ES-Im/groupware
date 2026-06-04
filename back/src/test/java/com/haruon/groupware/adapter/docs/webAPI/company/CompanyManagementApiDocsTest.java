package com.haruon.groupware.adapter.docs.webAPI.company;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.company.CompanyManagementApi;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyContactUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyHomePageUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyInfoUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyRegisterRequest;
import com.haruon.groupware.application.company.provided.CompanyManagement;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.headers.HeaderDocumentation.requestHeaders;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;
import static org.springframework.restdocs.snippet.Attributes.key;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class CompanyManagementApiDocsTest extends RestDocsSupport {

    private final CompanyManagement companyManagement = mock(CompanyManagement.class);
    private final static String REQUEST_MAPPING = "/api/company";

    @Override
    protected Object initController() {
        return new CompanyManagementApi(companyManagement);
    }

    @Test
    @DisplayName("회사 정보 최초 등록")
    void registerCompany() throws Exception {
        CompanyRegisterRequest request = CompanyRegisterRequest.builder()
                .companyName("하루온")
                .location("서울특별시 강남구")
                .presentedEmail("contact@haruon.com")
                .presentedExternalNo("02-1234-5678")
                .ownerName("홍길동")
                .homePageURL("https://haruon.com")
                .editedAt(LocalDateTime.of(2026, 1, 1, 9, 0))
                .build();

        Mockito.when(companyManagement.registerCompany(eq(1L), any(CompanyRegisterRequest.class)))
                .thenReturn(1L);

        mockMvc.perform(
                post(REQUEST_MAPPING + "/new")
                        .with(adminAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("COMPANY_REGISTER",
                        preprocessRequest(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        requestFields(
                                fieldWithPath("companyName").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("50자 이하"))
                                        .description("회사명"),
                                fieldWithPath("location").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("200자 이하"))
                                        .description("회사 위치 / 주소"),
                                fieldWithPath("presentedEmail").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("이메일 형식, 150자 이하"))
                                        .description("외부에 표시되는 대표 이메일"),
                                fieldWithPath("presentedExternalNo").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("20자 이하"))
                                        .description("외부에 표시되는 대표 연락처"),
                                fieldWithPath("ownerName").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("20자 이하"))
                                        .description("대표자명"),
                                fieldWithPath("homePageURL").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("http:// 또는 https://로 시작, 200자 이하"))
                                        .description("회사 홈페이지 URL"),
                                fieldWithPath("editedAt").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("yyyy-MM-dd'T'HH:mm:ss"))
                                        .description("회사 정보 스냅샷 수정일시")
                        )
                    )
                );
    }

    @Test
    @DisplayName("회사 기본 정보 이력 생성")
    void updateCompanyInfo() throws Exception {
        CompanyInfoUpdateRequest request = CompanyInfoUpdateRequest.builder()
                .companyName("하루온 그룹")
                .location("인천광역시 부평구")
                .ownerName("김대표")
                .editedAt(LocalDateTime.of(2026, 1, 2, 9, 0))
                .build();

        Mockito.doNothing()
                .when(companyManagement).updateCompanyInfo(eq(1L), any(CompanyInfoUpdateRequest.class));

        mockMvc.perform(
                post(REQUEST_MAPPING + "/info")
                        .with(adminAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("COMPANY_UPDATE_INFO",
                        preprocessRequest(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        requestFields(
                                fieldWithPath("companyName").optional().type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("50자 이하"))
                                        .description("변경할 회사명"),
                                fieldWithPath("location").optional().type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("200자 이하"))
                                        .description("변경할 회사 위치 / 주소"),
                                fieldWithPath("ownerName").optional().type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("20자 이하"))
                                        .description("변경할 대표자명"),
                                fieldWithPath("editedAt").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("yyyy-MM-dd'T'HH:mm:ss"))
                                        .description("회사 정보 스냅샷 수정일시")
                        )
                    )
                );
    }

    @Test
    @DisplayName("회사 대표 연락처 이력 생성")
    void updatePresentedContact() throws Exception {
        CompanyContactUpdateRequest request = CompanyContactUpdateRequest.builder()
                .presentedEmail("help@haruon.com")
                .presentedExternalNo("032-123-4567")
                .editedAt(LocalDateTime.of(2026, 1, 2, 9, 0))
                .build();

        Mockito.doNothing()
                .when(companyManagement).updatePresentedContact(eq(1L), any(CompanyContactUpdateRequest.class));

        mockMvc.perform(
                post(REQUEST_MAPPING + "/contact")
                        .with(adminAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("COMPANY_UPDATE_CONTACT",
                        preprocessRequest(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        requestFields(
                                fieldWithPath("presentedEmail").optional().type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("이메일 형식, 150자 이하"))
                                        .description("변경할 대표 이메일"),
                                fieldWithPath("presentedExternalNo").optional().type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("20자 이하"))
                                        .description("변경할 대표 연락처"),
                                fieldWithPath("editedAt").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("yyyy-MM-dd'T'HH:mm:ss"))
                                        .description("회사 정보 스냅샷 수정일시")
                        )
                    )
                );
    }

    @Test
    @DisplayName("회사 홈페이지 URL 이력 생성")
    void updateHomePageURL() throws Exception {
        CompanyHomePageUpdateRequest request = CompanyHomePageUpdateRequest.builder()
                .homePageURL("http://groupware.haruon.com")
                .editedAt(LocalDateTime.of(2026, 1, 2, 9, 0))
                .build();

        Mockito.doNothing()
                .when(companyManagement).updateHomePageURL(eq(1L), any(CompanyHomePageUpdateRequest.class));

        mockMvc.perform(
                post(REQUEST_MAPPING + "/home-page-url")
                        .with(adminAuthentication())
                        .header("Authorization", "Bearer accessToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andDo(document("COMPANY_UPDATE_HOME_PAGE_URL",
                        preprocessRequest(prettyPrint()),

                        requestHeaders(
                                headerWithName("Authorization").description("Bearer Access Token")
                        ),

                        requestFields(
                                fieldWithPath("homePageURL").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("http:// 또는 https://로 시작, 200자 이하"))
                                        .description("변경할 회사 홈페이지 URL"),
                                fieldWithPath("editedAt").type(JsonFieldType.STRING)
                                        .attributes(key("constraints").value("yyyy-MM-dd'T'HH:mm:ss"))
                                        .description("회사 정보 스냅샷 수정일시")
                        )
                    )
                );
    }

    private static RequestPostProcessor adminAuthentication() {
        EmpDetails empDetails = new EmpDetails(
                "admin",
                "password",
                List.of(SystemRoleCode.ADMIN),
                List.of(),
                EmpStatus.ACTIVE,
                1L
        );

        return authentication(
                new UsernamePasswordAuthenticationToken(
                        empDetails,
                        null,
                        empDetails.getAuthorities()
                )
        );
    }
}
