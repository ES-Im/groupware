package com.haruon.groupware.adapter.security;

import com.haruon.groupware.adapter.IntegrationTestSupport;
import com.haruon.groupware.application.draft.required.DraftRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class DraftSecurityIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private DraftRepository draftRepository;

    @AfterEach
    void tearDownDrafts() {
        draftRepository.deleteAll();
        entityManager.clear();
    }

    @Test
    @DisplayName("기안 API - 인증되지 않은 요청은 거부한다")
    void draft_api_rejects_unauthenticated_request() throws Exception {
        mockMvc.perform(
                        post("/api/drafts/generals")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(generalDraftRequest())
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("기안 API - 일반 직원은 일반기안을 생성할 수 있다")
    void employee_can_create_general_draft() throws Exception {
        String loginId = "employee12345";
        String password = "!Q2w3e4r5t";
        activatedEmp(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(
                        post("/api/drafts/generals")
                                .header("Authorization", BEARER + accessToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(generalDraftRequest())
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    @DisplayName("기안 API - 일반 직원은 매출기안을 생성할 수 없다")
    void employee_cannot_create_sales_draft() throws Exception {
        String loginId = "employee12345";
        String password = "!Q2w3e4r5t";
        activatedEmp(loginId, password);

        String accessToken = loginByIdAndPw(loginId, password);

        mockMvc.perform(
                        post("/api/drafts/sales")
                                .header("Authorization", BEARER + accessToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(salesDraftRequest())
                ).andDo(MockMvcResultHandlers.print())
                .andExpect(status().isForbidden());
    }

    private String generalDraftRequest() {
        // 일반 직원 role 인가 성공 검증용 요청
        return """
                {
                  "title": "품의 문서",
                  "content": "품의 내용"
                }
                """;
    }

    private String salesDraftRequest() {
        // FRANCHISE role 인가 실패 검증용 요청
        return """
                {
                  "param": {
                    "title": "매출 보고",
                    "content": "매출 보고 내용"
                  },
                  "franchiseId": 1,
                  "reportMonth": "2026-04",
                  "salesAmount": 1000000
                }
                """;
    }
}
