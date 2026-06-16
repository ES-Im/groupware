package com.haruon.groupware.adapter.webapi.franchise;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.command.dto.FranchiseCreateRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.shared.Email;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import java.time.LocalDate;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class FranchiseApiTest extends IntegrationTestSupport {

    private static final AtomicInteger EMP_NO = new AtomicInteger(810000);
    private static final AtomicInteger LOGIN_NO = new AtomicInteger(100);
    private static final String FRANCHISE_PASSWORD = "!Q2w3e4r5t";

    @Autowired
    private FranchiseRepository franchiseRepository;

    @AfterEach
    void tearDownFranchise() {
        franchiseRepository.deleteAll();
        entityManager.clear();
    }

    @Test
    @DisplayName("가맹점 API - 인증되지 않은 요청은 거부한다")
    void franchise_api_rejects_unauthenticated_request() throws Exception {
        mockMvc.perform(
                get("/api/franchises")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("가맹점 API - 일반 직원은 접근할 수 없다")
    void employee_cannot_access_franchise_api() throws Exception {
        String loginId = "emp" + LOGIN_NO.incrementAndGet();
        String password = "!Q2w3e4r5t";
        activatedEmp(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(
                get("/api/franchises")
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("가맹점 API - 가맹점 권한 사원은 가맹점을 등록할 수 있다")
    void franchise_emp_can_create_franchise() throws Exception {
        String accessToken = franchiseAccessToken();
        FranchiseCreateRequest request = FranchiseCreateRequest.builder()
                .businessNumber("000-00-00000")
                .franchiseName("테스트강남점")
                .address("서울특별시 강남구 테스트")
                .ownerName("홍길동")
                .contactNumber("010-1234-5678")
                .contactEmail("franchise-api@example.com")
                .build();

        MvcResult result = mockMvc.perform(
                post("/api/franchises")
                        .header("Authorization", BEARER + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request))
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.franchiseId").isNumber())
                .andReturn();

        long franchiseId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("franchiseId")
                .asLong();

        Franchise franchise = franchiseRepository.findById(franchiseId).orElseThrow();
        assertThat(franchise.getFranchiseName()).isEqualTo("테스트강남점");
    }

    @Test
    @DisplayName("가맹점 API - 가맹점 권한 사원은 교육/문의/매출 조회 API에 접근할 수 있다")
    void franchise_emp_can_access_franchise_read_apis() throws Exception {
        String accessToken = franchiseAccessToken();

        mockMvc.perform(
                get("/api/franchise-educations/calendar")
                        .header("Authorization", BEARER + accessToken)
                        .param("yearMonth", "2026-05")
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        mockMvc.perform(
                get("/api/franchise-inquiries")
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk());

        mockMvc.perform(
                get("/api/franchises/{franchiseId}/sales/dates/{date}", 999L, "2026-05-01")
                        .header("Authorization", BEARER + accessToken)
        )
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isNoContent());
    }

    private String franchiseAccessToken() throws Exception {
        String loginId = "franchise" + LOGIN_NO.incrementAndGet();
        Emp emp = Emp.register(
                String.valueOf(EMP_NO.incrementAndGet()),
                "Franchise",
                loginId,
                FRANCHISE_PASSWORD,
                Email.of(loginId, "haruon.com"),
                encoder
        );
        emp.approveRegister(LocalDate.of(2026, 1, 1));
        emp.changeInfoByHR(null, null, null, Set.of(SystemRoleCode.FRANCHISE), null, null);
        empRepository.save(emp);

        return loginByIdAndPw(loginId, FRANCHISE_PASSWORD);
    }
}
