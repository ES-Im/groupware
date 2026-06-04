package com.haruon.groupware.adapter.webapi.company;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyContactUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyHomePageUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyInfoUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyRegisterRequest;
import com.haruon.groupware.domain.Company;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class CompanyApiTest extends IntegrationTestSupport {

    private static final String REQUEST_MAPPING = "/api/company";

    @Test
    @DisplayName("회사 정보 조회")
    void getCompany_success() throws Exception {
        Company company = saveCompany(LocalDateTime.of(2026, 1, 1, 9, 0));

        mockMvc.perform(
                get(REQUEST_MAPPING)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyId").value(company.getId()))
                .andExpect(jsonPath("$.companyName").value("하루온"))
                .andExpect(jsonPath("$.location").value("서울특별시 강남구"))
                .andExpect(jsonPath("$.presentedEmail").value("contact@haruon.com"))
                .andExpect(jsonPath("$.presentedExternalNo").value("02-1234-5678"))
                .andExpect(jsonPath("$.ownerName").value("홍길동"))
                .andExpect(jsonPath("$.homePageURL").value("https://haruon.com"))
                .andExpect(jsonPath("$.editedAt").value("2026-01-01T09:00:00"));
    }

    @Test
    @DisplayName("회사 정보 최초 등록")
    void registerCompany_success() throws Exception {
        String accessToken = adminAccessToken("adminLoginId123", "!Q2w3e4r5t");

        CompanyRegisterRequest request = createRegisterRequest();

        mockMvc.perform(
                post(REQUEST_MAPPING + "/new")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        Company company = companyRepository.findFirstByOrderByEditedAtDescIdDesc().orElseThrow();
        assertThat(company.getCompanyName()).isEqualTo("하루온");
        assertThat(company.getEditedAt()).isEqualTo(LocalDateTime.of(2026, 1, 1, 9, 0));
    }

    @Test
    @DisplayName("회사 기본 정보 이력 생성")
    void updateCompanyInfo_success() throws Exception {
        saveCompany(LocalDateTime.of(2026, 1, 1, 9, 0));
        String accessToken = adminAccessToken("adminLoginId123", "!Q2w3e4r5t");

        CompanyInfoUpdateRequest request = CompanyInfoUpdateRequest.builder()
                .companyName("하루온 그룹")
                .location("인천광역시 부평구")
                .ownerName("김대표")
                .editedAt(LocalDateTime.of(2026, 1, 2, 9, 0))
                .build();

        mockMvc.perform(
                post(REQUEST_MAPPING + "/info")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        Company company = companyRepository.findFirstByOrderByEditedAtDescIdDesc().orElseThrow();
        assertThat(companyRepository.count()).isEqualTo(2);
        assertThat(company.getCompanyName()).isEqualTo("하루온 그룹");
        assertThat(company.getLocation()).isEqualTo("인천광역시 부평구");
        assertThat(company.getOwnerName()).isEqualTo("김대표");
    }

    @Test
    @DisplayName("회사 대표 연락처 이력 생성")
    void updateContact_success() throws Exception {
        saveCompany(LocalDateTime.of(2026, 1, 1, 9, 0));
        String accessToken = adminAccessToken("adminLoginId123", "!Q2w3e4r5t");

        CompanyContactUpdateRequest request = CompanyContactUpdateRequest.builder()
                .presentedEmail("help@haruon.com")
                .presentedExternalNo("032-123-4567")
                .editedAt(LocalDateTime.of(2026, 1, 2, 9, 0))
                .build();

        mockMvc.perform(
                post(REQUEST_MAPPING + "/contact")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        Company company = companyRepository.findFirstByOrderByEditedAtDescIdDesc().orElseThrow();
        assertThat(companyRepository.count()).isEqualTo(2);
        assertThat(company.getPresentedEmail().email()).isEqualTo("help@haruon.com");
        assertThat(company.getPresentedExternalNo()).isEqualTo("032-123-4567");
    }

    @Test
    @DisplayName("회사 홈페이지 URL 이력 생성")
    void updateHomePageURL_success() throws Exception {
        saveCompany(LocalDateTime.of(2026, 1, 1, 9, 0));
        String accessToken = adminAccessToken("adminLoginId123", "!Q2w3e4r5t");

        CompanyHomePageUpdateRequest request = CompanyHomePageUpdateRequest.builder()
                .homePageURL("http://groupware.haruon.com")
                .editedAt(LocalDateTime.of(2026, 1, 2, 9, 0))
                .build();

        mockMvc.perform(
                post(REQUEST_MAPPING + "/home-page-url")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        Company company = companyRepository.findFirstByOrderByEditedAtDescIdDesc().orElseThrow();
        assertThat(companyRepository.count()).isEqualTo(2);
        assertThat(company.getHomePageURL()).isEqualTo("http://groupware.haruon.com");
    }

    private Company saveCompany(LocalDateTime editedAt) {
        return companyRepository.save(
                Company.register(
                        "하루온",
                        "서울특별시 강남구",
                        "contact@haruon.com",
                        "02-1234-5678",
                        "홍길동",
                        "https://haruon.com",
                        editedAt
                )
        );
    }

    private CompanyRegisterRequest createRegisterRequest() {
        return CompanyRegisterRequest.builder()
                .companyName("하루온")
                .location("서울특별시 강남구")
                .presentedEmail("contact@haruon.com")
                .presentedExternalNo("02-1234-5678")
                .ownerName("홍길동")
                .homePageURL("https://haruon.com")
                .editedAt(LocalDateTime.of(2026, 1, 1, 9, 0))
                .build();
    }

    private String adminAccessToken(String loginId, String pw) throws Exception {
        registerAdmin(loginId, pw);

        return loginByIdAndPw(loginId, pw);
    }
}
